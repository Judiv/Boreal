// src/components/NotificationObserver.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { getMyNotifications } from "@/app/profile/actions";
import { NOTIFICATION_CONFIG } from "@/app/profile/config";

export default function NotificationObserver() {
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const prevCountRef = useRef(0);

  // ✅ 1. Débloquer l'audio au premier clic sur le site
  useEffect(() => {
    const unlock = () => {
      setAudioUnlocked(true);
      console.log("🔊 Audio débloqué pour la session");
      window.removeEventListener("click", unlock);
    };
    window.addEventListener("click", unlock);
    return () => window.removeEventListener("click", unlock);
  }, []);

  useEffect(() => {
    const checkNotifications = async () => {
      const notifs = await getMyNotifications();
      const currentUnread = notifs.filter((n: any) => !n.isRead).length;

      // ✅ 2. Debug en console pour voir si le script détecte bien
      if (currentUnread > prevCountRef.current) {
        console.log(`🔔 Nouvelle notification détectée ! (${currentUnread})`);
        
        if (audioUnlocked) {
          const latest = notifs[0];
          const config = NOTIFICATION_CONFIG[latest?.type as keyof typeof NOTIFICATION_CONFIG] || NOTIFICATION_CONFIG.INFO;
          
          const audio = new Audio(config.sound);
          audio.play().catch(e => console.error("❌ Erreur lecture audio:", e));
        } else {
          console.warn("🔇 Son bloqué : l'utilisateur n'a pas encore cliqué sur la page.");
        }
      }

      prevCountRef.current = currentUnread;
    };

    const interval = setInterval(checkNotifications, 10000); // On passe à 10s pour tes tests
    return () => clearInterval(interval);
  }, [audioUnlocked]); // On ré-exécute si l'audio se débloque

  return null;
}