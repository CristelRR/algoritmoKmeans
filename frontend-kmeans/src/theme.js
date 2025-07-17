// src/theme.js
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#58b4fa",      // Azul pastel animado para botones y detalles
    },
    secondary: {
      main: "#fd94b4",      // Rosa pastel (energía y calidez)
    },
    background: {
      default: "#eaf7fe",    // Fondo principal MUY claro (azul cielo)
      paper: "rgba(255,255,255,0.96)", // Cards tipo glass
    },
    text: {
      primary: "#22315b",     // Texto oscuro para claridad
      secondary: "#388ee8",   // Azul vivo para destacar
    },
    success: { main: "#52e096" },     // Verde pastel (positivo)
    error:   { main: "#fa758b" },     // Rosa fuerte (llamativo)
    warning: { main: "#f5d472" },     // Amarillo suave
    info:    { main: "#8dd6f7" }      // Celeste
  },
  typography: {
    fontFamily: "'Quicksand', 'Orbitron', 'Montserrat', 'Poppins', sans-serif",
    h1: { fontWeight: 800, letterSpacing: "2px" },
    h2: { fontWeight: 700, letterSpacing: "1.5px" },
    h5: { color: "#388ee8", fontWeight: 600, letterSpacing: "1px" },
    button: { textTransform: "uppercase", fontWeight: 700, letterSpacing: "2px" }
  },
  shape: { borderRadius: 18 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 4px 32px 0 rgba(131, 139, 191, 0.10)"
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "30px",
          fontWeight: 700,
          fontSize: "1rem",
          letterSpacing: "1px",
          background: "linear-gradient(90deg, #a1c4fd 0%, #ffb3c6 100%)",
          color: "#fff",
          boxShadow: "0 0 8px #a1c4fd, 0 0 24px #ffb3c6",
          '&:hover': {
            background: "linear-gradient(90deg, #ffb3c6 0%, #a1c4fd 100%)",
            boxShadow: "0 0 24px #a1c4fd, 0 0 48px #ffb3c6",
            color: "#fff"
          }
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "rgba(184,220,254,0.92)", // Azul MUY claro para cabecera
          color: "#22315b",
          boxShadow: "0 4px 24px #bae6fdcc"
        }
      }
    }
  }
});

export default theme;
