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
