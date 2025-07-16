from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import pandas as pd
import shutil
import os
import unicodedata
import numpy as np
from mapeos.mapeos import mapeos
from utils.kmeans_utils import aplicar_kmeans
from fastapi.responses import JSONResponse
from sklearn.base import BaseEstimator
import joblib  
from sklearn.cluster import KMeans  


app = FastAPI()

# Configurar CORS
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

@app.get("/mapeos")
def obtener_mapeos():
    return mapeos_numerados

@app.post("/limpiar-set")
async def limpiar_set(file: UploadFile = File(...)):
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

        return {
            "message": "Archivo limpiado correctamente",
            "rows": len(df),
            "columns": list(df.columns),
            "preview": df.to_dict(orient="records")
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar el archivo: {str(e)}")

@app.post("/generar-set-numerico")
async def generar_set_numerico(file: UploadFile = File(...)):
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

        mapeos_normalizados = {
            limpiar_texto(pregunta): {
                limpiar_texto(resp): val for resp, val in opciones.items()
            }
            for pregunta, opciones in mapeos.items()
        }

        for pregunta_norm, opciones in mapeos_normalizados.items():
            if pregunta_norm in df_numerico.columns:
                df_numerico[pregunta_norm] = df_numerico[pregunta_norm].map(
                    lambda x: opciones.get(limpiar_texto(x), None)
                )

        columnas_existentes = [col for col in mapeos_normalizados if col in df_numerico.columns]
        df_numerico["Puntaje Total"] = df_numerico[columnas_existentes].sum(axis=1)

        df_resultado = clasificar_personalidad(df_numerico)
        df_resultado["Clasificacion"] = df_resultado["Personalidad"]

        df_resultado = df_resultado.dropna()

        df_resultado, ruta_modelo = aplicar_kmeans(
            df_resultado,
            columnas_a_excluir=[
                "Puntaje Total", "Personalidad", "Clasificacion",
                "marca temporal", "cual es tu nombre", "en que rango de edad te encuentras",
                "cual es tu ocupacion actual", "cual es tu genero"
            ]
        )


                # Calcular el promedio del Puntaje Total por cluster
        promedios = df_resultado.groupby("Cluster")["Puntaje Total"].mean().sort_values()

        # Crear mapeo de clusters basado en promedio del puntaje
        # El más bajo → Introvertido, medio → Ambivertido, más alto → Extrovertido
        orden_clusters = promedios.index.tolist()

        mapeo_clusters = {
            orden_clusters[0]: "Introvertido",
            orden_clusters[1]: "Ambivertido",
            orden_clusters[2]: "Extrovertido"
        }

        # Agregar la predicción al DataFrame
        df_resultado["Prediccion_Personalidad"] = df_resultado["Cluster"].map(mapeo_clusters)

        # Guardar los archivos resultantes
        numerico_path = os.path.join(UPLOAD_DIR, f"numerico_{nombre_sin_ext}.xlsx")
        cluster_path = os.path.join(UPLOAD_DIR, f"clusterizado_{nombre_sin_ext}.csv")
        prediccion_path = os.path.join(UPLOAD_DIR, f"prediccion_{nombre_sin_ext}.xlsx")

        df_resultado.to_excel(numerico_path, index=False, engine="openpyxl")
        df_resultado.to_csv(cluster_path, index=False, encoding='utf-8-sig')
        df_resultado.to_excel(prediccion_path, index=False, engine="openpyxl")

        return {
            "message": "Archivo procesado correctamente",
            "rows": len(df_resultado),
            "preview_limpio": df.replace({pd.NA: None, np.nan: None}).to_dict(orient="records"),
            "preview_numerico": df_resultado.replace({pd.NA: None, np.nan: None}).to_dict(orient="records"),
            "columns_limpio": list(df.columns),
            "columns_numerico": list(df_resultado.columns),
            "archivo_cluster": f"clusterizado_{nombre_sin_ext}.csv",
            "archivo_numerico": f"numerico_{nombre_sin_ext}.xlsx",
            "archivo_prediccion": f"prediccion_{nombre_sin_ext}.xlsx",
            "modelo_guardado": ruta_modelo    # Aquí podrías devolver la ruta
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar el set numérico: {str(e)}")

@app.get("/preguntas-categorizadas")
def preguntas_categorizadas():
    categorias = {
        "Comunicación Social": ["p1", "p7", "p10", "p12", "p19", "p23", "p24", "p34", "p35", "p38", "p40", "p43"],
        "Energía e Interacción Social": ["p2", "p11", "p16", "p21", "p26", "p27", "p41"],
        "Preferencias de Actividades": ["p3", "p13", "p18", "p22", "p33", "p39", "p45"],
        "Comodidad en Espacios Sociales": ["p6", "p14", "p15", "p17", "p30", "p31", "p32", "p36", "p37", "p42", "p44"],
        "Expresión Emocional": ["p5", "p9", "p20", "p28", "p29"],
        "Estilo Cognitivo": ["p4", "p8", "p25"]
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

    archivos = [
        archivo for archivo in os.listdir(modelos_dir)
        if archivo.endswith(".joblib")
    ]
    archivos.sort(reverse=True)  # Opcional: más recientes primero
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

