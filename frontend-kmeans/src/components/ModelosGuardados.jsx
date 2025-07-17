import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Button,
  Modal,
  Card,
  CardContent,
  IconButton,
  Stack,
  Grow
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import ReactECharts from "echarts-for-react";
import {
  obtenerModelos,
  obtenerInfoModelo,
} from "../services/apiService";

export default function ModelosGuardados() {
  const [modelos, setModelos] = useState([]);
  const [allInfo, setAllInfo] = useState({});
  const [sel, setSel]         = useState(null); // modelo seleccionado
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    obtenerModelos().then(({ ok, data }) => {
      if (!ok) {
        setError("Error al cargar modelos.");
        setLoading(false);
        return;
      }
      setModelos(data.modelos);
      Promise.all(
        data.modelos.map(name =>
          obtenerInfoModelo(name).then(({ ok, data }) => ok ? { name, data } : null)
        )
      ).then(results => {
        const map = {};
        results.forEach(r => { if (r) map[r.name] = r.data; });
        setAllInfo(map);
        setLoading(false);
      });
    });
  }, []);

  if (loading) return <CircularProgress sx={{ display: "block", mx: "auto", mt: 4 }} />;
  if (error)   return <Alert severity="error">{error}</Alert>;

  // Formatea timestamp del nombre del archivo
  const formatFecha = name => {
    const m = name.match(/(\d{8})_(\d{6})/);
    if (!m) return "-";
    const [ , D, T ] = m;
    const d  = D.slice(6), mo = D.slice(4,6), y = D.slice(0,4);
    const h  = T.slice(0,2), mi = T.slice(2,4), s = T.slice(4);
    return `${d}/${mo}/${y} ${h}:${mi}:${s}`;
  };

  // Prepara datos para gráficas del modelo seleccionado
  const info = sel ? allInfo[sel] : {};
  const stats         = info?.stats         || [];
  const avgScores     = info?.avgScores     || [];
  const clusterCounts = info?.clusterCounts || [];
  const scores        = info?.scores        || [];
  const statsMax      = info?.statsMax      || 1;
  const radarData     = stats.map(r => r.mean);

  // Opciones de gráficas
  const baseAnim = { animation: true, animationDuration: 1000, animationEasing: "cubicOut" };
  const commonAxis = {
    axisLine:  { lineStyle: { color: "#b3d6ff" } },
    axisLabel: { color: "#3486ba" },
    splitLine: { lineStyle: { color: "rgba(100,149,237,0.09)" } }
  };
  const radarOption = {
    ...baseAnim,
    title: { text: "Perfil de Personalidad", left: "center", textStyle: { color: "#2563eb", fontSize: 22 } },
    tooltip: {},
    radar: {
      indicator: stats.map(s => ({ name: s.variable, max: statsMax })),
      radius: 140,
      axisName: { color: "#2563eb", fontSize: 12 }
    },
    series: [{ type: "radar", data: [{ value: radarData, name: "Media" }], areaStyle: { opacity: 0.23, color: "#a5f3fc" } }]
  };
  const barOption = {
    ...baseAnim,
    title: { text: "Media por Variable", left: "center", textStyle: { color: "#38bdf8", fontSize: 22 } },
    tooltip: {},
    xAxis: { ...commonAxis, type: "category", data: avgScores.map(i => i.variable), axisLabel: { rotate: 45, fontSize: 12 } },
    yAxis: { ...commonAxis, type: "value", name: "Media", nameTextStyle: { color: "#2563eb", fontSize: 14 } },
    series: [{ type: "bar", data: avgScores.map(i => i.mean), itemStyle: { color: "#7dd3fc" }, barWidth: "50%" }]
  };
  const pieOption = {
    ...baseAnim,
    title: { text: "Distribución de Personalidad", left: "center", textStyle: { color: "#6366f1", fontSize: 22 } },
    tooltip: { trigger: "item" },
    legend: { orient: "vertical", left: "left", textStyle: { color: "#2563eb", fontSize: 13 } },
    series: [{
      type: "pie",
      radius: "60%",
      center: ["50%", "55%"],
      data: clusterCounts,
      label: { color: "#2563eb", fontSize: 13 },
      emphasis: { itemStyle: { shadowBlur: 20, shadowColor: "#2563eb22" } }
    }]
  };
  const histOption = {
    ...baseAnim,
    title: { text: "Histograma de Puntajes", left: "center", textStyle: { color: "#38bdf8", fontSize: 22 } },
    tooltip: {},
    xAxis: { ...commonAxis, type: "category", data: scores.map(Math.floor).map(String), name: "Rango", nameTextStyle: { color: "#2563eb", fontSize: 14 } },
    yAxis: { ...commonAxis, type: "value", name: "Frecuencia", nameTextStyle: { color: "#2563eb", fontSize: 14 } },
    series: [{ type: "bar", data: scores.map(Math.floor), itemStyle: { color: "#93c5fd" }, barWidth: "50%" }]
  };
  const boxOption = {
    ...baseAnim,
    title: { text: "Boxplot de Puntajes", left: "center", textStyle: { color: "#38bdf8", fontSize: 22 } },
    tooltip: { trigger: "item" },
    grid: { left: "10%", right: "10%", bottom: "15%" },
    xAxis: { type: "category", data: ["Scores"], boundaryGap: true, axisLabel: { show: false } },
    yAxis: { ...commonAxis, type: "value", name: "Valor", nameTextStyle: { color: "#2563eb", fontSize: 14 } },
    series: [{ type: "boxplot", data: [scores] }]
  };
  const charts = [
    { title: "Perfil de Personalidad",       option: radarOption },
    { title: "Media por Variable",           option: barOption   },
    { title: "Distribución de Personalidad", option: pieOption   },
    { title: "Histograma de Puntajes",       option: histOption  },
    { title: "Boxplot de Puntajes",          option: boxOption   }
  ];

  // ---------- RENDER ----------
  return (
    <Box sx={{
      px: 2, py: 4,
      background: "linear-gradient(120deg,#dbeafe 0%, #bae6fd 100%)",
      minHeight: "100vh"
    }}>
      <Typography
        variant="h3"
        align="center"
        gutterBottom
        sx={{
          color: "#2563eb",
          mb: 4,
          fontWeight: 800,
          textShadow: "0 2px 16px #dbeafe",
          letterSpacing: "1px"
        }}>
        <span role="img" aria-label="box">📦</span> Modelos KMeans Guardados
      </Typography>

      {/* Tabla principal de modelos */}
      <TableContainer component={Paper} sx={{
        mb: 4,
        overflowX: "auto",
        background: "rgba(240, 249, 255, 0.99)",
        borderRadius: 4,
        boxShadow: "0 2px 24px 0 #a0e9fd44",
        maxWidth: "1100px",
        mx: "auto"
      }}>
        <Table sx={{ minWidth: 1100 }}>
          <TableHead>
            <TableRow>
              {["Modelo", "Creación", "# Clusters", "Inercia", "Variables usadas", "Centroides", "Cant. por cluster", ""].map((h, i) => (
                <TableCell key={i} sx={{
                  color: "#2563eb",
                  fontWeight: "bold",
                  fontSize: 15,
                  background: "#e0f2fe",
                  borderBottom: "3px solid #38bdf8",
                  letterSpacing: ".5px"
                }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {modelos.map((m, i) => {
              const inf = allInfo[m] || {};
              return (
                <TableRow hover key={i} sx={{
                  "&:hover": { background: "#bae6fd" },
                  borderBottom: "1px solid #90cdf4"
                }}>
                  {/* Nombre del modelo */}
                  <TableCell
                    sx={{
                      color: "#374151",
                      whiteSpace: "nowrap",
                      fontWeight: 600,
                      maxWidth: 180,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      fontSize: 14,
                      position: "relative"
                    }}
                    title={m}
                  >
                    {m}
                  </TableCell>
                  {/* Fecha de creación */}
                  <TableCell
                    sx={{
                      color: "#2563eb",
                      whiteSpace: "nowrap",
                      fontWeight: 500,
                      maxWidth: 120,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      fontSize: 14
                    }}
                  >
                    {formatFecha(m)}
                  </TableCell>
                  {/* Resto de celdas */}
                  <TableCell sx={{ color: "#0ea5e9", textAlign: "center", fontWeight: 700 }}>
                    {inf.n_clusters ?? "-"}
                  </TableCell>
                  <TableCell sx={{ color: "#0ea5e9", textAlign: "right", fontWeight: 700 }}>
                    {inf.inertia?.toFixed(2) ?? "-"}
                  </TableCell>
                  {/* VARIABLES USADAS */}
                  <TableCell
                    sx={{
                      color: "#334155",
                      maxWidth: 100,
                      fontSize: 12,
                      fontFamily: "monospace",
                      verticalAlign: "top",
                      p: 0
                    }}
                  >
                    <Box sx={{
                      maxHeight: 80,
                      overflowY: "auto",
                      wordBreak: "break-all",
                      whiteSpace: "pre-line",
                      p: 1,
                      pr: 0.5,
                      borderRadius: 1,
                      background: "#e0f2fe"
                    }}>
                      {(inf.variables || []).join(",\n")}
                    </Box>
                  </TableCell>
                  {/* CENTROIDES */}
                  <TableCell
                    sx={{
                      color: "#334155",
                      maxWidth: 120,
                      fontSize: 12,
                      fontFamily: "monospace",
                      verticalAlign: "top",
                      p: 0
                    }}
                  >
                    <Box sx={{
                      maxHeight: 80,
                      overflowY: "auto",
                      wordBreak: "break-all",
                      whiteSpace: "pre-line",
                      p: 1,
                      pr: 0.5,
                      borderRadius: 1,
                      background: "#e0f2fe"
                    }}>
                      {(inf.centros || []).map((c, j) =>
                        `C${j}: [${c.map(x => x.toFixed(1)).join(",")}]`
                      ).join("\n")}
                    </Box>
                  </TableCell>
                  {/* Cant. por cluster */}
                  <TableCell
                    sx={{
                      color: "#334155",
                      maxWidth: 100,
                      fontSize: 12,
                      fontFamily: "monospace",
                      verticalAlign: "top",
                      p: 0
                    }}
                  >
                    <Box sx={{
                      maxHeight: 65,
                      overflowY: "auto",
                      p: 1,
                      borderRadius: 1,
                      background: "#e0f2fe"
                    }}>
                      {(inf.clusterCounts || []).map((c, idx) =>
                        <div key={idx}>{c.name}: {c.value}</div>
                      )}
                    </Box>
                  </TableCell>
                  {/* Botón gráficas */}
                  <TableCell sx={{ textAlign: "center" }}>
                    <Button
                      size="small"
                      variant="contained"
                      sx={{
                        borderRadius: 10,
                        fontWeight: 700,
                        letterSpacing: 1,
                        px: 2.5,
                        background: "linear-gradient(90deg, #a5f3fc 0%, #38bdf8 100%)",
                        color: "#2563eb",
                        boxShadow: "0 1px 10px #7dd3fc66",
                        textTransform: "uppercase",
                        "&:hover": {
                          background: "linear-gradient(90deg, #38bdf8 0%, #a5f3fc 100%)",
                        }
                      }}
                      onClick={() => { setSel(m); setModalOpen(true); }}
                    >
                      GRÁFICAS
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal de Gráficas */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        sx={{ zIndex: 1300, display: "flex", alignItems: "center", justifyContent: "center" }}
        BackdropProps={{ sx: { background: "rgba(176,206,250,0.85)" } }}
      >
        <Box
          sx={{
            outline: "none",
            bgcolor: "#f1f5fd",
            p: 3,
            borderRadius: 4,
            minWidth: { xs: "90vw", sm: 700 },
            maxWidth: 900,
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 6px 36px rgba(54,100,221,0.11)",
            position: "relative"
          }}
        >
          <IconButton
            aria-label="cerrar"
            onClick={() => setModalOpen(false)}
            sx={{ position: "absolute", right: 12, top: 8, color: "#6366f1" }}
          >
            <CloseIcon fontSize="large" />
          </IconButton>
          <Typography variant="h5" sx={{ color: "#2563eb", textAlign: "center", mb: 2, fontWeight: 700 }}>
            Gráficas del Modelo: <span style={{ color: "#64748b" }}>{sel}</span>
          </Typography>
          <Stack spacing={3}>
            {charts.map((c, i) => (
              <Grow in timeout={600 + i * 150} key={i}>
                <Card sx={{ boxShadow: "0 4px 20px #38bdf822", borderRadius: 3 }}>
                  <CardContent sx={{ background: "#e0f2fe" }}>
                    <Typography variant="h6" sx={{ color: "#2563eb", mb: 2, textAlign: "center" }}>
                      {c.title}
                    </Typography>
                    <ReactECharts option={c.option} style={{ width: "100%", height: 400 }} />
                  </CardContent>
                </Card>
              </Grow>
            ))}
          </Stack>
        </Box>
      </Modal>
    </Box>
  );
}
