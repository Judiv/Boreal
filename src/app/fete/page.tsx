import { prisma } from "@/lib/prisma";
import { getUserSession, hasPermission, getUser } from "@/lib/auth";
import FeteClient from "./FeteClient";
import AuthGuard from "@/components/AuthGuard";

export default async function FetePage() {
  const user = await getUser().catch(() => null);
  const session = await getUserSession();
  const canManage = await hasPermission("manage_events");

  // 1. Récupérer les news liées aux soirées
  // Correction : On utilise "categorie" ou on filtre sur le titre si les tags n'existent pas
  const dejantesNews = await prisma.news.findMany({
    where: {
      OR: [
        { categorie: { in: ["Déjantés", "Soirée", "Event"] } },
        { titre: { contains: "Soirée", mode: 'insensitive' } }
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: 3
  });

  // 2. Récupérer les événements à venir
  const upcomingEvents = await prisma.event.findMany({
    where: {
      date: {
        gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    },
    orderBy: { date: 'asc' }
  });

  // 3. Récupérer les événements passés (Archives)
  const pastEvents = await prisma.event.findMany({
    where: {
      date: {
        lt: new Date(new Date().setHours(0, 0, 0, 0))
      }
    },
    orderBy: { date: 'desc' },
    take: 10
  });

  return (
    <AuthGuard user={user}>
      <FeteClient 
        dejantesNews={dejantesNews}
        upcomingEvents={upcomingEvents}
        pastEvents={pastEvents}
        canManage={canManage}
      />
    </AuthGuard>
  );
}