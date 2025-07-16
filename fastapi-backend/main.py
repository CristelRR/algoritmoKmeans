from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import shutil
import os
import unidecode

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

# Normalizador de texto
def normalizar(texto):
    if not isinstance(texto, str):
        return texto
    return unidecode.unidecode(texto.strip().lower().replace('\n', ' ').replace('"', '').replace("¿", "").replace("?", "")).strip()


# Diccionario de mapeos personalizados por pregunta
mapeos = {
  "¿Qué tan cómodo te sientes al iniciar una conversación con alguien que no conoces?": {
    "muy incómodo": 1, "incómodo": 2, "neutro": 3, "cómodo": 4, "muy cómodo": 5
  },
  "Después de pasar varias horas conviviendo con otras personas, ¿Cómo te sientes?": {
    "muy cansado": 1, "cansado": 2, "neutro": 3, "energizado": 4, "muy energizado": 5
  },
  "En tu tiempo libre, ¿prefieres hacer algo tranquilo (leer, ver series) o salir?": {
    "siempre tranquilo": 1,
    "usualmente tranquilo": 2,
    "depende": 3,
    "usualmente salir": 4,
    "siempre salir": 5
  },
  "¿Te cuesta mantenerte concentrado cuando estás solo mucho tiempo?": {
    "nunca": 1,
    "rara vez": 2,
    "a veces": 3,
    "frecuentemente": 4,
    "siempre": 5
  },
  "¿Te incomodan los momentos de silencio cuando estás con alguien?": {
    "me gusta el silencio": 1,
    "no me incomoda": 2,
    "neutro": 3,
    "me incomoda un poco": 4,
    "me incomoda mucho": 5
  },
  "¿Disfrutas que las personas pongan atención en ti en reuniones o grupos?": {
    "nada": 1,
    "poco": 2,
    "a veces": 3,
    "bastante": 4,
    "mucho": 5
  },
  "¿Te gustan las pequeñas charlas (sobre clima, noticias, etc.)?": {
    "nada": 1,
    "poco": 2,
    "a veces": 3,
    "bastante": 4,
    "mucho": 5
  },
  "¿Prefieres tener pocos amigos cercanos o muchos conocidos?": {
    "nada": 1,
    "poco": 2,
    "a veces": 3,
    "bastante": 4,
    "mucho": 5
  },
  "¿Te cuesta hablar de tus emociones con alguien más?": {
    "mucho": 1,
    "bastante": 2,
    "a veces": 3,
    "poco": 4,
    "nada": 5
  },
  "¿Te resulta fácil integrarte a una conversación grupal?": {
    "muy difícil": 1,
    "difícil": 2,
    "neutro": 3,
    "fácil": 4,
    "muy fácil": 5
  },
  "¿Después de eventos sociales necesitas descansar a solas?": {
    "nunca": 1,
    "rara vez": 2,
    "a veces": 3,
    "frecuentemente": 4,
    "siempre": 5
  },
  "¿Sueles contar anécdotas tuyas cuando convives?": {
    "nada": 1,
    "poco": 2,
    "a veces": 3,
    "bastante": 4,
    "mucho": 5
  },
  "¿Te gustan los ambientes activos (plazas, conciertos, etc.)?": {
    "nunca": 1,
    "rara vez": 2,
    "a veces": 3,
    "frecuentemente": 4,
    "siempre": 5
  },
  "¿Prefieres trabajar o estudiar en grupo?": {
    "nunca": 1,
    "rara vez": 2,
    "a veces": 3,
    "frecuentemente": 4,
    "siempre": 5
  },
  "¿Evitas hablar en público si puedes elegir?": {
    "nunca": 1,
    "rara vez": 2,
    "a veces": 3,
    "frecuentemente": 4,
    "siempre": 5
  },
  "¿Te aburres si no interactúas con alguien?": {
    "nunca": 1,
    "rara vez": 2,
    "a veces": 3,
    "frecuentemente": 4,
    "siempre": 5
  },
  "¿Prefieres platicar en persona o por redes sociales?": {
    "siempre redes": 1,
    "usualmente redes": 2,
    "neutro": 3,
    "usualmente en persona": 4,
    "siempre en persona": 5
  },
  "¿Con qué frecuencia organizas convivencias o reuniones?": {
    "nunca": 1,
    "rara vez": 2,
    "a veces": 3,
    "frecuentemente": 4,
    "siempre": 5
  },
  "En las conversaciones, ¿hablas o escuchas más?": {
    "siempre escucho": 1,
    "usualmente escucho": 2,
    "equilibrado": 3,
    "usualmente hablo": 4,
    "siempre hablo": 5
  },
  "¿Qué tan cómodo te sientes expresando tus emociones?": {
    "nada cómodo": 1,
    "poco cómodo": 2,
    "neutro": 3,
    "bastante cómodo": 4,
    "muy cómodo": 5
  },
  "¿Necesitas tiempo a solas para equilibrarte después de socializar?": {
    "nunca": 1,
    "rara vez": 2,
    "a veces": 3,
    "frecuentemente": 4,
    "siempre": 5
  },
  "¿Disfrutas conocer personas, lugares o actividades nuevas?": {
    "nada": 1,
    "poco": 2,
    "a veces": 3,
    "bastante": 4,
    "mucho": 5
  },
  "¿Te gusta hablar de ti con otras personas?": {
    "nada": 1,
    "poco": 2,
    "a veces": 3,
    "bastante": 4,
    "mucho": 5
  },
  "¿Piensas antes de hablar o hablas sin filtro?": {
    "siempre pienso antes": 1,
    "usualmente pienso antes": 2,
    "depende": 3,
    "hablo rápido": 4,
    "hablo sin filtro": 5
  },
  "¿Te incomodan lugares muy concurridos?": {
    "nunca": 1,
    "rara vez": 2,
    "a veces": 3,
    "frecuentemente": 4,
    "siempre": 5
  },
  "¿Te sientes bien al recibir elogios públicos?": {
    "nada": 1,
    "poco": 2,
    "a veces": 3,
    "bastante": 4,
    "mucho": 5
  },
  "¿Necesitas convivir con alguien para sentirte bien durante el día?": {
    "nada": 1,
    "poco": 2,
    "a veces": 3,
    "bastante": 4,
    "mucho": 5
  },
  "¿Te cansan los estímulos como ruido o luces fuertes?": {
    "mucho": 1,
    "bastante": 2,
    "a veces": 3,
    "poco": 4,
    "nada": 5
  },
  "¿Necesitas silencio para ordenar tus ideas?": {
    "nunca": 1,
    "rara vez": 2,
    "a veces": 3,
    "frecuentemente": 4,
    "siempre": 5
  },
  "¿Te sientes con confianza al hablar en presentaciones o networking?": {
    "muy incómodo": 1,
    "incómodo": 2,
    "neutro": 3,
    "cómodo": 4,
    "muy cómodo": 5
  },
  "¿Cómo te sientes en videollamadas grupales (Zoom, Meet)?": {
    "muy incómodo": 1,
    "incómodo": 2,
    "neutro": 3,
    "cómodo": 4,
    "muy cómodo": 5
  },
  "¿Con qué frecuencia usas redes para interactuar con otros?": {
    "nunca": 1,
    "rara vez": 2,
    "a veces": 3,
    "frecuentemente": 4,
    "siempre": 5
  },
  "¿Disfrutas dinámicas en grupo como juegos o debates?": {
    "nada": 1,
    "poco": 2,
    "a veces": 3,
    "bastante": 4,
    "mucho": 5
  },
  "¿Te cuesta expresar desacuerdo en grupo?": {
    "mucho": 1,
    "bastante": 2,
    "a veces": 3,
    "poco": 4,
    "nada": 5
  },
  "¿Te gusta que te hagan preguntas personales?": {
    "nada": 1,
    "poco": 2,
    "a veces": 3,
    "bastante": 4,
    "mucho": 5
  },
  "¿Te molesta que interrumpan tu tiempo a solas para platicar?": {
    "nunca": 1,
    "rara vez": 2,
    "a veces": 3,
    "frecuentemente": 4,
    "siempre": 5
  },
  "¿Prefieres hacer cosas nuevas acompañado o solo?": {
    "siempre solo": 1,
    "usualmente solo": 2,
    "depende": 3,
    "usualmente acompañado": 4,
    "siempre acompañado": 5
  },
  "¿Te cuesta hablar en un grupo donde no conoces a nadie?": {
    "mucho": 1,
    "bastante": 2,
    "a veces": 3,
    "poco": 4,
    "nada": 5
  },
  "¿Te gusta participar en actividades escolares, laborales o sociales?": {
    "nada": 1,
    "poco": 2,
    "a veces": 3,
    "bastante": 4,
    "mucho": 5
  },
  "¿Te sientes cómodo hablando de tus logros?": {
    "nada cómodo": 1,
    "poco cómodo": 2,
    "neutro": 3,
    "bastante cómodo": 4,
    "muy cómodo": 5
  },
  "¿Con qué frecuencia tomas la iniciativa para conocer personas nuevas?": {
    "nunca": 1,
    "rara vez": 2,
    "a veces": 3,
    "frecuentemente": 4,
    "siempre": 5
  },
  "¿Prefieres trabajar en silencio o en lugares sociales?": {
    "siempre silencio": 1,
    "usualmente silencio": 2,
    "neutro": 3,
    "usualmente social": 4,
    "siempre social": 5
  },
  "¿Compartes tus ideas en clases, reuniones o trabajo?": {
    "nunca": 1,
    "rara vez": 2,
    "a veces": 3,
    "frecuentemente": 4,
    "siempre": 5
  },
  "¿Qué tan cómodo te sientes en reuniones por videollamada?": {
    "muy incómodo": 1,
    "incómodo": 2,
    "neutro": 3,
    "cómodo": 4,
    "muy cómodo": 5
  },
  "¿Te gusta estar en grupos grandes de WhatsApp o redes?": {
    "nada": 1,
    "poco": 2,
    "a veces": 3,
    "bastante": 4,
    "mucho": 5
  }
}


