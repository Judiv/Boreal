"use server";

import { prisma } from "@/lib/prisma"; 
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkPermission, getUserSession } from "@/lib/auth";
import { canEditCategory } from "@/lib/mappings";
import { handleImageProcessing } from "@/lib/upload";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// ✅ Utilitaire d'upload PDF amélioré
async function handlePdfUpload(file: File | null): Promise<string | null> {
  // Vérification de sécurité pour Docker
  if (!file || file.size === 0 || typeof file === 'string' || file.name === "undefined") return null;

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ✅ Dossier commun pour la compatibilité API
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const cleanName = file.name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9.\-_]/g, "");
    const fileName = `${Date.now()}-${cleanName}`;
    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);
    
    // ✅ On stocke l'URL de l'API
    return `/api/uploads/${fileName}`;
  } catch (error) {
    console.error("Erreur upload PDF News:", error);
    return null;
  }
}

// --- CRÉATION ---
export async function createNews(formData: FormData) {
  const user = await checkPermission("manage_news");

  const titre = formData.get("titre") as string;
  const contenu = formData.get("contenu") as string;
  const categorie = formData.get("categorie") as string;
  
  const file = formData.get("imageFile") as File;
  const url = formData.get("imageUrl") as string;
  const finalImageUrl = await handleImageProcessing(file, url, "news");

  const pdfFile = formData.get("pdf") as File; 
  const finalPdfUrl = await handlePdfUpload(pdfFile);

  console.log("--- DEBUG UPLOAD ---");
  console.log("Type du champ pdf:", typeof pdfFile);
  
  if (pdfFile instanceof File) {
    console.log("Nom du fichier:", pdfFile.name);
    console.log("Taille du fichier:", pdfFile.size, "octets");
  } else {
    console.log("Le champ 'pdf' ne contient pas un fichier !");
  }

  await prisma.news.create({
    data: {
      titre,
      contenu,
      categorie,
      imageUrl: finalImageUrl || null,
      pdfUrl: finalPdfUrl || null,
      auteurId: user.id,
    },
  });

  revalidatePath("/news");
  redirect("/news");
}

// --- MISE À JOUR ---
export async function updateNews(formData: FormData) {
  const id = parseInt(formData.get("id") as string);
  await checkPermission("manage_news");

  const titre = formData.get("titre") as string;
  const contenu = formData.get("contenu") as string;
  const categorie = formData.get("categorie") as string;
  
  // Image
  const file = formData.get("imageFile") as File;
  const url = formData.get("imageUrl") as string;
  const finalImageUrl = await handleImageProcessing(file, url, "news");

  // PDF
  const pdfFile = formData.get("pdf") as File;
  const newPdfUrl = await handlePdfUpload(pdfFile);

  console.log("--- DEBUG UPLOAD ---");
  console.log("Type du champ pdf:", typeof pdfFile);
  
  if (pdfFile instanceof File) {
    console.log("Nom du fichier:", pdfFile.name);
    console.log("Taille du fichier:", pdfFile.size, "octets");
  } else {
    console.log("Le champ 'pdf' ne contient pas un fichier !");
  }

  // ✅ LOGIQUE DE MISE À JOUR SÉCURISÉE
  const updateData: any = {
    titre,
    contenu,
    categorie,
  };

  // On n'écrase l'image QUE si une nouvelle image est détectée
  if (finalImageUrl) {
    updateData.imageUrl = finalImageUrl;
  }

  // On n'écrase le PDF QUE si un nouveau fichier est détectée
  if (newPdfUrl) {
    updateData.pdfUrl = newPdfUrl;
  }

  await prisma.news.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/news");
  revalidatePath(`/news/${id}`); 
  redirect("/news");
}

// --- SUPPRESSION ---
export async function deleteNews(id: number) {
  const session = await getUserSession();
  if (!session) throw new Error("Non connecté");

  const news = await prisma.news.findUnique({ where: { id } });
  if (!news) throw new Error("News introuvable");

  const canGlobalManage = session.isSuperAdmin || session.permissions.includes("manage_news");
  const isAuthor = news.auteurId === session.user.id;
  const hasCategoryRight = session.isSuperAdmin || canEditCategory(session.allTags, news.categorie) || isAuthor;

  if (!canGlobalManage && !hasCategoryRight) {
     throw new Error("Droits insuffisants");
  }

  await prisma.news.delete({ where: { id } });
  revalidatePath("/news");
}