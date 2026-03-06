"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import BorgiaModal from "@/components/BorgiaModal";

interface BorgiaContextType {
  balance: number | null;
  isConnected: boolean;
  isLoading: boolean;
  openBorgia: () => void;
  refreshBalance: () => Promise<void>;
}

const BorgiaContext = createContext<BorgiaContextType | undefined>(undefined);

export function BorgiaProvider({ children, user }: { children: React.ReactNode, user: any }) {
  const [balance, setBalance] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // On commence à false pour éviter un flash bloquant
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openBorgia = () => setIsModalOpen(true);

  const refreshBalance = useCallback(async () => {
    // Sécurité renforcée : si l'objet user n'est pas complet, on ne fetch pas
    if (!user || !user.id) {
      setBalance(null);
      setIsConnected(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/borgia/balance");
      
      // On vérifie que la réponse est bien du JSON avant de parser
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setIsConnected(!!data.isConnected);
        setBalance(data.isConnected ? data.balance : null);
      } else {
        throw new Error("Réponse API invalide");
      }
    } catch (error) {
      console.error("Erreur Borgia Context:", error);
      setIsConnected(false);
      setBalance(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]); // On ne dépend que de l'ID pour éviter les rafraîchissements inutiles

  useEffect(() => {
    // On attend un petit délai pour laisser la session se stabiliser
    const timer = setTimeout(() => {
        refreshBalance();
    }, 100);
    return () => clearTimeout(timer);
  }, [refreshBalance]);

  return (
    <BorgiaContext.Provider value={{ balance, isConnected, isLoading, openBorgia, refreshBalance }}>
      {children}
      {/* On ne rend la modale que si l'utilisateur est au moins loggé sur Boreal */}
      {user && (
        <BorgiaModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onLoginSuccess={refreshBalance} 
        />
      )}
    </BorgiaContext.Provider>
  );
}

export const useBorgia = () => {
  const context = useContext(BorgiaContext);
  // Au lieu de crash, on renvoie un objet vide ou on gère l'erreur plus bas
  if (!context) {
    console.warn("useBorgia utilisé en dehors du provider");
    return { balance: null, isConnected: false, isLoading: false, openBorgia: () => {}, refreshBalance: async () => {} };
  }
  return context;
};