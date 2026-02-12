import { prisma } from "@/lib/prisma";
import { hasPermission, getUser } from "@/lib/auth";
import EcoleClient from "./EcoleClient";
import AuthGuard from "@/components/AuthGuard";

export const dynamic = 'force-dynamic';

export default async function EcolePage() {
  const user = await getUser().catch(() => null);
  // Récupération des drives dynamiques depuis la DB
  const thuysses = await prisma.thuysse.findMany({ 
    orderBy: { createdAt: 'desc' } 
  });
  
  // Vérification de la permission pour afficher les outils d'édition
  const canManage = await hasPermission("manage_ecole");

  return <AuthGuard user={user}><EcoleClient initialThuysses={thuysses} canManage={canManage} /></AuthGuard>;
}