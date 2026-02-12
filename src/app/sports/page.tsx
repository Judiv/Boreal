// src/app/sports/page.tsx
import { prisma } from "@/lib/prisma";
import { getUser, checkPermission } from "@/lib/auth";
import SportCard from "./SportCard";
import SportModalWrapper from "./SportModalWrapper";
import SportEventHero from "./SportEventHero";
import SportEventModal from "./SportEventModal";
import styles from "./sports.module.css";
import AuthGuard from "@/components/AuthGuard";

export default async function SportsPage() {
  const user = await getUser();
  
  // ✅ Vérification des permissions pour l'interface
  let canManage = false;
  try {
    const permission = await checkPermission("manage_sports");
    canManage = !!permission; 
  } catch (e) {
    canManage = false;
  }

  // Récupération des données en parallèle
  const [sports, sportEvents] = await Promise.all([
    prisma.sport.findMany({
      include: {
        _count: { select: { members: true } },
        members: { where: { id: user?.id || "" } }
      },
      orderBy: { name: "asc" }
    }),
    prisma.sportEvent.findMany({
      orderBy: { createdAt: 'desc' }, // Les plus récents en premier
      take: 3
    })
  ]);

  return (
    <AuthGuard user={user}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Boreal Sports</h1>
            <p className="text-gray-400">Compétitions, entraînements et esprit d'équipe.</p>
          </div>
          
          {/* ✅ Actions d'administration en haut de page */}
          <div className="flex gap-4">
            {canManage && <SportEventModal />}
            <div style={{ width: '20px' }} />
            {canManage && <SportModalWrapper />}
          </div>
        </header>

        {/* --- SECTION COMPÉTITIONS & ÉVÉNEMENTS --- */}
        {sportEvents.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-black italic mb-6 text-white uppercase tracking-tighter">
              Événements & Compétitions
            </h2>
            <div className="flex flex-col gap-8">
              {sportEvents.map(event => (
                <SportEventHero 
                  key={event.id} 
                  event={event} 
                  canManage={canManage} // ✅ PASSAGE DU CANMANAGE ICI
                />
              ))}
            </div>
          </section>
        )}

        {/* --- SECTION CLUBS & SPORTS --- */}
        <h2 className="text-2xl font-black italic mb-6 text-white uppercase tracking-tighter">
          Nos Sports
        </h2>
        
        <div className={styles.grid}>
          {sports.map((sport) => (
            <SportCard 
              key={sport.id} 
              sport={sport} 
              canManage={canManage} // ✅ PASSAGE DU CANMANAGE ICI AUSSI
              isRegistered={sport.members.length > 0}
            />
          ))}
        </div>
      </div>
    </AuthGuard>
  );
}