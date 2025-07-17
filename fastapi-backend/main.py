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

mapeos_numerados = {
    f"p{i+1}": {"pregunta": pregunta, "opciones": opciones}
    for i, (pregunta, opciones) in enumerate(mapeos.items())
}

@app.get("/preguntas-categorizadas")
def preguntas_categorizadas():
    categorias = {
        "Sociabilidad": [ "p1", "p8", "p17", "p18", "p19", "p21", "p24", "p27", "p34", "p35", "p39", "p43" ],
        "Asertividad / Liderazgo": [ "p7", "p10", "p14", "p20", "p23", "p28", "p29", "p30", "p31", "p38", "p41" ],
        "Nivel de actividad": [ "p2", "p4", "p11", "p12", "p13", "p16", "p22", "p26", "p33", "p40", "p45" ],
        "Búsqueda de emociones": [ "p3", "p6", "p15", "p25", "p32", "p36", "p37", "p42", "p44" ],
        "Afecto positivo": [ "p5", "p9", "p20", "p29", "p30" ]
    }

    p_to_categoria = {
        clave: categoria
        for categoria, claves in categorias.items()
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
    ruta = os.path.join("modelos", nombre_modelo)
    if not os.path.exists(ruta):
        raise HTTPException(status_code=404, detail="Modelo no encontrado")
    try:
        modelo: BaseEstimator = joblib.load(ruta)
        if not isinstance(modelo, KMeans):
            raise HTTPException(status_code=400, detail="El archivo no es un modelo KMeans")
        return {
            "n_clusters": modelo.n_clusters,
            "inertia": modelo.inertia_,
            "centros": modelo.cluster_centers_.tolist()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al cargar el modelo: {str(e)}")

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

            errores_validacion = validar_preguntas_por_categoria(columnas_existentes)
            if errores_validacion:
                raise HTTPException(status_code=400, detail={
                    "error": "No se cumplen los mínimos por categoría.",
                    "detalles": errores_validacion
                })

        df_filtrado = df_numerico[columnas_existentes].copy()

        # ✅ Agregar puntajes por categoría (esto alimenta la gráfica radar)
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