import React from "react";
import { Typography, Paper, Divider } from "@mui/material";

function Home() {
  return (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        mt: 2,
        background: "linear-gradient(to right, #E0F2FE, #F8FAFC)",
        borderRadius: 4,
      }}
    >
      <Typography variant="h4" fontWeight="bold" gutterBottom color="#1E3A8A">
        KMeans Predictor App
      </Typography>

      <Typography variant="body1" paragraph>
        Esta aplicación utiliza el algoritmo de <strong>K-Means Clustering</strong> para analizar respuestas de un test psicológico y clasificar a los usuarios como <strong>Introvertido</strong>, <strong>Ambivertido</strong> o <strong>Extrovertido</strong>.
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" fontWeight="bold" gutterBottom color="#1E3A8A">
        Funcionalidades principales
      </Typography>

      <ul>
        <li>
          <strong>Subir Archivo:</strong> Carga un archivo Excel con respuestas para limpieza, transformación y análisis automático.
        </li>
        <li>
          <strong>Ingreso Manual:</strong> Ingresa las respuestas directamente desde la interfaz.
        </li>
        <li>
          <strong>Resultados:</strong> Visualiza los resultados numéricos, clasificaciones y gráficas generadas por el modelo.
        </li>
        <li>
          <strong>Modelos Guardados:</strong> Consulta modelos KMeans previos con detalles como número de clusters, inercia y centroides.
        </li>
      </ul>

      <Divider sx={{ my: 2 }} />
    </Paper>
  );
}

export default Home;
