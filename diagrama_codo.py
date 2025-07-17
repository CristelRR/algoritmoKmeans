import pandas as pd
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans

# Ruta completa al archivo Excel
ruta_archivo = r"C:\INGENIERIA\9NO cuatrimestre\Extración de Conocimiento en Base de Datos\Unidad 4\AppKmeans\fastapi-backend\cleaned_data\numerico_test (1).xlsx"

# Cargar archivo
df = pd.read_excel(ruta_archivo)

# Filtrar solo columnas que empiecen con "p" y sean numéricas
columnas_p = [col for col in df.columns if col.lower().startswith("p") and df[col].dtype in ['int64', 'float64']]
X = df[columnas_p]

# Graficar diagrama del codo
inercia = []
k_range = range(1, 11)
for k in k_range:
    kmeans = KMeans(n_clusters=k, random_state=0, n_init='auto')
    kmeans.fit(X)
    inercia.append(kmeans.inertia_)

plt.figure(figsize=(8, 5))
plt.plot(k_range, inercia, marker='o')
plt.xlabel('Número de clusters (k)')
plt.ylabel('Inercia')
plt.title('Método del Codo para elegir k')
plt.grid(True)
plt.show()
