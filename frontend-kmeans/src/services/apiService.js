// src/services/apiService.js

export const limpiarSet = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("http://localhost:8000/limpiar-set", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  return { ok: res.ok, data };
};

// Unificamos la función para soportar variables opcionales
export const generarSetNumerico = async (file, variables = []) => {
  const formData = new FormData();
  formData.append("file", file);

  // Si variables están presentes, adjuntarlas
  if (variables && variables.length > 0) {
    formData.append("variables", JSON.stringify(variables));
  }

  try {
    const response = await fetch("http://localhost:8000/generar-set-numerico", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    return { ok: response.ok, data };
  } catch (error) {
    return { ok: false, data: { detail: "Error de red o servidor." } };
  }
};

export const descargarArchivo = async (nombreArchivo) => {
  const url = `http://localhost:8000/descargar-archivo/${nombreArchivo}`;
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", nombreArchivo);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export async function obtenerModelos() {
  try {
    const response = await fetch("http://localhost:8000/modelos");
    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    console.error("Error al obtener modelos:", error);
    return { ok: false, error };
  }
}

export async function obtenerInfoModelo(nombre) {
  try {
    const response = await fetch(`http://localhost:8000/modelo-info/${nombre}`);
    const data = await response.json();
    return { ok: response.ok, data };
  } catch (error) {
    console.error("Error al obtener info del modelo:", error);
    return { ok: false, data: null };
  }
}

// Agrega la función de preguntas categorizadas sin quitar las anteriores
export async function obtenerPreguntasCategorizadas() {
  try {
    const response = await fetch("http://localhost:8000/preguntas-categorizadas");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al obtener preguntas categorizadas:", error);
    return [];
  }
}

// Obtener datos numéricos de gráficas dinámicas
export async function obtenerGraficasJSON(nombreArchivo) {
  try {
    const response = await fetch(`http://localhost:8000/graficas-json/${nombreArchivo}`);
    const data = await response.json();
    return { ok: response.ok, data };
  } catch (error) {
    console.error("Error al obtener datos de gráficas JSON:", error);
    return { ok: false, data: null };
  }
}
