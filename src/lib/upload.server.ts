// src/lib/upload.server.ts
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function handleImageProcessing(file: File | null, urlFallback: string | null, folder: string) {
  if (file && file.size > 0) {
    // Chemin physique : /public/uploads/[folder]
    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
    
    await mkdir(uploadDir, { recursive: true });

    const fileName = `${crypto.randomUUID()}-${file.name.replace(/\s+/g, '_')}`;
    const filePath = path.join(uploadDir, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // URL publique pour le navigateur
    return `/uploads/${folder}/${fileName}`; 
  }

  return urlFallback && urlFallback.trim() !== "" ? urlFallback : null;
}