"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "@/app/admin/admin.module.css"; 
import { useRef } from "react"; // ✅ On utilise useRef natif

export default function AdminSearch() {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  
  // On utilise une référence pour stocker le timer du debounce
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = (term: string) => {
    // Si un timer est déjà en cours, on l'annule (reset du chrono)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // On lance un nouveau timer de 300ms
    timeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      
      // On garde l'onglet actuel si présent
      const currentTab = params.get("tab") || "users";
      params.set("tab", currentTab);

      if (term) {
        params.set("q", term);
      } else {
        params.delete("q");
      }
      
      replace(`/admin?${params.toString()}`);
    }, 300);
  };

  return (
    <div className="relative w-full">
      <input 
        type="text" 
        placeholder="Rechercher (Nom, Email, Tag...)" 
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get("q")?.toString()}
        className={styles.searchInput}
      />
    </div>
  );
}