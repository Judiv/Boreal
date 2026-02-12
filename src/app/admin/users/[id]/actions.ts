"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// --- VÉRIFICATION SÉCURITÉ ---
async function checkSuperAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  if (!userId) redirect("/login");

  const admin = await prisma.user.findUnique({
    // ✅ FIX : userId est déjà un String (CUID)
    where: { id: userId }, 
    include: { role: true },
  });

  if (admin?.role?.nom !== "SUPER_ADMIN") {
    throw new Error("Accès refusé");
  }
  return admin;
}

// 1. RÉCUPÉRATION DES DONNÉES (User cible en String)
export async function getUserData(targetUserId: string) {
  await checkSuperAdmin();

  const user = await prisma.user.findUnique({
    // ✅ FIX : targetUserId doit être un String
    where: { id: targetUserId },
    include: {
      role: true,
      tags: true,
      permissionsPerso: true,
    },
  });

  if (!user) return null;

  const allRoles = await prisma.role.findMany();
  const allTags = await prisma.tag.findMany();
  const allPermissions = await prisma.permission.findMany();

  return { user, allRoles, allTags, allPermissions };
}

// 2. MISE À JOUR DE L'UTILISATEUR
export async function updateUser(formData: FormData) {
  const admin = await checkSuperAdmin();

  // ✅ FIX : userId cible est un String
  const targetUserId = formData.get("userId") as string;
  
  // ✅ OK : roleId reste un Int (autoincrement dans Prisma)
  const roleId = parseInt(formData.get("roleId") as string);
  
  // ✅ OK : Les IDs des tags et perms restent des Int
  const selectedTags = formData.getAll("tags").map(id => parseInt(id as string));
  const selectedPermissions = formData.getAll("permissions").map(id => parseInt(id as string));

  // Récupération de l'ancien user pour le log
  const oldUser = await prisma.user.findUnique({ where: { id: targetUserId } });

  // Mise à jour Prisma
  await prisma.user.update({
    where: { id: targetUserId },
    data: {
      roleId: roleId,
      // On remplace toute la liste par la nouvelle sélection
      tags: {
        set: selectedTags.map((id) => ({ id })),
      },
      permissionsPerso: {
        set: selectedPermissions.map((id) => ({ id })),
      }
    },
  });

  // LOG
  await prisma.log.create({
    data: {
      action: "UPDATE_USER",
      details: `Admin ${admin.prenom} a modifié l'user ${oldUser?.prenom} ${oldUser?.nom}. Nouveau rôle ID: ${roleId}`,
      userId: admin.id, // ✅ admin.id est déjà un String
    },
  });

  revalidatePath(`/admin/users/${targetUserId}`);
  revalidatePath(`/admin`);
  
  return { success: true };
}