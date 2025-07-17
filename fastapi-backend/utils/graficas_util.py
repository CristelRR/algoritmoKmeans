import os
import json
import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_samples, silhouette_score

def generar_graficas_backend(df: pd.DataFrame, labels: list, nombre_archivo_base: str, output_dir="graficas_personalidad"):
    os.makedirs(output_dir, exist_ok=True)
    rutas = {}

    # === DATOS PARA GRAFICAS INTERACTIVAS ===
    datos_graficas = {}

    # 1. Matriz de correlación
    try:
        print("✅ Generando matriz de correlación...")
        corr = df.corr().round(2)
        plt.figure(figsize=(10, 8))
        sns.heatmap(corr, annot=True, cmap="coolwarm")
        filename = f"{nombre_archivo_base}_correlacion.png"
        path = os.path.join(output_dir, filename)
        plt.title("Matriz de correlación")
        plt.tight_layout()
        plt.savefig(path)
        plt.close()
        rutas["matriz_correlacion"] = filename
        print("✅ Matriz de correlación guardada en:", path)
        datos_graficas["matriz_correlacion"] = corr.to_dict()
    except Exception as e:
        print("❌ Error en matriz de correlación:", str(e))

    # 2. PCA
    try:
        print("✅ Generando gráfico PCA...")
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
        print("✅ Gráfico PCA guardado en:", path)
        datos_graficas["pca_data"] = [
            {"PC1": float(row["PC1"]), "PC2": float(row["PC2"]), "Cluster": int(row["Cluster"])}
            for _, row in df_pca.iterrows()
        ]
        datos_graficas["pca_var"] = (pca.explained_variance_ratio_ * 100).round(2).tolist()
    except Exception as e:
        print("❌ Error en gráfico PCA:", str(e))

    # 3. Silueta
    try:
        print("✅ Generando gráfico de silueta...")
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

        avg_sil = silhouette_score(df, labels)
        plt.axvline(x=avg_sil, color="red", linestyle="--")
        plt.title("Gráfico de Silueta")
        plt.xlabel("Coeficiente de Silueta")
        filename = f"{nombre_archivo_base}_silueta.png"
        path = os.path.join(output_dir, filename)
        plt.tight_layout()
        plt.savefig(path)
        plt.close()
        rutas["silueta"] = filename
        print("✅ Gráfico de silueta guardado en:", path)
        datos_graficas["silueta_data"] = [
            {"Cluster": int(c), "Coeficiente": float(s)} for c, s in zip(labels, silhouette_vals)
        ]
        datos_graficas["silhouette_avg"] = round(float(avg_sil), 4)
    except Exception as e:
        print("❌ Error en gráfico de silueta:", str(e))

    print("🎯 Rutas de gráficas generadas:", rutas)

    # === GUARDAR DATOS INTERACTIVOS EN JSON ===
    try:
        json_path = os.path.join(output_dir, f"{nombre_archivo_base}_graficas.json")
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(datos_graficas, f, ensure_ascii=False, indent=2)
        print("✅ Datos interactivos guardados en:", json_path)
        rutas["json_interactivo"] = f"{nombre_archivo_base}_graficas.json"
    except Exception as e:
        print("❌ Error al guardar datos interactivos JSON:", str(e))

    return rutas
