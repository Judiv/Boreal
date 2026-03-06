// src/app/admin/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getUserSession } from "@/lib/auth";
import { runGlobalBotMaintenance } from "@/lib/cleanup-bot";

// --- SÉCURITÉ ---
async function checkAdminAccess() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  if (!userId) redirect("/login");
  
  const user = await prisma.user.findUnique({ 
    where: { id: userId }, 
    include: { role: true } 
  });
  
  if (user?.role?.nom !== "SUPER_ADMIN") redirect("/");
  return user;
}

// --- DATA FETCHING ---
export async function getAdminDashboardData(search?: string) {
  await checkAdminAccess();

  const logs = await prisma.log.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { prenom: true, nom: true } } },
  });

  const whereCondition = search ? {
    OR: [
      { nom: { contains: search, mode: 'insensitive' as const } },
      { prenom: { contains: search, mode: 'insensitive' as const } },
      { emailEnsam: { contains: search, mode: 'insensitive' as const } },
    ]
  } : {};

  const users = await prisma.user.findMany({
    where: whereCondition,
    include: { role: true, tags: true },
    orderBy: { nom: "asc" },
  });

  const stats = {
    totalUsers: await prisma.user.count(),
    totalEvents: await prisma.planningEvent.count(),
    totalLogs: await prisma.log.count(),
  };

  const allTags = await prisma.tag.findMany({ orderBy: { nom: 'asc' } });
  const categories = await prisma.category.findMany({ orderBy: { label: 'asc' } });
  const categoryMappings = await prisma.categoryMapping.findMany({ orderBy: { category: 'asc' } });

  return { logs, users, stats, allTags, categories, categoryMappings };
}

// --- ACTIONS LOGS ---

/**
 * Vide tous les logs de la base de données
 * Laisse une trace de l'action de suppression
 */
export async function clearLogs() {
  const admin = await checkAdminAccess();

  try {
    // On vide la table
    await prisma.log.deleteMany({});

    // On crée un log de "re-initialisation" pour savoir qui a vidé le terminal
    await prisma.log.create({
      data: {
        action: "CLEAR_LOGS",
        details: `Historique des logs vidé par ${admin.prenom} ${admin.nom}`,
        userId: admin.id
      }
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (e) {
    console.error("Erreur lors du vidage des logs", e);
    return { success: false, error: "Erreur technique lors de la suppression" };
  }
}

// --- ACTIONS TAGS ---
export async function createTag(formData: FormData) {
  const admin = await checkAdminAccess();
  const nom = formData.get("nom") as string;
  
  if (!nom) return;

  try {
    await prisma.tag.create({ data: { nom } });
    await prisma.log.create({
      data: { 
        action: "CREATE_TAG", 
        details: `Tag "${nom}" créé par ${admin.prenom}`, 
        userId: admin.id 
      }
    });
    revalidatePath("/admin");
  } catch (e) {
    console.error("Erreur création tag", e);
  }
}

export async function deleteTag(id: number) {
  const admin = await checkAdminAccess();

  try {
    const tagToDelete = await prisma.tag.findUnique({ where: { id } });
    if (!tagToDelete) return;

    await prisma.$transaction([
      prisma.categoryMapping.deleteMany({ where: { tag: tagToDelete.nom } }),
      prisma.tag.delete({ where: { id } })
    ]);

    await prisma.log.create({
      data: { 
        action: "DELETE_TAG", 
        details: `Tag #${tagToDelete.nom} et ses mappings supprimés par ${admin.prenom}`, 
        userId: admin.id 
      }
    });

    revalidatePath("/admin");
  } catch (e) {
    console.error("Erreur suppression tag & mapping", e);
  }
}

// --- ACTIONS CATÉGORIES ---

export async function getAuthorizedCategories() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  if (!userId) return [];

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { tags: true, role: true }
  });

  if (!user) return [];

  if (user.role?.nom === "SUPER_ADMIN") {
    return await prisma.category.findMany({ orderBy: { label: 'asc' } });
  }

  const mappings = await prisma.categoryMapping.findMany();
  const userTagNames = user.tags.map(t => t.nom);
  
  const authorizedCodes = mappings
    .filter(m => userTagNames.includes(m.tag))
    .map(m => m.category);

  return await prisma.category.findMany({
    where: { code: { in: authorizedCodes } },
    orderBy: { label: 'asc' }
  });
}

export async function createCategory(formData: FormData) {
  const admin = await checkAdminAccess();
  const code = (formData.get("code") as string).toUpperCase();
  const label = formData.get("label") as string;

  try {
    await prisma.category.create({ data: { code, label } });
    await prisma.log.create({
      data: { action: "CREATE_CATEGORY", details: `Catégorie ${code} créée`, userId: admin.id }
    });
    revalidatePath("/admin");
  } catch (e) { console.error(e); }
}

export async function deleteCategory(id: number) {
  const admin = await checkAdminAccess();
  try {
    const categoryToDelete = await prisma.category.findUnique({ where: { id } });
    if (!categoryToDelete) return;

    await prisma.$transaction([
      prisma.categoryMapping.deleteMany({ where: { category: categoryToDelete.code } }),
      prisma.category.delete({ where: { id } })
    ]);

    await prisma.log.create({
      data: { 
        action: "DELETE_CATEGORY", 
        details: `Catégorie ${categoryToDelete.code} et son mapping total supprimés par ${admin.prenom}`, 
        userId: admin.id 
      }
    });

    revalidatePath("/admin");
  } catch (e) { console.error(e); }
}

// --- MAPPINGS ---

export async function addCategoryMapping(category: string, tag: string) {
  const admin = await checkAdminAccess();
  try {
    await prisma.categoryMapping.create({ data: { category, tag } });
    await prisma.log.create({
      data: { action: "CREATE_MAPPING", details: `Accès "${category}" lié au tag "${tag}"`, userId: admin.id }
    });
    revalidatePath("/admin");
  } catch (e) { console.error(e); }
}

export async function deleteCategoryMapping(id: number) {
  const admin = await checkAdminAccess();
  try {
    await prisma.categoryMapping.delete({ where: { id } });
    await prisma.log.create({
      data: { action: "DELETE_MAPPING", details: `Mapping supprimé`, userId: admin.id }
    });
    revalidatePath("/admin");
  } catch (e) { console.error(e); }
}

// --- AUTRES ---

export async function getPublishingTags() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  if (!userId) return [];

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { tags: true, role: true }
  });

  if (!user) return [];
  if (user.role?.nom === "SUPER_ADMIN") {
    return await prisma.tag.findMany({ orderBy: { nom: 'asc' } });
  }
  return user.tags;
}

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

export async function runStorageCleanup() {
  const session = await getUserSession();
  
  if (!session || Number(session.user.roleId) !== 2) {
    return { success: false, error: "Droit administrateur requis" };
  }

  try {
    const results = await runGlobalBotMaintenance();
    
    // Le type "layout" indique à Next.js de rafraîchir la racine et tous ses enfants
    revalidatePath("/", "layout");

    return { 
      success: true, 
      message: "Maintenance globale effectuée et cache purgé.",
      results 
    };
  } catch (err) {
    console.error("Erreur Action Bot:", err);
    return { success: false, error: "Échec de la maintenance." };
  }
}