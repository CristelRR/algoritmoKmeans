import pandas as pd
from sklearn.cluster import KMeans
import joblib
import os
from datetime import datetime

def guardar_modelo(modelo, df_entrenamiento: pd.DataFrame, nombre="kmeans_model"):
    """
    1) Guarda el modelo en 'modelos' con timestamp
    2) Guarda el DataFrame de entrenamiento como CSV junto al .joblib
    """
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    os.makedirs("modelos", exist_ok=True)

    ruta_modelo = os.path.join("modelos", f"{nombre}_{ts}.joblib")
    joblib.dump(modelo, ruta_modelo)

    # Guardar también los datos de entrenamiento
    ruta_data = os.path.join("modelos", f"{nombre}_{ts}_data.csv")
    df_entrenamiento.to_csv(ruta_data, index=False, encoding="utf-8-sig")

    return ruta_modelo

def aplicar_kmeans(df: pd.DataFrame, columnas_a_excluir: list = None, n_clusters: int = 3):
    if columnas_a_excluir is None:
        columnas_a_excluir = []

    # 1) Filtrar columnas numéricas válidas
    columnas_validas = df.select_dtypes(include=["number"]).columns.tolist()
    columnas_utiles = [col for col in columnas_validas if col not in columnas_a_excluir]
    if not columnas_utiles:
        raise ValueError("No hay columnas numéricas válidas para aplicar KMeans.")

    # 2) Eliminar filas con NaN en las columnas útiles
    df_filtrado = df.dropna(subset=columnas_utiles)

    # 3) Entrenar KMeans
    modelo = KMeans(n_clusters=n_clusters, random_state=42)
    df_filtrado["Cluster"] = modelo.fit_predict(df_filtrado[columnas_utiles])

    # 4) Guardar modelo y datos de entrenamiento
    ruta_modelo = guardar_modelo(modelo, df_filtrado, nombre="kmeans_model")
    print(f"✅ Modelo guardado en: {ruta_modelo}")

    # 5) Volver a inyectar la columna Cluster en el DataFrame original
    df.loc[df_filtrado.index, "Cluster"] = df_filtrado["Cluster"]

    return df, ruta_modelo
