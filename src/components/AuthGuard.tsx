"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthGuard({ user, children }: { user: any, children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  if (!user) return null; // Empêche l'affichage du contenu privé

  return <>{children}</>;
}