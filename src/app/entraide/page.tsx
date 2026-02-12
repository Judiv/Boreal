import { prisma } from "@/lib/prisma";
import { getUserSession, getUser } from "@/lib/auth";
import EntraideClient from "./EntraideClient";
import AuthGuard from "@/components/AuthGuard";

export const dynamic = 'force-dynamic';

export default async function EntraidePage() {
  const user = await getUser().catch(() => null);
  const session = await getUserSession();
  
  // On récupère tout pour le filtrage côté client (plus fluide pour la recherche)
  const objects = await prisma.loanObject.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const rides = await prisma.ride.findMany({
    orderBy: { dateHeure: 'asc' },
    include: {
        registrations: true
    },
    where: {
        dateHeure: { gte: new Date() }
    }
    });

  return (
    <AuthGuard user={user}>
      <EntraideClient 
        objects={objects} 
        rides={rides} 
        currentUserId={session?.user?.id} 
      />
    </AuthGuard>
  );
}