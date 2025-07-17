import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line,
  ScatterChart, Scatter
} from "recharts";
import { Box, Typography } from "@mui/material";

const COLORS = ["#0088FE", "#00C49F", "#FF8042", "#FFBB28", "#FF6699"];
const CATEGORIAS = [
  "Sociabilidad", "Asertividad / Liderazgo", "Nivel de actividad",
  "Búsqueda de emociones", "Afecto positivo"
];
const COLORES_RADAR = {
  Ambivertido: "#38bdf8",
  Extrovertido: "#34d399",
  Introvertido: "#fb7185",
};

function descripcionBarChart(conteo) {
  const total = Object.values(conteo).reduce((a, b) => a + b, 0);
  const mayor = Object.entries(conteo).reduce((acc, [tipo, val]) => val > acc[1] ? [tipo, val] : acc, ["", 0]);
  const menor = Object.entries(conteo).reduce((acc, [tipo, val]) => val < acc[1] ? [tipo, val] : acc, ["", Number.POSITIVE_INFINITY]);
  return (
    <>
      <b>Interpretación:</b> Este gráfico de barras muestra la cantidad de personas en cada tipo de personalidad detectado. 
      Se observa que <b>{mayor[0]}</b> es el grupo más frecuente (representa el <b>{((mayor[1]/total)*100).toFixed(1)}%</b> del total), lo que indica una mayor tendencia de este perfil en los datos. 
      El grupo menos frecuente es <b>{menor[0]}</b>. <br />
      <b>Conclusión:</b> Los resultados sugieren que el perfil <b>{mayor[0]}</b> predomina en la muestra. Este hallazgo puede orientar futuras acciones o intervenciones según el perfil más representativo.
    </>
  );
}

function descripcionPieChart(conteo) {
  const total = Object.values(conteo).reduce((a, b) => a + b, 0);
  const mayor = Object.entries(conteo).reduce((acc, [tipo, val]) => val > acc[1] ? [tipo, val] : acc, ["", 0]);
  return (
    <>
      <b>Interpretación:</b> El gráfico de pastel permite observar de manera visual la proporción relativa de cada tipo de personalidad respecto al total de personas analizadas.
      El segmento de <b>{mayor[0]}</b> ocupa la mayor parte del gráfico con <b>{((mayor[1]/total)*100).toFixed(1)}%</b>. <br />
      <b>Conclusión:</b> Existe una marcada diferencia porcentual, lo que puede indicar predominancia o tendencia en la distribución del tipo de personalidad más común en el grupo.
    </>
  );
}

function descripcionDona(conteo) {
  return (
    <>
      <b>Interpretación:</b> El gráfico de dona refuerza la visualización de proporciones. Permite identificar de forma rápida cuál grupo de personalidad tiene mayor presencia y cuál es minoritario.
      <br />
      <b>Conclusión:</b> Es recomendable considerar el tamaño relativo de cada grupo en futuras comparaciones o análisis individuales, ya que podría influir en interpretaciones más avanzadas.
    </>
  );
}

function descripcionRadar(promediosRadar) {
  if (!promediosRadar.length) return "";
  // Buscamos el valor máximo en cada tipo para hacer la interpretación
  let topCategorias = [];
  for (let tipo of ["Introvertido", "Ambivertido", "Extrovertido"]) {
    let max = 0, catMax = "";
    for (let cat of promediosRadar) {
      if (cat[tipo] && cat[tipo] > max) {
        max = cat[tipo];
        catMax = cat.categoria;
      }
    }
    if (catMax) topCategorias.push(`${tipo}: ${catMax} (${max})`);
  }
  return (
    <>
      <b>Interpretación:</b> Este gráfico de radar (o araña) muestra el promedio por categoría psicológica para cada tipo de personalidad.
      Se aprecia que {topCategorias.join(", ")} son los valores más altos por perfil, reflejando las áreas donde cada grupo destaca.
      <br />
      <b>Conclusión:</b> Estas diferencias sugieren que cada tipo de personalidad tiene fortalezas particulares en diferentes subescalas, lo que puede guiar estrategias de intervención personalizadas.
    </>
  );
}

