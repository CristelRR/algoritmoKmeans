import React, { useState } from "react";
import "./styles/global.css";
import GalaxyBackground from "./components/GalaxyBackground";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  AppBar,
  Typography,
  CssBaseline,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import EditIcon from "@mui/icons-material/Edit";
import FolderIcon from "@mui/icons-material/Folder";

import UploadForm from "./components/UploadForm";
import ManualInputForm from "./components/ManualInputForm";
import ResultsViewer from "./components/ResultsViewer";
import ChartsViewer from "./components/ChartsViewer";
import ModelosGuardados from "./components/ModelosGuardados";

const drawerWidth = 230;

function App() {
  const [selectedSection, setSelectedSection] = useState("upload");
  const [resultados, setResultados] = useState(null);

  const renderSection = () => {
    switch (selectedSection) {
      case "upload":
        return (
          <Box className="glass-card"
            sx={{
              width: "100%", maxWidth: 750, mx: "auto", p: { xs: 2, md: 4 }, mt: 3,
              boxShadow: "0 4px 32px #a0e9fd44"
            }}>
            <UploadForm setResultados={setResultados} />
          </Box>
        );
      case "manual":
        return (
          <Box className="glass-card"
            sx={{
              width: "100%", maxWidth: 750, mx: "auto", p: { xs: 2, md: 4 }, mt: 3,
              boxShadow: "0 4px 32px #f3bff833"
            }}>
            <ManualInputForm setResultados={setResultados} />
          </Box>
        );
      case "results":
        return (
          <Box className="glass-card"
            sx={{
              width: "100%", maxWidth: 980, mx: "auto", p: { xs: 2, md: 4 }, mt: 3,
              boxShadow: "0 4px 32px #a0e9fd44"
            }}>
            <ResultsViewer resultados={resultados} />
            <ChartsViewer resultados={resultados} />
          </Box>
        );
      case "modelos":
        // ModelosGuardados ya trae su propio fondo y glass, no lo encierres en otra card.
        return <ModelosGuardados />;
      default:
        return null;
    }
  };

  return (
    <>
      <GalaxyBackground />
      <Box sx={{ display: "flex", minHeight: "100vh", position: "relative", zIndex: 1 }}>
        <CssBaseline />
        {/* AppBar: Glass + colores suaves */}
        <AppBar
          position="fixed"
          sx={{
            zIndex: 1300,
            background: "rgba(180,215,255,0.92)",
            color: "#285685",
            boxShadow: "0 2px 24px #b8d6f7bb",
            backdropFilter: "blur(8px)",
            borderBottom: "2px solid #a0e9fd",
          }}
        >
          <Toolbar>
            <Typography variant="h5" noWrap sx={{
              fontWeight: "bold",
              letterSpacing: "2.5px",
              color: "#285685"
            }}>
              KMeans Predictor App
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Sidebar */}
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              boxSizing: "border-box",
              background: "rgba(209, 239, 255, 0.60)",
              color: "#285685",
              borderRight: "2px solid #a0e9fd",
              boxShadow: "2px 0 24px #a0e9fd22",
              backdropFilter: "blur(8px)",
              pt: 2,
            },
          }}
        >
          <Toolbar />
          <List>
            <ListItem
              button
              selected={selectedSection === "upload"}
              onClick={() => setSelectedSection("upload")}
              sx={{
                borderRadius: 2,
                my: 1,
                background: selectedSection === "upload" ? "rgba(120,180,255,0.18)" : "none",
                "&.Mui-selected": { background: "rgba(160,235,252,0.23)" }
              }}>
              <ListItemIcon>
                <UploadFileIcon sx={{ color: "#41b4ee" }} />
              </ListItemIcon>
              <ListItemText primary="Subir Archivo" />
            </ListItem>
            <ListItem
              button
              selected={selectedSection === "manual"}
              onClick={() => setSelectedSection("manual")}
              sx={{
                borderRadius: 2,
                my: 1,
                background: selectedSection === "manual" ? "rgba(180,170,252,0.17)" : "none",
                "&.Mui-selected": { background: "rgba(230,180,250,0.18)" }
              }}>
              <ListItemIcon>
                <EditIcon sx={{ color: "#9d7cf8" }} />
              </ListItemIcon>
              <ListItemText primary="Ingreso Manual" />
            </ListItem>
            <ListItem
              button
              selected={selectedSection === "modelos"}
              onClick={() => setSelectedSection("modelos")}
              sx={{
                borderRadius: 2,
                my: 1,
                background: selectedSection === "modelos" ? "rgba(160,220,242,0.18)" : "none",
                "&.Mui-selected": { background: "rgba(160,235,252,0.21)" }
              }}>
              <ListItemIcon>
                <FolderIcon sx={{ color: "#4fd1c5" }} />
              </ListItemIcon>
              <ListItemText primary="Modelos Guardados" />
            </ListItem>
          </List>
        </Drawer>

        {/* Contenido principal */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3, md: 4 },
            mt: 8,
            minHeight: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            background: "transparent",
          }}
        >
          {renderSection()}
        </Box>
      </Box>
    </>
  );
}

export default App;
