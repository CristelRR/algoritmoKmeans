import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Input,
  Paper,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { DataGrid } from "@mui/x-data-grid";
import { generarSetNumerico, descargarArchivo } from "../services/apiService";
import GraficaPersonalidad from "./GraficaPersonalidad";
import VariableSelector from "./VariableSelector";

function UploadForm({ setResultados }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);
  const [vistaLimpia, setVistaLimpia] = useState(null);
  const [vistaNumerica, setVistaNumerica] = useState(null);
  const [nombreLimpio, setNombreLimpio] = useState(null);
  const [nombreNumerico, setNombreNumerico] = useState(null);
  const [nombreCluster, setNombreCluster] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [variablesSeleccionadas, setVariablesSeleccionadas] = useState([]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMensaje(null);
    setError(null);
    setVistaLimpia(null);
    setVistaNumerica(null);
    setNombreLimpio(null);
    setNombreNumerico(null);
    setNombreCluster(null);
  };

  const handleSeleccionVariables = (lista) => {
    setVariablesSeleccionadas(lista);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Selecciona un archivo");
      return;
    }

    setLoading(true);
    setError(null);
    setMensaje(null);

    try {
      const { ok, data } = await generarSetNumerico(file, variablesSeleccionadas);

      if (ok) {
        setMensaje("Archivo procesado correctamente");
        setResultados(data);
        setVistaLimpia(data.preview_limpio);
        setVistaNumerica(data.preview_numerico);
        setNombreLimpio(`limpio_${file.name}`);
        setNombreNumerico(`numerico_${file.name}`);
        setNombreCluster(data.archivo_cluster);
        setTabIndex(0);
      } else {
        const detalle = data?.detail;
        if (typeof detalle === "object" && detalle.error && detalle.detalles) {
          const mensajeFormateado = `${detalle.error}:\n${detalle.detalles.join("\n")}`;
          setError(mensajeFormateado);
        } else if (typeof detalle === "string") {
          setError(detalle);
        } else {
          setError("Error al procesar el archivo.");
        }
      }
    } catch (error) {
      console.error(error);

      const detalle =
        error?.response?.data?.detail ||
        error?.response?.data ||
        error?.message;

      if (typeof detalle === "object" && detalle.error && detalle.detalles) {
        const mensajeFormateado = `${detalle.error}:\n${detalle.detalles.join("\n")}`;
        setError(mensajeFormateado);
      } else if (typeof detalle === "string") {
        setError(detalle);
      } else {
        setError("Ocurrió un error inesperado.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const renderTable = (titulo, rows) => {
    if (!rows || rows.length === 0) return null;
    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: "bold" }}>
          {titulo}
        </Typography>
        <Box sx={{ height: 400, width: "100%" }}>
          <DataGrid
            rows={rows.map((row, i) => ({ id: i, ...row }))}
            columns={Object.keys(rows[0]).map((col) => ({
              field: col,
              headerName: col.toUpperCase(),
              flex: 1,
              minWidth: 150,
            }))}
            pageSize={5}
            rowsPerPageOptions={[5, 10, 20]}
          />
        </Box>
      </Box>
    );
  };

  return (
    <Paper
      elevation={6}
      sx={{
        maxWidth: 900,
        mx: "auto",
        my: 6,
        p: 5,
        backgroundColor: "#FFFFFF",
        borderRadius: 4,
        boxShadow: "0 12px 24px rgba(0,0,0,0.08)",
      }}
    >
      <Typography
        variant="h6"
        gutterBottom
        sx={{ color: "primary.main", fontWeight: "bold" }}
      >
        📂 Adjuntar Set de Datos (Introvertido/Extrovertido)
      </Typography>

      <VariableSelector onSeleccionChange={handleSeleccionVariables} />

      <Box display="flex" alignItems="center" gap={2}>
        <Input
          type="file"
          onChange={handleFileChange}
          inputProps={{ accept: ".csv,.xlsx" }}
          sx={{
            backgroundColor: "#F8FAFC",
            borderRadius: 1,
            p: 1,
            border: "1px solid #CBD5E1",
            flex: 1,
          }}
        />
        <Button
          variant="contained"
          startIcon={<CloudUploadIcon />}
          onClick={handleUpload}
          disabled={loading}
          sx={{
            background: "primary.main",
            color: "white",
            fontWeight: "bold",
            borderRadius: 50,
            px: 4,
            py: 1.5,
            textTransform: "none",
            boxShadow: "0px 4px 10px rgba(30, 58, 138, 0.3)",
            "&:hover": {
              backgroundColor: "#1D4ED8",
              transform: "translateY(-1px)",
            },
          }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "PROCESAR CON KMEANS"
          )}
        </Button>
      </Box>

      {file && (
        <Typography variant="body2" sx={{ mt: 2 }}>
          Archivo seleccionado: <strong>{file.name}</strong>
        </Typography>
      )}

      {mensaje && <Alert severity="success" sx={{ mt: 2 }}>{mensaje}</Alert>}

      {error && (
        <Alert severity="error" sx={{ mt: 2, whiteSpace: 'pre-line' }}>
          {error}
        </Alert>
      )}

      {vistaNumerica && (
        <Box sx={{ mt: 5 }}>
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            textColor="primary"
            indicatorColor="primary"
            centered
          >
            <Tab label="Set Limpio" />
            <Tab label="Set Numérico" />
            <Tab label="Gráfica" />
          </Tabs>

          {tabIndex === 0 &&
            renderTable("✅ Vista previa del set limpio:", vistaLimpia)}
          {tabIndex === 1 &&
            renderTable("📊 Vista previa del set numérico con clasificación:", vistaNumerica)}
          {tabIndex === 2 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2 }}>
                📊 Gráfico de clasificación de personalidad
              </Typography>
              <GraficaPersonalidad datos={vistaNumerica} />
            </Box>
          )}

          {(nombreLimpio || nombreNumerico || nombreCluster) && (
            <Box
              sx={{
                mt: 4,
                display: "flex",
                justifyContent: "center",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              {nombreLimpio && (
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => descargarArchivo(nombreLimpio)}
                >
                  Descargar Set Limpio
                </Button>
              )}
              {nombreNumerico && (
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => descargarArchivo(nombreNumerico)}
                >
                  Descargar Set Numérico
                </Button>
              )}
              {nombreCluster && (
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => descargarArchivo(nombreCluster)}
                >
                  Descargar Resultados con Clúster
                </Button>
              )}
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
}

export default UploadForm;
