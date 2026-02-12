"use client";

import { useState, useEffect } from "react";
import { GetCalendar } from "@/actions/getCalendar";

export function useCalendarSession(username: string) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // 1. On regarde si on a déjà stocké ça pour CETTE session
      const cached = sessionStorage.getItem(`cal_cache_${username}`);
      
      if (cached) {
        setEvents(JSON.parse(cached));
        setLoading(false);
        return;
      }

      // 2. Sinon, on appelle le serveur
      const data = await GetCalendar(username);
      
      // 3. On stocke dans le navigateur de l'user
      sessionStorage.setItem(`cal_cache_${username}`, JSON.stringify(data));
      setEvents(data);
      setLoading(false);
    }

    if (username) loadData();
  }, [username]);

  return { events, loading };
}