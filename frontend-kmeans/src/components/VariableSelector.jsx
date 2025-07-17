import React, { useEffect, useState } from "react";
import {
  Box,
  FormControlLabel,
  Checkbox,
  Typography,
  Paper,
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
    <Box sx={{ mb: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          🎯 Selecciona las variables por categoría
        </Typography>

        {/* ✅ Seleccionar todas */}
        <FormControlLabel
          control={
            <Checkbox
              checked={isAllSelected}
              onChange={(e) => handleSelectAll(e.target.checked)}
            />
          }
          label="Seleccionar TODAS las variables"
          sx={{ mb: 2 }}
        />

        {Object.entries(preguntasPorCategoria).map(([categoria, preguntas]) => (
          <Box
            key={categoria}
            sx={{
              mb: 3,
              pb: 2,
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
              {categoria}
            </Typography>

            {/* ✅ Seleccionar todas por categoría */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={isCategoriaSeleccionada(categoria)}
                  onChange={(e) =>
                    handleSelectCategoria(categoria, e.target.checked)
                  }
                />
              }
              label={`Seleccionar todas en "${categoria}"`}
              sx={{ mb: 1 }}
            />

            {/* ✅ Preguntas en cuadrícula compacta */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))",
                gap: 0.5,
                mt: 1,
                backgroundColor: "#F9FAFB",
                p: 1,
                borderRadius: 2,
              }}
            >
              {preguntas.map((p) => (
                <FormControlLabel
                  key={p}
                  control={
                    <Checkbox
                      checked={seleccionadas.includes(p)}
                      onChange={() => handleChange(p)}
                      size="small"
                    />
                  }
                  label={p.toUpperCase()}
                  sx={{ m: 0 }}
                />
              ))}
            </Box>
          </Box>
        ))}
      </Paper>
    </Box>
  );
}

export default VariableSelector;
