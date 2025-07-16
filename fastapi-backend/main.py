from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import shutil
import os 
import unicodedata
import numpy as np
from mapeos.mapeos import mapeos  

app = FastAPI()

# CORS para permitir conexión con React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # puedes poner "http://localhost:3000" si lo prefieres más seguro
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
    """
    Clasifica la personalidad en base a la columna 'Puntaje Total' en tres categorías.
    """
    def determinar_clasificacion(puntaje):
        if puntaje <= 90:
            return 'Introvertido'
        elif puntaje <= 135:
            return 'Ambivertido'
        else:
            return 'Extrovertido'

    df['Personalidad'] = df['Puntaje Total'].apply(determinar_clasificacion)
    return df


# Convertir a mapeos con claves p1, p2, ...
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
        # Leer archivo
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)

        # 🧽 LIMPIEZA DE DATOS
        df = df.dropna()
        df.columns = df.columns.str.strip()
        df = df.applymap(lambda x: x.strip() if isinstance(x, str) else x)
        df = df.applymap(lambda x: x.lower() if isinstance(x, str) else x)

        # Guardar limpio
        cleaned_path = os.path.join(UPLOAD_DIR, f"limpio_{file.filename}")
        df.to_csv(cleaned_path, index=False)

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
        # Leer archivo
        if file.filename.endswith(".csv"):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)

        df = df.dropna()
        df.columns = df.columns.str.strip()

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

        # ✅ Guardar archivo numérico generado con clasificación
        numerico_path = os.path.join(UPLOAD_DIR, f"numerico_{file.filename}")
        df_resultado.to_csv(numerico_path, index=False)

        return {
            "message": "Archivo numérico generado correctamente",
            "rows": len(df_resultado),
            "columns": list(df_resultado.columns),
            "preview": df_resultado.replace({pd.NA: None, np.nan: None}).to_dict(orient="records")
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

    # Asocia cada clave como 'p1', 'p2'... a su categoría
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
