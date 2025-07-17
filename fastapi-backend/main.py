from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import pandas as pd
import shutil
import os
import unicodedata
import numpy as np
from mapeos.mapeos import mapeos
from utils.kmeans_utils import aplicar_kmeans
from sklearn.base import BaseEstimator
import joblib
from sklearn.cluster import KMeans
from typing import Optional
import json
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_samples, silhouette_score


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "cleaned_data"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def limpiar_texto(texto):
    texto = str(texto).strip().lower()
    texto = texto.replace("¿", "").replace("?", "").replace("¡", "").replace("!", "")
    texto = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode("utf-8")
    return texto

def clasificar_personalidad(df: pd.DataFrame) -> pd.DataFrame:
    def determinar_clasificacion(puntaje):
        if puntaje <= 90:
            return 'Introvertido'
        elif puntaje <= 135:
            return 'Ambivertido'
        else:
            return 'Extrovertido'
    df['Personalidad'] = df['Puntaje Total'].apply(determinar_clasificacion)
    return df

# —— MINIMOS Y CATEGORIAS (de ambas ramas, para validación)
MINIMOS_POR_CATEGORIA = {
    "Sociabilidad": 6,
    "Asertividad / Liderazgo": 6,
    "Nivel de actividad": 6,
    "Búsqueda de emociones": 5,
    "Afecto positivo": 3
}

CATEGORIAS = {
    "Sociabilidad": [ "p1", "p8", "p17", "p18", "p19", "p21", "p24", "p27", "p34", "p35", "p39", "p43" ],
    "Asertividad / Liderazgo": [ "p7", "p10", "p14", "p20", "p23", "p28", "p29", "p30", "p31", "p38", "p41" ],
    "Nivel de actividad": [ "p2", "p4", "p11", "p12", "p13", "p16", "p22", "p26", "p33", "p40", "p45" ],
    "Búsqueda de emociones": [ "p3", "p6", "p15", "p25", "p32", "p36", "p37", "p42", "p44" ],
    "Afecto positivo": [ "p5", "p9", "p20", "p29", "p30" ]
}

def validar_preguntas_por_categoria(df_columnas):
    errores = []
    for categoria, preguntas in CATEGORIAS.items():
        seleccionadas = [p for p in preguntas if p in df_columnas]
        if len(seleccionadas) < MINIMOS_POR_CATEGORIA[categoria]:
            errores.append(f"{categoria}: mínimo requerido es {MINIMOS_POR_CATEGORIA[categoria]}, seleccionadas: {len(seleccionadas)}")
    return errores

mapeos_numerados = {
    f"p{i+1}": {"pregunta": pregunta, "opciones": opciones}
    for i, (pregunta, opciones) in enumerate(mapeos.items())
}

@app.get("/preguntas-categorizadas")
def preguntas_categorizadas():
    p_to_categoria = {
        clave: categoria
        for categoria, claves in CATEGORIAS.items()
        for clave in claves
    }
    resultado = []
    for clave, contenido in mapeos_numerados.items():
        resultado.append({
            "numero": clave,
            "pregunta": contenido["pregunta"],
            "categoria": p_to_categoria.get(clave, "No clasificada")
        })
    return resultado

@app.get("/descargar-archivo/{nombre_archivo}")
def descargar_archivo(nombre_archivo: str):
    ruta_archivo = os.path.join(UPLOAD_DIR, nombre_archivo)
    if not os.path.exists(ruta_archivo):
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return FileResponse(path=ruta_archivo, filename=nombre_archivo, media_type='application/octet-stream')

@app.get("/modelos")
def listar_modelos():
    modelos_dir = "modelos"
    if not os.path.exists(modelos_dir):
        return JSONResponse(content={"modelos": []})
    archivos = [archivo for archivo in os.listdir(modelos_dir) if archivo.endswith(".joblib")]
    archivos.sort(reverse=True)
    return {"modelos": archivos}

