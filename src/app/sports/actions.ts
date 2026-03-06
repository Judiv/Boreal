"use server"

import { prisma } from "@/lib/prisma";
import { checkPermission, getUserSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { v2 as cloudinary } from "cloudinary";


async function getAuthenticatedUser() {
  const session = await getUserSession();
  if (!session) throw new Error("Vous devez être connecté.");
  
  const canGlobalManage = session.isSuperAdmin || session.permissions.includes("manage_planning");
  if (!canGlobalManage) throw new Error("Permission refusée (Module Planning).");

  return session;
}

// Configuration Cloudinary côté serveur
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Helper pour gérer les dates provenant des inputs datetime-local sans décalage UTC
 */
function parseDateTimeLocal(value: string): Date {
  const d = new Date(value);
  const userOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - userOffset);
}

/**
 * Créer ou modifier un sport (Clubs)
 */
export async function upsertSport(id: string | null, formData: FormData) {
  const isAllowed = await checkPermission("manage_sports");
  if (!isAllowed) throw new Error("Accès refusé");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const file = formData.get("file") as File;

  let imageUrl = undefined;

  if (file && file.size > 0) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const uploadResponse = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "boreal/sports" }, 
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      }) as any;
      imageUrl = uploadResponse.secure_url;
    } catch (error) {
      throw new Error("Échec de l'upload de l'image");
    }
  }

  const dataPayload = {
    name,
    description,
    ...(imageUrl && { imageUrl }), 
  };

  if (id) {
    await prisma.sport.update({ where: { id }, data: dataPayload });
  } else {
    await prisma.sport.create({ data: { ...dataPayload, imageUrl: imageUrl || "" } });
  }

  revalidatePath("/sports");
  revalidatePath("/");
}

/**
 * Supprimer un sport (Club)
 */
export async function deleteSport(id: string) {
  const isAllowed = await checkPermission("manage_sports");
  if (!isAllowed) throw new Error("Non autorisé");
  await prisma.sport.delete({ where: { id } });
  revalidatePath("/sports");
}

/**
 * Inscrire / Désinscrire un utilisateur
 */
export async function toggleRegistration(sportId: string) {
  // On utilise getUserSession directement au lieu de getAuthenticatedUser
  const session = await getUserSession();
  
  // Ici on vérifie juste s'il est loggé, peu importe son rôle
  if (!session || !session.user) {
    throw new Error("Vous devez être connecté pour vous inscrire.");
  }

  const sport = await prisma.sport.findUnique({
    where: { id: sportId },
    include: { members: { where: { id: session.user.id } } }
  });

  if (!sport) throw new Error("Sport introuvable.");

  const isRegistered = (sport?.members.length ?? 0) > 0;

  await prisma.sport.update({
    where: { id: sportId },
    data: {
      members: isRegistered 
        ? { disconnect: { id: session.user.id } } 
        : { connect: { id: session.user.id } }
    }
  });

  revalidatePath("/sports");
}

/**
 * Ajouter une session d'entraînement au planning
 */
export async function addSportSession(sportId: string, formData: FormData) {
  const session = await getAuthenticatedUser();
  const isAllowed = await checkPermission("manage_sports");
  if (!isAllowed || !session.user) throw new Error("Non autorisé");

  const sport = await prisma.sport.findUnique({ where: { id: sportId } });
  if (!sport) throw new Error("Sport introuvable");

  const dateDebut = parseDateTimeLocal(formData.get("startDate") as string);
  const dateFin = parseDateTimeLocal(formData.get("endDate") as string);

  await prisma.$transaction(async (tx) => {
    await tx.sportSession.create({
      data: {
        date: dateDebut,
        endDate: dateFin,
        lieu: formData.get("lieu") as string,
        managers: formData.get("managers") as string,
        description: formData.get("description") as string,
        sportId: sportId,
      },
    });

    await tx.planningEvent.create({
      data: {
        titre: `[SPORT] ${sport.name}`,
        description: `Gérants : ${formData.get("managers")}`,
        lieu: formData.get("lieu") as string,
        dateDebut: dateDebut,
        dateFin: dateFin,
        type: "SPORT",
        autoreserv: false,
        gestionnaireId: session.user.id,
      }
    });
  });

  revalidatePath("/sports");
  revalidatePath("/");
}

// ==========================================
// SECTION ÉVÉNEMENTS (HERO)
// ==========================================

/**
 * Créer un nouvel événement Hero
 */
