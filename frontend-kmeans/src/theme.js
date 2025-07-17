// src/theme.js
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#020b22ff",  // Azul profundo elegante (AppBar, títulos)
    },
    secondary: {
      main: "#132e68ff",  // Azul intenso para botones activos
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