@app.get("/modelo-info/{nombre_modelo}")
def obtener_info_modelo(nombre_modelo: str):
    ruta_modelo = os.path.join("modelos", nombre_modelo)
    ruta_data   = ruta_modelo.replace(".joblib", "_data.csv")

    # 1) Validaciones
    if not os.path.exists(ruta_modelo):
        raise HTTPException(status_code=404, detail="Modelo no encontrado")
    if not os.path.exists(ruta_data):
        raise HTTPException(status_code=404, detail="Datos del modelo no encontrados")

    # 2) Carga del modelo KMeans y del CSV de entrenamiento
    modelo: KMeans = joblib.load(ruta_modelo)
    if not isinstance(modelo, KMeans):
        raise HTTPException(status_code=400, detail="No es un modelo KMeans")
    df = pd.read_csv(ruta_data)

    # 3) Metadata del modelo
    n_clusters = modelo.n_clusters
    inertia    = float(modelo.inertia_)
    centros    = modelo.cluster_centers_.tolist()

    # 4) Columnas numéricas y estadísticas descriptivas
    vars_num = df.select_dtypes(include=[np.number]).columns.tolist()
    agg = df[vars_num].agg(['mean','median','std','min','max']).T
    stats = [
        {
            "variable": var,
            "mean":     float(row['mean']),
            "median":   float(row['median']),
            "std":      float(row['std']),
            "min":      float(row['min']),
            "max":      float(row['max']),
        }
        for var, row in agg.iterrows()
    ]

    # 5) avgScores para gráfico de barras
    avgScores = [{"variable": s["variable"], "mean": s["mean"]} for s in stats]

    # 6) Cluster counts para pie chart
    labels = modelo.labels_
    counts = np.bincount(labels, minlength=n_clusters)
    clusterCounts = [
        {"name": f"Cluster {i}", "value": int(counts[i])}
        for i in range(n_clusters)
    ]

    # 7) Scores (todos los valores numéricos) para histograma/boxplot
    scores = df[vars_num].values.flatten().tolist()

    # 8) Correlación
    corr_df = df[vars_num].corr()
    corr      = corr_df.values.tolist()
    abs_corr  = np.abs(corr_df)
    i, j      = np.unravel_index(
        np.argmax(abs_corr.values + np.eye(len(vars_num)) * -1),
        abs_corr.shape
    )
    max_pair  = (vars_num[i], vars_num[j])
    max_val   = float(corr_df.iloc[i, j])

    # 9) Pairplot (matriz de dispersión)
    pairplot = [
        [df[[x, y]].values.tolist() for y in vars_num]
        for x in vars_num
    ]

    # 10) PCA
    pca    = PCA(n_components=2)
    pcs    = pca.fit_transform(df[vars_num]).tolist()
    pcsVar = (pca.explained_variance_ratio_ * 100).tolist()

    # 11) Silhouette
    sil_vals  = silhouette_samples(df[vars_num], labels)
    sil_avg   = float(silhouette_score(df[vars_num], labels))
    sil_labels = df.index.astype(str).tolist()

    # 12) Cota máxima para radar
    statsMax = max(s["mean"] for s in stats)

    return {
        "n_clusters":    n_clusters,
        "inertia":       inertia,
        "centros":       centros,
        "stats":          stats,
        "avgScores":      avgScores,
        "clusterCounts":  clusterCounts,
        "scores":         scores,
        "variables":      vars_num,
        "statsMax":       statsMax,
        "corrMatrix":     corr,
        "maxCorr":        {"pair": f"{max_pair[0]}–{max_pair[1]}", "value": max_val},
        "pairplot":       pairplot,
        "pcs":            pcs,
        "pcsVar":         pcsVar,
        "silLabels":      sil_labels,
        "silhouette":     sil_vals.tolist(),
        "silhouetteAvg":  sil_avg
    }

def generar_graficas_backend(df: pd.DataFrame, labels: list, nombre_archivo_base: str, output_dir="graficas_personalidad"):
    import os
    os.makedirs(output_dir, exist_ok=True)
    rutas = {}

    # 1. Matriz de correlación
    try:
        plt.figure(figsize=(10, 8))
        sns.heatmap(df.corr(), annot=True, cmap="coolwarm")
        filename = f"{nombre_archivo_base}_correlacion.png"
        path = os.path.join(output_dir, filename)
        plt.title("Matriz de correlación")
        plt.tight_layout()
        plt.savefig(path)
        plt.close()
        rutas["matriz_correlacion"] = filename
    except Exception as e:
        print("❌ Error en matriz de correlación:", str(e))

    # 2. PCA
    try:
        pca = PCA(n_components=2)
        componentes = pca.fit_transform(df)
        df_pca = pd.DataFrame(componentes, columns=["PC1", "PC2"])
        df_pca["Cluster"] = labels
        plt.figure(figsize=(8, 6))
        sns.scatterplot(data=df_pca, x="PC1", y="PC2", hue="Cluster", palette="Set2")
        filename = f"{nombre_archivo_base}_pca.png"
        path = os.path.join(output_dir, filename)
        plt.title("Dispersión PCA")
        plt.tight_layout()
        plt.savefig(path)
        plt.close()
        rutas["pca"] = filename
    except Exception as e:
        print("❌ Error en gráfico PCA:", str(e))

    # 3. Silueta
    try:
        silhouette_vals = silhouette_samples(df, labels)
        n_clusters = len(set(labels))
        y_lower = 10
        plt.figure(figsize=(8, 6))

        for i in range(n_clusters):
            ith_vals = silhouette_vals[np.array(labels) == i]
            ith_vals.sort()
            size_cluster = ith_vals.shape[0]
            y_upper = y_lower + size_cluster
            plt.fill_betweenx(np.arange(y_lower, y_upper), 0, ith_vals)
            plt.text(-0.05, y_lower + 0.5 * size_cluster, str(i))
            y_lower = y_upper + 10

        plt.axvline(x=silhouette_score(df, labels), color="red", linestyle="--")
        plt.title("Gráfico de Silueta")
        plt.xlabel("Coeficiente de Silueta")
        filename = f"{nombre_archivo_base}_silueta.png"
        path = os.path.join(output_dir, filename)
        plt.tight_layout()
        plt.savefig(path)
        plt.close()
        rutas["silueta"] = filename
    except Exception as e:
        print("❌ Error en gráfico de silueta:", str(e))

    return rutas
