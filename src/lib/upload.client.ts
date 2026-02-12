// src/lib/upload.client.ts

export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Erreur lors de l'upload");
  }

  return await res.json(); // Renvoie { url, name, size, type }
};