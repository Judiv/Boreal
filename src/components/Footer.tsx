"use client";

import React from "react";
import { Github, Mail, Scale } from "lucide-react";
import Link from "next/link";
import styles from "./footer.module.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          
          <div className={styles.section}>
            <h3 className={styles.title}><span className={styles.dot}>●</span> Boreal</h3>
            <p className={styles.text}>La plateforme open-source dédiée à la vie étudiante.</p>
          </div>

          <div className={styles.section}>
            <h4 className={styles.title}>Licence</h4>
            <p className={styles.text}>Logiciel libre sous GNU GPL v3.</p>
            <Link href="https://www.gnu.org/licenses/gpl-3.0.html" className={styles.licenseLink}>
              Consulter la licence
            </Link>
          </div>

          <div className={styles.section}>
            <h4 className={styles.title}>Contact</h4>
            <div className={styles.linkGroup}>
               <Link href="https://github.com/Judiv/Boreal" className={styles.link}><Github size={18}/> GitHub</Link>
               <Link href="mailto:antoineschirrerpro@gmail.com" className={styles.link}><Mail size={18}/> Email</Link>
            </div>
          </div>

        </div>

        <div className={styles.bottomBar}>
          <div className={styles.copyright}>© {currentYear} <strong>SCHIRRER Antoine</strong></div>
          <div className={styles.badgeGroup}>
            <span className={styles.versionBadge}>v1.0-stable</span>
            <span className={styles.motto}>"by Universiris"</span>
          </div>
        </div>
      </div>
    </footer>
  );
}