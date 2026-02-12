// src/context/BorgiaContext.tsx
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
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openBorgia = () => setIsModalOpen(true);

  const refreshBalance = useCallback(async () => {
    // Si pas d'utilisateur Boreal, on reset tout et on arrête
    if (!user) {
      setBalance(null);
      setIsConnected(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/borgia/balance");
      const data = await res.json();

      if (res.ok) {
        // On synchronise l'état avec la réponse de l'API (qui contient isConnected)
        setIsConnected(data.isConnected);
        setBalance(data.isConnected ? data.balance : null); // null si déconnecté pour éviter le "0"
      } else {
        setIsConnected(false);
        setBalance(null);
      }
    } catch (error) {
      setIsConnected(false);
      setBalance(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]); // Dépendance sur user pour refresh lors d'un changement de compte

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  return (
    <BorgiaContext.Provider value={{ balance, isConnected, isLoading, openBorgia, refreshBalance }}>
      {children}
      <BorgiaModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onLoginSuccess={refreshBalance} 
      />
    </BorgiaContext.Provider>
  );
}

export const useBorgia = () => {
  const context = useContext(BorgiaContext);
  if (!context) throw new Error("useBorgia must be used within a BorgiaProvider");
  return context;
};