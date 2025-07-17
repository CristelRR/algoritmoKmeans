import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FF8042"];

function GraficaPersonalidad({ datos }) {
  // ==================== GRÁFICA 1 y 2 ====================
  // Contar cantidad por tipo de personalidad
  const conteo = datos.reduce((acc, fila) => {
    const tipo = fila["Personalidad"];
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {});

  const dataChart = Object.entries(conteo).map(([tipo, cantidad]) => ({
    tipo,
    cantidad,
  }));

  // ==================== GRÁFICA 3 (Radar) ====================
  const categorias = [
    "Sociabilidad",
    "Asertividad / Liderazgo",
    "Nivel de actividad",
    "Búsqueda de emociones",
    "Afecto positivo",
  ];

  const promediosPorGrupo = {};

  datos.forEach((fila) => {
    const grupo = fila["Personalidad"];
    if (!promediosPorGrupo[grupo]) {
      promediosPorGrupo[grupo] = { count: 0 };
      categorias.forEach((cat) => {
        promediosPorGrupo[grupo][cat] = 0;
      });
    }
    categorias.forEach((cat) => {
      promediosPorGrupo[grupo][cat] += Number(fila[cat]) || 0;
    });
    promediosPorGrupo[grupo].count += 1;
  });

  const radarData = categorias.map((cat) => {
    const resultado = { categoria: cat };
    Object.entries(promediosPorGrupo).forEach(([grupo, valores]) => {
      resultado[grupo] = (valores[cat] / valores.count).toFixed(2);
    });
    return resultado;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Gráfico de barras */}
      <div style={{ width: "100%", height: 300 }}>
        <h4 style={{ textAlign: "center" }}>📊 Clasificación por cantidad</h4>
        <ResponsiveContainer>
          <BarChart data={dataChart}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="tipo" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="cantidad" fill="#1976d2" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de pastel */}
      <div style={{ width: "100%", height: 300 }}>
        <h4 style={{ textAlign: "center" }}>📈 Porcentaje por tipo (Pie)</h4>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={dataChart}
              dataKey="cantidad"
              nameKey="tipo"
              outerRadius={100}
              label
            >
              {dataChart.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Radar chart */}
      <div style={{ width: "100%", height: 400 }}>
        <h4 style={{ textAlign: "center" }}>
          🧠 Promedio por categoría (Radar Chart)
        </h4>
        <ResponsiveContainer>
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="categoria" />
            <PolarRadiusAxis />
            {Object.keys(promediosPorGrupo).map((grupo, i) => (
              <Radar
                key={grupo}
                name={grupo}
                dataKey={grupo}
                stroke={COLORS[i % COLORS.length]}
                fill={COLORS[i % COLORS.length]}
                fillOpacity={0.4}
              />
            ))}
            <Legend />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default GraficaPersonalidad;
