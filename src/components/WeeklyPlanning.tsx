"use client";

import { useState, useMemo } from "react";
import { format, startOfWeek, addDays, isSameDay, isBefore, startOfDay, endOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  ChevronLeft, ChevronRight, CalendarDays, RefreshCw, X, 
  MapPin, Clock, Users, GraduationCap, 
  Trophy, PartyPopper, Info, Plus, Drama, Briefcase, Pin 
} from "lucide-react"; 
import Link from "next/link";
import EventCard from "./EventCard";
import styles from "./WeeklyPlanning.module.css";
import { TagMapping } from "@/lib/mappings";

const getMinutes = (date: Date) => date.getHours() * 60 + date.getMinutes();

const splitMultiDayEvents = (events: any[]) => {
  const segments: any[] = [];
  events.forEach((event) => {
    const start = new Date(event.dateDebut);
    const end = new Date(event.dateFin);
    if (start.toDateString() === end.toDateString()) {
      segments.push(event);
      return;
    }
    segments.push({ ...event, dateDebut: start, dateFin: endOfDay(start) });
    let current = addDays(startOfDay(start), 1);
    while (isBefore(current, startOfDay(end))) {
      segments.push({ ...event, dateDebut: startOfDay(current), dateFin: endOfDay(current) });
      current = addDays(current, 1);
    }
    segments.push({ ...event, dateDebut: startOfDay(end), dateFin: end });
  });
  return segments;
};

const calculateLayout = (dayEvents: any[], hourHeight: number, startHour: number, endHour: number) => {
  if (dayEvents.length === 0) return [];
  const startLimit = startHour * 60;
  const endLimit = endHour * 60;
  const sorted = [...dayEvents].sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime());
  
  const finalLayout: any[] = [];
  const clusters: any[][] = [];
  let currentCluster: any[] = [];
  let clusterEnd = -1;

  sorted.forEach((ev) => {
    const s = Math.max(getMinutes(new Date(ev.dateDebut)), startLimit);
    const e = Math.min(getMinutes(new Date(ev.dateFin)), endLimit);
    if (currentCluster.length > 0 && s >= clusterEnd) {
      clusters.push(currentCluster);
      currentCluster = [];
      clusterEnd = -1;
    }
    currentCluster.push(ev);
    if (e > clusterEnd) clusterEnd = e;
  });
  if (currentCluster.length > 0) clusters.push(currentCluster);

  clusters.forEach((cluster) => {
    const columns: any[][] = [];
    cluster.forEach((ev) => {
      let placed = false;
      const s2 = Math.max(getMinutes(new Date(ev.dateDebut)), startLimit);
      const f2 = Math.min(getMinutes(new Date(ev.dateFin)), endLimit);
      for (let i = 0; i < columns.length; i++) {
        const hasColl = columns[i].some((ex) => {
          const s1 = Math.max(getMinutes(new Date(ex.dateDebut)), startLimit);
          const f1 = Math.min(getMinutes(new Date(ex.dateFin)), endLimit);
          return s1 < f2 && s2 < f1;
        });
        if (!hasColl) { columns[i].push(ev); placed = true; break; }
      }
      if (!placed) columns.push([ev]);
    });

    const w = 100 / columns.length;
    columns.forEach((col, i) => {
      col.forEach((ev) => {
        const s = Math.max(getMinutes(new Date(ev.dateDebut)), startLimit);
        const e = Math.min(getMinutes(new Date(ev.dateFin)), endLimit);
        finalLayout.push({
          event: ev,
          style: { 
            top: ((s - startLimit) / 60) * hourHeight, 
            height: Math.max(((e - s) / 60) * hourHeight, 25), 
            left: i * w, width: w, zIndex: 10 + i 
          },
        });
      });
    });
  });
  return finalLayout;
};

