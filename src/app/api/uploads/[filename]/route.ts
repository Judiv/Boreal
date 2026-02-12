import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await context.params;

    if (!filename) {
      return new NextResponse('Filename missing', { status: 400 });
    }

    // 1. Définition des dossiers où chercher
    // Ta galerie utilise des dossiers comme 'news', 'galerie', 'avatars', etc.
    const uploadBaseDir = path.join(process.cwd(), 'public', 'uploads');
    const subFolders = ['', 'events','news', 'galerie', 'avatars', 'pdf', 'mail'];
    
    let filePath = '';
    let found = false;

    // 2. Recherche du fichier dans la racine ou les sous-dossiers
    for (const folder of subFolders) {
      const testPath = path.join(uploadBaseDir, folder, filename);
      if (fs.existsSync(testPath) && fs.lstatSync(testPath).isFile()) {
        filePath = testPath;
        found = true;
        break;
      }
    }

    if (!found) {
      console.log(`--- DEBUG API --- Fichier introuvable : ${filename}`);
      return new NextResponse('404 Not Found', { status: 404 });
    }

    // 3. Identification du type MIME
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg',
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';

    // Log pour confirmer que l'API intercepte bien la demande de la galerie
    console.log(`--- DEBUG API --- Lecture : ${filename} | Type: ${contentType}`);

    // 4. Lecture et retour (Utilisation de Buffer pour la simplicité ici)
    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        // Sécurité Iframe : SAMEORIGIN uniquement pour les PDF
        ...(ext === '.pdf' ? { 'X-Frame-Options': 'SAMEORIGIN' } : {}),
        'Content-Disposition': 'inline',
        // On évite le cache pendant les tests pour voir les changements de type MIME
        'Cache-Control': 'no-store, must-revalidate',
      },
    });

  } catch (error) {
    console.error("🔥 Erreur critique API Uploads:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}