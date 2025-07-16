// src/components/ManualInputForm.jsx
import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  CircularProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

function ManualInputForm({ setResultados }) {
  const [formData, setFormData] = useState({
    feature1: '',
    feature2: ''
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    if (!formData.feature1 || !formData.feature2) {
      alert('Por favor completa todos los campos.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/predict/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      setResultados(data);
    } catch (error) {
      console.error('Error al enviar datos:', error);
      alert('Error al enviar los datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Typography variant="h6" gutterBottom>
        ✍️ Ingresar datos manualmente
      </Typography>

      <Box display="flex" flexDirection="column" gap={2}>
        <TextField
          label="Feature 1"
          name="feature1"
          type="number"
          value={formData.feature1}
          onChange={handleChange}
          fullWidth
        />
        <TextField
          label="Feature 2"
          name="feature2"
          type="number"
          value={formData.feature2}
          onChange={handleChange}
          fullWidth
        />
        <Button
          variant="contained"
          startIcon={<SendIcon />}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Enviar'}
        </Button>
      </Box>
    </Paper>
  );
}

export default ManualInputForm;
