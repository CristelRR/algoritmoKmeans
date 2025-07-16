import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";

function GraficaPersonalidad({ datos }) {
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

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={dataChart}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="tipo" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="cantidad" fill="#1976d2" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default GraficaPersonalidad;