@app.get("/graficas-json/{nombre_archivo}")
def obtener_datos_graficas(nombre_archivo: str):
    try:
        # DEBUG: Mostrar nombre recibido
        print(f"🟦 Nombre recibido en endpoint: {nombre_archivo}")

        nombre_sin_ext = os.path.splitext(nombre_archivo)[0]

        # Si el nombre ya empieza con "numerico_", quitarlo para buscar el original
        if nombre_sin_ext.startswith("numerico_"):
            nombre_base = nombre_sin_ext.replace("numerico_", "", 1)
        else:
            nombre_base = nombre_sin_ext

        # Primero intentamos con "clusterizado_{nombre_base}.csv"
        path_clusterizado = os.path.join(UPLOAD_DIR, f"clusterizado_{nombre_base}.csv")

        print(f"🟩 Buscando archivo clusterizado en: {path_clusterizado}")

        if not os.path.exists(path_clusterizado):
            print(f"🟥 Archivo NO encontrado: {path_clusterizado}")
            raise HTTPException(status_code=404, detail=f"Archivo clusterizado no encontrado: {path_clusterizado}")

        # Cargar archivo CSV
        df = pd.read_csv(path_clusterizado)
        print(f"✅ Archivo leído. Columnas: {df.columns.tolist()}")

        # Validación extra: asegúrate de que tenga columna Cluster
        if "Cluster" not in df.columns:
            raise HTTPException(status_code=400, detail=f"El archivo {path_clusterizado} no contiene columna 'Cluster'.")

        df_numeric = df.select_dtypes(include=[np.number])
        labels = df["Cluster"].tolist()

        # — Matriz de correlación
        corr_matrix = df_numeric.corr().round(2).to_dict()

        # — PCA
        pca = PCA(n_components=2)
        pcs = pca.fit_transform(df_numeric)
        pca_data = [{"PC1": float(x), "PC2": float(y), "Cluster": int(c)} for (x, y), c in zip(pcs, labels)]
        pca_var = (pca.explained_variance_ratio_ * 100).round(2).tolist()

        # — Silueta
        silhouette_vals = silhouette_samples(df_numeric, labels)
        silueta_data = [{"Cluster": int(cluster), "Coeficiente": float(s)}
                        for cluster, s in zip(labels, silhouette_vals)]
        silhouette_avg = round(silhouette_score(df_numeric, labels), 3)

        print("✅ Datos de gráficas generados correctamente.")
        return {
            "matriz_correlacion": corr_matrix,
            "pca_data": pca_data,
            "pca_var": pca_var,
            "silueta_data": silueta_data,
            "silhouette_avg": silhouette_avg
        }

    except Exception as e:
        import traceback
        print("❌ Error al generar datos de gráficas:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error al generar datos de gráficas: {str(e)}")