function descripcionLineChart(lineData) {
  return (
    <>
      <b>Interpretación:</b> El gráfico de líneas permite comparar el promedio obtenido en cada subescala entre los diferentes perfiles de personalidad.
      Se pueden notar diferencias notables en ciertas categorías, así como posibles puntos de cruce, que indican variaciones relevantes entre los grupos.
      <br />
      <b>Conclusión:</b> Identificar en qué categorías existen mayores diferencias puede ayudar a personalizar recomendaciones, programas o análisis futuros según el tipo de personalidad predominante.
    </>
  );
}

function descripcionPCA(datosPCA, grupos) {
  const numClusters = Object.keys(grupos).length;
  return (
    <>
      <b>Interpretación:</b> El análisis PCA visualiza los datos en dos dimensiones principales, resaltando la separación natural entre los <b>{numClusters}</b> grupos encontrados por el algoritmo.
      Los puntos muestran cómo se agrupan las respuestas y qué tan diferenciados están los perfiles en el espacio reducido.
      <br />
      <b>Conclusión:</b> La buena separación entre clusters respalda la clasificación realizada y puede ser útil para validar el modelo y detectar posibles casos atípicos o mezclas entre perfiles.
    </>
  );
}

function descripcionCorrelacion(datosGraficas) {
  return (
    <>
      <b>Interpretación:</b> La matriz de correlación representa la relación entre las distintas variables del set de datos.
      Los valores cercanos a 1 o -1 (colores más intensos) muestran correlaciones fuertes, ya sean positivas o negativas, lo cual ayuda a identificar dependencias y redundancias entre variables.
      <br />
      <b>Conclusión:</b> Este análisis es fundamental para seleccionar variables relevantes y evitar multicolinealidad en futuros modelos predictivos o interpretaciones avanzadas.
    </>
  );
}

function descripcionSilueta(datosGraficas) {
  const avg = datosGraficas?.silhouette_avg ? Number(datosGraficas.silhouette_avg).toFixed(2) : "N/A";
  return (
    <>
      <b>Interpretación:</b> El gráfico de silueta evalúa la calidad de la agrupación realizada por KMeans, mostrando cuán bien están separados los clusters.
      Un valor promedio de silueta de <b>{avg}</b> indica que {avg > 0.5 ? "la separación entre grupos es clara y confiable" : "existe cierta superposición o ambigüedad en algunos clusters"}.
      <br />
      <b>Conclusión:</b> Un buen coeficiente de silueta valida la robustez del modelo y sugiere confianza en las clasificaciones propuestas.
    </>
  );
}

