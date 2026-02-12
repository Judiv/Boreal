export const uploadToCloudinary = async (file: File) => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dvdjcmdni";
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "boreal_upload"; // Matching your screenshot preset

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", preset);
  
  // MUST add this line to support PDFs and other non-image files
  formData.append("resource_type", "auto"); 

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Cloudinary Error");
  }

  const data = await res.json();

  return {
    url: data.secure_url,
    name: file.name,
    size: data.bytes, // Cloudinary returns size in bytes
    type: data.format || "pdf"
  };
};