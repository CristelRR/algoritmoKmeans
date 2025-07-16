import pandas as pd
from sklearn.cluster import KMeans

def aplicar_kmeans(df: pd.DataFrame, columnas_a_excluir: list = None, n_clusters: int = 3) -> pd.DataFrame:
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

    # Combinar resultados con DataFrame original (opcional: también puedes usar solo el filtrado)
    df.loc[df_filtrado.index, "Cluster"] = df_filtrado["Cluster"]

    return df
