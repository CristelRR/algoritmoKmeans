import React, { useEffect, useState } from "react";
import {
  Box,
  FormControlLabel,
  Checkbox,
  Typography,
  Paper,
  Tooltip,
} from "@mui/material";
import { obtenerPreguntasCategorizadas } from "../services/apiService";

function VariableSelector({ onSeleccionChange }) {
  const [preguntasPorCategoria, setPreguntasPorCategoria] = useState({});
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [todasLasPreguntas, setTodasLasPreguntas] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const data = await obtenerPreguntasCategorizadas();
      const agrupadas = {};
      const todas = [];
      data.forEach((item) => {
        if (!agrupadas[item.categoria]) agrupadas[item.categoria] = [];
        agrupadas[item.categoria].push(item.numero);
        todas.push(item.numero);
      });
      setPreguntasPorCategoria(agrupadas);
      setTodasLasPreguntas(todas);
    }
    fetchData();
  }, []);

  const handleChange = (pregunta) => {
    const updated = seleccionadas.includes(pregunta)
      ? seleccionadas.filter((p) => p !== pregunta)
      : [...seleccionadas, pregunta];
    setSeleccionadas(updated);
    onSeleccionChange(updated);
  };

  const handleSelectAll = (checked) => {
    const nuevas = checked ? [...todasLasPreguntas] : [];
    setSeleccionadas(nuevas);
    onSeleccionChange(nuevas);
  };

  const handleSelectCategoria = (categoria, checked) => {
    const preguntasCategoria = preguntasPorCategoria[categoria] || [];
    const nuevasSeleccionadas = checked
      ? [...new Set([...seleccionadas, ...preguntasCategoria])]
      : seleccionadas.filter((p) => !preguntasCategoria.includes(p));
    setSeleccionadas(nuevasSeleccionadas);
    onSeleccionChange(nuevasSeleccionadas);
  };

  const isAllSelected =
    todasLasPreguntas.length > 0 &&
    seleccionadas.length === todasLasPreguntas.length;

  const isCategoriaSeleccionada = (categoria) =>
    preguntasPorCategoria[categoria]?.every((p) =>
      seleccionadas.includes(p)
    );

  return (
    <Box
      sx={{
        mb: 3,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Paper
        className="glass-card"
        sx={{
          p: { xs: 2, md: 4 },
          borderRadius: 5,
          width: "100%",
          maxWidth: 720,
          boxShadow: "0 4px 32px #b3e6ff44",
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          border: "1.5px solid #e0f7ff",
        }}
        elevation={0}
      >
        <Typography
          variant="h6"
          sx={{
            mb: 3,
            fontWeight: "bold",
            letterSpacing: 1,
            color: "#388ee8",
            textShadow: "0 2px 16px #b6f1fd44",
          }}
        >
          🎯 Selecciona las variables por categoría
        </Typography>

        <FormControlLabel
          control={
            <Checkbox
              checked={isAllSelected}
              onChange={(e) => handleSelectAll(e.target.checked)}
              sx={{
                color: "#388ee8",
                "&.Mui-checked": { color: "#4fd1c5" },
              }}
            />
          }
          label={
            <span style={{ fontWeight: 600, color: "#22315b" }}>
              Seleccionar TODAS las variables
            </span>
          }
          sx={{
            mb: 3,
            background: "rgba(160,235,252,0.13)",
            borderRadius: 3,
            px: 2,
            py: 1,
          }}
        />

        {Object.entries(preguntasPorCategoria).map(([categoria, preguntas]) => (
          <Box
            key={categoria}
            sx={{
              mb: 4,
              pb: 2,
              borderBottom: "2px solid #e3e6f9",
              background:
                "linear-gradient(90deg, rgba(160,235,252,0.06) 0%, rgba(253,220,255,0.04) 100%)",
              borderRadius: 3,
              px: 2,
              pt: 2,
              boxShadow: "none",
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                color: "#58b4fa",
                textShadow: "0 2px 8px #9ee6ff77",
                mb: 0.5,
                letterSpacing: 0.5,
              }}
            >
              {categoria}
            </Typography>

            <FormControlLabel
              control={
                <Checkbox
                  checked={isCategoriaSeleccionada(categoria)}
                  onChange={(e) =>
                    handleSelectCategoria(categoria, e.target.checked)
                  }
                  sx={{
                    color: "#fd94b4",
                    "&.Mui-checked": { color: "#58b4fa" },
                  }}
                />
              }
              label={
                <span style={{ fontWeight: 500, color: "#285685" }}>
                  Seleccionar todas en "{categoria}"
                </span>
              }
              sx={{
                mb: 1,
                px: 1,
                background: "rgba(253,220,255,0.09)",
                borderRadius: 2,
              }}
            />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(62px, 1fr))",
                gap: 0.5,
                mt: 1,
                background: "rgba(249,250,251,0.90)",
                p: 1,
                borderRadius: 2,
                boxShadow: "0 1px 8px #bae6fd07",
              }}
            >
              {preguntas.map((p) => (
                <Tooltip
                  key={p}
                  title={`Pregunta ${p.toUpperCase()}`}
                  arrow
                  placement="top"
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={seleccionadas.includes(p)}
                        onChange={() => handleChange(p)}
                        size="small"
                        sx={{
                          color: "#388ee8",
                          "&.Mui-checked": { color: "#fd94b4" },
                          borderRadius: "50%",
                        }}
                      />
                    }
                    label={
                      <span
                        style={{
                          fontSize: "0.98rem",
                          fontWeight: 600,
                          letterSpacing: 0.7,
                          color: seleccionadas.includes(p)
                            ? "#58b4fa"
                            : "#22315b",
                        }}
                      >
                        {p.toUpperCase()}
                      </span>
                    }
                    sx={{ m: 0, pl: 0.5 }}
                  />
                </Tooltip>
              ))}
            </Box>
          </Box>
        ))}
      </Paper>
    </Box>
  );
}

export default VariableSelector;
