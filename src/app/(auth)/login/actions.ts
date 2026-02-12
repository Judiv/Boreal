"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

/**
 * CONNEXION UTILISATEUR
 */
export async function loginUser(formData: FormData) {
  const email = formData.get("email") as string;
  const passwordSaisi = formData.get("password") as string;

  const user = await prisma.user.findUnique({
    where: { emailEnsam: email.toLowerCase().trim() },
  });

  if (!user || !user.password) {
    return { error: "Identifiants invalides" };
  }

  const isMatch = await bcrypt.compare(passwordSaisi, user.password);
  
  if (!isMatch) {
    return { error: "Identifiants invalides" };
  }

  const cookieStore = await cookies();
  cookieStore.set("userId", user.id.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  redirect("/");
}

/**
 * DEMANDE DE RÉINITIALISATION DE MOT DE PASSE
 */
export async function requestPasswordReset(email: string) {
  console.log("🚀 [DEBUG] Appel de requestPasswordReset reçu pour :", email);
  try {
    const user = await prisma.user.findUnique({ 
      where: { emailEnsam: email.toLowerCase().trim() } 
    });
    
    if (!user) {
      console.log("👤 [DEBUG] Utilisateur non trouvé en base.");
      return { success: true }; 
    }

    console.log("👤 [DEBUG] Utilisateur trouvé :", user.prenom);

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600 * 1000); 

    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { email: user.emailEnsam } }),
      prisma.passwordResetToken.create({
        data: { email: user.emailEnsam, token, expires }
      })
    ]);

    console.log("💾 [DEBUG] Token généré et enregistré en base.");

    // 1. CONFIGURATION DU TRANSPORTEUR SMTP OVH
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST || process.env.EMAIL_HOST || "ssl0.ovh.net",
      port: Number(process.env.EMAIL_SERVER_PORT || process.env.EMAIL_PORT || 465),
      secure: true, 
      auth: {
        user: process.env.EMAIL_SERVER_USER || process.env.EMAIL_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD || process.env.EMAIL_PASS,
      },
      // 🛡️ Options de compatibilité Docker / Certificats OVH
      tls: {
        rejectUnauthorized: false, // Évite les erreurs de certificat SSL dans le container
        minVersion: 'TLSv1.2'
      },
      connectionTimeout: 15000, // On laisse un peu plus de temps pour Docker
      greetingTimeout: 15000,
    });

    // 📡 TEST DE CONNEXION AVANT ENVOI
    console.log("📡 [DEBUG] Vérification de la connexion au serveur OVH...");
    try {
      await transporter.verify();
      console.log("✅ [DEBUG] Serveur SMTP prêt.");
    } catch (vError) {
      console.error("❌ [DEBUG] Erreur de vérification SMTP (Vérifie tes identifiants ou le port):", vError);
      throw vError; // On remonte l'erreur au catch principal
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    // 2. ENVOI DU MAIL
    await transporter.sendMail({
      from: `"Boreal Portail" <${process.env.EMAIL_SERVER_USER || process.env.EMAIL_USER}>`,
      to: user.emailEnsam,
      subject: "Réinitialisation de ton mot de passe Boreal",
      html: `
        <div style="font-family: sans-serif; background: #020617; color: white; padding: 40px; border-radius: 20px; text-align: center;">
          <h1 style="color: #3b82f6; font-style: italic; margin-bottom: 20px;">BOREAL</h1>
          <p style="font-size: 16px;">Bonjour <strong>${user.prenom}</strong>,</p>
          <p style="font-size: 14px; color: #94a3b8;">Tu as demandé à changer ton code d'accès.</p>
          <div style="margin: 30px 0;">
            <a href="${resetLink}" style="background: #3b82f6; color: white; padding: 15px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
              Changer mon mot de passe
            </a>
          </div>
          <p style="font-size: 12px; color: #64748b;">Si tu n'es pas à l'origine de cette demande, ignore ce mail.</p>
          <p style="font-size: 12px; color: #64748b; margin-top: 20px;">L'équipe Boreal</p>
        </div>
      `,
    });

    console.log(`✅ Mail envoyé avec succès à : ${user.emailEnsam}`);
    return { success: true };
  } catch (error) {
    console.error("💥 Erreur SMTP OVH détaillée:", error);
    return { error: "Erreur lors de l'envoi du mail. Vérifie les logs Docker." };
  }
}