# Normalizar mapeos
mapeos_normalizados = {
    normalizar(pregunta): {normalizar(resp): val for resp, val in opciones.items()}
    for pregunta, opciones in mapeos.items()
}

@app.post("/limpiar-set")
async def limpiar_set(file: UploadFile = File(...)):
    if not file.filename.endswith(('.csv', '.xlsx')):
        raise HTTPException(status_code=400, detail="Formato de archivo no válido")

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)

        df.columns = df.columns.str.strip()
        df = df.dropna()
        df = df.applymap(lambda x: x.strip().lower() if isinstance(x, str) else x)

        columnas_originales = df.columns.tolist()
        columnas_normalizadas = [normalizar(c) for c in columnas_originales]

        # Mapeo real usando columnas normalizadas
        for idx, col_normalizada in enumerate(columnas_normalizadas):
            if col_normalizada in mapeos_normalizados:
                original = columnas_originales[idx]
                mapa = mapeos_normalizados[col_normalizada]
                df[original] = df[original].map(lambda x: mapa.get(normalizar(x), x))

        cleaned_path = os.path.join(UPLOAD_DIR, f"limpio_{file.filename}")
        df.to_csv(cleaned_path, index=False)

        return {
            "message": "Archivo limpiado correctamente",
            "rows": len(df),
            "columns": list(df.columns),
            "preview": df.head().to_dict(orient="records")
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar el archivo: {str(e)}")
