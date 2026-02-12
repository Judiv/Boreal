"use client";

import { useState, useRef } from "react";
import styles from "./PhotoModal.module.css";
import { X, MapPin, User, Calendar, Info, Trash2, ZoomIn, ZoomOut, RotateCcw, Grab } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// ✅ Utilitaire pour l'API Uploads
const getSafeUrl = (url: string | null) => {
  if (!url) return "";
  if (url.startsWith("/api/uploads/") || url.startsWith("http")) return url;
  const filename = url.split("/").pop();
  return `/api/uploads/${filename}`;
};

export default function PhotoModal({ photo, onClose, onDelete, canManage }: any) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  
  const safeUrl = getSafeUrl(photo.url);

  // Zoom à la molette
  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    const newScale = Math.min(Math.max(1, scale + delta), 4);
    setScale(newScale);
    if (newScale === 1) setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    setPosition({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        
        <div className={styles.mainLayout}>
          <div 
            className={styles.viewport} 
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
          >
            <div className={styles.canvas}>
              <img 
                src={safeUrl} 
                alt="" 
                style={{ 
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transition: isDragging ? "none" : "transform 0.2s cubic-bezier(0.2, 0, 0.2, 1)"
                }}
                className={styles.image}
                draggable={false}
              />
            </div>

            {scale > 1 && !isDragging && (
              <div className={styles.dragHint}>
                <Grab size={14} /> Maintenez pour déplacer
              </div>
            )}

            <div className={styles.zoomControls}>
              <button onClick={() => { const s = Math.max(1, scale - 0.4); setScale(s); if(s===1) resetZoom(); }}><ZoomOut size={20} /></button>
              <span className={styles.zoomLevel}>{Math.round(scale * 100)}%</span>
              <button onClick={() => setScale(s => Math.min(4, s + 0.4))}><ZoomIn size={20} /></button>
              <button onClick={resetZoom} className={styles.resetBtn}><RotateCcw size={18} /></button>
            </div>
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.sideContent}>
              <header>
                <span className={styles.categoryTag}>Focus Galerie</span>
                <h2 className={styles.title}>{photo.titre || "Cliché Boreal"}</h2>
                <div className={styles.metaBadge}>
                  <Calendar size={14} /> 
                  {format(new Date(photo.createdAt), "dd MMMM yyyy", { locale: fr })}
                </div>
              </header>

              <div className={styles.scrollArea}>
                <section className={styles.infoBlock}>
                  <div className={styles.blockHeader}><Info size={16} /> Description</div>
                  <p>{photo.description || "Aucun détail supplémentaire."}</p>
                </section>

                <div className={styles.gridInfo}>
                  <div className={styles.infoBlock}>
                    <div className={styles.blockHeader}><MapPin size={16} /> Lieu</div>
                    <p>{photo.lieu || "Non précisé"}</p>
                  </div>
                  <div className={styles.infoBlock}>
                    <div className={styles.blockHeader}><User size={16} /> Auteur</div>
                    <p>{photo.auteur || "Membre"}</p>
                  </div>
                </div>
              </div>

              {/* ✅ PIED DE SIDEBAR : ACTIONS */}
              <div className={styles.sidebarFooter}>
                {canManage && (
                  <button className={styles.deleteBtn} onClick={() => confirm("Supprimer ?") && onDelete(photo.id)}>
                    <Trash2 size={18} /> Supprimer
                  </button>
                )}
                <button className={styles.cancelBtn} onClick={onClose}>
                  Fermer
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}