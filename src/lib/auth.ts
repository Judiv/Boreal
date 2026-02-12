// src/lib/auth.ts
"use server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

/**
 * FONCTION 1 : hasPermission (Pour l'UI)
 * Renvoie un booléen. Ne fait JAMAIS crash la page.
 */
export async function hasPermission(requiredCode: string): Promise<boolean> {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) return false;

  const user = await prisma.user.findUnique({
    where: { id: String(userId) },
    include: {
      role: { include: { permissions: true } },
      permissionsPerso: true
    }
  });

  if (!user) return false;

  if (user.role.nom === "SUPER_ADMIN") return true;

  const hasRolePerm = user.role.permissions.some(p => p.code === requiredCode);
  const hasPersoPerm = user.permissionsPerso.some(p => p.code === requiredCode);

  return hasRolePerm || hasPersoPerm;
}

/**
 * FONCTION 2 : checkPermission (Pour la sécurité des routes/actions)
 */
export async function checkPermission(requiredCode: string) {
  const isAllowed = await hasPermission(requiredCode);

  if (!isAllowed) {
    throw new Error(`Accès refusé. Permission requise : ${requiredCode}`);
  }

  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  
  // Correction : suppression de parseInt
  return prisma.user.findUnique({ where: { id: String(userId) } });
}

export async function getUserSession() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: String(userId) }, // Correction : String au lieu de parseInt
    include: {
      role: { include: { permissions: true } },
      permissionsPerso: true,
      tags: true, 
    },
  });

  if (!user) return null;

  const allTags = user.tags.map((t) => t.nom);

  if (user.role.nom === "SUPER_ADMIN") {
    return { 
      user, 
      isSuperAdmin: true, 
      permissions: [],
      allTags: allTags 
    };
  }

  const allPermissions = new Set([
    ...user.role.permissions.map((p) => p.code),
    ...user.permissionsPerso.map((p) => p.code),
  ]);

  return {
    user,
    isSuperAdmin: false,
    permissions: Array.from(allPermissions),
    allTags: allTags, 
  };
}

export async function getUser() {
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get("userId"); 

  if (!userIdCookie || !userIdCookie.value) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: String(userIdCookie.value), // Correction : String au lieu de Number
      },
      include: {
        role: true,
        permissionsPerso: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Erreur récupération utilisateur:", error);
    return null;
  }
}

// Correction du type de paramètre : string au lieu de number
export async function getUserTags(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { tags: true },
  });

  return user?.tags.map(t => t.nom) || [];
}

/**
* Vérifie si l'utilisateur a au moins un tag en commun avec la ressource
*/
export async function hasTagAccess(userTags: string[], resourceTags: { nom: string }[]) {
  if (!resourceTags || resourceTags.length === 0) return true;
  return resourceTags.some(rTag => userTags.includes(rTag.nom));
}