@app.post("/generar-set-numerico")
async def generar_set_numerico(
    file: UploadFile = File(...),
    variables: Optional[str] = Form(None)
):
    if not file.filename.endswith(('.csv', '.xlsx')):
        raise HTTPException(status_code=400, detail="Formato de archivo no válido")

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        df = pd.read_csv(file_path) if file.filename.endswith('.csv') else pd.read_excel(file_path)
        df.columns = df.columns.str.strip()
        df = df.dropna()
        df = df.applymap(lambda x: x.strip() if isinstance(x, str) else x)
        df = df.applymap(lambda x: x.lower() if isinstance(x, str) else x)

        nombre_sin_ext = os.path.splitext(file.filename)[0]
        cleaned_path = os.path.join(UPLOAD_DIR, f"limpio_{nombre_sin_ext}.xlsx")
        df.to_excel(cleaned_path, index=False, engine="openpyxl")

        df_numerico = df.copy()
        df_numerico.columns = [limpiar_texto(col) for col in df_numerico.columns]

        mapa_columnas = {
            limpiar_texto(contenido["pregunta"]): clave
            for clave, contenido in mapeos_numerados.items()
        }
        df_numerico.rename(columns=lambda col: mapa_columnas.get(col, col), inplace=True)

        mapeos_normalizados = {
            limpiar_texto(clave): {
                limpiar_texto(resp): val for resp, val in contenido["opciones"].items()
            }
            for clave, contenido in mapeos_numerados.items()
        }

        for pregunta_norm, opciones in mapeos_normalizados.items():
            if pregunta_norm in df_numerico.columns:
                df_numerico[pregunta_norm] = df_numerico[pregunta_norm].map(
                    lambda x: opciones.get(limpiar_texto(x), None)
                )

        variables_usar = None
        if variables:
            try:
                variables_usar = json.loads(variables)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Error al leer variables seleccionadas: {str(e)}")

        columnas_existentes = [col for col in mapeos_normalizados if col in df_numerico.columns]

        if variables_usar:
            columnas_existentes = [col for col in variables_usar if col in df_numerico.columns]
            if not columnas_existentes:
                raise HTTPException(status_code=400, detail="No hay columnas válidas seleccionadas.")

            # ✅ Validación de mínimos por categoría
            errores_validacion = validar_preguntas_por_categoria(columnas_existentes)
            if errores_validacion:
                raise HTTPException(status_code=400, detail={
                    "error": "No se cumplen los mínimos por categoría.",
                    "detalles": errores_validacion
                })

        df_filtrado = df_numerico[columnas_existentes].copy()

        # Agregar puntajes por categoría para radar chart (¡NO eliminar!)
        for categoria, preguntas in CATEGORIAS.items():
            columnas_categoria = [p for p in preguntas if p in df_filtrado.columns]
            if columnas_categoria:
                df_filtrado[categoria] = df_filtrado[columnas_categoria].sum(axis=1)

        df_filtrado["Puntaje Total"] = df_filtrado[columnas_existentes].sum(axis=1)

        total_original = df_filtrado.shape[0]
        df_resultado = clasificar_personalidad(df_filtrado)
        df_resultado["Clasificacion"] = df_resultado["Personalidad"]
        df_resultado = df_resultado.dropna()
        total_final = df_resultado.shape[0]
        eliminados = total_original - total_final

        columnas_excluir = ["Puntaje Total", "Personalidad", "Clasificacion"]
        if variables_usar:
            columnas_excluir += [col for col in df_resultado.columns if col.startswith("p") and col not in variables_usar]

        df_resultado, ruta_modelo = aplicar_kmeans(df_resultado, columnas_a_excluir=columnas_excluir)

        promedios = df_resultado.groupby("Cluster")["Puntaje Total"].mean().sort_values()
        orden_clusters = promedios.index.tolist()
        mapeo_clusters = {
            orden_clusters[0]: "Introvertido",
            orden_clusters[1]: "Ambivertido",
            orden_clusters[2]: "Extrovertido"
        }
        df_resultado["Prediccion_Personalidad"] = df_resultado["Cluster"].map(mapeo_clusters)
        
        # Generar gráficas a partir del DataFrame clusterizado
        df_numerico_graficas = df_resultado.select_dtypes(include=[np.number])
        graficas = generar_graficas_backend(
            df=df_numerico_graficas,
            labels=df_resultado["Cluster"].tolist(),
            nombre_archivo_base=nombre_sin_ext
        )

        numerico_path = os.path.join(UPLOAD_DIR, f"numerico_{nombre_sin_ext}.xlsx")
        cluster_path = os.path.join(UPLOAD_DIR, f"clusterizado_{nombre_sin_ext}.csv")
        prediccion_path = os.path.join(UPLOAD_DIR, f"prediccion_{nombre_sin_ext}.xlsx")

        
        df_resultado.to_excel(numerico_path, index=False, engine="openpyxl")
        df_resultado.to_csv(cluster_path, index=False, encoding='utf-8-sig')
        df_resultado.to_excel(prediccion_path, index=False, engine="openpyxl")
        
        return {
            "message": "Archivo procesado correctamente",
            "rows": total_final,
            "eliminados_por_nan": eliminados,
            "preview_limpio": df.replace({pd.NA: None, np.nan: None}).to_dict(orient="records"),
            "preview_numerico": df_resultado.replace({pd.NA: None, np.nan: None}).to_dict(orient="records"),
            "columns_limpio": list(df.columns),
            "columns_numerico": list(df_resultado.columns),
            "archivo_cluster": f"clusterizado_{nombre_sin_ext}.csv",
            "archivo_numerico": f"numerico_{nombre_sin_ext}.xlsx",
            "archivo_prediccion": f"prediccion_{nombre_sin_ext}.xlsx",
            "modelo_guardado": ruta_modelo
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar el set numérico: {str(e)}")
from fastapi.staticfiles import StaticFiles

# Montar la carpeta de gráficas como recursos estáticos
app.mount("/static", StaticFiles(directory="graficas_personalidad"), name="static")