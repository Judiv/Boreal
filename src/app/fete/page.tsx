import { prisma } from "@/lib/prisma";
import { getUserSession, hasPermission, getUser } from "@/lib/auth";
import FeteClient from "./FeteClient";
import AuthGuard from "@/components/AuthGuard";

// Force la page à se rafraîchir à chaque visite (évite le cache Docker)
export const revalidate = 0;

export default async function FetePage() {
  const user = await getUser().catch(() => null);
  const canManage = await hasPermission("manage_events");
  const today = new Date();


  // 1. Récupérer les news liées aux soirées
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

  // 2. Récupérer les événements à venir (aujourd'hui inclus)
  const upcomingEvents = await prisma.event.findMany({
    where: {
      date: {
        gte: today
      }
    },
    orderBy: { date: 'asc' }
  });

  // 3. Récupérer les événements passés (Archives)
  const pastEvents = await prisma.event.findMany({
    where: {
      dateFin: {
        lte: today
      }
    },
    orderBy: { date: 'desc' }
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