"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { hasPermission } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { unlink } from "fs/promises";

export async function uploadPhoto(formData: FormData) {
  if (!(await hasPermission("manage_photos"))) throw new Error("Non autorisé");

  const url = formData.get("url") as string;
  const folderId = parseInt(formData.get("folderId") as string);
  const titre = formData.get("titre") as string;
  const description = formData.get("description") as string;
  const lieu = formData.get("lieu") as string;
  const auteur = formData.get("auteur") as string;

  await prisma.photo.create({
    data: { url, titre, description, lieu, auteur, folderId }
  });

  revalidatePath("/galerie");
}

export async function createFolder(formData: FormData) {
  const nom = formData.get("nom") as string;
  const auteur = formData.get("auteur") as string;
  const description = formData.get("description") as string;

  await prisma.galleryFolder.create({
    data: { 
      nom, 
      auteur, 
      description: description || null // Gère le cas où c'est vide
    }
  });

  revalidatePath("/galerie"); // ✅ Dit à Next.js de recharger les données
}

export async function deleteFolder(id: number) {
  if (!(await hasPermission("manage_photos"))) throw new Error("Non autorisé");

  // 1. Récupérer le dossier ET toutes les photos qu'il contient
  const folder = await prisma.galleryFolder.findUnique({
    where: { id },
    include: { photos: true }
  });

  if (!folder) return;

  // 2. Supprimer les fichiers physiques sur le disque
  for (const photo of folder.photos) {
    try {
      // On reconstruit le chemin absolu vers le fichier dans /public
      const filePath = path.join(process.cwd(), "public", photo.url);
      await unlink(filePath);
    } catch (error) {
      // On log l'erreur mais on ne bloque pas la suppression du reste 
      // (au cas où le fichier aurait déjà été supprimé manuellement)
      console.error(`Impossible de supprimer le fichier: ${photo.url}`, error);
    }
  }

  // 3. Supprimer le dossier de la base de données
  // Note : Assure-toi que dans ton schema.prisma, la relation est configurée 
  // avec onDelete: Cascade sur les photos, sinon Prisma bloquera.
  await prisma.galleryFolder.delete({
    where: { id }
  });

  revalidatePath("/galerie");
}

export async function updateFolder(id: number, formData: FormData) {
  const canManage = await hasPermission("manage_photos");
  if (!canManage) throw new Error("Permission refusée");

  const nom = formData.get("nom") as string;
  const auteur = formData.get("auteur") as string;
  const description = formData.get("description") as string;

  await prisma.galleryFolder.update({
    where: { id },
    data: { 
      nom, 
      auteur, 
      description: description || null 
    }
  });

  revalidatePath("/galerie");
}

export async function addPhotosToFolder(folderId: number, formData: FormData) {
  const titre = formData.get("titre") as string;
  const auteur = formData.get("auteur") as string;
  const lieu = formData.get("lieu") as string;
  const files = formData.getAll("photos") as File[];

  const uploadDir = path.join(process.cwd(), "public", "uploads");

  // On s'assure que le dossier existe
  await mkdir(uploadDir, { recursive: true });

  const photosData = [];

  for (const file of files) {
    if (file.size === 0) continue;

    const buffer = Buffer.from(await file.arrayBuffer());
    // On nettoie le nom du fichier pour éviter les espaces ou caractères spéciaux
    const safeName = Date.now() + "-" + file.name.replaceAll(" ", "_");
    const filePath = path.join(uploadDir, safeName);

    // ✅ Écriture physique sur le disque
    await writeFile(filePath, buffer);

    // ✅ URL pour la base de données (doit commencer par /)
    photosData.push({
      url: `/uploads/${safeName}`, 
      titre: titre || file.name,
      auteur: auteur || "Inconnu",
      lieu: lieu || "Non précisé",
      folderId: folderId
    });
  }

  if (photosData.length > 0) {
    await prisma.photo.createMany({ data: photosData });
  }

  revalidatePath(`/galerie/${folderId}`);
}

export async function deletePhoto(photoId: number) {
  const canManage = await hasPermission("manage_photos");
  if (!canManage) throw new Error("Non autorisé");

  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo) return;

  await prisma.photo.delete({ where: { id: photoId } });

  revalidatePath(`/galerie/${photo.folderId}`);
}