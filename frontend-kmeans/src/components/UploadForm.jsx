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
import { generarSetNumerico, obtenerGraficasJSON } from "../services/apiService";
import GraficaPersonalidad from "./GraficaPersonalidad";
import VariableSelector from "./VariableSelector";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
  const [datosGraficas, setDatosGraficas] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMensaje(null);
    setError(null);
    setVistaLimpia(null);
    setVistaNumerica(null);
    setNombreLimpio(null);
    setNombreNumerico(null);
    setNombreCluster(null);
    setDatosGraficas(null);
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

        const resGraficas = await obtenerGraficasJSON(`numerico_${file.name}`);
        if (resGraficas.ok) setDatosGraficas(resGraficas.data);
        else setDatosGraficas(null);
      } else {
        const detalle = data?.detail;
        if (typeof detalle === "object" && detalle.error && detalle.detalles) {
          setError(`${detalle.error}:\n${detalle.detalles.join("\n")}`);
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
        setError(`${detalle.error}:\n${detalle.detalles.join("\n")}`);
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

  // --------- BOTONES DE DESCARGA ---------
  const handleDescarga = (tipo) => {
    let url = "";
    if (tipo === "limpio" && nombreLimpio) url = `http://localhost:8000/descargar-archivo/${nombreLimpio}`;
    if (tipo === "numerico" && nombreNumerico) url = `http://localhost:8000/descargar-archivo/${nombreNumerico}`;
    if (tipo === "cluster" && nombreCluster) url = `http://localhost:8000/descargar-archivo/${nombreCluster}`;
    if (url) window.open(url, "_blank");
  };

  // -------- GENERAR PDF PROFESIONAL ---------
  const handleDescargarPDF = async () => {
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const marginX = 40;
    let y = 48;

    // Portada profesional
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(28);
    pdf.text("Reporte de Personalidad con KMeans", pageWidth / 2, y, { align: "center" });
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "normal");
    y += 45;
    pdf.text(`Archivo Analizado: ${file?.name || "-"}`, pageWidth / 2, y, { align: "center" });
    y += 24;
    pdf.setFontSize(13);
    pdf.text(`Fecha de generación: ${new Date().toLocaleString()}`, pageWidth / 2, y, { align: "center" });
    y += 18;
    pdf.setDrawColor(70, 180, 255);
    pdf.line(marginX, y + 5, pageWidth - marginX, y + 5);
    y += 30;
    pdf.setFontSize(13);
    pdf.setFont("helvetica", "italic");
    pdf.text(
      "Este reporte incluye análisis descriptivo, clasificación de personalidad\n y visualizaciones generadas automáticamente.",
      pageWidth / 2,
      y,
      { align: "center" }
    );

    pdf.addPage();

    // Estadística general descriptiva
    y = 44;
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("1. Estadística Descriptiva General", marginX, y);
    y += 16;
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");

    if (vistaNumerica && vistaNumerica.length > 0) {
      const columnas = Object.keys(vistaNumerica[0]).filter(c => c !== "id" && c !== "Personalidad");
      const stats = columnas.map(col => {
        const vals = vistaNumerica.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
        if (vals.length > 0) {
          const mean = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
          const min = Math.min(...vals).toFixed(2);
          const max = Math.max(...vals).toFixed(2);
          const std = Math.sqrt(vals.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / vals.length).toFixed(2);
          return `${col}: Media = ${mean} | Min = ${min} | Max = ${max} | Std = ${std}`;
        }
        return null;
      }).filter(Boolean);

      for (const st of stats) {
        pdf.text(st, marginX + 6, y);
        y += 15;
        if (y > 730) { pdf.addPage(); y = 44; }
      }
      y += 12;
    } else {
      pdf.text("No hay datos estadísticos disponibles.", marginX + 6, y);
      y += 18;
    }

    // Sección visualizaciones
    pdf.addPage();
    y = 50;
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("2. Visualización de Gráficas Principales", marginX, y);
    y += 20;

    // IDs de gráficas a capturar
    const graficaIds = [
      { id: "grafica-barra-pdf", label: "Clasificación por Cantidad" },
      { id: "grafica-pie-pdf", label: "Porcentaje por Tipo (Pie)" },
      { id: "grafica-radar-pdf", label: "Promedio por Categoría (Radar Chart)" }
    ];

    for (const { id, label } of graficaIds) {
      const el = document.getElementById(id);
      if (el) {
        const canvas = await html2canvas(el, { backgroundColor: "#fff", scale: 1.7 });
        const imgData = canvas.toDataURL("image/png");
        if (y > 600) { pdf.addPage(); y = 50; }
        pdf.setFontSize(13);
        pdf.setFont("helvetica", "bold");
        pdf.text(label, marginX, y + 10);
        y += 16;
        pdf.addImage(imgData, "PNG", marginX, y, 480, 200);
        y += 220;
      }
    }

    // Visualizaciones extra generadas por backend (si existen)
    if (file) {
      const nombre = file.name.replace(/\.[^/.]+$/, "");
      const imgs = [
        { url: `http://localhost:8000/static/${nombre}_correlacion.png`, label: "Matriz de Correlación (Backend)" },
        { url: `http://localhost:8000/static/${nombre}_pca.png`, label: "Gráfico de Dispersión PCA (Backend)" },
        { url: `http://localhost:8000/static/${nombre}_silueta.png`, label: "Gráfico de Silueta (Backend)" }
      ];
      for (const imgObj of imgs) {
        const img = new window.Image();
        img.crossOrigin = "Anonymous";
        img.src = imgObj.url;
        await new Promise(res => { img.onload = res; img.onerror = res; });
        try {
          if (y > 600) { pdf.addPage(); y = 50; }
          pdf.setFontSize(13);
          pdf.setFont("helvetica", "bold");
          pdf.text(imgObj.label, marginX, y + 10);
          y += 16;
          pdf.addImage(img, "PNG", marginX, y, 470, 195);
          y += 210;
        } catch (e) { /* Si falla ignora */ }
      }
    }

    // Notas finales
    pdf.addPage();
    y = 70;
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bolditalic");
    pdf.text("Observaciones y Notas:", marginX, y);
    y += 16;
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      "Este reporte fue generado automáticamente por la aplicación web de análisis de personalidad.\n" +
        "Incluye análisis estadístico descriptivo y visualizaciones tanto interactivas como imágenes estáticas generadas por el backend.\n\n" +
        "Desarrollado por: Eduardo González Ortiz, Lucia Cristel Ramirez Romero y Schoenstantt Andrea Palomares Barrientos\n" +
        `Fecha: ${new Date().toLocaleDateString()}`,
      marginX, y
    );

    pdf.save(`Reporte_${file ? file.name.replace(/\.[^/.]+$/, "") : "personalidad"}.pdf`);
  };

  // -------- TABLA PREVIA --------
  const renderTable = (titulo, rows) => {
    if (!rows || rows.length === 0) return null;
    const colCount = Object.keys(rows[0]).length;
    const innerMinWidth = colCount * 140;
    return (
      <Box
        className="glass-card"
        sx={{
          mt: 4, p: 3, borderRadius: 6,
          background: "linear-gradient(120deg, #eaf6ffbb 0%, #f8faffbb 100%)",
          boxShadow: "0 8px 38px 0 #b3e6ff33",
          border: "1.7px solid #b7eafd",
          backdropFilter: "blur(10px)",
          color: "#0f172a",
          overflowX: "hidden",
          overflowY: "visible",
        }}
      >
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700, color: "#0ea5e9", letterSpacing: "0.5px" }}>
          {titulo}
        </Typography>
        <Box sx={{ width: "100%", overflowX: "auto", textAlign: "center", pb: 1 }}>
          <Box sx={{ display: "inline-block", minWidth: innerMinWidth, height: 420 }}>
            <DataGrid
              rows={rows.map((r, i) => ({ id: i, ...r }))}
              columns={Object.keys(rows[0]).map((col) => ({
                field: col,
                headerName: col.toUpperCase(),
                flex: 1,
                minWidth: 140,
              }))}
              pageSize={5}
              rowsPerPageOptions={[5, 10, 20, 100]}
              sx={{
                height: "100%",
                border: "none",
                "& .MuiDataGrid-columnHeaders": {
                  background: "rgba(174,225,254,0.22)",
                  color: "#2563eb",
                  fontWeight: 800,
                  fontSize: 17,
                  borderBottom: "2px solid #b7eafd77",
                  letterSpacing: "1px",
                  textShadow: "0 1px 6px #dbeafe77",
                  backdropFilter: "blur(7px)",
                },
                "& .MuiDataGrid-cell": {
                  background: "rgba(255,255,255,0.12)",
                  color: "#0f172a",
                  fontWeight: 600,
                  fontSize: 17,
                  borderBottom: "1px solid #bae6fd18",
                  borderRight: "1px solid #bae6fd11",
                  backdropFilter: "blur(3px)",
                },
                "& .MuiDataGrid-footerContainer": {
                  background: "rgba(187,247,255,0.15)",
                  borderTop: "none",
                  color: "#334155",
                  backdropFilter: "blur(7px)",
                },
                "& .MuiDataGrid-root": { border: "none" },
              }}
            />
          </Box>
        </Box>
      </Box>
    );
  };

  // ----------- RETURN -------------
  return (
    <Box sx={{
      mt: 0, pt: 0, pb: 0, mb: 0,
      display: "flex", flexDirection: "column", alignItems: "center",
      minHeight: "calc(100vh - 0px)", width: "100%",
    }}>
    <Paper
  className="glass-card"
  elevation={0}
  sx={{
    maxWidth: 750,      // <<<< CAMBIADO, antes 950
    mx: "auto",
    my: 2,
    p: { xs: 2.5, md: 5 },
    borderRadius: 7,
    background: "linear-gradient(120deg, #eaf6ff 0%, #f8faff 100%)",
    boxShadow: "0 12px 54px 0 #a7e6fd2f, 0 2px 12px #7ec3f333",
    border: "2px solid #b7eafd",
    backdropFilter: "blur(18px)",
    minHeight: 220,
    overflowX: "auto",
  }}
>
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            color: "#2579d1", fontWeight: "bold", letterSpacing: "0.7px",
            textShadow: "0 2px 24px #dbeafe66",
          }}
        >
          <span role="img" aria-label="clip">📂</span> Adjuntar Set de Datos (Introvertido/Extrovertido)
        </Typography>
        <VariableSelector onSeleccionChange={handleSeleccionVariables} />

        <Box display="flex" alignItems="center" gap={2} sx={{ mt: 2 }}>
          <Input
            type="file"
            onChange={handleFileChange}
            inputProps={{ accept: ".csv,.xlsx" }}
            sx={{
              background: "rgba(216,238,255,0.49)",
              borderRadius: 2, p: 1.5,
              border: "1px solid #a5d8fa",
              color: "#22315b",
              flex: 1, fontWeight: 600,
              "&::file-selector-button": {
                background: "rgba(118,199,255,0.24)", color: "#2579d1",
                border: "none", borderRadius: 8, px: 2, py: 1,
                fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }
            }}
          />
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            onClick={handleUpload}
            disabled={loading}
            sx={{
              background: "#38bdf8", color: "#f1f5f9",
              fontWeight: "bold", borderRadius: 50, px: 4, py: 1.5, fontSize: "1.13rem",
              textTransform: "none", boxShadow: "0px 2px 18px #7dd3fc44", letterSpacing: 0.7,
              "&:hover": {
                background: "#0ea5e9",
                transform: "translateY(-1px) scale(1.03)",
                boxShadow: "0 0 18px #38bdf8bb",
              },
            }}
          >
            {loading ? (<CircularProgress size={24} color="inherit" />) : "PROCESAR CON KMEANS"}
          </Button>
        </Box>

        {file && (
          <Typography variant="body2" sx={{ mt: 2, color: "#2563eb", fontWeight: 600 }}>
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
              sx={{
                "& .MuiTabs-indicator": { background: "#38bdf8" },
                "& .MuiTab-root": { color: "#2579d1 !important", fontWeight: 700 }
              }}
            >
              <Tab label="Set Limpio" />
              <Tab label="Set Numérico" />
              <Tab label="Gráfica" />
            </Tabs>

            {tabIndex === 0 && (
              <Box sx={{ display: "flex", justifyContent: "center", width: "100%", mt: 4 }}>
                {renderTable("✅ Vista previa del set limpio:", vistaLimpia)}
              </Box>
            )}

            {tabIndex === 1 && (
              <Box sx={{ display: "flex", justifyContent: "center", width: "100%", mt: 4 }}>
                {renderTable("📊 Vista previa del set numérico con clasificación:", vistaNumerica)}
              </Box>
            )}

            {tabIndex === 2 && (
              <Box sx={{ mt: 4, mb: 5 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: "bold", mb: 2, color: "#0ea5e9" }}
                >
                  📊 Gráfico de clasificación de personalidad
                </Typography>
                <GraficaPersonalidad
                  datos={vistaNumerica}
                  datosGraficas={datosGraficas}
                  idBarra="grafica-barra-pdf"
                  idPie="grafica-pie-pdf"
                  idRadar="grafica-radar-pdf"
                />
                <Box sx={{ height: 48 }} />
              </Box>
            )}

            {(nombreLimpio || nombreNumerico || nombreCluster) && (
              <Box
                sx={{
                  mt: tabIndex === 2 ? 0 : 4,
                  display: "flex",
                  justifyContent: "center",
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                {nombreLimpio && (
                  <Button
                    variant="outlined"
                    color="info"
                    onClick={() => handleDescarga("limpio")}
                    sx={{
                      fontWeight: 700, borderRadius: 4, px: 3, py: 1.1,
                      borderColor: "#38bdf8", color: "#2563eb",
                      "&:hover": { borderColor: "#2563eb", background: "#e0f2fe" }
                    }}
                  >
                    Descargar Set Limpio
                  </Button>
                )}
                {nombreNumerico && (
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => handleDescarga("numerico")}
                    sx={{
                      fontWeight: 700, borderRadius: 4, px: 3, py: 1.1,
                      borderColor: "#2563eb", color: "#2563eb",
                      "&:hover": { borderColor: "#1e40af", background: "#dbeafe" }
                    }}
                  >
                    Descargar Set Numérico
                  </Button>
                )}
                {nombreCluster && (
                  <Button
                    variant="outlined"
                    color="success"
                    onClick={() => handleDescarga("cluster")}
                    sx={{
                      fontWeight: 700, borderRadius: 4, px: 3, py: 1.1,
                      borderColor: "#22c55e", color: "#22c55e",
                      "&:hover": { borderColor: "#16a34a", background: "#dcfce7" }
                    }}
                  >
                    Descargar Clusterizado
                  </Button>
                )}
                {tabIndex === 2 && (
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleDescargarPDF}
                    sx={{
                      fontWeight: 700, borderRadius: 4, px: 3, py: 1.1,
                      background: "#6366f1", color: "#fff",
                      "&:hover": { background: "#6366f1cc" },
                    }}
                  >
                    Descargar PDF del Reporte
                  </Button>
                )}
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default UploadForm;
