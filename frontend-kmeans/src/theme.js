// src/theme.js
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1E3A8A",  // Azul profundo elegante (AppBar, títulos)
    },
    secondary: {
      main: "#2563EB",  // Azul intenso para botones activos
    },
    background: {
      default: "#F1F5F9", // Fondo gris azulado suave
      paper: "#FFFFFF",   // Cartas limpias
    },
    text: {
      primary: "#0F172A", // Azul oscuro legible
    },
    success: {
      main: "#22C55E",
    },
    error: {
      main: "#EF4444",
    },
  },
  typography: {
    fontFamily: "'Quicksand', sans-serif",
  },
  shape: {
    borderRadius: 12,
  },
});

export default theme;
