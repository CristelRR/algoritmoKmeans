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

  const handleUpload = async () => {
    if (!file) {
      setError("Selecciona un archivo");
      return;
    }

    setLoading(true);
    try {
      const { ok, data } = await generarSetNumerico(file);
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
        setError(data.detail || "Error al procesar el archivo");
      }
    } catch (error) {
      console.error(error);
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  // ---- GALAXY TABLE ----
  const renderTable = (titulo, rows) => {
    if (!rows || rows.length === 0) return null;
    return (
      <Box
        className="glass-card"
        sx={{
          mt: 4,
          p: 3,
          borderRadius: 14,
          background: "rgba(45,56,80,0.72)",  // Gris-azul medio, glassy
          boxShadow: "0 8px 32px 0 rgba(30,41,59,0.19)",
          border: "1.5px solid #475569",
          backdropFilter: "blur(6px) saturate(1.08)",
          color: "#e5e7ef",
          overflow: "hidden",
          minWidth: 300,
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            mb: 2,
            fontWeight: 700,
            color: "#e0e7ef",
            letterSpacing: "0.5px",
            textShadow: "none",
          }}
        >
          {titulo}
        </Typography>
        <Box
          sx={{
            height: 420,
            width: "100%",
            background: "transparent",
            borderRadius: 3,
            p: 0,
            boxShadow: "0 0 6px #3b425266",
            overflow: "auto",
          }}
        >
          <DataGrid
            rows={rows.map((row, i) => ({ id: i, ...row }))}
            columns={Object.keys(rows[0]).map((col) => ({
              field: col,
              headerName: col.toUpperCase(),
              flex: 1,
              minWidth: 140,
            }))}
            pageSize={5}
            rowsPerPageOptions={[5, 10, 20]}
            sx={{
              color: "#f3f4f6",
              background: "transparent",
              border: "none",
              fontFamily: "'Quicksand', 'Poppins', Arial, sans-serif",
              fontSize: "1.1rem",
              "& .MuiDataGrid-columnHeaders": {
                background: "rgba(255,255,255,0.16)",
                color: "#1e293b",
                fontWeight: 800,
                fontSize: 17,
                borderBottom: "2px solid rgba(255,255,255,0.19)",
                letterSpacing: "1px",
                textShadow: "0 2px 6px #fff6, 0 1px 10px #fff4",
                backdropFilter: "blur(7px) saturate(1.35)",
                borderTopLeftRadius: "16px",
                borderTopRightRadius: "16px",
              },
              "& .MuiDataGrid-cell": {
                background: "rgba(255,255,255,0.09)",
                color: "#0f172a",
                fontWeight: 600,
                fontSize: 17,
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                borderRight: "1px solid rgba(255,255,255,0.04)",
                backdropFilter: "blur(5px) saturate(1.15)",
                transition: "background 0.18s, box-shadow 0.15s, backdrop-filter 0.18s",
              },
              "& .MuiDataGrid-row:nth-of-type(even) .MuiDataGrid-cell": {
                background: "rgba(255,255,255,0.12)",
              },
              "& .MuiDataGrid-row:nth-of-type(odd) .MuiDataGrid-cell": {
                background: "rgba(255,255,255,0.09)",
              },
              "& .MuiDataGrid-footerContainer": {
                background: "rgba(255,255,255,0.13)",
                borderTop: "none",
                color: "#1e293b",
                backdropFilter: "blur(7px) saturate(1.2)",
                borderBottomLeftRadius: "16px",
                borderBottomRightRadius: "16px",
              },
              // Efecto glass líquido al pasar mouse (hover)
              "& .MuiDataGrid-row:hover .MuiDataGrid-cell": {
                background: "rgba(255,255,255,0.29)",
                boxShadow: "0 4px 32px 0 rgba(180, 215, 255, 0.15)",
                backdropFilter: "blur(10px) saturate(1.6)",
                border: "1.5px solid rgba(255,255,255,0.17)",
                zIndex: 2,
              },
              // Efecto glass líquido al seleccionar
              "& .MuiDataGrid-row.Mui-selected, & .MuiDataGrid-row.Mui-selected:hover .MuiDataGrid-cell": {
                background: "rgba(118,199,255,0.32) !important", // azul muy sutil glass
                boxShadow: "0 6px 32px 0 rgba(180, 215, 255, 0.25)",
                backdropFilter: "blur(12px) saturate(1.8)",
                border: "1.5px solid rgba(118,199,255,0.13)",
                zIndex: 3,
              },
              "& .MuiDataGrid-root": {
                border: "none",
              }
            }}
            
          />
        </Box>
      </Box>
    );
  };
  
  
  return (
    <Paper
      className="glass-card"
      elevation={5}
      sx={{
        maxWidth: 900,
        mx: "auto",
        my: 6,
        p: 5,
        borderRadius: 4,
        background: "rgba(24,28,48,0.78)", // Más oscuro, menos saturado
        boxShadow: "0 2px 18px 0 rgba(30,40,80,0.12)",
        border: "1.2px solid rgba(110,115,180,0.10)",
        backdropFilter: "blur(7px) saturate(1.03)",
      }}
    >
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          color: "#cbd5e1",
          fontWeight: "bold",
          letterSpacing: "0.5px"
        }}
      >
        📂 Adjuntar Set de Datos (Introvertido/Extrovertido)
      </Typography>

      <Box display="flex" alignItems="center" gap={2}>
        <Input
          type="file"
          onChange={handleFileChange}
          inputProps={{ accept: ".csv,.xlsx" }}
          sx={{
            background: "rgba(33,39,59,0.37)",
            borderRadius: 2,
            p: 1.5,
            border: "1px solid #3b82f6",
            color: "#e5e7ef",
            flex: 1,
            boxShadow: "none",
            "&::file-selector-button": {
              background: "rgba(59,130,246,0.18)",
              color: "#e5e7ef",
              border: "none",
              borderRadius: 8,
              px: 2,
              py: 1,
              fontWeight: 700,
              cursor: "pointer",
            }
          }}
        />
        <Button
          variant="contained"
          startIcon={<CloudUploadIcon />}
          onClick={handleUpload}
          disabled={loading}
          sx={{
            background: "#3b82f6",
            color: "#f1f5f9",
            fontWeight: "bold",
            borderRadius: 50,
            px: 4,
            py: 1.5,
            textTransform: "none",
            boxShadow: "0px 2px 10px rgba(59,130,246,0.16)",
            "&:hover": {
              background: "#1e40af",
              transform: "translateY(-1px) scale(1.03)",
              boxShadow: "0 0 10px #3b82f6bb",
            },
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "PROCESAR CON KMEANS"}
        </Button>
      </Box>

      {file && (
        <Typography variant="body2" sx={{ mt: 2, color: "#e5e7ef" }}>
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

      {vistaNumerica && (
        <Box sx={{ mt: 5 }}>
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            textColor="primary"
            indicatorColor="primary"
            centered
            sx={{
              "& .MuiTabs-indicator": { background: "#3b82f6" },
              "& .MuiTab-root": { color: "#e5e7ef !important" }
            }}
          >
            <Tab label="Set Limpio" />
            <Tab label="Set Numérico" />
            <Tab label="Gráfica" />
          </Tabs>

          {tabIndex === 0 && renderTable("✅ Vista previa del set limpio:", vistaLimpia)}
          {tabIndex === 1 && renderTable("📊 Vista previa del set numérico con clasificación:", vistaNumerica)}
          {tabIndex === 2 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2, color: "#a5b4fc" }}>
                📊 Gráfico de clasificación de personalidad
              </Typography>
              <GraficaPersonalidad datos={vistaNumerica} />
            </Box>
          )}

          {(nombreLimpio || nombreNumerico || nombreCluster) && (
            <Box sx={{ mt: 4, display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap" }}>
              {nombreLimpio && (
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => descargarArchivo(nombreLimpio)}
                  sx={{ borderColor: "#3b82f6", color: "#3b82f6" }}
                >
                  Descargar Set Limpio
                </Button>
              )}
              {nombreNumerico && (
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => descargarArchivo(nombreNumerico)}
                  sx={{ borderColor: "#818cf8", color: "#818cf8" }}
                >
                  Descargar Set Numérico
                </Button>
              )}
              {nombreCluster && (
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => descargarArchivo(nombreCluster)}
                  sx={{ background: "#22c55e", color: "#fff" }}
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