export default function WeeklyPlanning({ events, canEdit, tags, mapping }: { events: any[], canEdit: { isSuperAdmin: boolean, canManage: boolean }, tags: string[], mapping: TagMapping }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const today = new Date();
  const baseDate = startOfWeek(today, { weekStartsOn: 1 });
  const currentMonday = addDays(baseDate, weekOffset * 7);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentMonday, i));

  const HOUR_HEIGHT = 70;
  const START_HOUR = 7;
  const END_HOUR = 24;
  const timeSlots = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  const processedEvents = useMemo(() => splitMultiDayEvents(events), [events]);

  const handleRefresh = () => { 
    setIsRefreshing(true);
    sessionStorage.clear(); 
    window.location.reload(); 
  };

  const isEnsamEvent = (ev: any) => ev.type === "ENSAM" || String(ev.id).startsWith("ensam");

  const getTypeKey = (ev: any) => {
    if (!ev) return "AUTRE";
    const t = (ev.typeCours || "").toUpperCase();
    const type = (ev.type || "").toUpperCase();
    
    if (t.includes("COMITS") || type.includes("COMITS")) return "COMITS";
    if (t.includes("ADMIN") || t.includes("BUREAU") || type.includes("ADMINISTRATIVE")) return "ADMINISTRATIVE";
    if (t.includes("SPORT") || type.includes("SPORT")) return "SPORT";
    if (t.includes("FETE") || t.includes("SOIREE") || type.includes("FETE")) return "FETE";
    if (t.includes("INFO") || type.includes("INFO")) return "INFO";
    if (t.includes("CM")) return "CM";
    if (t.includes("TP")) return "TP";
    if (t.includes("EXAM") || t.includes("EVAL")) return "EXAM";
    if (t.includes("ED") || t.includes("TD")) return "ED";
    if (t.includes("PROJET")) return "PROJET";
    if (t.includes("AUTONOME")) return "AUTONOME";
    if (t.includes("INDISP")) return "INDISP";
    return "AUTRE";
  };

  const getTheme = (ev: any) => {
    const key = getTypeKey(ev);
    switch (key) {
      case "COMITS": return { modal: styles.modalContentCOMITS, badge: styles.badgeCOMITS, icon: styles.iconRed, text: styles.textRed, border: styles.separatorRed, id: styles.idRed, IconComp: Drama };
      case "ADMINISTRATIVE": return { modal: styles.modalContentADMINISTRATIVE, badge: styles.badgeADMINISTRATIVE, icon: styles.iconYellow, text: styles.textYellow, border: styles.separatorYellow, id: styles.idYellow, IconComp: Briefcase };
      case "SPORT": return { modal: styles.modalContentSPORT, badge: styles.badgeSPORT, icon: styles.iconOrange, text: styles.textOrange, border: styles.separatorOrange, id: styles.idOrange, IconComp: Trophy };
      case "FETE": return { modal: styles.modalContentFETE, badge: styles.badgeFETE, icon: styles.iconPink, text: styles.textPink, border: styles.separatorPink, id: styles.idPink, IconComp: PartyPopper };
      case "INFO": return { modal: styles.modalContentINFO, badge: styles.badgeINFO, icon: styles.iconBlue, text: styles.textBlue, border: styles.separatorBlue, id: styles.idBlue, IconComp: Info };
      case "CM": return { modal: "", badge: styles.badgeCM, icon: styles.iconBlue, text: "", border: "", id: "", IconComp: GraduationCap };
      case "TP": return { modal: "", badge: styles.badgeTP, icon: styles.iconGreen, text: "", border: "", id: "", IconComp: GraduationCap };
      case "EXAM": return { modal: "", badge: styles.badgeEXAM, icon: styles.iconRed, text: "", border: "", id: "", IconComp: GraduationCap };
      case "ED": return { modal: "", badge: styles.badgeED, icon: styles.iconPurple, text: "", border: "", id: "", IconComp: GraduationCap };
      case "PROJET": return { modal: "", badge: styles.badgePROJET, icon: styles.iconPurple, text: "", border: "", id: "", IconComp: GraduationCap };
      case "AUTONOME": return { modal: "", badge: styles.badgeAUTONOME, icon: styles.iconTeal, text: "", border: "", id: "", IconComp: GraduationCap };
      case "INDISP": return { modal: "", badge: styles.badgeINDISP, icon: styles.iconGrey, text: "", border: "", id: "", IconComp: GraduationCap };
      default: return { modal: styles.modalContentAUTRE, badge: styles.badgeAUTRE, icon: styles.iconGrey, text: styles.textGrey, border: styles.separatorGrey, id: styles.idGrey, IconComp: Pin };
    }
  };

  const currentTheme = getTheme(selectedEvent);

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.monthTitle}>
          <CalendarDays size={24} className={styles.monthIcon} />
          {format(currentMonday, "MMMM yyyy", { locale: fr })}
        </div>
        <div className={styles.controls}>
          {canEdit && <Link href="/planning/add" className={styles.addButton}><Plus size={18} /> Ajouter</Link>}
          <button onClick={() => setWeekOffset(0)} className={styles.todayBtn}>Aujourd'hui</button>
          <button onClick={() => setWeekOffset(p => p - 1)} className={styles.iconBtn}><ChevronLeft size={20}/></button>
          <button onClick={() => setWeekOffset(p => p + 1)} className={styles.iconBtn}><ChevronRight size={20}/></button>
          <button onClick={handleRefresh} className={styles.iconBtn}>
            <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className={styles.gridWrapper}>
        <div className={styles.timeColumn}>
          <div style={{ height: '60px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}></div>
          <div style={{ position: 'relative' }}>
            {timeSlots.map((hour) => (
              <div key={hour} className={styles.timeSlotLabel} style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px` }}>{hour}:00</div>
            ))}
          </div>
        </div>

        <div className={styles.mainZone}>
          <div className={styles.daysHeader}>
            {weekDays.map(day => (
              <div key={day.toString()} className={`${styles.dayCell} ${isSameDay(day, today) ? styles.todayCell : ""}`}>
                <span className={styles.dayName}>{format(day, "eee", { locale: fr })}</span>
                <span className={styles.dayNumber}>{format(day, "d")}</span>
              </div>
            ))}
          </div>

          <div className={styles.eventScrollArea}>
            <div className={styles.columnsContainer} style={{ height: timeSlots.length * HOUR_HEIGHT }}>
              {weekDays.map(day => {
                const dStr = format(day, "yyyy-MM-dd");
                const dayEvs = processedEvents.filter(e => format(new Date(e.dateDebut), "yyyy-MM-dd") === dStr);
                const layout = calculateLayout(dayEvs, HOUR_HEIGHT, START_HOUR, END_HOUR);

                return (
                  <div key={day.toString()} className={styles.column}>
                    {timeSlots.map((_, i) => <div key={i} className={styles.hourLine} style={{ top: i * HOUR_HEIGHT }} />)}
                    {layout.map(({ event, style }) => (
                      <div key={`${event.id}-${dStr}`} className={styles.eventWrapper} style={{ ...style, left: `${style.left}%`, width: `${style.width}%` }}>
                        <EventCard 
                          event={event} 
                          canEdit={canEdit} 
                          tags={tags} 
                          mapping={mapping} 
                          onClick={() => setSelectedEvent(event)} 
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {selectedEvent && (
        <div className={styles.modalOverlay} onClick={() => setSelectedEvent(null)}>
          <div className={`${styles.modalContent} ${currentTheme.modal}`} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.headerTopRow}>
                <div className="flex-1">
                  <span className={`${styles.badge} ${currentTheme.badge}`}>{selectedEvent.typeCours || selectedEvent.type || "EVENT"}</span>
                  <h2 className={styles.modalTitle}>{selectedEvent.titre || selectedEvent.title}</h2>
                </div>
                <button onClick={() => setSelectedEvent(null)} className={styles.closeButton}><X size={18}/></button>
              </div>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.infoRow}>
                <div className={`${styles.iconBox} ${currentTheme.icon}`}><Clock size={20}/></div>
                <div>
                  <p className={`${styles.infoLabel} ${currentTheme.text}`}>Horaire</p>
                  <p className={styles.infoValue}>
                    {format(new Date(selectedEvent.dateDebut), "HH:mm")} — {format(new Date(selectedEvent.dateFin), "HH:mm")}
                  </p>
                </div>
              </div>

              <div className={styles.infoRow}>
                <div className={`${styles.iconBox} ${currentTheme.icon}`}><MapPin size={20}/></div>
                <div>
                  <p className={`${styles.infoLabel} ${currentTheme.text}`}>Lieu</p>
                  <p className={styles.infoValue}>{selectedEvent.lieu || "Non spécifié"}</p>
                </div>
              </div>

              <div className={styles.infoRow}>
                <div className={`${styles.iconBox} ${currentTheme.icon}`}>
                  {currentTheme.IconComp ? <currentTheme.IconComp size={20}/> : <Users size={20}/>}
                </div>
                <div>
                  <p className={`${styles.infoLabel} ${currentTheme.text}`}>
                    {isEnsamEvent(selectedEvent) ? "Enseignant" : "Gestionnaire"}
                  </p>
                  <p className={styles.infoValue}>
                    {/* 1. Si c'est un cours ENSAM, on affiche 'prof' 
                        2. Sinon, on cherche le nom/prenom dans l'objet gestionnaire 
                        3. Sinon "Moi" ou "Non spécifié" */}
                    {isEnsamEvent(selectedEvent) 
                      ? (selectedEvent.prof || "Non spécifié")
                      : selectedEvent.gestionnaire 
                        ? `${selectedEvent.gestionnaire.prenom} ${selectedEvent.gestionnaire.nom}`
                        : (selectedEvent.prof || "Moi")
                    }
                  </p>
                </div>
              </div>
              
              {selectedEvent.description && (
                <div className={styles.infoRow}>
                  <div className={`${styles.iconBox} ${currentTheme.badge}`}><Info size={20}/></div>
                  <div>
                    <p className={`${styles.infoLabel} ${currentTheme.text}`}>Détails</p>
                    <p className={styles.infoValue}>{selectedEvent.description}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}