"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache"; 
import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth";
import { canEditCategory, getTagMappingFromDB } from "@/lib/mappings";

// --- HELPER DE SÉCURITÉ ---
async function getAuthenticatedUser() {
  const session = await getUserSession();
  if (!session) throw new Error("Vous devez être connecté.");
  
  const canGlobalManage = session.isSuperAdmin || session.permissions.includes("manage_planning");
  if (!canGlobalManage) throw new Error("Permission refusée (Module Planning).");

  return session;
}

// --- CRÉATION ---
export async function createEvent(formData: FormData) {
  const session = await getAuthenticatedUser();

  const titre = formData.get("titre") as string;
  const description = formData.get("description") as string;
  const lieu = formData.get("lieu") as string;
  const type = (formData.get("type") as string) || "AUTRE";
  
  const dateDebut = new Date(formData.get("dateDebut") as string);
  const dateFinStr = formData.get("dateFin") as string; // ✅ Correction ici : définie avant usage
  const dateFin = dateFinStr ? new Date(dateFinStr) : dateDebut;

  const mapping = await getTagMappingFromDB();
  const canCreateThisType = session.isSuperAdmin || canEditCategory(session.allTags, type, mapping);
  console.log("createEvent", { type, canCreateThisType, userTags: session.allTags, mapping });
  if (!canCreateThisType) throw new Error(`Droit insuffisant pour le type ${type}.`);

  await prisma.$transaction(async (tx) => {
    // 1. Création dans le Planning
    await tx.planningEvent.create({
      data: {
        titre,
        description,
        lieu,
        dateDebut,
        dateFin,
        gestionnaireId: session.user.id,
        type, 
      },
    });
  });

  revalidatePath("/");
  revalidatePath("/sports");
  redirect("/"); 
}

// --- MISE À JOUR SYNCHRONISÉE ---
export async function updateEvent(formData: FormData) {
  const session = await getAuthenticatedUser();
  const id = parseInt(formData.get("id") as string);
  
  const existingEvent = await prisma.planningEvent.findUnique({ where: { id } });
  if (!existingEvent) throw new Error("Événement introuvable.");

  const mapping = await getTagMappingFromDB();
  const matchesType = canEditCategory(session.allTags, existingEvent.type || "", mapping);
  const isAuthor = existingEvent.gestionnaireId === session.user.id;
  if (!session.isSuperAdmin && !matchesType && !isAuthor) throw new Error("Accès refusé.");

  const titre = formData.get("titre") as string;
  const description = formData.get("description") as string;
  const lieu = formData.get("lieu") as string;
  const type = (formData.get("type") as string) || "AUTRE";
  const dateDebut = new Date(formData.get("dateDebut") as string);
  const dateFinStr = formData.get("dateFin") as string; // ✅ Correction ici : définie avant usage
  const dateFin = dateFinStr ? new Date(dateFinStr) : dateDebut;

  await prisma.$transaction(async (tx) => {
    // 1. Mise à jour Planning
    await tx.planningEvent.update({
      where: { id },
      data: { titre, description, lieu, dateDebut, dateFin, type },
    });
  });

  revalidatePath("/");
  revalidatePath("/sports");
  revalidatePath("/fete");
  redirect("/");
}

// --- SUPPRESSION SYNCHRONISÉE ---
export async function deleteEvent(id: number) {
  const session = await getAuthenticatedUser();
  const existingEvent = await prisma.planningEvent.findUnique({ where: { id } });
  if (!existingEvent) throw new Error("Événement introuvable.");

  const mapping = await getTagMappingFromDB();
  const matchesType = canEditCategory(session.allTags, existingEvent.type || "", mapping);
  const isAuthor = existingEvent.gestionnaireId === session.user.id;
  if (!session.isSuperAdmin && !matchesType && !isAuthor) throw new Error("Accès refusé.");

  await prisma.$transaction(async (tx) => {
    // 1. Delete Planning
    await tx.planningEvent.delete({ where: { id } });
  });
  
  revalidatePath("/");
  revalidatePath("/sports");
  revalidatePath("/fete"); 
}