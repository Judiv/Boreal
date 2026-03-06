"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { compare, hash } from "bcrypt";
import { getUserSession } from "@/lib/auth";

// --- 1. ACTIONS UTILISATEUR ---
export async function updateProfileInfo(formData: FormData) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  if (!userId) return;

  const prenom = formData.get("prenom") as string;
  const nom = formData.get("nom") as string;
  const bucque = formData.get("bucque") as string;
  const numFams = formData.get("numFams") as string;
  const liseId = formData.get("liseId") as string;

  await prisma.user.update({
    where: { id: userId },
    data: { prenom, nom, bucque, numFams, liseId },
  });

  revalidatePath("/profile");
}

export async function changePassword(formData: FormData) {
  try {
    // 1. Vérification de la session
    const session = await getUserSession();
    if (!session) {
      return { error: "Vous n'êtes plus connecté." };
    }

    // 2. Récupération des données du formulaire
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // 3. Vérifications de base (champs vides)
    if (!currentPassword || !newPassword || !confirmPassword) {
      return { error: "Tous les champs doivent être remplis." };
    }

    // 4. Vérification de la correspondance des nouveaux mots de passe
    if (newPassword !== confirmPassword) {
      return { error: "Les nouveaux mots de passe ne correspondent pas." };
    }

    // 5. Vérification de la longueur (Sécurité)
    if (newPassword.length < 6) {
      return { error: "Le nouveau mot de passe doit faire au moins 6 caractères." };
    }

    // 6. Récupération de l'utilisateur en base (avec le password hashé)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true }, // On ne récupère que le nécessaire
    });

    if (!user || !user.password) {
      return { error: "Utilisateur introuvable en base de données." };
    }

    // 7. Comparaison du mot de passe actuel
    const isMatch = await compare(currentPassword, user.password);

    if (!isMatch) {
      // ✅ Au lieu de crash, on renvoie l'erreur visuelle pour le client
      return { error: "Le mot de passe actuel est incorrect." };
    }

    // 8. Hashage du nouveau mot de passe
    const hashedNewPassword = await hash(newPassword, 12);

    // 9. Mise à jour dans Prisma
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedNewPassword },
    });

    // 10. Succès
    revalidatePath("/profile");
    return { success: true };

  } catch (error) {
    console.error("Erreur changePassword:", error);
    return { error: "Une erreur technique est survenue. Réessayez plus tard." };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("userId");
  cookieStore.delete("userRole");
  redirect("/login");
}

// --- 3. GESTION DES NOTIFICATIONS ---
export async function getMyNotifications() {
  const session = await getUserSession();
  if (!session) return [];

  return await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 20
  });
}

export async function markAsRead(id: number) {
  await prisma.notification.update({
    where: { id },
    data: { isRead: true }
  });
  revalidatePath("/profile");
}

export async function clearNotifications() {
  const session = await getUserSession();
  if (!session) return;

  await prisma.notification.deleteMany({
    where: { userId: session.user.id }
  });
  revalidatePath("/profile");
}

export async function deleteAccount() {
  const session = await getUserSession();
  if (!session) return { error: "Non autorisé" };

  const GHOST_USER_ID = "ghost-user-system";
  const userId = session.user.id;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. S'assurer que le Bot existe pour les contenus que l'on GARDE (News, Forum)
      await tx.user.upsert({
        where: { id: GHOST_USER_ID },
        update: {},
        create: {
          id: GHOST_USER_ID,
          emailEnsam: "bot.boreal@siberss.fr",
          password: "system-locked-account",
          liseId: "SYSTEM-BOT",
          nom: "BOREAL",
          prenom: "Bot",
          roleId: 3,
        },
      });

      // 2. TRANSFERT (Ce qu'on garde mais anonymise)
      await tx.news.updateMany({ where: { auteurId: userId }, data: { auteurId: GHOST_USER_ID } });
      await tx.forumPost.updateMany({ where: { auteurId: userId }, data: { auteurId: GHOST_USER_ID } });
      await tx.planningEvent.updateMany({ where: { gestionnaireId: userId }, data: { gestionnaireId: GHOST_USER_ID } });
      await tx.message.updateMany({ where: { expediteurId: userId }, data: { expediteurId: GHOST_USER_ID } });
      await tx.log.updateMany({ where: { userId: userId }, data: { userId: GHOST_USER_ID } });

      // 3. SUPPRESSION RADICALE (Ce que tu as demandé)
      
      // Supprimer les inscriptions aux trajets des autres et ses propres trajets
      await tx.rideRegistration.deleteMany({ where: { passengerId: userId } });
      await tx.ride.deleteMany({ where: { conducteurId: userId } });

      // Supprimer les objets en prêt
      await tx.loanObject.deleteMany({ where: { ownerId: userId } });

      // Supprimer les notifications et dossiers
      await tx.notification.deleteMany({ where: { userId: userId } });
      await tx.folder.deleteMany({ where: { userId: userId } });

      // Supprimer les réceptions de messages (laisse le message original mais l'enlève de la boîte de l'utilisateur)
      await tx.messageRecipient.deleteMany({ where: { userId: userId } });

      // 4. NETTOYAGE DES RELATIONS MANY-TO-MANY (Sport, Tags, etc.)
      await tx.user.update({
        where: { id: userId },
        data: {
          sports: { set: [] },
          tags: { set: [] },
          permissionsPerso: { set: [] }
        }
      });

      // 5. SUPPRESSION FINALE DU COMPTE
      // Maintenant que toutes les dépendances sont nettoyées, le delete ne fera plus d'erreur technique
      await tx.user.delete({
        where: { id: userId }
      });
    });

    // IMPORTANT : Ne pas appeler logout() ici si tu es dans une Server Action Next.js 
    // qui attend une réponse JSON, car le logout peut rediriger et casser la réponse.
    return { success: true };

  } catch (error) {
    console.error("🔥 Erreur lors de la suppression du compte :", error);
    return { error: "Erreur technique : impossible de supprimer toutes les dépendances." };
  }
}