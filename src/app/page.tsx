import { redirect } from "next/navigation";
import { startOfWeek, isAfter } from "date-fns"; 
import { GetCalendar } from "@/actions/getCalendar"; 
import Link from "next/link";
import WeeklyPlanning from "@/components/WeeklyPlanning"; 
import logger from "@/lib/logger";
import { 
  Store, Newspaper, Images, GraduationCap, 
  PartyPopper, Compass, Dumbbell, HelpingHand, 
  ArrowRight, Command, Clock, 
  MessageSquare, Folder, MapPin, ChevronRight
} from "lucide-react"; 
import styles from "./home.module.css";
import { prisma } from "@/lib/prisma";
import { fromZonedTime } from "date-fns-tz";
import { getUserSession, getUserTags } from "@/lib/auth";
import { getTagMappingFromDB } from "@/lib/mappings";

export default async function HomePage() {
  const session = await getUserSession();
  if (!session) {
    logger.warn("Accès HomePage refusé : Non connecté");
    redirect("/login");
  }

  const { isSuperAdmin, permissions, user: sessionUser } = session;
  const currentUserId = sessionUser.id;
  const tags = await getUserTags(currentUserId);
  console.log("Tags récupérés sur le serveur:", tags);
  const mapping = await getTagMappingFromDB();
  const canGlobalManage = {isSuperAdmin, canManage: permissions.includes("manage_planning")};

  const today = new Date();
  
  const [myEvents, ensamEvents, latestNews, folders, userSports] = await Promise.all([
    prisma.planningEvent.findMany({ include: { gestionnaire: true } }),
    GetCalendar(session.user.liseId),
    prisma.news.findMany({ take: 3, orderBy: { createdAt: 'desc' } }),
    prisma.galleryFolder.findMany({ 
      take: 3, 
      orderBy: { createdAt: 'desc' },
      include: { photos: { take: 1 } } 
    }),
    prisma.sport.findMany({
      where: { members: { some: { id: currentUserId } } },
      select: { name: true }
    })
  ]);

  const joinedSportNames = userSports.map(s => s.name);

  const fixPrismaDate = (date: Date) => {
    const iso = date.toISOString();
    return fromZonedTime(iso.replace('Z', ''), "Europe/Paris");
  };

  const formattedMyEvents = myEvents
    .filter((e) => {
      if (e.type === "SPORT") {
        if (e.titre.startsWith("[EVENT]")) return true; 
        if (e.titre.startsWith("[SPORT]")) {
          const sportNameInTitle = e.titre.replace("[SPORT] ", "").trim();
          return joinedSportNames.includes(sportNameInTitle);
        }
      }
      return true;
    })
    .map((e) => ({
      ...e,
      title: e.titre,
      dateDebut: fixPrismaDate(e.dateDebut),
      dateFin: fixPrismaDate(e.dateFin),
    }));

  const allEvents = [...(ensamEvents || []), ...formattedMyEvents];

  const nextEvent = allEvents
    .filter(e => isAfter(new Date(e.dateDebut), today))
    .sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime())[0];

  return (
    <main className={styles.mainContainer}>
      {/* Halos de couleurs pour plus de peps */}
      <div className={styles.auroraBlue} />
      <div className={styles.auroraPurple} />
      <div className={styles.grain} />

      <div className={styles.floatingActionsLeft}>
        <Link href="/mail" className={styles.fab}>
          <MessageSquare size={20} />
          <span>Besoin d'aide</span>
        </Link>
      </div>

      <div className={styles.contentWrapper}>
        
        {/* --- HERO --- */}
        <header className={styles.heroSection}>
          <div className={styles.topBar}>
            <div className={styles.brandTag}>
              <Command size={14} /> <span>Boreal OS / v2.0</span>
            </div>
            <div className={styles.sessionMeta}>
              <div className={styles.pulse} />
              <p>{session.user.prenom} {session.user.nom}</p>
            </div>
          </div>

          <div className={styles.heroGrid}>
            <div className={styles.heroText}>
              <h1 className={styles.mainTitle}>
                Bonjour <br />
                <span className={styles.accentText}>{session.user.prenom}</span>
              </h1>
              <div className={styles.heroDetails}>
                <p className={styles.dateDisplay}>
                  {today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <div className={styles.vLine} />
                <p className={styles.location}>Sibers • Arts et Métiers</p>
              </div>
            </div>

            <div className={styles.focusWidget}>
              <div className={styles.focusHeader}>
                <Clock size={16} /> <span>Focus Immédiat</span>
              </div>
              <div className={styles.focusBody}>
                {nextEvent ? (
                  <>
                    <h3>{nextEvent.titre || nextEvent.titre}</h3>
                    <div className={styles.focusInfo}>
                      <MapPin size={14} />
                      <p>{nextEvent.lieu || "Lieu à venir"}</p>
                    </div>
                    <div className={styles.focusTime}>
                       {new Date(nextEvent.dateDebut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </>
                ) : (
                  <h3>Journée libre</h3>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* --- 01. PLANNING --- */}
        <section className={styles.section}>
          <div className={styles.modernHeader}>
            <div className={styles.headerLeft}>
              <span className={styles.sectionNumber}>01</span>
              <div className={styles.titleStack}>
                <h2 className={styles.sectionTitle}>Planning</h2>
                <h2 className={`${styles.sectionTitle} ${styles.blue}`}>Hebdomadaire</h2>
              </div>
            </div>
          </div>
          <div className={styles.planningCard}>
            <WeeklyPlanning events={allEvents} canEdit={canGlobalManage} tags={tags} mapping={mapping} />
          </div>
        </section>

        {/* --- 02. GALERIE --- */}
        <section className={styles.section}>
          <div className={styles.modernHeader}>
            <div className={styles.headerLeft}>
              <span className={styles.sectionNumber}>02</span>
              <div className={styles.titleStack}>
                <h2 className={styles.sectionTitle}>Derniers</h2>
                <h2 className={`${styles.sectionTitle} ${styles.blue}`}>Albums</h2>
              </div>
            </div>
            <Link href="/galerie" className={styles.archiveLink}>Voir la galerie <ChevronRight size={16}/></Link>
          </div>
          <div className={styles.folderGrid}>
            {folders.map((folder) => (
              <Link href={`/galerie/${folder.id}`} key={folder.id} className={styles.folderCard}>
                <div className={styles.folderImageWrapper}>
                  {folder.photos[0] ? (
                    <img src={folder.photos[0].url} alt={folder.nom} className={styles.folderImg} />
                  ) : (
                    <div className={styles.folderPlaceholder}><Images size={40} /></div>
                  )}
                  <div className={styles.folderOverlay}><Folder size={20} /><span>Explorer</span></div>
                </div>
                <div className={styles.folderInfo}>
                  <h3>{folder.nom}</h3>
                  <p>{new Date(folder.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* --- 03. ACTUALITÉS & SERVICES --- */}
        <div className={styles.bottomLayout}>
          <section className={styles.newsColumn}>
            <div className={styles.modernHeader}>
              <div className={styles.headerLeft}>
                <span className={styles.sectionNumber}>03</span>
                <div className={styles.titleStack}>
                   <h2 className={styles.sectionTitle}>Flux</h2>
                   <h2 className={`${styles.sectionTitle} ${styles.blue}`}>Actualités</h2>
                </div>
              </div>
              <Link href="/news" className={styles.archiveLink}>Archives <ArrowRight size={16} /></Link>
            </div>
            <div className={styles.newsStack}>
              {latestNews.map((news) => (
                <Link href={`/news/${news.id}`} key={news.id} className={styles.newsRow}>
                  <div className={styles.newsHeadline}>
                    <span className={styles.newsCat}>{news.categorie}</span>
                    <h3>{news.titre}</h3>
                  </div>
                  <p className={styles.newsDate}>{new Date(news.createdAt).toLocaleDateString()}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className={styles.servicesColumn}>
             <div className={styles.modernHeader}>
              <div className={styles.headerLeft}>
                <span className={styles.sectionNumber}>04</span>
                <div className={styles.titleStack}>
                  <h2 className={styles.sectionTitle}>Espace</h2>
                  <h2 className={`${styles.sectionTitle} ${styles.blue}`}>Communauté</h2>
                </div>
              </div>
            </div>
            <div className={styles.serviceGrid}>
              <Link href="/entraide" className={styles.premiumBtn}>
                <span>Entraide</span>
                <HelpingHand size={20} />
              </Link>
              <Link href="/boquettes" className={styles.premiumBtn}>
                <span>Boquettes</span>
                <Store size={20} />
              </Link>
            </div>
          </section>
        </div>

        <footer className={styles.footer}>
          <p>BORÉAL DIGITAL PLATFORM — DESIGNED FOR EXCELLENCE</p>
        </footer>
      </div>
    </main>
  );
}