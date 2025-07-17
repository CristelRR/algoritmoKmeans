import os

directorio = r"C:\INGENIERIA\9NO cuatrimestre\Extracción de Conocimiento en Base de Datos\Unidad 4\AppKmeans\fastapi-backend\cleaned_data"
archivos = os.listdir(directorio)

print("Archivos en la carpeta cleaned_data:")
for archivo in archivos:
    print("-", archivo)
