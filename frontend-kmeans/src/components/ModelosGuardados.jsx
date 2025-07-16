import React, { useEffect, useState } from "react";
import { Typography, Paper, List, ListItem, ListItemText, CircularProgress, Alert } from "@mui/material";
import { obtenerModelos } from "../services/apiService";

function ModelosGuardados() {
  const [modelos, setModelos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function cargarModelos() {
      const { ok, data } = await obtenerModelos();
      if (ok) {
        setModelos(data.modelos);
      } else {
        setError("Error al cargar los modelos guardados.");
      }
      setLoading(false);
    }
    cargarModelos();
  }, []);

  return (
    <Paper sx={{ p: 4, mt: 5 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
        📦 Modelos KMeans Guardados
      </Typography>

      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}
      {!loading && modelos.length === 0 && <Typography>No hay modelos guardados aún.</Typography>}
      <List>
        {modelos.map((modelo, index) => (
          <ListItem key={index}>
            <ListItemText primary={modelo} />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}

export default ModelosGuardados;