#!/usr/bin/env python3
import pandas as pd
import json
import os
import re
import unicodedata
import os
# obtenemos la carpeta donde está este mismo script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# si tu Excel está en la raíz del proyecto (D:\algoritmo\algoritmoKmeans\test (1).xlsx):
INPUT_XLSX = os.path.join(SCRIPT_DIR, '..', 'test (1).xlsx')

# si por el contrario lo dejaste en un sub‑directorio distinto, ajústalo igual:
# INPUT_XLSX = os.path.join(SCRIPT_DIR, '..', 'otro_folder', 'test (1).xlsx')

# salida sigue igual:
OUTPUT_JSON = os.path.join(SCRIPT_DIR, '..', 'frontend-kmeans', 'src', 'data', 'questions.json')

# --- Configuración de rutas ---
INPUT_XLSX = os.path.join(os.getcwd(), 'scripts', 'test (1).xlsx')
OUTPUT_JSON = os.path.join(
    os.getcwd(),
    'frontend-kmeans', 'src', 'data', 'questions.json'
)

# --- Función auxiliar para limpiar texto ---
def slugify(text):
    # quita acentos, espacios y caracteres inválidos
    text = unicodedata.normalize('NFKD', text)
    text = text.encode('ascii', 'ignore').decode('ascii')
    text = text.strip().lower()
    text = re.sub(r'[^a-z0-9]+', '_', text)
    return text.strip('_')

def main():
    # Leemos todo el Excel
    df = pd.read_excel(INPUT_XLSX)

    # Nombres de columnas que queremos ignorar
    exclude = {'Marca temporal', 'Puntuación', 'Score', 'Timestamp'}

    preguntas = []
    for col in df.columns:
        label = col.strip()
        if label in exclude:
            continue

        name = slugify(label)
        # sacamos los valores únicos (sin nulos)
        opts = df[col].dropna().unique().tolist()
        opts = [str(o) for o in opts]

        # Si la etiqueta es "¿Cuál es tu nombre?" la hacemos text, si no, select
        if label.lower().startswith('¿cuál es tu nombre'):
            tipo = 'text'
            opciones = None
        else:
            tipo = 'select'
            opciones = opts

        qobj = {
            'name': name,
            'label': label,
            'type': tipo
        }
        if opciones is not None:
            qobj['options'] = opciones

        preguntas.append(qobj)

    # Aseguramos carpeta de destino
    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)

    # Volcamos JSON
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(preguntas, f, ensure_ascii=False, indent=2)

    print(f'✅ Generadas {len(preguntas)} preguntas en {OUTPUT_JSON}')

if __name__ == '__main__':
    main()
