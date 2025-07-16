from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import shutil
import os 
import unicodedata
import numpy as np

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

# Diccionario de mapeos personalizados por pregunta
mapeos = {
  "¿Qué tan cómodo te sientes al iniciar una conversación con alguien que no conoces?": {
    "Muy incómodo": 1, "Incómodo": 2, "Neutro": 3, "Cómodo": 4, "Muy cómodo": 5
  },
  "Después de pasar varias horas conviviendo con otras personas, ¿Cómo te sientes?": {
    "Muy cansado": 1, "Cansado": 2, "Neutro": 3, "Energizado": 4, "Muy energizado": 5
  },
  "En tu tiempo libre, ¿prefieres hacer algo tranquilo (leer, ver series) o salir?": {
    "Siempre tranquilo": 1, "Usualmente tranquilo": 2, "Depende": 3, "Usualmente salir": 4, "Siempre salir": 5
  },
  "¿Te cuesta mantenerte concentrado cuando estás solo mucho tiempo?": {
    "Nunca": 1, "Rara vez": 2, "A veces": 3, "Frecuentemente": 4, "Siempre": 5
  },
  "¿Te incomodan los momentos de silencio cuando estás con alguien?": {
    "Me gusta el silencio": 1, "No me incomoda": 2, "Neutro": 3, "Me incomoda un poco": 4, "Me incomoda mucho": 5
  },
  "¿Disfrutas que las personas pongan atención en ti en reuniones o grupos?": {
    "Nada": 1, "Poco": 2, "A veces": 3, "Bastante": 4, "Mucho": 5
  },
  "¿Te gustan las pequeñas charlas (sobre clima, noticias, etc.)?": {
    "No me gustan": 1, "Prefiero evitarlas": 2, "Neutro": 3, "A veces sí": 4, "Sí, me gustan ": 5
  },
  "¿Prefieres tener pocos amigos cercanos o muchos conocidos?": {
    "Muy pocos": 1, "Pocos": 2, "Equilibrado": 3, "Bastantes": 4, "Muchos": 5
  },
  "¿Te cuesta hablar de tus emociones con alguien más?": {
    "Mucho": 1, "Bastante": 2, "Regular": 3, "Poco": 4, "Nada": 5
  },
  "¿Te resulta fácil integrarte a una conversación grupal?": {
    "Muy difícil": 1, "Difícil": 2, "Neutro": 3, "Fácil": 4, "Muy fácil": 5
  },
  "¿Después de eventos sociales necesitas descansar a solas?": {
    "Siempre": 1,  "Frecuentemente": 2,  "A veces": 3, "Rara vez": 4, "Nunca": 5
  },
  "¿Sueles contar anécdotas tuyas cuando convives?": {
    "Nada": 1, "Poco": 2, "A veces": 3, "Bastante": 4, "Mucho": 5
  },
  "¿Te gustan los ambientes activos (plazas, conciertos, etc.)?": {
    "Nunca": 1, "rara vez": 2,  "A veces": 3, "Frecuentemente": 4, "Siempre": 5
  },
  "¿Prefieres trabajar o estudiar en grupo?": {
    "Nunca": 1, "Rara vez": 2, "Depende": 3, "Usualmente en grupo": 4, "Siempre en grupo": 5 
  },
  "¿Evitas hablar en público si puedes elegir?": {
    "Siempre": 1, "Casi siempre": 2, "A veces": 3, "Rara vez": 4, "Nunca": 5
  },
  "¿Te aburres si no interactúas con alguien?": {
    "Nunca": 1, "Rara vez": 2, "A veces": 3, "Frecuentemente": 4, "Siempre": 5
  },
  "¿Prefieres platicar en persona o por redes sociales?": {
    "Siempre redes": 1, "Usualmente redes": 2, "Neutro": 3, "Usualmente en persona": 4, "Siempre en persona": 5
  },
  "¿Con qué frecuencia organizas convivencias o reuniones?": {
    "Nunca": 1, "Rara vez": 2, "A veces": 3, "Frecuentemente": 4, "Muy seguido": 5
  },
  "En las conversaciones, ¿hablas o escuchas más?": {
    "Siempre escucho": 1, "Usualmente escucho": 2, "Equilibrado": 3, "Usualmente hablo": 4, "Siempre hablo": 5
  },
  "¿Qué tan cómodo te sientes expresando tus emociones?": {
    "Nada cómodo": 1, "Poco cómodo": 2, "Neutro": 3, "Bastante cómodo": 4, "Muy cómodo": 5
  },
  "¿Necesitas tiempo a solas para equilibrarte después de socializar?": {
    "Nunca": 1, "Rara vez": 2, "A veces": 3, "Frecuentemente": 4, "Siempre": 5
  },
  "¿Disfrutas conocer personas, lugares o actividades nuevas?": {
    "Nada": 1, "Poco": 2, "A veces": 3, "Mucho": 4, "Muchísimo": 5
  },
  "¿Te gusta hablar de ti con otras personas?": {
    "Nada": 1, "Poco": 2, "A veces": 3, "Bastante": 4, "Mucho": 5
  },
  "¿Piensas antes de hablar o hablas sin filtro?": {
    "Siempre pienso antes": 1, "Usualmente pienso antes": 2, "Depende": 3, "Hablo rápido": 4, "Hablo sin filtro": 5
  },
  "¿Te incomodan lugares muy concurridos?": {
    "Nada": 1, "Rara vez": 2, "A veces": 3, "Frecuentemente": 4, "Siempre": 5
  },
  "¿Te sientes bien al recibir elogios públicos?": {
    "Nada": 1, "Poco": 2, "A veces": 3, "Bastante": 4, "Mucho": 5
  },
  "¿Necesitas convivir con alguien para sentirte bien durante el día?": {
    "Nada": 1, "Poco": 2, "A veces": 3, "Bastante": 4, "Mucho": 5
  },
  "¿Te cansan los estímulos como ruido o luces fuertes?": {
    "Mucho": 1, "Bastante": 2, "A veces": 3, "Poco": 4, "Nada": 5
  },
  "¿Necesitas silencio para ordenar tus ideas?": {
    "Siempre": 1, "Frecuentemente": 2, "A veces": 3, "Rara vez": 4, "Nunca": 5
  },
  "¿Te sientes con confianza al hablar en presentaciones o networking?": {
    "Muy incómodo": 1, "Incómodo": 2, "Neutro": 3, "Cómodo": 4, "Muy cómodo": 5
  },
  "¿Cómo te sientes en videollamadas grupales (Zoom, Meet)?": {
    "Muy incómodo": 1, "Algo incómodo": 2, "Neutro": 3, "Cómodo": 4, "Muy cómodo": 5
  },
  "¿Con qué frecuencia usas redes para interactuar con otros?": {
    "Casi nunca": 1, "Rara vez": 2, "A veces": 3, "Frecuentemente": 4, "Muy seguido": 5
  },
  "¿Disfrutas dinámicas en grupo como juegos o debates?": {
    "Nada": 1, "Poco": 2, "A veces": 3, "Bastante": 4, "Mucho": 5
  },
  "¿Te cuesta expresar desacuerdo en grupo?": {
    "Mucho": 1, "Bastante": 2, "A veces": 3, "Poco": 4, "Nada": 5
  },
  "¿Te gusta que te hagan preguntas personales?": {
    "Nada": 1, "Poco": 2, "Depende": 3, "Bastante": 4, "Mucho": 5
  },
  "¿Te molesta que interrumpan tu tiempo a solas para platicar?": {
    "Siempre": 1, "Frecuentemente": 2, "A veces": 3, "Rara vez": 4, "Nunca": 5
  },
  "¿Prefieres hacer cosas nuevas acompañado o solo?": {
    "Siempre solo": 1, "Usualmente solo": 2, "Depende": 3, "Usualmente acompañado": 4, "Siempre acompañado": 5
  },
  "¿Te cuesta hablar en un grupo donde no conoces a nadie?": {
    "Mucho": 1, "Bastante": 2, "Un poco": 3, "Poco": 4, "Nada": 5
  },
  "¿Te gusta participar en actividades escolares, laborales o sociales?": {
    "Nada": 1, "Poco": 2, "A veces": 3, "Bastante": 4, "Mucho": 5
  },
  "¿Te sientes cómodo hablando de tus logros?": {
    "Nada cómodo": 1, "Poco cómodo": 2, "Neutro": 3, "Cómodo": 4, "Muy cómodo": 5
  },
  "¿Con qué frecuencia tomas la iniciativa para conocer personas nuevas?": {
    "Nunca": 1, "Rara vez": 2, "A veces": 3, "Frecuentemente": 4, "Siempre": 5
  },
  "¿Prefieres trabajar en silencio o en lugares sociales?": {
    "Siempre silencio": 1, "Usualmente silencio": 2, "Neutro": 3, "Usualmente social": 4, "Siempre social": 5
  },
  "¿Compartes tus ideas en clases, reuniones o trabajo?": {
    "Nunca": 1, "Rara vez": 2, "A veces": 3, "Frecuentemente": 4, "Siempre": 5
  },
  "¿Qué tan cómodo te sientes en reuniones por videollamada?": {
    "Muy incómodo": 1, "Incómodo": 2, "Neutro": 3, "Cómodo": 4, "Muy cómodo": 5
  },
  "¿Te gusta estar en grupos grandes de WhatsApp o redes?": {
    "Nada": 1, "Poco": 2, "A veces": 3, "Bastante": 4, "Mucho": 5
  }
}

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

        # Copia y normaliza nombres de columnas
        df_numerico = df.copy()
        df_numerico.columns = [limpiar_texto(col) for col in df_numerico.columns]

        # Normaliza preguntas y opciones del diccionario
        mapeos_normalizados = {
            limpiar_texto(pregunta): {
                limpiar_texto(resp): val for resp, val in opciones.items()
            }
            for pregunta, opciones in mapeos.items()
        }

        # Aplica los mapeos
        for pregunta_norm, opciones in mapeos_normalizados.items():
            if pregunta_norm in df_numerico.columns:
                df_numerico[pregunta_norm] = df_numerico[pregunta_norm].map(
                    lambda x: opciones.get(limpiar_texto(x), None)
                )

        # Calcula el puntaje sumando solo las columnas mapeadas correctamente
        columnas_existentes = [col for col in mapeos_normalizados if col in df_numerico.columns]
        df_numerico["Puntaje Total"] = df_numerico[columnas_existentes].sum(axis=1)

        # Guarda el archivo generado
        numerico_path = os.path.join(UPLOAD_DIR, f"numerico_{file.filename}")
        df_numerico.to_csv(numerico_path, index=False)

        return {
            "message": "Archivo numérico generado correctamente",
            "rows": len(df_numerico),
            "columns": list(df_numerico.columns),
            "preview": df_numerico.head(3).replace({pd.NA: None, np.nan: None}).to_dict(orient="records")
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar el set numérico: {str(e)}")