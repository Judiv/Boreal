import { useState, useEffect } from "react";

export function useBorgia() {
  const [balance, setBalance] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const fetchBalance = async () => {
    try {
      const res = await fetch("/api/borgia/balance");
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance);
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    } catch {
      setIsConnected(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  return { balance, isConnected, refresh: fetchBalance };
}