"use server";

import { prisma } from "@/lib/prisma";
import { hash } from "bcrypt";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

export async function registerUser(prevState: any, formData: FormData) {
  const prenom = formData.get("prenom") as string;
  const nom = formData.get("nom") as string;
  const bucque = formData.get("bucque") as string;
  const email = formData.get("email") as string;
  const numFams = formData.get("numFams") as string;
  const liseId = formData.get("liseId") as string;
  const password = formData.get("password") as string;

  // 1. Validation LISE
  const liseRegex = /^20\d{2}-\d{4}$/;
  if (!liseRegex.test(liseId)) {
    return { error: "L'identifiant LISE doit être au format Année-Matricule (ex: 2025-0703)" };
  }

  const hashedPassword = await hash(password, 10);

  try {
    // ✅ 2. Gérer le rôle dynamiquement
    // Au lieu de mettre "3" en dur, on cherche ou on crée le rôle GADZ
    let role = await prisma.role.findUnique({ where: { nom: "GADZ" } });
    
    if (!role) {
      role = await prisma.role.create({ data: { nom: "GADZ" } });
    }

    // 3. Création de l'utilisateur
    await prisma.user.create({
      data: {
        prenom,
        nom,
        bucque,
        emailEnsam: email,
        numFams,
        liseId,
        password: hashedPassword,
        roleId: role.id, // On utilise l'ID récupéré dynamiquement
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const target = (error.meta?.target as string[]) || [];
        if (target.includes('emailEnsam')) {
          return { error: "Cet email est déjà utilisé." };
        }
        if (target.includes('liseId')) {
          return { error: "Cet identifiant LISE existe déjà." };
        }
      }
    }
    console.error("Erreur Inscription:", error);
    return { error: "Erreur technique. Vérifiez que la base est bien à jour (db push)." };
  }

  // Si tout est bon, on redirige vers le login
  redirect("/login");
}