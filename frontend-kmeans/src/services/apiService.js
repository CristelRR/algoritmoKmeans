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
