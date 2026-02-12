"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getUserSession } from "@/lib/auth";

// --- HELPER NOTIFICATION ---
// ✅ FIX : userId est maintenant une String (CUID)
async function sendGadzNotification(userId: string, title: string, message: string) {
  await prisma.notification.create({
    data: {
      userId: userId, // Match avec User.id (String)
      title: title,
      message: message,
      type: "ENTRAIDE",
      isRead: false,
    }
  });
}

// --- ACTIONS OBJETS ---
export async function addLoanObject(formData: FormData) {
  const session = await getUserSession();
  if (!session) throw new Error("Non connecté");

  const quantite = parseInt(formData.get("quantite") as string);
  
  await prisma.loanObject.create({
    data: {
      nom: formData.get("nom") as string,
      description: formData.get("description") as string,
      lieu: formData.get("lieu") as string,
      quantite: quantite,
      disponible: quantite,
      // ✅ Session.user.id est déjà une string
      ownerId: session.user.id, 
      ownerName: session.user.prenom || "Gadz",
    }
  });
  revalidatePath("/entraide");
}

export async function requestLoan(objectId: number) {
  const session = await getUserSession();
  if (!session) return;

  const obj = await prisma.loanObject.findUnique({ where: { id: objectId } });
  if (!obj) return;

  // ✅ FIX : On n'utilise plus parseInt car ownerId est une String
  await sendGadzNotification(
    obj.ownerId, 
    "Demande de prêt",
    `📢 ${session.user.prenom} souhaite t'emprunter : ${obj.nom}.`
  );
  
  revalidatePath("/entraide");
}

export async function toggleLoan(id: number, increment: boolean) {
  const session = await getUserSession();
  const obj = await prisma.loanObject.findUnique({ where: { id } });
  if (!obj || !session) return;

  // ✅ Comparaison directe entre Strings
  if (session.user.id !== obj.ownerId) throw new Error("Accès refusé");

  const newVal = increment 
    ? Math.min(obj.disponible + 1, obj.quantite)
    : Math.max(obj.disponible - 1, 0);

  await prisma.loanObject.update({
    where: { id },
    data: { disponible: newVal }
  });
  revalidatePath("/entraide");
}

// --- COVOITURAGE ---
export async function registerRide(rideId: number) {
  const session = await getUserSession();
  if (!session) return;

  const userId = session.user.id; // Déjà String

  const existingRegistration = await prisma.rideRegistration.findUnique({
    where: {
      rideId_passengerId: {
        rideId: rideId,
        passengerId: userId,
      },
    },
  });

  if (existingRegistration) return;

  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: { registrations: true },
  });

  if (!ride || ride.registrations.length >= ride.places) return;

  await prisma.rideRegistration.create({
    data: {
      rideId: rideId,
      passengerId: userId,
      passengerName: session.user.prenom || "Gadz",
    },
  });

  // ✅ FIX : Pas de parseInt
  await sendGadzNotification(
    ride.conducteurId,
    "Nouveau passager",
    `🚗 ${session.user.prenom} s'est inscrit pour ton trajet vers ${ride.destination}.`
  );

  revalidatePath("/entraide");
}

export async function unregisterRide(rideId: number) {
  const session = await getUserSession();
  if (!session) return;

  const userId = session.user.id;

  await prisma.rideRegistration.deleteMany({
    where: {
      rideId: rideId,
      passengerId: userId
    }
  });

  const ride = await prisma.ride.findUnique({ where: { id: rideId } });
  if (!ride) return;

  // ✅ FIX : Pas de parseInt pour userId
  await prisma.notification.deleteMany({
    where: {
      userId: ride.conducteurId,
      title: "Nouveau passager",
      message: { contains: session.user.prenom || "Gadz" }
    }
  });

  await sendGadzNotification(
    ride.conducteurId, 
    "Mise à jour trajet", 
    `Un passager s'est désinscrit de votre trajet vers ${ride.destination}.`
  );

  revalidatePath("/entraide");
}

export async function updateLoanObject(id: number, formData: FormData) {
  const session = await getUserSession();
  const obj = await prisma.loanObject.findUnique({ where: { id } });
  if (!obj || String(session.user.id) !== obj.ownerId) return;

  const newQuantite = parseInt(formData.get("quantite") as string);

  await prisma.loanObject.update({
    where: { id },
    data: {
      nom: formData.get("nom") as string,
      description: formData.get("description") as string,
      lieu: formData.get("lieu") as string,
      quantite: newQuantite,
      disponible: Math.min(obj.disponible, newQuantite)
    }
  });
  revalidatePath("/entraide");
}

export async function deleteObject(id: number) {
  const session = await getUserSession();
  const obj = await prisma.loanObject.findUnique({ where: { id } });
  if (obj && String(session.user.id) === obj.ownerId) {
    await prisma.loanObject.delete({ where: { id } });
  }
  revalidatePath("/entraide");
}

// --- COVOITURAGE ---
export async function addRide(formData: FormData) {
  const session = await getUserSession();
  if (!session) throw new Error("Non connecté");

  await prisma.ride.create({
    data: {
      depart: formData.get("depart") as string,
      destination: formData.get("destination") as string,
      dateHeure: new Date(formData.get("dateHeure") as string),
      places: parseInt(formData.get("places") as string),
      conducteurId: String(session.user.id),
      conducteurName: session.user.prenom || "Gadz",
    }
  });
  revalidatePath("/entraide");
}



export async function updateRide(id: number, formData: FormData) {
  const session = await getUserSession();
  const ride = await prisma.ride.findUnique({ where: { id } });
  if (!ride || String(session.user.id) !== ride.conducteurId) return;

  await prisma.ride.update({
    where: { id },
    data: {
      depart: formData.get("depart") as string,
      destination: formData.get("destination") as string,
      dateHeure: new Date(formData.get("dateHeure") as string),
      places: parseInt(formData.get("places") as string),
    }
  });
  revalidatePath("/entraide");
}

export async function deleteRide(id: number) {
  const session = await getUserSession();
  const ride = await prisma.ride.findUnique({ where: { id } });
  if (ride && String(session.user.id) === ride.conducteurId) {
    await prisma.ride.delete({ where: { id } });
  }
  revalidatePath("/entraide");
}