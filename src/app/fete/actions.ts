"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getUserSession } from "@/lib/auth";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

// --- HELPER DE FIX TEMPOREL ---
function parseDateTimeLocal(value: string): Date {
  const d = new Date(value);
  const userOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - userOffset);
}

// --- HELPER DE SÉCURITÉ ---
async function checkManagePermission() {
  const session = await getUserSession();
  if (!session) throw new Error("Vous devez être connecté.");

  const canManage = session.isSuperAdmin || session.permissions.includes("manage_fete");
  if (!canManage) throw new Error("Permission refusée (manage_fete).");

  return session;
}

/**
 * Récupère les actualités liées aux Déjantés
 */
export async function getDejantesNews() {
  return await prisma.news.findMany({
    where: {
      OR: [
        { titre: { contains: "Déjantés", mode: 'insensitive' } },
        { titre: { contains: "Soirée", mode: 'insensitive' } },
        { titre: { contains: "Fête", mode: 'insensitive' } },
        { contenu: { contains: "Déjantés", mode: 'insensitive' } },
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
}

/**
 * Récupère les événements pour la page Fête
 */
export async function getEvents() {
  const now = new Date();
  const upcoming = await prisma.event.findMany({
    where: { date: { gte: now } },
    orderBy: { date: 'asc' },
  });
  const past = await prisma.event.findMany({
    where: { date: { lt: now } },
    orderBy: { date: 'desc' },
    take: 6,
  });
  return { upcoming, past };
}

/**
 * AJOUTER : Crée dans 'Event' ET 'PlanningEvent' sans doublons
 */
export async function addEvent(formData: FormData) {
  const session = await checkManagePermission();

  const titre = formData.get("titre") as string;
  const dateStr = formData.get("date") as string;
  const dateFinStr = formData.get("dateFin") as string;
  
  const dateDebut = parseDateTimeLocal(dateStr);
  const dateFin = dateFinStr ? parseDateTimeLocal(dateFinStr) : dateDebut;

  const lieu = formData.get("lieu") as string;
  const description = formData.get("description") as string;
  const file = formData.get("image") as File;

  let imageUrl = null;
  if (file && file.size > 0) {
    const uploadDir = path.join(process.cwd(), "public", "uploads/events");
    await mkdir(uploadDir, { recursive: true });
    const fileName = `${Date.now()}-${file.name.replaceAll(" ", "_")}`;
    await writeFile(path.join(uploadDir, fileName), Buffer.from(await file.arrayBuffer()));
    
    // ✅ FIX : On enregistre l'URL de l'API pour que Docker puisse la lire
    imageUrl = `/api/uploads/${fileName}`;
  }

  await prisma.$transaction(async (tx) => {
    await tx.event.create({
      data: { 
        titre, date: dateDebut, dateFin, lieu, description, imageUrl,
        lienBilletterie: formData.get("lienBilletterie") as string,
        playlistUrl: formData.get("playlistUrl") as string,
      }
    });

    await tx.planningEvent.create({
      data: {
        titre: `[FÊTE] ${titre}`,
        description, lieu, dateDebut, dateFin,
        type: "FETE",
        gestionnaireId: session.user.id,
        autoreserv: true
      }
    });
  });

  revalidatePath("/fete");
  revalidatePath("/"); 
}

/**
 * SUPPRIMER : Supprime des deux tables proprement
 */
export async function deleteEvent(id: number) {
  await checkManagePermission();
  
  const event = await prisma.event.findUnique({ where: { id } });
  
  if (!event) throw new Error("Événement introuvable");

  if (event.imageUrl) {
    try { 
      // On récupère le nom du fichier depuis l'URL de l'API pour supprimer le fichier physique
      const filename = event.imageUrl.split('/').pop();
      await unlink(path.join(process.cwd(), "public", "uploads/events", filename!)); 
    } catch (e) {
      console.error("Erreur suppression fichier:", e);
    }
  }

  await prisma.$transaction([
    prisma.event.delete({ where: { id } }),
    prisma.planningEvent.deleteMany({ 
      where: { 
        titre: `[FÊTE] ${event.titre}`,
        dateDebut: event.date
      } 
    })
  ]);

  revalidatePath("/fete");
  revalidatePath("/"); 
}

/**
 * MODIFIER : Met à jour les deux tables
 */
export async function updateEvent(id: number, formData: FormData) {
  const session = await checkManagePermission();

  const titre = formData.get("titre") as string;
  const dateStr = formData.get("date") as string;
  const dateFinStr = formData.get("dateFin") as string;

  const dateDebut = parseDateTimeLocal(dateStr);
  const dateFin = dateFinStr ? parseDateTimeLocal(dateFinStr) : dateDebut;

  const lieu = formData.get("lieu") as string;
  const description = formData.get("description") as string;
  const file = formData.get("image") as File;

  const currentEvent = await prisma.event.findUnique({ where: { id } });
  if (!currentEvent) throw new Error("Événement introuvable");

  let imageUrl = currentEvent.imageUrl;
  if (file && file.size > 0) {
    if (currentEvent.imageUrl) {
      try { 
        const oldFilename = currentEvent.imageUrl.split('/').pop();
        await unlink(path.join(process.cwd(), "public", "uploads/events", oldFilename!)); 
      } catch (e) {}
    }
    const uploadDir = path.join(process.cwd(), "public", "uploads/events");
    await mkdir(uploadDir, { recursive: true });
    const fileName = `${Date.now()}-${file.name.replaceAll(" ", "_")}`;
    await writeFile(path.join(uploadDir, fileName), Buffer.from(await file.arrayBuffer()));
    
    // ✅ FIX : On enregistre l'URL de l'API
    imageUrl = `/api/uploads/${fileName}`;
  }

  await prisma.$transaction([
    prisma.event.update({
      where: { id },
      data: { titre, date: dateDebut, dateFin, lieu, description, imageUrl, 
              lienBilletterie: formData.get("lienBilletterie") as string, 
              playlistUrl: formData.get("playlistUrl") as string }
    }),
    prisma.planningEvent.updateMany({
      where: { 
        titre: `[FÊTE] ${currentEvent.titre}`,
        dateDebut: currentEvent.date 
      },
      data: {
        titre: `[FÊTE] ${titre}`,
        description, lieu, dateDebut, dateFin,
        type: "FETE"
      }
    })
  ]);

  revalidatePath("/fete");
  revalidatePath("/"); 
}

export async function clearPastEvents() {
  await checkManagePermission();
  
  const now = new Date();
  const threshold = new Date(now.getTime() + 2 * 60 * 60 * 1000); 

  const eventsToDelete = await prisma.event.findMany({
    where: {
      OR: [
        { dateFin: { lt: threshold } },
        { 
          AND: [
            { dateFin: null },
            { date: { lt: threshold } } 
          ]
        }
      ]
    }
  });

  if (eventsToDelete.length === 0) return { success: true, count: 0 };

  for (const event of eventsToDelete) {
    if (event.imageUrl) {
      try {
        const filename = event.imageUrl.split('/').pop();
        const filePath = path.join(process.cwd(), "public", "uploads/events", filename!);
        await unlink(filePath);
      } catch (e) { console.log("Fichier non trouvé, skip."); }
    }

    await prisma.$transaction([
      prisma.event.delete({ where: { id: event.id } }),
      prisma.planningEvent.deleteMany({ 
        where: { 
          dateDebut: event.date,
          titre: { contains: event.titre }
        } 
      })
    ]);
  }

  revalidatePath("/fete");
  return { success: true, count: eventsToDelete.length };
}