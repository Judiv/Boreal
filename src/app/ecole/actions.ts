"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { hasPermission } from "@/lib/auth";

export async function addThuysse(formData: FormData) {
  // Vérification de la permission spécifique
  if (!(await hasPermission("manage_ecole"))) throw new Error("Non autorisé");

  const nom = formData.get("nom") as string;
  const url = formData.get("url") as string;
  const description = formData.get("description") as string;

  await prisma.thuysse.create({
    data: { nom, url, description }
  });

  revalidatePath("/ecole");
}

export async function deleteThuysse(id: number) {
  if (!(await hasPermission("manage_ecole"))) throw new Error("Non autorisé");
  
  await prisma.thuysse.delete({ where: { id } });
  
  revalidatePath("/ecole");
}