"use client";

import styles from "./EventCard.module.css";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteEvent } from "@/app/planning/actions";
import { canEditCategory, TagMapping } from "@/lib/mappings";

export default function EventCard({ 
  event, 
  onClick, 
  tags = [],
  canEdit, 
  mapping = {}
}: { 
  event: any, 
  onClick?: () => void, 
  tags?: string[], 
  canEdit: { isSuperAdmin: boolean, canManage: boolean },
  mapping?: TagMapping 
}) {
  
  let typeCours = (event?.typeCours || "AUTRE").toUpperCase();
  if (typeCours === "AUTRE" && event?.type) {
    typeCours = event.type.toUpperCase();
  }

  const titre = (event?.titre || event?.title || "").toLowerCase();
  const isEnsam = event?.type === "ENSAM" || String(event?.id).startsWith("ensam");
  const isAutoEvent = isEnsam || event.autoreserv;

  const hasTagPermission = canEditCategory(tags, event.type, mapping);
  const isEditable = !isAutoEvent && ((canEdit.canManage && hasTagPermission) || canEdit.isSuperAdmin);

  const getStyleClass = () => {
    // PRIORITÉ EXAMENS
    if (typeCours.includes("EXAMEN") || typeCours.includes("EVAL") || titre.includes("ds ")) return styles.typeEXAM;
    
    // COURS ENSAM
    if (typeCours.includes("CM") || titre.includes("amphi")) return styles.typeCM;
    if (typeCours.includes("TP") || typeCours.includes("TPS") || typeCours.includes("TPF")) return styles.typeTP;
    if (typeCours.includes("ED") || typeCours.includes("TD")) return styles.typeED;
    if (typeCours.includes("PROJET") || titre.includes("projet") || titre.includes("be ") || titre.includes("conception")) return styles.typePROJET;
    if (typeCours.includes("AUTONOME")) return styles.typeAUTONOME;
    if (typeCours.includes("INDISP")) return styles.typeINDISP;

    // PERSO / CUSTOM
    if (typeCours.includes("SPORT")) return styles.typeSPORT;
    if (typeCours.includes("FETE") || typeCours.includes("SOIREE")) return styles.typeFETE;
    if (typeCours.includes("INFO")) return styles.typeINFO;
    if (typeCours.includes("COMITS")) return styles.typeCOMITS;
    
    return styles.typeDefault;
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Voulez-vous vraiment supprimer cet événement ?")) {
      await deleteEvent(event.id);
    }
  };

  return (
    <div className={`${styles.card} ${getStyleClass()}`} onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="flex justify-between items-start gap-1 relative z-0">
        <h3 className={styles.title}>{event?.titre || event?.title}</h3>
        <span className="text-[7px] font-bold opacity-50 px-1 bg-black/20 rounded shrink-0 h-fit">
          {typeCours}
        </span>
      </div>
      
      <div className={styles.meta}>
        <p className="truncate opacity-80 tracking-tight flex items-center gap-1">
           {event?.lieu && `📍 ${event.lieu}`}
        </p>
      </div>

      {isEditable && (
        <div className={styles.actionsOverlay}>
          <Link 
            href={`/planning/edit/${event.id}`} 
            className={styles.actionBtn} 
            onClick={(e) => e.stopPropagation()}
          >
            <Pencil size={12} />
          </Link>
          <button onClick={handleDelete} className={`${styles.actionBtn} ${styles.deleteBtn}`}>
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  );
}