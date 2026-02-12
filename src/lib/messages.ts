// src/lib/messages.ts
import { prisma } from "@/lib/prisma";

/**
 * Récupère les messages reçus par l'utilisateur
 */
export async function getInbox(userId: string) {
  return await prisma.message.findMany({
    where: {
      destinataires: {
        some: {
          userId: userId,
        },
      },
    },
    include: {
      expediteur: {
        select: {
          prenom: true,
          nom: true,
          bucque: true,
        },
      },
      destinataires: {
        where: { userId: userId },
        select: { isRead: true },
      },
    },
    orderBy: {
      dateEnvoi: "desc",
    },
  });
}

/**
 * Récupère les messages envoyés par l'utilisateur
 */
export async function getSentMessages(userId: string) {
  return await prisma.message.findMany({
    where: {
      expediteurId: userId,
    },
    include: {
      destinataires: {
        include: {
          user: {
            select: {
              prenom: true,
              nom: true,
              bucque: true,
            },
          },
        },
      },
    },
    orderBy: {
      dateEnvoi: "desc",
    },
  });
}