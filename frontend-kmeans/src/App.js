// src/App.jsx
import React, { useState } from "react";
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
import HomeIcon from "@mui/icons-material/Home";

import UploadForm from "./components/UploadForm";
import ManualInputForm from "./components/ManualInputForm";
import ResultsViewer from "./components/ResultsViewer";
import ChartsViewer from "./components/ChartsViewer";
import ModelosGuardados from "./components/ModelosGuardados";
import Home from "./components/Home";


const drawerWidth = 240;

function App() {
  const [selectedSection, setSelectedSection] = useState("upload");
  const [resultados, setResultados] = useState(null);

  const renderSection = () => {
    switch (selectedSection) {
      case "upload":
        return <UploadForm setResultados={setResultados} />;
      case "manual":
        return <ManualInputForm setResultados={setResultados} />;
      case "results":
        return (
          <>
            <ResultsViewer resultados={resultados} />
            <ChartsViewer resultados={resultados} />
          </>
        );
      case "modelos":
        return <ModelosGuardados />;
      case "home":
  return <Home />;

      default:
        return null;
    }
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          zIndex: 1300,
          background: "linear-gradient(to right, #1E3A8A, #2563EB)",
          boxShadow: 4,
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap sx={{ fontWeight: "bold" }}>
            KMeans Predictor App
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: "#E0E7FF",
            color: "#1E3A8A",
            borderRight: "1px solid #CBD5E1",
            pt: 2,
          },
        }}
      >
        <Toolbar />
        <List>
          <ListItem button onClick={() => setSelectedSection("home")}>
  <ListItemIcon>
    <HomeIcon sx={{ color: "#1E3A8A" }} />
  </ListItemIcon>
  <ListItemText primary="Inicio" />
</ListItem>

          <ListItem button onClick={() => setSelectedSection("upload")}>
            <ListItemIcon>
              <UploadFileIcon sx={{ color: "#1E3A8A" }} />
            </ListItemIcon>
            <ListItemText primary="Subir Archivo" />
          </ListItem>
          <ListItem button onClick={() => setSelectedSection("manual")}>
            <ListItemIcon>
              <EditIcon sx={{ color: "#1E3A8A" }} />
            </ListItemIcon>
            <ListItemText primary="Ingreso Manual" />
          </ListItem>
          <ListItem button onClick={() => setSelectedSection("modelos")}>
            <ListItemIcon>
              <FolderIcon sx={{ color: "#1E3A8A" }} />
            </ListItemIcon>
            <ListItemText primary="Modelos Guardados" />
          </ListItem>
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          mt: 8,
          background: "linear-gradient(to bottom right, #F1F5F9, #E2E8F0)",
        }}
      >
        {renderSection()}
      </Box>
    </Box>
  );
}

export default App;
