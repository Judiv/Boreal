"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function resetPassword(token: string, passwordSaisi: string) {
  try {
    // 1. On cherche le token dans la BDD
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token }
    });

    // 2. Vérifications (existence et expiration)
    if (!resetToken) {
      return { success: false, error: "Jeton de réinitialisation invalide." };
    }

    if (new Date() > resetToken.expires) {
      return { success: false, error: "Le lien a expiré (validité 1h)." };
    }

    // 3. Hachage du nouveau mot de passe
    const hashedPassword = await bcrypt.hash(passwordSaisi, 10);

    // 4. Transaction : Mise à jour de l'user + Suppression du token utilisé
    await prisma.$transaction([
      prisma.user.update({
        where: { emailEnsam: resetToken.email },
        data: { password: hashedPassword }
      }),
      prisma.passwordResetToken.delete({
        where: { token }
      })
    ]);

    console.log(`✅ Mot de passe mis à jour pour : ${resetToken.email}`);
    
    return { success: true };
  } catch (error) {
    console.error("Erreur resetPassword action:", error);
    return { success: false, error: "Une erreur technique est survenue." };
  }
}