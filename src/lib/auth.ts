// src/lib/auth.ts
"use server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

/**
 * FONCTION UTILITAIRE : Récupérer l'ID depuis le cookie
 */
async function getUserIdFromCookie() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  // Debug pour voir dans le terminal Docker
  console.log(">>> [AUTH DEBUG] Cookie userId trouvé :", userId || "AUCUN");
  return userId;
}

/**
 * FONCTION 1 : hasPermission (Pour l'UI)
 */
export async function hasPermission(requiredCode: string): Promise<boolean> {
  const userId = await getUserIdFromCookie();
  if (!userId) return false;

  const user = await prisma.user.findUnique({
    where: { id: userId },
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
 * FONCTION 2 : checkPermission
 */
export async function checkPermission(requiredCode: string) {
  const isAllowed = await hasPermission(requiredCode);
  if (!isAllowed) {
    throw new Error(`Accès refusé. Permission requise : ${requiredCode}`);
  }
  const userId = await getUserIdFromCookie();
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function getUserSession() {
  const userId = await getUserIdFromCookie();
  if (!userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
  } catch (e) {
    return null;
  }
}

export async function getUser() {
  const userId = await getUserIdFromCookie();
  if (!userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

export async function getUserTags(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { tags: true },
  });
  return user?.tags.map(t => t.nom) || [];
}

export async function hasTagAccess(userTags: string[], resourceTags: { nom: string }[]) {
  if (!resourceTags || resourceTags.length === 0) return true;
  return resourceTags.some(rTag => userTags.includes(rTag.nom));
}