// src/app/planning/edit/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import styles from "../../form.module.css";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import EditEventForm from "./EditEventForm";
import { getAuthorizedCategories } from "@/app/admin/actions"; // ✅ Import de l'action dynamique

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const eventId = parseInt(id);

  // 1. Auth & Récupération User
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { tags: true, role: true }
  });
  if (!user) redirect("/login");

  // 2. Récupération Event
  const event = await prisma.planningEvent.findUnique({ where: { id: eventId } });
  if (!event) notFound();

  // 3. Récupération dynamique des catégories autorisées
  const authorizedCats = await getAuthorizedCategories();
  
  let options = authorizedCats.map(c => ({
    id: c.code,
    label: c.label
  }));

  // ✅ SÉCURITÉ : Gérer la catégorie actuelle si elle n'est plus autorisée
  if (event.type && !options.some(opt => opt.id === event.type)) {
    const currentCatDoc = await prisma.category.findUnique({ 
      where: { code: event.type } 
    });
    
    options.unshift({
      id: event.type,
      label: `${currentCatDoc?.label || event.type} (Actuel - Restreint)`
    });
  }

  const userRole = user.role?.nom || "USER";

  return (
    <div className={styles.container}>
      <div className={styles.auroraBlob} />
      {/* ✅ On passe les catégories formatées au client */}
      <EditEventForm 
        event={event} 
        userRole={userRole} 
        categories={options} 
      />
    </div>
  );
}