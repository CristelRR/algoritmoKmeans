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

export const generarSetNumerico = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

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
