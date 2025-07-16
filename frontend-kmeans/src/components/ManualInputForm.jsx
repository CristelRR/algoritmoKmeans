// frontend-kmeans/src/components/ManualInputForm.jsx
import React, { useState } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Button,
  Paper,
  Typography,
  CircularProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import preguntasData from '../data/questions.json';

export default function ManualInputForm({ setResultados }) {
  const total = preguntasData.length;
  const [current, setCurrent] = useState(0);
  const [formData, setFormData] = useState(
    Object.fromEntries(preguntasData.map(p => [p.name, '']))
  );
  const [loading, setLoading] = useState(false);

  const { name, label, type, options } = preguntasData[current];

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (formData[name] === '') {
      alert('Por favor responde la pregunta antes de continuar.');
      return;
    }
    setCurrent(i => Math.min(i + 1, total - 1));
  };

  const handleBack = () => {
    setCurrent(i => Math.max(i - 1, 0));
  };

  const handleSubmit = async () => {
    if (Object.values(formData).some(v => v === '')) {
      alert('Faltan respuestas por completar.');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/predict/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      setResultados(data);
    } catch (err) {
      console.error(err);
      alert('Error al enviar los datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Paso {current + 1} de {total}
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        {label}
      </Typography>

      <Box mb={3}>
        {type === 'text' && (
          <TextField
            fullWidth
            name={name}
            value={formData[name]}
            onChange={handleChange}
            placeholder="Escribe tu respuesta aquí"
          />
        )}
        {type === 'select' && (
          <TextField
            fullWidth
            select
            name={name}
            value={formData[name]}
            onChange={handleChange}
            placeholder="Selecciona una opción"
          >
            {options.map(opt => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </TextField>
        )}
      </Box>

      <Box display="flex" justifyContent="space-between">
        <Button
          variant="outlined"
          onClick={handleBack}
          disabled={current === 0 || loading}
        >
          Atrás
        </Button>

        {current < total - 1 ? (
          <Button variant="contained" onClick={handleNext} disabled={loading}>
            Siguiente
          </Button>
        ) : (
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Enviar todas'}
          </Button>
        )}
      </Box>
    </Paper>
  );
}