function GraficaPersonalidad({
  datos = [],
  datosPCA = [],
  datosGraficas = null,
  idBarra = "grafica-barra-pdf",
  idPie = "grafica-pie-pdf",
  idRadar = "grafica-radar-pdf"
}) {
  if (!datos || datos.length === 0) return null;

  // Agrupación por tipo de personalidad
  const conteo = datos.reduce((acc, fila) => {
    const tipo = fila["Personalidad"];
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {});

  const dataBar = Object.entries(conteo).map(([tipo, cantidad]) => ({ tipo, cantidad }));
  const dataPie = Object.entries(conteo).map(([tipo, cantidad]) => ({ name: tipo, value: cantidad }));

  // Grupos y promedios locales (fallback)
  const grupos = datos.reduce((acc, fila) => {
    const tipo = fila["Personalidad"];
    if (!acc[tipo]) acc[tipo] = [];
    acc[tipo].push(fila);
    return acc;
  }, {});

  // Radar data (local por defecto, backend si lo tienes)
  const promediosRadar = CATEGORIAS.map((categoria) => {
    const res = { categoria };
    Object.entries(grupos).forEach(([tipo, filas]) => {
      const suma = filas.reduce((acc, f) => acc + (f[categoria] || 0), 0);
      res[tipo] = Number((suma / filas.length || 0).toFixed(2));
    });
    return res;
  });

  const radarDataBackend = datosGraficas?.radar_data?.length > 0
    ? datosGraficas.radar_data
    : null;

  const lineData = CATEGORIAS.map((cat) => {
    const obj = { categoria: cat };
    Object.entries(grupos).forEach(([tipo, filas]) => {
      const suma = filas.reduce((acc, f) => acc + (f[cat] || 0), 0);
      obj[tipo] = Number((suma / filas.length || 0).toFixed(2));
    });
    return obj;
  });

  // -- Matriz de correlación: tabla coloreada (mini heatmap)
  const renderCorrelacion = () => {
    if (!datosGraficas?.matriz_correlacion) return null;
    const keys = Object.keys(datosGraficas.matriz_correlacion);
    return (
      <Box sx={{ overflowX: "auto", mb: 2, width: "100%" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1, fontSize: 14 }}>
          🔍 Matriz de Correlación (Interactivo)
        </Typography>
        <table
          style={{
            borderCollapse: "collapse",
            minWidth: 220,
            fontSize: "10px",
            width: "auto",
            maxWidth: 330,
          }}
        >
          <thead>
            <tr>
              <th style={{ background: "#eee", fontSize: 9, padding: 2 }}></th>
              {keys.map(col => (
                <th key={col} style={{ background: "#eee", padding: 2, fontSize: 9, maxWidth: 48 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keys.map(row => (
              <tr key={row}>
                <td style={{
                  background: "#eee",
                  fontWeight: "bold",
                  padding: 2,
                  fontSize: 9,
                  maxWidth: 48,
                  whiteSpace: "nowrap"
                }}>{row}</td>
                {keys.map(col => {
                  const val = datosGraficas.matriz_correlacion[row][col];
                  return (
                    <td key={col}
                      style={{
                        padding: 2,
                        fontSize: 10,
                        maxWidth: 48,
                        background: `rgba(56,189,248,${Math.abs(val)})`,
                        color: Math.abs(val) > 0.65 ? "#fff" : "#222",
                        fontWeight: Math.abs(val) > 0.8 ? 700 : 400,
                        textAlign: "center",
                        border: "1px solid #fff3",
                        whiteSpace: "nowrap",
                      }}>
                      {val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <Typography variant="body2" sx={{ mt: 1, mb: 2, color: "#444", fontStyle: "italic" }}>
          {descripcionCorrelacion(datosGraficas)}
        </Typography>
      </Box>
    );
  };

  // --- PCA backend interactivo
  const renderPCA = () => {
    if (!datosGraficas?.pca_data) return null;
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
          🧬 PCA Interactivo desde Backend
        </Typography>
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart>
            <XAxis dataKey="PC1" name="PC1" />
            <YAxis dataKey="PC2" name="PC2" />
            <Tooltip />
            <Legend />
            <Scatter name="Clusters" data={datosGraficas.pca_data} fill="#38bdf8" />
          </ScatterChart>
        </ResponsiveContainer>
        <Typography variant="body2" sx={{ mt: 1, color: "#444", fontStyle: "italic" }}>
          {descripcionPCA(datosGraficas.pca_data, grupos)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Varianza explicada: {datosGraficas.pca_var?.join(" / ")} %
        </Typography>
      </Box>
    );
  };

  // --- Silueta backend interactivo
  const renderSilueta = () => {
    if (!datosGraficas?.silueta_data) return null;
    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
          📐 Gráfico de Silueta Interactivo
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={datosGraficas.silueta_data}>
            <XAxis dataKey="Cluster" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="Coeficiente" fill="#0ea5e9" />
          </BarChart>
        </ResponsiveContainer>
        <Typography variant="body2" sx={{ mt: 1, color: "#444", fontStyle: "italic" }}>
          {descripcionSilueta(datosGraficas)}
        </Typography>
      </Box>
    );
  };

  // ======================= RENDER PRINCIPAL ===========================
  return (
    <div style={{ width: "100%", marginTop: 20 }}>
      {/* BARRAS */}
      <h3>📊 Clasificación por cantidad</h3>
      <div id={idBarra}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dataBar}>
            <XAxis dataKey="tipo" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="cantidad" fill="#0088FE" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Typography variant="body2" sx={{ mt: 1, mb: 2, color: "#444", fontStyle: "italic" }}>
        {descripcionBarChart(conteo)}
      </Typography>

      {/* PIE */}
      <h3>🥧 Porcentaje por tipo (Pie)</h3>
      <div id={idPie}>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={dataPie}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {dataPie.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <Typography variant="body2" sx={{ mt: 1, mb: 2, color: "#444", fontStyle: "italic" }}>
        {descripcionPieChart(conteo)}
      </Typography>

      {/* DONA */}
      <h3>🍩 Porcentaje por tipo (Dona)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={dataPie}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            label
          >
            {dataPie.map((entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <Typography variant="body2" sx={{ mt: 1, mb: 2, color: "#444", fontStyle: "italic" }}>
        {descripcionDona(conteo)}
      </Typography>

      {/* RADAR - ARAÑA */}
      <h3>🧭 Promedio por categoría (Radar Chart)</h3>
      <div id={idRadar}>
        <ResponsiveContainer width="100%" height={350}>
          <RadarChart
            data={radarDataBackend || promediosRadar}
            outerRadius={120}
          >
            <PolarGrid />
            <PolarAngleAxis dataKey="categoria" />
            <PolarRadiusAxis angle={30} domain={[0, 5]} />
            {["Introvertido", "Ambivertido", "Extrovertido"].map((tipo) => (
              <Radar
                key={tipo}
                name={tipo}
                dataKey={tipo}
                stroke={COLORES_RADAR[tipo]}
                fill={COLORES_RADAR[tipo]}
                fillOpacity={0.35}
                isAnimationActive={false}
              />
            ))}
            <Tooltip />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <Typography variant="body2" sx={{ mt: 1, mb: 2, color: "#444", fontStyle: "italic" }}>
        {descripcionRadar(radarDataBackend || promediosRadar)}
      </Typography>

      {/* LÍNEAS */}
      <h3>📈 Comparativo por categoría (Líneas)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={lineData}>
          <XAxis dataKey="categoria" />
          <YAxis domain={[0, 5]} />
          <Tooltip />
          <Legend />
          {["Introvertido", "Ambivertido", "Extrovertido"].map((tipo) => (
            <Line
              key={tipo}
              type="monotone"
              dataKey={tipo}
              stroke={COLORES_RADAR[tipo]}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <Typography variant="body2" sx={{ mt: 1, mb: 2, color: "#444", fontStyle: "italic" }}>
        {descripcionLineChart(lineData)}
      </Typography>

      {/* PCA LOCAL */}
      {datosPCA.length > 0 && (
        <>
          <h3>🧬 Visualización de Clusters (PCA)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <XAxis dataKey="x" name="PCA1" />
              <YAxis dataKey="y" name="PCA2" />
              <Tooltip />
              <Legend />
              {Object.entries(grupos).map(([tipo, puntos], i) => (
                <Scatter
                  key={tipo}
                  name={tipo}
                  data={puntos.map((_, idx) => datosPCA[idx])}
                  fill={COLORES_RADAR[tipo]}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
          <Typography variant="body2" sx={{ mt: 1, mb: 2, color: "#444", fontStyle: "italic" }}>
            {descripcionPCA(datosPCA, grupos)}
          </Typography>
        </>
      )}

      {/* GRAFICAS DEL BACKEND - INTERACTIVAS */}
      <h3>🧠 Análisis Adicional desde Backend (Interactivo)</h3>
      {renderCorrelacion()}
      {renderPCA()}
      {renderSilueta()}
    </div>
  );
}

export default GraficaPersonalidad;
