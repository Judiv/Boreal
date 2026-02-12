import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function handleImageProcessing(file: File | null, urlFallback: string | null, folder: string) {
  if (file && file.size > 0) {
    // 1. Stockage physique : On garde les dossiers pour l'organisation
    // Mais attention : ta route API actuelle cherche dans /public/uploads/[filename]
    // On va donc mettre le nom du dossier DANS le nom du fichier pour rester compatible
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    // On préfixe le nom du fichier avec le dossier pour ne pas perdre l'organisation
    // Exemple : news-image.jpg ou galerie-photo.png
    const fileName = `${folder}-${crypto.randomUUID()}-${file.name.replace(/\s+/g, '_')}`;
    const filePath = path.join(uploadDir, fileName);

    // 2. Écriture du fichier
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // 3. RETOUR POUR LA BDD : On utilise l'URL de l'API
    // ✅ C'est ce chemin qui sera enregistré dans Prisma
    return `/api/uploads/${fileName}`; 
  }

  // Si pas de fichier, on retourne l'URL manuelle
  return urlFallback && urlFallback.trim() !== "" ? urlFallback : null;
}