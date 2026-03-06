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
  if (!session || (!session.isSuperAdmin && !checkPermission("manage_boquettes"))) {
    throw new Error("Action non autorisée");
  }

  const nom = formData.get("nom") as string;
  const lieu = formData.get("lieu") as string;
  const description = formData.get("description") as string;
  
  // Le TagSelector renvoie une string simple pour requiredTag
  const requiredTag = formData.get("requiredTag") as string;
  
  // Le TagSelector renvoie un JSON stringifié pour multiple=true
  const allowedTagsRaw = formData.get("allowedTags") as string;
  const allowedTags = allowedTagsRaw ? JSON.parse(allowedTagsRaw) : [];

  const file = formData.get("imageFile") as File;
  const url = formData.get("imageUrl") as string;
  const finalImageUrl = await handleImageProcessing(file, url, "boquettes");

  await prisma.boquette.create({
    data: {
      nom,
      lieu,
      description,
      requiredTag,
      allowedTags: { set: allowedTags }, // On suppose que le schéma Prisma est mis à jour en string[]
      imageUrl: finalImageUrl,
      isOpen: false,
    },
  });

  revalidatePath("/boquettes");
}

export async function updateBoquetteInfo(formData: FormData) {
  const session = await getUserSession();
  if (!session) throw new Error("Non connecté");

  const id = parseInt(formData.get("id") as string);
  const boquette = await prisma.boquette.findUnique({ where: { id } });
  if (!boquette) throw new Error("Boquette introuvable");

  // Sécurité
  const canManage = session.isSuperAdmin || session.allTags.includes(boquette.requiredTag);
  if (!canManage) throw new Error("Permission refusée");

  // Traitement des tags
  const requiredTag = formData.get("requiredTag") as string;
  const allowedTagsRaw = formData.get("allowedTags") as string;
  const allowedTags = allowedTagsRaw ? JSON.parse(allowedTagsRaw) : [];

  const file = formData.get("imageFile") as File;
  const url = formData.get("imageUrl") as string;
  let finalImageUrl = await handleImageProcessing(file, url, "boquettes");
  if (!finalImageUrl) finalImageUrl = boquette.imageUrl;

  await prisma.boquette.update({
    where: { id },
    data: { 
      nom: formData.get("nom") as string,
      lieu: formData.get("lieu") as string,
      description: formData.get("description") as string,
      requiredTag, // Permet maintenant de modifier le groupe responsable
      allowedTags: { set: allowedTags },
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