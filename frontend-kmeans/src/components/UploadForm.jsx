import React, { useState } from "react";
import { Box, Typography,Button,Input,Paper,CircularProgress,Alert, } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { limpiarSet } from "../services/apiService";

function UploadForm({ setResultados }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMensaje(null);
    setError(null);
  };

  const handleUpload = async () => {
  if (!file) {
    setError('Selecciona un archivo');
    return;
  }

  setLoading(true);
  try {
    const { ok, data } = await limpiarSet(file);
    if (ok) {
      setMensaje('Archivo limpiado correctamente');
      setResultados(data);
    } else {
      setError(data.detail || 'Error al limpiar el archivo');
    }
  } catch (error) {
    console.error(error);
    setError('No se pudo conectar con el servidor');
  } finally {
    setLoading(false);
  }
};

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Typography variant="h6" gutterBottom>
        📂 Adjuntar Set de Datos (Introvertido/Extrovertido)
      </Typography>

      <Box display="flex" alignItems="center" gap={2}>
        <Input
          type="file"
          onChange={handleFileChange}
          inputProps={{ accept: ".csv,.xlsx" }}
        />
        <Button
          variant="contained"
          startIcon={<CloudUploadIcon />}
          onClick={handleUpload}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Subir"}
        </Button>
      </Box>

      {file && (
        <Typography variant="body2" sx={{ mt: 2 }}>
          Archivo seleccionado: <strong>{file.name}</strong>
        </Typography>
      )}

      {mensaje && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {mensaje}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Paper>
  );
}

export default UploadForm;
