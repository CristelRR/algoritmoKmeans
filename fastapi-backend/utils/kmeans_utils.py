import pandas as pd
from sklearn.cluster import KMeans
import joblib
import os
from datetime import datetime

def guardar_modelo(modelo, nombre="kmeans_model"):
    """Guarda el modelo en una carpeta llamada 'modelos' con marca de tiempo."""
    fecha = datetime.now().strftime("%Y%m%d_%H%M%S")
    os.makedirs("modelos", exist_ok=True)
    ruta = os.path.join("modelos", f"{nombre}_{fecha}.joblib")
    joblib.dump(modelo, ruta)
    return ruta

def aplicar_kmeans(df: pd.DataFrame, columnas_a_excluir: list = None, n_clusters: int = 3):
    if columnas_a_excluir is None:
        columnas_a_excluir = []

    # Filtrar columnas numéricas válidas
    columnas_validas = df.select_dtypes(include=["number"]).columns
    columnas_utiles = [col for col in columnas_validas if col not in columnas_a_excluir]

    if not columnas_utiles:
        raise ValueError("No hay columnas numéricas válidas para aplicar KMeans.")

    # ⚠️ Eliminar filas con NaN solo en columnas útiles para clustering
    df_filtrado = df.dropna(subset=columnas_utiles)

    # Aplicar KMeans
    modelo = KMeans(n_clusters=n_clusters, random_state=42)
    df_filtrado["Cluster"] = modelo.fit_predict(df_filtrado[columnas_utiles])

    # Guardar modelo entrenado
    ruta_modelo = guardar_modelo(modelo)
    print(f"✅ Modelo guardado en: {ruta_modelo}")

    # Combinar resultados con DataFrame original
    df.loc[df_filtrado.index, "Cluster"] = df_filtrado["Cluster"]

    # ⬅️ ¡Retorna también la ruta del modelo!
    return df, ruta_modelo