export async function addSportEvent(formData: FormData) {
  const session = await getAuthenticatedUser();
  const isAllowed = await checkPermission("manage_sports");
  if (!isAllowed || !session.user) throw new Error("Non autorisé");

  const titre = formData.get("titre") as string;
  const lieu = formData.get("lieu") as string;
  const dateDebut = parseDateTimeLocal(formData.get("dateDebut") as string);
  const dateFin = parseDateTimeLocal(formData.get("dateFin") as string);

  await prisma.$transaction(async (tx) => {
    // A. Création dans la table Sport (pour le Hero)
    await tx.sportEvent.create({
      data: {
        titre,
        lieu,
        dateDebut,
        dateFin,
        trailerUrl: formData.get("trailerUrl") as string,
        externalTrailerUrl: formData.get("externalTrailerUrl") as string,
        billetterieUrl: formData.get("billetterieUrl") as string,
      }
    });

    // B. Création automatique dans le Planning global (pour l'Accueil)
    await tx.planningEvent.create({
      data: {
        titre: `[EVENT] ${titre}`,
        description: "Événement Majeur / Compétition",
        lieu: lieu,
        dateDebut: dateDebut,
        dateFin: dateFin,
        type: "SPORT",
        gestionnaireId: session.user.id,
        autoreserv: true
      }
    });
  });

  revalidatePath("/sports");
  revalidatePath("/"); // ✅ Crucial pour mettre à jour l'accueil
}

/**
 * Supprimer un événement Hero
 */
export async function deleteSportEvent(id: string) {
  const isAllowed = await checkPermission("manage_sports");
  if (!isAllowed) throw new Error("Permission refusée");

  const event = await prisma.sportEvent.findUnique({ where: { id } });
  
  if (event) {
    await prisma.$transaction(async (tx) => {
      // 1. Supprimer l'event Hero
      await tx.sportEvent.delete({ where: { id } });

      // 2. Tenter de supprimer l'event correspondant dans le planning
      // On cherche un event avec le même titre (prefixé) et la même date
      await tx.planningEvent.deleteMany({
        where: {
          titre: `[EVENT] ${event.titre}`,
          dateDebut: event.dateDebut
        }
      });
    });
  }

  revalidatePath("/sports");
  revalidatePath("/");
}

/**
 * Mettre à jour un événement Hero
 */
export async function updateSportEvent(id: string, formData: FormData) {
  const session = await getAuthenticatedUser();
  const isAllowed = await checkPermission("manage_sports");
  if (!isAllowed || !session.user) throw new Error("Non autorisé");

  // 1. Récupérer l'ancienne version pour pouvoir retrouver l'entrée dans le planning
  const oldEvent = await prisma.sportEvent.findUnique({ where: { id } });
  if (!oldEvent) throw new Error("Événement introuvable");

  // 2. Extraire les nouvelles données
  const titre = formData.get("titre") as string;
  const lieu = formData.get("lieu") as string;
  const dateDebut = parseDateTimeLocal(formData.get("dateDebut") as string);
  const dateFin = parseDateTimeLocal(formData.get("dateFin") as string);
  const trailerUrl = formData.get("trailerUrl") as string;
  const externalTrailerUrl = formData.get("externalTrailerUrl") as string;
  const billetterieUrl = formData.get("billetterieUrl") as string;

  try {
    await prisma.$transaction(async (tx) => {
      // ✅ A. Mise à jour de l'événement Hero
      await tx.sportEvent.update({
        where: { id },
        data: {
          titre,
          lieu,
          dateDebut,
          dateFin,
          trailerUrl,
          externalTrailerUrl,
          billetterieUrl,
        },
      });

      // ✅ B. Mise à jour dynamique du planning
      // On cherche l'événement qui correspondait à l'ancienne version
      await tx.planningEvent.updateMany({
        where: {
          titre: `[EVENT] ${oldEvent.titre}`,
          dateDebut: oldEvent.dateDebut,
        },
        data: {
          titre: `[EVENT] ${titre}`,
          lieu: lieu,
          dateDebut: dateDebut,
          dateFin: dateFin,
          // La description reste fixe ou peut être mise à jour ici
        }
      });
    });

    // 3. Rafraîchir les caches
    revalidatePath("/sports");
    revalidatePath("/"); 
  } catch (error) {
    console.error("Update Error:", error);
    throw new Error("Erreur lors de la modification synchronisée");
  }
}