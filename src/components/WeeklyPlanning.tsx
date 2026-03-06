"use client";

import { useState, useMemo, useEffect } from "react";
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
            height: Math.max(((e - s) / 60) * hourHeight, 30), 
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

  const HOUR_HEIGHT = 80; // ✅ Légèrement augmenté pour la lisibilité
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
      case "COMITS": 
        return { badge: styles.badgeCOMITS, icon: styles.iconRed, text: styles.textRed, IconComp: Drama, modalBorder: styles.modalBorderRed };
      case "SPORT": 
        return { badge: styles.badgeSPORT, icon: styles.iconOrange, text: styles.textOrange, IconComp: Trophy, modalBorder: styles.modalBorderOrange };
      case "FETE": 
        return { badge: styles.badgeFETE, icon: styles.iconPink, text: styles.textPink, IconComp: PartyPopper, modalBorder: styles.modalBorderPink };
      case "INFO": 
        return { badge: styles.badgeINFO, icon: styles.iconBlue, text: styles.textBlue, IconComp: Info, modalBorder: styles.modalBorderBlue };
      case "ADMINISTRATIVE": 
        return { badge: styles.badgeADMIN, icon: styles.iconYellow, text: styles.textYellow, IconComp: Briefcase, modalBorder: styles.modalBorderYellow };
      case "CM": 
        return { badge: styles.badgeCM, icon: styles.iconBlueDark, text: styles.textBlueDark, IconComp: GraduationCap, modalBorder: styles.modalBorderBlueDark };
      case "TP": 
        return { badge: styles.badgeTP, icon: styles.iconGreen, text: styles.textGreen, IconComp: GraduationCap, modalBorder: styles.modalBorderGreen };
      case "EXAM": 
        return { badge: styles.badgeEXAM, icon: styles.iconRedVivid, text: styles.textRedVivid, IconComp: Info, modalBorder: styles.modalBorderRedVivid };
      case "PROJET": case "ED":
        return { badge: styles.badgeED, icon: styles.iconPurple, text: styles.textPurple, IconComp: Briefcase, modalBorder: styles.modalBorderPurple };
      default: 
        return { badge: styles.badgeDefault, icon: styles.iconGrey, text: styles.textGrey, IconComp: Pin, modalBorder: styles.modalBorderGrey };
    }
  };

  const currentTheme = getTheme(selectedEvent);

  return (
    <div className={styles.container}>
      {/* TOOLBAR */}
      <div className={styles.toolbar}>
        <div className={styles.monthTitle}>
          <CalendarDays size={20} className={styles.monthIcon} />
          {format(currentMonday, "MMMM yyyy", { locale: fr })}
        </div>
        <div className={styles.controls}>
          {(canEdit.isSuperAdmin || canEdit.canManage) && <Link href="/planning/add" className={styles.addButton}><Plus size={16} /> <span className={styles.hideMobile}>Ajouter</span></Link>}
          <button onClick={() => setWeekOffset(0)} className={styles.todayBtn}><span className={styles.hideMobile}>Aujourd'hui</span><CalendarDays className={styles.showMobile} size={16}/></button>
          <div className={styles.navGroup}>
             <button onClick={() => setWeekOffset(p => p - 1)} className={styles.iconBtn}><ChevronLeft size={18}/></button>
             <button onClick={() => setWeekOffset(p => p + 1)} className={styles.iconBtn}><ChevronRight size={18}/></button>
          </div>
          <button onClick={handleRefresh} className={styles.iconBtn}>
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* GRILLE */}
      <div className={styles.gridWrapper}>
        <div className={styles.timeColumn}>
          <div className={styles.timeColumnHeader}></div>
          {timeSlots.map((hour) => (
            <div key={hour} className={styles.timeSlotLabel} style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT + 60}px` }}>{hour}:00</div>
          ))}
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
              {/* Lignes d'heures en arrière-plan */}
              {timeSlots.map((_, i) => <div key={i} className={styles.hourLine} style={{ top: i * HOUR_HEIGHT }} />)}
              
              <div className={styles.columnsFlex}>
                {weekDays.map(day => {
                  const dStr = format(day, "yyyy-MM-dd");
                  const dayEvs = processedEvents.filter(e => format(new Date(e.dateDebut), "yyyy-MM-dd") === dStr);
                  const layout = calculateLayout(dayEvs, HOUR_HEIGHT, START_HOUR, END_HOUR);

                  return (
                    <div key={day.toString()} className={styles.column}>
                      {layout.map(({ event, style }) => (
                        <div key={`${event.id}-${dStr}`} className={styles.eventWrapper} style={{ ...style, left: `${style.left}%`, width: `${style.width}%` }}>
                          <EventCard event={event} canEdit={canEdit} tags={tags} mapping={mapping} onClick={() => setSelectedEvent(event)} />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODALE DETAILS */}
      {selectedEvent && (() => {
        const theme = getTheme(selectedEvent);
        const IconHeader = theme.IconComp;
        
        return (
          <div className={styles.modalOverlay} onClick={() => setSelectedEvent(null)}>
            <div className={`${styles.modalContent} ${theme.modalBorder}`} onClick={e => e.stopPropagation()}>
              
              {/* En-tête avec fond coloré dynamique */}
              <div className={`${styles.modalHeaderNew} ${theme.badge}`}>
                <div className={styles.headerIconCircle}>
                  <IconHeader size={24} className={theme.text} />
                </div>
                <div className={styles.headerTitles}>
                  <span className={`${styles.modalBadgeLabel} ${theme.text}`}>
                    {selectedEvent.typeCours || selectedEvent.type || "Événement"}
                  </span>
                  <h2 className={styles.modalTitle}>{selectedEvent.titre || selectedEvent.title}</h2>
                </div>
                <button onClick={() => setSelectedEvent(null)} className={styles.closeButtonNew}>
                  <X size={20}/>
                </button>
              </div>

              <div className={styles.modalBodyNew}>
                {/* Horaires */}
                <div className={styles.infoBox}>
                  <div className={`${styles.infoIconWrapper} ${theme.icon}`}>
                    <Clock size={18} />
                  </div>
                  <div className={styles.infoText}>
                    <span className={styles.infoLabel}>Horaire</span>
                    <p>{format(new Date(selectedEvent.dateDebut), "HH:mm")} — {format(new Date(selectedEvent.dateFin), "HH:mm")}</p>
                  </div>
                </div>

                {/* Lieu */}
                <div className={styles.infoBox}>
                  <div className={`${styles.infoIconWrapper} ${theme.icon}`}>
                    <MapPin size={18} />
                  </div>
                  <div className={styles.infoText}>
                    <span className={styles.infoLabel}>Localisation</span>
                    <p>{selectedEvent.lieu || "Non spécifié"}</p>
                  </div>
                </div>

                {/* Organisateur / Prof */}
                <div className={styles.infoBox}>
                  <div className={`${styles.infoIconWrapper} ${theme.icon}`}>
                    <Users size={18} />
                  </div>
                  <div className={styles.infoText}>
                    <span className={styles.infoLabel}>Organisateur</span>
                    <p>
                      {isEnsamEvent(selectedEvent) 
                        ? (selectedEvent.prof || "Administration ENSAM") 
                        : (selectedEvent.gestionnaire ? `${selectedEvent.gestionnaire.prenom} ${selectedEvent.gestionnaire.nom}` : "Moi")}
                    </p>
                  </div>
                </div>

                {/* Description si elle existe */}
                {selectedEvent.description && (
                  <div className={styles.descriptionSection}>
                    <div className={styles.descriptionHeader}>
                      <Info size={16} className={theme.text} />
                      <span>Description</span>
                    </div>
                    <p className={styles.descriptionContent}>{selectedEvent.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}