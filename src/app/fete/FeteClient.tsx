"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  PartyPopper, Wallet, ExternalLink, CalendarDays, Music, 
  Ticket, Plus, Timer, MapPin, ChevronRight, 
  Trash2, Pencil, X, Clock, RefreshCw, AlertCircle
} from "lucide-react";
import styles from "./fete.module.css";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import AddEventModal from "./AddEventModal";
import EditEventModal from "./EditEventModal";
import { deleteEvent, clearPastEvents } from "./actions";

// ✅ Fonction utilitaire pour rediriger vers l'API Uploads
const getSafeUrl = (url: string | null) => {
  if (!url) return null;
  if (url.startsWith("/api/uploads/") || url.startsWith("http")) return url;
  const filename = url.split("/").pop();
  return `/api/uploads/${filename}`;
};

// --- COMPOSANT MODAL DE DÉTAIL ---
const ViewEventModal = ({ event, onClose, formatLocaleTime }: any) => {
  if (!event) return null;
  const imageUrl = getSafeUrl(event.imageUrl);

  return (
    <div className={styles.detailOverlay} onClick={onClose}>
      <div className={styles.detailCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.detailHero}>
          {imageUrl ? (
            <img src={imageUrl} alt="" className={styles.detailHeroImg} />
          ) : (
            <div className={styles.detailHeroPlaceholder} />
          )}
          <div className={styles.detailHeroGradient} />
          <button onClick={onClose} className={styles.detailCloseBtn}><X size={24} /></button>
          <div className={styles.detailHeroContent}>
            <div className={styles.statusBadge}><div className={styles.pulseDot} /> Événement Déjantés</div>
            <h2 className={styles.detailTitleMain}>{event.titre}</h2>
          </div>
        </div>
        <div className={styles.detailScrollArea}>
          <div className={styles.detailGrid}>
            <div className={styles.detailInfoCard}>
              <CalendarDays className={styles.detailIcon} />
              <div>
                <label>DÉBUT</label>
                <p>{format(formatLocaleTime(event.date), "EEEE dd MMMM", { locale: fr })}</p>
                <span>à {format(formatLocaleTime(event.date), "HH:mm")}</span>
              </div>
            </div>
            {event.dateFin && (
              <div className={styles.detailInfoCard}>
                <Clock className={styles.detailIcon} />
                <div>
                  <label>FIN</label>
                  <p>{format(formatLocaleTime(event.dateFin), "EEEE dd MMMM", { locale: fr })}</p>
                  <span>à {format(formatLocaleTime(event.dateFin), "HH:mm")}</span>
                </div>
              </div>
            )}
          </div>
          <div className={styles.detailInfoCardFull}>
             <MapPin className={styles.detailIcon} />
             <div><label>LIEU</label><p>{event.lieu}</p></div>
          </div>
          <div className={styles.detailDescriptionBox}>
            <h3>À propos de la soirée</h3>
            <p>{event.description || "Préparez-vous pour une soirée mémorable !"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function FeteClient({ dejantesNews, upcomingEvents, pastEvents, canManage }: any) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [countdown, setCountdown] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const [isCleaning, setIsCleaning] = useState(false);

  const formatLocaleTime = (date: Date | string) => {
    const d = new Date(date);
    return new Date(d.getTime() + d.getTimezoneOffset() * 60000);
  };

  const isEventOver = (event: any) => {
    const end = event.dateFin ? formatLocaleTime(event.dateFin) : formatLocaleTime(event.date);
    const limit = event.dateFin ? end.getTime() : end.getTime() + (6 * 60 * 60 * 1000);
    return now.getTime() > limit;
  };

  const isEventLive = (event: any) => {
    const start = formatLocaleTime(event.date).getTime();
    const end = event.dateFin ? formatLocaleTime(event.dateFin).getTime() : start + (6 * 60 * 60 * 1000);
    return now.getTime() >= start && now.getTime() <= end;
  };

  const activeTimerEvent = useMemo(() => {
    const live = upcomingEvents.find((e: any) => isEventLive(e));
    if (live) return { event: live, status: "LIVE" };
    const next = upcomingEvents.find((e: any) => !isEventOver(e));
    if (next) return { event: next, status: "UPCOMING" };
    return null;
  }, [upcomingEvents, now]);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = new Date();
      setNow(currentTime);

      if (activeTimerEvent) {
        if (activeTimerEvent.status === "LIVE") {
          setCountdown("C'EST LA FÊTE ! 🕺");
        } else {
          const eventDate = formatLocaleTime(activeTimerEvent.event.date);
          const diff = eventDate.getTime() - currentTime.getTime();
          
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setCountdown(`${days}j ${hours}h ${minutes}m ${seconds}s`);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTimerEvent]);

  const handleClearPast = async () => {
    if (confirm("Supprimer définitivement les soirées passées ?")) {
      setIsCleaning(true);
      await clearPastEvents();
      setIsCleaning(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.animatedBg}><div className={styles.blob} /><div className={styles.blob2} /></div>

      {/* Hero News */}
      {dejantesNews.length > 0 && (
        <section className={styles.heroNews}>
          <div className={styles.heroOverlay} />
          <img 
            src={getSafeUrl(dejantesNews[0].imageUrl) || "/upload/party-placeholder.jpg"} 
            alt="Hero" 
            className={styles.heroImg} 
          />
          <div className={styles.heroContent}>
            <span className={styles.tag}><PartyPopper size={16} /> À la une</span>
            <h1 className={styles.heroTitle}>{dejantesNews[0].titre}</h1>
            <p className={styles.heroDescription}>{dejantesNews[0].contenu.substring(0, 180)}...</p>
            <Link href={`/news/${dejantesNews[0].id}`} className={styles.heroReadMore}>Lire la suite <ChevronRight size={18} /></Link>
          </div>
        </section>
      )}

      <div className={styles.gridMain}>
        <a href="https://sibers.borgia-app.com" target="_blank" className={styles.borgiaCard} rel="noopener noreferrer">
          <div className={styles.cardHeader}><Wallet size={32} /><h2>Borgia</h2></div>
          <p>Solde Sibers en direct.</p>
          <div className={styles.actionLabel}>Ouvrir <ExternalLink size={16} /></div>
        </a>

        {activeTimerEvent && (
          <div className={styles.countdownCard} onClick={() => setSelectedEvent(activeTimerEvent.event)} style={{cursor: 'pointer'}}>
            <Timer size={24} className={activeTimerEvent.status === "LIVE" ? "text-green-400 animate-pulse" : "text-purple-400"} />
            <span className={styles.countdownTitle}>{activeTimerEvent.status === "LIVE" ? "En cours" : "Temps restant"}</span>
            <p className={styles.countdownTime}>{countdown}</p>
            <h3 className={styles.nextEventTitle}>{activeTimerEvent.event.titre}</h3>
          </div>
        )}
      </div>

      {canManage && (
        <div className="flex justify-center gap-4 mb-12">
          <button className={styles.addEventBtn} onClick={() => setIsAddModalOpen(true)}><Plus size={20} /> Organiser</button>
          <button className={`${styles.addEventBtn} ${styles.clearBtn}`} onClick={handleClearPast} disabled={isCleaning}>
            {isCleaning ? <RefreshCw className={styles.spinning} size={20} /> : <Trash2 size={20} />} Purger
          </button>
        </div>
      )}

      {/* Prochaines soirées */}
      <section className={styles.eventsSection}>
        <h2 className={styles.sectionTitle}><CalendarDays size={28} className="text-purple-500 mr-3" /> À venir</h2>
        <div className={styles.eventCardsGrid}>
          {upcomingEvents
            .filter((event: any) => !isEventOver(event))
            .map((event: any) => (
              <div key={event.id} className={`${styles.eventCard} ${isEventLive(event) ? styles.liveCard : ""}`} onClick={() => setSelectedEvent(event)}>
                <div className={styles.eventImageContainer}>
                  {event.imageUrl ? (
                    <img src={getSafeUrl(event.imageUrl) as string} className={styles.eventCardImg} alt={event.titre} />
                  ) : (
                    <div className={styles.noImage}>No Image</div>
                  )}
                  {isEventLive(event) && <div className={styles.liveBadge}><div className={styles.liveDot} /> EN DIRECT 🕺</div>}
                  {canManage && (
                    <div className={styles.adminActions} onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setEventToEdit(event)} className={styles.editBtnNeon}><Pencil size={16} /></button>
                      <button onClick={() => confirm("Supprimer ?") && deleteEvent(event.id)} className={styles.deleteBtn}><Trash2 size={16} /></button>
                    </div>
                  )}
                </div>
                <div className={styles.eventCardContent}>
                  <span className={styles.eventCardDate}>{format(formatLocaleTime(event.date), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}</span>
                  <h3>{event.titre}</h3>
                  <div className={styles.lieuRow}><MapPin size={14} /> {event.lieu}</div>
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* Archives */}
      <section className={styles.eventsSection} style={{ marginTop: '5rem', opacity: 0.5 }}>
        <h2 className={styles.sectionTitle}>Archives</h2>
        <div className={styles.eventCardsGrid}>
            {[...upcomingEvents, ...pastEvents]
              .filter(isEventOver)
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 4)
              .map((event: any) => (
                <div key={event.id} className={styles.eventCard} onClick={() => setSelectedEvent(event)}>
                  {/* ✅ Ajout de l'image sécurisée pour les archives aussi */}
                  <div className={styles.eventImageContainer} style={{height: '120px'}}>
                     {event.imageUrl ? (
                        <img src={getSafeUrl(event.imageUrl) as string} className={styles.eventCardImg} alt="" />
                     ) : (
                        <div className={styles.noImage}>Archive</div>
                     )}
                  </div>
                  <div className={styles.eventCardContent}>
                    <span className={styles.eventCardDate}>Fini le {format(formatLocaleTime(event.dateFin || event.date), "dd/MM/yy")}</span>
                    <h3>{event.titre}</h3>
                  </div>
                </div>
            ))}
        </div>
      </section>

      {isAddModalOpen && <AddEventModal onClose={() => setIsAddModalOpen(false)} />}
      {eventToEdit && <EditEventModal event={eventToEdit} onClose={() => setEventToEdit(null)} />}
      {selectedEvent && <ViewEventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} formatLocaleTime={formatLocaleTime} />}
    </div>
  );
}