// src/components/CalendarWrapper.tsx
"use client";

import { useEffect, useState } from "react";
import WeeklyPlanning from "./WeeklyPlanning";
import { format } from "date-fns";

export default function CalendarWrapper({ initialEvents, username }: { initialEvents: any[], username: string }) {
  // On initialise avec les events du serveur, mais on laisse le useEffect prendre le relais
  const [events, setEvents] = useState(initialEvents);
  const [lastSync, setLastSync] = useState<string>("");

  useEffect(() => {
    const storageKey = `boreal_cache_${username}`;
    const timeKey = `boreal_sync_time_${username}`;

    const cachedData = sessionStorage.getItem(storageKey);
    const cachedTime = sessionStorage.getItem(timeKey);

    if (cachedData) {
      // Si on a du cache, on l'utilise
      const parsed = JSON.parse(cachedData);
      setEvents(parsed);
      setLastSync(cachedTime || "");
    } else {
      // Sinon on stocke ce que le serveur vient de nous donner
      const now = format(new Date(), "HH:mm");
      sessionStorage.setItem(storageKey, JSON.stringify(initialEvents));
      sessionStorage.setItem(timeKey, now);
      setEvents(initialEvents);
      setLastSync(now);
    }
  }, [initialEvents, username]);

  const forceSync = () => {
    sessionStorage.clear(); // Vide TOUT le cache de session
    window.location.reload(); // Recharge la page pour forcer le fetch serveur
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-4">
        <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <p className="text-[10px] font-bold text-slate-500 uppercase">
                Live : {lastSync ? `Synchronisé à ${lastSync}` : "Calcul..."}
            </p>
        </div>
      </div>
      <WeeklyPlanning events={events} />
    </div>
  );
}