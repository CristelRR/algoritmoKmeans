// src/App.jsx
import React, { useState } from 'react';
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, AppBar, Typography, CssBaseline } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import EditIcon from '@mui/icons-material/Edit';
import BarChartIcon from '@mui/icons-material/BarChart';

import UploadForm from './components/UploadForm';
import ManualInputForm from './components/ManualInputForm';
import ResultsViewer from './components/ResultsViewer';
import ChartsViewer from './components/ChartsViewer';

const drawerWidth = 240;

function App() {
  const [selectedSection, setSelectedSection] = useState('upload');
  const [resultados, setResultados] = useState(null);

  const renderSection = () => {
    switch (selectedSection) {
      case 'upload':
        return <UploadForm setResultados={setResultados} />;
      case 'manual':
        return <ManualInputForm setResultados={setResultados} />;
      case 'results':
        return (
          <>
            <ResultsViewer resultados={resultados} />
            <ChartsViewer resultados={resultados} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: 1300 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            🦋 KMeans Predictor App
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <List>
          <ListItem button onClick={() => setSelectedSection('upload')}>
            <ListItemIcon><UploadFileIcon /></ListItemIcon>
            <ListItemText primary="Subir Archivo" />
          </ListItem>
          <ListItem button onClick={() => setSelectedSection('manual')}>
            <ListItemIcon><EditIcon /></ListItemIcon>
            <ListItemText primary="Ingreso Manual" />
          </ListItem>
          <ListItem button onClick={() => setSelectedSection('results')}>
            <ListItemIcon><BarChartIcon /></ListItemIcon>
            <ListItemText primary="Resultados y Gráficas" />
          </ListItem>
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, mt: 8 }}
      >
        {renderSection()}
      </Box>
    </Box>
  );
}

export default App;
