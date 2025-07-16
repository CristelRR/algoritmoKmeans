import React, { useEffect, useState } from "react";
import {
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Divider,
} from "@mui/material";
import {
  obtenerModelos,
  obtenerInfoModelo,
} from "../services/apiService";

function ModelosGuardados() {
  const [modelos, setModelos] = useState([]);
  const [modeloSeleccionado, setModeloSeleccionado] = useState(null);
  const [infoModelo, setInfoModelo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function cargarModelos() {
      const { ok, data } = await obtenerModelos();
      if (ok) {
        setModelos(data.modelos);
        setError(null);
      } else {
        setError("Error al cargar los modelos guardados.");
      }
      setLoading(false);
    }
    cargarModelos();
  }, []);

  const handleClickModelo = async (nombreModelo) => {
    setModeloSeleccionado(nombreModelo);
    setInfoModelo(null);

    const { ok, data } = await obtenerInfoModelo(nombreModelo);
    if (ok) {
      setError(null);
      setInfoModelo(data);
    } else {
      setInfoModelo(null);
      setError("No se pudo cargar la información del modelo.");
    }
  };

  return (
    <Paper sx={{ p: 4, mt: 5 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
        📦 Modelos KMeans Guardados
      </Typography>

      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}
      {!loading && modelos.length === 0 && (
        <Typography>No hay modelos guardados aún.</Typography>
      )}

      <List>
        {modelos.map((modelo, index) => (
          <ListItem
            key={index}
            button
            onClick={() => handleClickModelo(modelo)}
            selected={modelo === modeloSeleccionado}
          >
            <ListItemText primary={modelo} />
          </ListItem>
        ))}
      </List>

      {infoModelo && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="subtitle1" gutterBottom>
            🔍 Detalles del modelo seleccionado:
          </Typography>
          <Typography><strong>Nombre:</strong> {modeloSeleccionado}</Typography>
          <Typography><strong>Clusters:</strong> {infoModelo.n_clusters}</Typography>
          <Typography><strong>Inercia:</strong> {infoModelo.inertia}</Typography>
          <Typography variant="subtitle2" sx={{ mt: 2 }}>
            <strong>Centroides:</strong>
          </Typography>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.9rem" }}>
            {JSON.stringify(infoModelo.centroids, null, 2)}
          </pre>
        </>
      )}
    </Paper>
  );
}

export default ModelosGuardados;
