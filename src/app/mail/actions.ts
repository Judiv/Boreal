"use server";

import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// --- CONFIGURATION SÉCURITÉ ---

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf', 'text/plain', 'text/csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword', 'application/vnd.ms-excel', 'application/vnd.ms-powerpoint',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/x-step', 'application/step',
  'application/sla', 'application/vnd.ms-pki.stl',
  'application/x-solidworks', 'application/x-asap',
  'model/iges', 'application/iges',
  'video/mp4', 'video/webm', 'video/quicktime',
  'video/x-msvideo', 'video/mpeg',
  'audio/mpeg', 'audio/wav', 'audio/ogg',
  'audio/aac', 'audio/x-m4a', 'audio/flac'
];

const ALLOWED_EXTENSIONS = [
  '.docx', '.xlsx', '.pptx', '.doc', '.xls', '.ppt', 
  '.odt', '.ods', 
  '.step', '.stp', '.stl', '.obj', '.igs', '.iges',
  '.sldprt', '.sldasm', '.f3d', '.ipt', '.iam',
  '.mp4', '.webm', '.mov', '.avi', '.mpeg',
  '.mp3', '.wav', '.ogg', '.aac', '.m4a', '.flac'
];

const lastMessageCache = new Map<string, number>();
const RATE_LIMIT_MS = 5000;

if (typeof global !== 'undefined') {
  if (!(global as any).rateLimitInterval) {
    (global as any).rateLimitInterval = setInterval(() => {
      const now = Date.now();
      for (const [userId, lastActive] of lastMessageCache.entries()) {
        if (now - lastActive > 3600000) lastMessageCache.delete(userId);
      }
    }, 3600000);
  }
}

export async function sendInternalMessage(arg1: any, arg2?: any) {
  const formData = arg1 instanceof FormData ? arg1 : (arg2 instanceof FormData ? arg2 : null);
  if (!formData) return { error: "Données de formulaire manquantes." };

  try {
    const session = await getUserSession();
    if (!session) return { error: "Session expirée." };

    const now = Date.now();
    const lastSend = lastMessageCache.get(session.user.id) || 0;
    const diff = now - lastSend;

    if (diff < RATE_LIMIT_MS) {
      const waitTime = Math.ceil((RATE_LIMIT_MS - diff) / 1000);
      return { error: `Veuillez patienter ${waitTime} seconde(s).` };
    }

    const objet = formData.get("objet") as string;
    const contenu = formData.get("contenu") as string;
    const parentMessageId = formData.get("parentMessageId") as string | null;
    
    let recipientIds = [];
    try {
      recipientIds = JSON.parse(formData.get("recipientIds") as string || "[]");
    } catch (e) {
      return { error: "Liste de destinataires invalide." };
    }
    
    const rawFiles = formData.getAll("files");
    const uploadedAttachments = [];

    if (rawFiles.length > 0) {
      // ✅ CORRECTION 1 : Utilisation de process.cwd() robuste pour Docker
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });

      for (const item of rawFiles) {
        // ✅ CORRECTION 2 : Filtrage strict pour éviter l'erreur "Received undefined"
        if (!item || typeof item === 'string' || !(item instanceof Blob)) {
          continue;
        }

        const file = item as File;
        
        // Sécurité sur le nom pour éviter que path.extname crash
        const safeRawName = file.name || "fichier_sans_nom";
        const fileExtension = path.extname(safeRawName).toLowerCase();
        
        const isAllowedType = ALLOWED_TYPES.includes(file.type);
        const isAllowedExt = ALLOWED_EXTENSIONS.includes(fileExtension);

        if (!isAllowedType && !isAllowedExt) {
          return { error: `Format non supporté : ${safeRawName}` };
        }

        // ✅ CORRECTION 3 : Gestion de la mémoire pour les gros fichiers (Vidéos)
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Nettoyage agressif du nom de fichier pour les URLs
        const cleanFileName = safeRawName
          .replace(/\s+/g, "_")
          .replace(/[^a-zA-Z0-9.\-_]/g, "");
          
        const uniqueName = `${Date.now()}-${cleanFileName}`;
        const filePath = path.join(uploadDir, uniqueName);
        
        await writeFile(filePath, buffer);
        
        uploadedAttachments.push({
          name: safeRawName,
          url: `/api/uploads/${uniqueName}`,
          size: file.size,
          type: file.type || "application/octet-stream"
        });
      }
    }

    if (recipientIds.length === 0) return { error: "Destinataire manquant." };

    await prisma.message.create({
      data: {
        objet: objet || "(Sans objet)",
        contenu: contenu || "",
        expediteurId: session.user.id,
        parentMessageId: parentMessageId || null,
        destinataires: {
          create: recipientIds.map((id: string) => ({ userId: id })),
        },
        attachments: {
          create: uploadedAttachments
        }
      }
    });

    await prisma.notification.createMany({
      data: recipientIds.map((id: string) => ({
        userId: id,
        type: "MESSAGE",
        title: "Nouveau message",
        message: `${session.user.bucque || session.user.prenom} vous a envoyé un message.`,
      }))
    });

    lastMessageCache.set(session.user.id, Date.now());
    
    // On revalide le chemin mail pour rafraîchir l'interface
    revalidatePath("/mail");
    
    return { success: true };

  } catch (error: any) {
    console.error("🔥 Erreur Serveur Upload:", error);
    return { error: "Une erreur est survenue lors de l'envoi." };
  }
}

