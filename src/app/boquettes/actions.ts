// src/app/boquettes/actions.ts
"use server";

import { getUserSession, checkPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { handleImageProcessing } from "@/lib/upload";
import { pusherServer } from "@/lib/pusher";

// --- OUVRIR / FERMER ---
export async function toggleBoquetteStatus(boquetteId: number) {
  const session = await getUserSession();
  if (!session) throw new Error("Non connecté");

  // 1. On récupère la boquette pour connaître son Tag Requis
  const boquette = await prisma.boquette.findUnique({ where: { id: boquetteId } });
  if (!boquette) throw new Error("Boquette introuvable");

  // 2. SÉCURITÉ : Est-ce que j'ai le droit ?
  // Droit si : SuperAdmin OU j'ai le tag requis (ex: "ZiBar")
  const canManage = session.isSuperAdmin || session.allTags.includes(boquette.requiredTag);

  if (!canManage) {
    throw new Error("Vous n'avez pas le tag requis pour gérer cette boquette.");
  }

  // 3. On inverse le statut
  await prisma.boquette.update({
    where: { id: boquetteId },
    data: { isOpen: !boquette.isOpen },
  });

  revalidatePath("/boquettes");
}

/**
 * ACTION : CRÉER UNE BOQUETTE
 */
export async function createBoquette(formData: FormData) {
  const session = await getUserSession();
  
  // Vérification de la permission globale
  if (!session || (!session.isSuperAdmin && !checkPermission("manage_boquettes"))) {
    throw new Error("Action non autorisée");
  }

  const nom = formData.get("nom") as string;
  const lieu = formData.get("lieu") as string;
  const description = formData.get("description") as string;
  const requiredTag = formData.get("requiredTag") as string;
  
  const file = formData.get("imageFile") as File;
  const url = formData.get("imageUrl") as string;

  const finalImageUrl = await handleImageProcessing(file, url, "boquettes");

  await prisma.boquette.create({
    data: {
      nom,
      lieu,
      description,
      requiredTag,
      imageUrl: finalImageUrl,
      isOpen: false, // Fermé par défaut à la création
    },
  });

  revalidatePath("/boquettes");
}

/**
 * ACTION : MODIFIER UNE BOQUETTE
 */
export async function updateBoquetteInfo(formData: FormData) {
  const session = await getUserSession();
  if (!session) throw new Error("Non connecté");

  // Sécurité : Conversion propre de l'ID
  const idRaw = formData.get("id");
  if (!idRaw) throw new Error("ID de la boquette manquant");
  const id = parseInt(idRaw as string);
  
  if (isNaN(id)) throw new Error("ID de boquette invalide");

  const boquette = await prisma.boquette.findUnique({ where: { id } });
  if (!boquette) throw new Error("Boquette introuvable");

  // Vérification des droits (SuperAdmin ou Permission + Tag)
  const canManage = session.isSuperAdmin || 
    (checkPermission("manage_boquettes") && session.allTags.includes(boquette.requiredTag));

  if (!canManage) throw new Error("Permission refusée pour cette boquette");

  const file = formData.get("imageFile") as File;
  const url = formData.get("imageUrl") as string;
  let finalImageUrl = await handleImageProcessing(file, url, "boquettes");

  // Si on n'a rien uploadé, on garde l'ancienne image
  if (!finalImageUrl) finalImageUrl = boquette.imageUrl;

  await prisma.boquette.update({
    where: { id },
    data: { 
      nom: formData.get("nom") as string,
      lieu: formData.get("lieu") as string,
      description: formData.get("description") as string,
      imageUrl: finalImageUrl,
    },
  });

  revalidatePath("/boquettes");
}

/**
 * ACTION : SUPPRIMER UNE BOQUETTE
 */
export async function deleteBoquette(id: number) {
  const session = await getUserSession();
  if (!session) throw new Error("Non connecté");

  const boquette = await prisma.boquette.findUnique({ where: { id } });
  if (!boquette) throw new Error("Boquette introuvable");

  const canManage = session.isSuperAdmin || 
    (checkPermission("manage_boquettes") && session.allTags.includes(boquette.requiredTag));

  if (!canManage) throw new Error("Permission refusée");

  await prisma.boquette.delete({ where: { id } });
  
  revalidatePath("/boquettes");
}

export async function sendRotanceRequest(boquetteId: number) {
  const session = await getUserSession();
  if (!session) return;

  const boquette = await prisma.boquette.findUnique({ where: { id: boquetteId } });
  if (!boquette) return;

  const managers = await prisma.user.findMany({
    where: { tags: { some: { nom: boquette.requiredTag } } }
  });

  // ✅ LOGIQUE ANTI-FLOOD & PUSHER
  for (const manager of managers) {
    // 1. On nettoie les anciennes demandes non-lues
    await prisma.notification.deleteMany({
      where: {
        userId: manager.id,
        type: "ROTANCE",
        isRead: false,
        title: { contains: boquette.nom }
      }
    });

    // 2. On crée la nouvelle notification en base
    const newNotif = await prisma.notification.create({
      data: {
        userId: manager.id,
        type: "ROTANCE",
        title: `🍻 Rotance : ${boquette.nom}`,
        message: `${session.user.prenom} demande l'ouverture !`,
      }
    });

    // 3. ✨ ENVOI PUSHER : On prévient le manager en temps réel
    // On envoie un signal sur le canal privé du manager
    try {
      await pusherServer.trigger(`user-${manager.id}`, "new-notification", {
        id: newNotif.id,
        type: "ROTANCE",
        title: newNotif.title,
        message: newNotif.message
      });
    } catch (error) {
      console.error("Erreur Pusher:", error);
      // On ne bloque pas l'exécution si Pusher échoue, la notif est déjà en base.
    }
  }

  revalidatePath("/profile");
}