"use client";

import { Ship, Mountain, ArrowRight, Compass } from "lucide-react";
import styles from "./evasion.module.css";

export default function EvasionClient({ user }: { user: any }) {
  const destinations = [
    {
      id: "skz",
      titre: "Skiozarts",
      baseline: "L'ivresse des sommets",
      description: "Une semaine de glisse, de folie et de traditions Gadzarts au cœur des plus belles stations.",
      lien: "https://skiozarts.fr",
      icon: <Mountain size={32} />,
      color: "#00d2ff",
      rgb: "0, 210, 255",
      video: "/videos/Teaser_SKZ.mp4", 
    },
    {
      id: "croisiere",
      titre: "Croisière AM",
      baseline: "L'appel du large",
      description: "Larguez les amarres pour une épopée méditerranéenne entre vents, vagues et liberté.",
      lien: "https://site-croisiere-am-main.vercel.app",
      icon: <Ship size={32} />,
      color: "#ff9d00",
      rgb: "255, 157, 0",
      video: "/videos/Teaser_CROISIEREAM.mp4",
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.bgGlow} />
      
      <header className={styles.header}>
        <div className={styles.preTitle}>Explorer de nouveaux horizons</div>
        <h1 className={styles.mainTitle}>ÉVASION<span>.</span></h1>
        <div className={styles.compassContainer}>
          <Compass size={40} className={styles.compassIcon} />
        </div>
      </header>

      <div className={styles.destinationsWrapper}>
        {destinations.map((dest) => (
          <a 
            key={dest.id} 
            href={dest.lien} 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.destCard}
            style={{ "--accent": dest.color, "--accent-rgb": dest.rgb } as any}
          >
            <div className={styles.cardImageArea}>
              <div className={styles.imageOverlay} />
              
              {dest.video && (
                <video
                  className={styles.videoBg}
                  src={dest.video}
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              )}

              <div className={styles.cardBg} /> 
            </div>

            <div className={styles.cardInfo}>
              <div className={styles.cardHeader}>
                <div className={styles.iconCircle}>{dest.icon}</div>
                <span className={styles.baseline}>{dest.baseline}</span>
              </div>
              
              <h2 className={styles.destTitle}>{dest.titre}</h2>
              <p className={styles.destDesc}>{dest.description}</p>

              <div className={styles.exploreTrigger}>
                <span className={styles.exploreText}>Découvrir l'aventure</span>
                <div className={styles.arrowCircle}>
                  <ArrowRight size={20} />
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>

      <footer className={styles.footerInfo}>
        <div className={styles.infoLine}></div>
        <p>Sélectionné avec soin par les Déjantés</p>
      </footer>
    </div>
  );
}