// --- LES FONCTIONS SUIVANTES RESTENT INCHANGÉES POUR LA STABILITÉ ---

export async function markAsRead(messageId: string) {
  const session = await getUserSession();
  if (!session) return;
  try {
    await prisma.messageRecipient.updateMany({
      where: { messageId: messageId, userId: session.user.id, lu: false },
      data: { lu: true, isRead: new Date() }
    });
    revalidatePath("/mail");
  } catch (e) {}
}

export async function moveMessageToFolder(messageId: string, folderId: string | null) {
  const session = await getUserSession();
  if (!session) return { error: "Non autorisé" };
  try {
    const targetFolderId = (folderId === "inbox" || folderId === "" || folderId === "null") ? null : folderId;
    await prisma.messageRecipient.updateMany({
      where: { messageId: messageId, userId: session.user.id },
      data: { folderId: targetFolderId }
    });
    revalidatePath("/mail");
    return { success: true };
  } catch (e) { return { error: "Erreur déplacement." }; }
}

export async function createFolder(nom: string, color: string = "#3b82f6") {
  const session = await getUserSession();
  if (!session) return { error: "Non autorisé" };
  try {
    await prisma.folder.create({ data: { nom, color, userId: session.user.id } });
    revalidatePath("/mail");
    return { success: true };
  } catch (e) { return { error: "Erreur création." }; }
}

export async function deleteFolder(folderId: string) {
  const session = await getUserSession();
  if (!session) return { error: "Non autorisé" };
  try {
    await prisma.messageRecipient.updateMany({
      where: { folderId: folderId, userId: session.user.id },
      data: { folderId: null }
    });
    await prisma.folder.delete({ where: { id: folderId, userId: session.user.id } });
    revalidatePath("/mail");
    return { success: true };
  } catch (e) { return { error: "Erreur suppression." }; }
}

export async function deleteMessage(messageId: string) {
  const session = await getUserSession();
  if (!session) return { error: "Non autorisé" };
  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { destinataires: true, attachments: true }
    });
    if (!message) return { error: "Message introuvable" };
    const isSender = message.expediteurId === session.user.id;
    const recipient = message.destinataires.find(d => d.userId === session.user.id);
    const alreadySoftDeleted = isSender ? message.supprimePourExpediteur : recipient?.supprime;

    if (alreadySoftDeleted) {
      await prisma.message.delete({ where: { id: messageId } });
    } else {
      if (isSender) {
        await prisma.message.update({ where: { id: messageId }, data: { supprimePourExpediteur: true } });
      } else {
        await prisma.messageRecipient.updateMany({
          where: { messageId, userId: session.user.id },
          data: { supprime: true }
        });
      }
    }
    revalidatePath("/mail");
    return { success: true };
  } catch (e) { return { error: "Erreur suppression" }; }
}

export async function restoreMessage(messageId: string) {
  const session = await getUserSession();
  if (!session) return { error: "Non autorisé" };
  try {
    await prisma.message.updateMany({
      where: { id: messageId, expediteurId: session.user.id },
      data: { supprimePourExpediteur: false }
    });
    await prisma.messageRecipient.updateMany({
      where: { messageId, userId: session.user.id },
      data: { supprime: false }
    });
    revalidatePath("/mail");
    return { success: true };
  } catch (e) { return { error: "Erreur restauration" }; }
}

export async function emptyTrash() {
  const session = await getUserSession();
  if (!session) return { error: "Non autorisé" };
  await prisma.messageRecipient.deleteMany({ where: { userId: session.user.id, supprime: true } });
  await prisma.message.deleteMany({ where: { expediteurId: session.user.id, supprimePourExpediteur: true } });
  revalidatePath("/mail");
  return { success: true };
}

export async function searchUsers(query: string) {
  const session = await getUserSession();
  if (!session || query.length < 2) return [];
  return await prisma.user.findMany({
    where: {
      OR: [
        { nom: { contains: query, mode: 'insensitive' } },
        { prenom: { contains: query, mode: 'insensitive' } },
        { bucque: { contains: query, mode: 'insensitive' } },
      ],
      NOT: { id: session.user.id } 
    },
    select: { id: true, prenom: true, nom: true, bucque: true },
    take: 5
  });
}

export async function hardDeleteMessage(messageId: string) {
  const session = await getUserSession();
  if (!session) return { error: "Non autorisé" };
  try {
    const recipient = await prisma.messageRecipient.findFirst({ where: { messageId, userId: session.user.id, supprime: true } });
    const isSender = await prisma.message.findFirst({ where: { id: messageId, expediteurId: session.user.id, supprimePourExpediteur: true } });
    if (!recipient && !isSender) return { error: "Action impossible" };
    await deleteMessage(messageId); 
    revalidatePath("/mail");
    return { success: true };
  } catch (e) { return { error: "Erreur suppression définitive" }; }
}