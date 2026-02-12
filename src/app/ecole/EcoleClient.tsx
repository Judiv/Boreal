"use client";

import { useState } from "react";
import { GraduationCap, ExternalLink, School, Library, Milestone, Plus, Trash2 } from "lucide-react";
import AddThuysseModal from "./AddThuysseModal";
import { deleteThuysse } from "./actions";
import styles from "./ecole.module.css";

const officialPlatforms = [
  { name: "LISE", href: "https://lise.ensam.eu", icon: <School size={20} />, desc: "Portail officiel (Scolarité, absences, notes)." },
  { name: "Savoir", href: "https://savoir.ensam.eu", icon: <Library size={20} />, desc: "Plateforme Moodle pour les cours en ligne." },
  { name: "Amway", href: "https://amway.ensam.eu", icon: <Milestone size={20} />, desc: "Orientation, stages et parcours supérieur." },
];

export default function EcoleClient({ initialThuysses, canManage }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className={styles.container}>
      <div className={styles.bgDecor}>
        <div className={styles.blob} />
        <div className={styles.gridOverlay} />
      </div>

      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <GraduationCap size={40} className="text-blue-500 mb-4" />
          <h1 className={styles.title}>Espace Études</h1>
          <p className={styles.subtitle}>Ressources officielles et entraide Gadzarique.</p>
        </div>
      </header>

      {/* OPTIMISATION */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Optimisation</h2>
        <a href="https://www.better-lise.com" target="_blank" className={styles.betterLiseCard}>
          <div className={styles.cardContent}>
            <h3>Better-Lise</h3>
            <p>L'interface améliorée pour booster ta productivité sur LISE.</p>
          </div>
          <ExternalLink size={24} />
          <div className={styles.cardGlow} />
        </a>
      </section>

      {/* OUTILS OFFICIELS */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Outils ENSAM</h2>
        <div className={styles.officialGrid}>
          {officialPlatforms.map((plat, i) => (
            <a key={i} href={plat.href} target="_blank" className={styles.officialCard}>
              <div className={styles.platHeader}>
                {plat.icon}
                <h3>{plat.name}</h3>
              </div>
              <p>{plat.desc}</p>
              <ExternalLink size={14} className={styles.miniArrow} />
            </a>
          ))}
        </div>
      </section>

      {/* THUYSSES (DRIVES DYNAMIQUES) */}
      <section className={styles.section}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={styles.sectionTitle}>Drives & Thuysses</h2>
          {canManage && (
            <button className={styles.addBtn} onClick={() => setIsModalOpen(true)}>
              <Plus size={18} /> Ajouter une Thuysse
            </button>
          )}
        </div>

        <div className={styles.driveGrid}>
          {initialThuysses.map((thuysse: any) => (
            <div key={thuysse.id} className={styles.driveCard}>
              <div className={styles.driveInfo}>
                <div className="flex justify-between items-start">
                  <h3>{thuysse.nom}</h3>
                  {canManage && (
                    <button 
                        className={styles.deleteBtn}
                        onClick={() => confirm("Voulez-vous vraiment supprimer cette Thuysse ?") && deleteThuysse(thuysse.id)}
                    >
                        <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <p>{thuysse.description}</p>
                <a href={thuysse.url} target="_blank" className={styles.externalLink}>
                  Accéder au drive <ExternalLink size={14} className="ml-1" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {isModalOpen && <AddThuysseModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}