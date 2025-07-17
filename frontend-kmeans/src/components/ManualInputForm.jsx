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
    <Paper
      elevation={0}
      sx={{
        maxWidth: 500,
        mx: "auto",
        my: 6,
        p: { xs: 2, md: 4 },
        borderRadius: 6,
        background: "linear-gradient(120deg, #eaf6ff 0%, #f8faff 100%)",
        boxShadow: "0 8px 38px 0 #b3e6ff33",
        border: "2px solid #b7eafd",
        backdropFilter: "blur(14px)",
        minHeight: 210,
      }}
    >
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          color: "#2579d1",
          fontWeight: "bold",
          letterSpacing: "0.7px",
          mb: 2,
          textShadow: "0 2px 24px #dbeafe66",
        }}
      >
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
          InputProps={{
            sx: {
              background: "rgba(174,225,254,0.18)",
              borderRadius: 2,
              fontWeight: 600,
              color: "#2579d1",
            }
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: "#b7eafd"
              },
              "&:hover fieldset": {
                borderColor: "#38bdf8"
              },
              "&.Mui-focused fieldset": {
                borderColor: "#38bdf8"
              }
            }
          }}
        />
        <TextField
          label="Feature 2"
          name="feature2"
          type="number"
          value={formData.feature2}
          onChange={handleChange}
          fullWidth
          InputProps={{
            sx: {
              background: "rgba(174,225,254,0.18)",
              borderRadius: 2,
              fontWeight: 600,
              color: "#2579d1",
            }
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: "#b7eafd"
              },
              "&:hover fieldset": {
                borderColor: "#38bdf8"
              },
              "&.Mui-focused fieldset": {
                borderColor: "#38bdf8"
              }
            }
          }}
        />
        <Button
          variant="contained"
          startIcon={<SendIcon />}
          onClick={handleSubmit}
          disabled={loading}
          sx={{
            background: "#38bdf8",
            color: "#f1f5f9",
            fontWeight: "bold",
            borderRadius: 50,
            px: 3,
            py: 1.4,
            fontSize: "1.08rem",
            textTransform: "none",
            boxShadow: "0px 2px 14px #7dd3fc44",
            letterSpacing: 0.6,
            "&:hover": {
              background: "#0ea5e9",
              transform: "translateY(-1px) scale(1.03)",
              boxShadow: "0 0 14px #38bdf8bb",
            },
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Enviar'}
        </Button>
      </Box>
    </Paper>
  );
}

export default ManualInputForm;
