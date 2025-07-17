import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Alert,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { predecirKMeans } from "../services/apiService";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

// Etiquetas por cluster (ajústalas según la salida de tu modelo si cambia)
const etiquetas = {
  0: "Introvertido",
  1: "Ambivertido",
  2: "Extrovertido",
};

function KMeansForm({ file, columnas, datosBase }) {
  const [resultados, setResultados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Ejecuta el clustering en el backend y procesa los resultados
  const handleClustering = async () => {
    setLoading(true);
    setError(null);

    try {
      // Extrae los nombres de columnas (acepta ambos formatos)
      const columnasParaKmeans = columnas.map((col) =>
        typeof col === "string" ? col : col.name || col
      );

      // Llama al backend
      const { ok, data } = await predecirKMeans(file, columnasParaKmeans);

      if (ok) {
        // Soporta los dos posibles formatos de respuesta
        let filasConCluster = [];
        if (data.preview_kmeans && Array.isArray(data.preview_kmeans)) {
          filasConCluster = data.preview_kmeans.map((fila, i) => ({
            id: i,
            ...fila,
            personalidad: etiquetas[fila.Cluster] ?? "Desconocido",
          }));
        } else if (data.predicciones && Array.isArray(data.predicciones)) {
          filasConCluster = datosBase.map((fila, i) => ({
            id: i,
            ...fila,
            cluster: data.predicciones[i],
            personalidad: etiquetas[data.predicciones[i]] ?? "Desconocido",
          }));
        } else {
          setError("La respuesta del backend no es válida.");
          setLoading(false);
          return;
        }
        setResultados(filasConCluster);
      } else {
        setError(data.detail || "Error al procesar clustering.");
      }
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar con el backend.");
    } finally {
      setLoading(false);
    }
  };

  // Cuenta por tipo de personalidad
  const contarPorPersonalidad = () => {
    if (!resultados) return {};
    return resultados.reduce((acc, fila) => {
      acc[fila.personalidad] = (acc[fila.personalidad] || 0) + 1;
      return acc;
    }, {});
  };

  // Gráfica Pie de resultados
  const renderGrafica = () => {
    const conteo = contarPorPersonalidad();
    const labels = Object.keys(conteo);
    const valores = Object.values(conteo);
    const colores = ["#60A5FA", "#A78BFA", "#F87171"]; // Puedes ajustar los colores si quieres

    const data = {
      labels,
      datasets: [
        {
          label: "# de personas",
          data: valores,
          backgroundColor: colores,
          borderColor: "#fff",
          borderWidth: 1,
        },
      ],
    };

    return (
      <Box sx={{ my: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          🧠 Distribución de Personalidades
        </Typography>
        <Pie data={data} />
      </Box>
    );
  };

  return (
    <Paper
      elevation={6}
      sx={{
        maxWidth: 1000,
        mx: "auto",
        my: 6,
        p: 5,
        borderRadius: 4,
        backgroundColor: "#FFFFFF",
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
        🤖 Aplicar Clustering K-Means
      </Typography>

      <Typography variant="body1" sx={{ mb: 3 }}>
        Elige las variables adecuadas para agrupar a los usuarios en clusters basados en sus respuestas.
      </Typography>

      <Button
        variant="contained"
        onClick={handleClustering}
        disabled={loading}
        sx={{ mb: 3 }}
      >
        {loading ? <CircularProgress size={24} /> : "Ejecutar Clustering"}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {resultados && (
        <>
          <Box sx={{ height: 400, mt: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
              Resultados del Clustering
            </Typography>
            <DataGrid
              rows={resultados}
              columns={Object.keys(resultados[0]).map((col) => ({
                field: col,
                headerName: col.toUpperCase(),
                flex: 1,
                minWidth: 130,
              }))}
              pageSize={5}
              rowsPerPageOptions={[5, 10, 20]}
            />
          </Box>
          {renderGrafica()}
        </>
      )}
    </Paper>
  );
}

export default KMeansForm;
