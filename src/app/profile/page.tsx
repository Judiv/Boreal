export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProfileClient from "./ProfileClient";
import { getMyNotifications } from "./actions";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    redirect("/login");
  }

  // ✅ On récupère l'utilisateur avec TOUTES les relations nécessaires
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: { 
          permissions: true // Permissions liées au rôle (ex: manage_planning)
        }
      },
      tags: true,             // Tes tags (ex: ZiSport, ZiFete)
      permissionsPerso: true  // Tes permissions spécifiques ajoutées à la main
    }
  });

  // On récupère les notifications en parallèle
  const notifications = await getMyNotifications();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 min-h-screen">
      {/* Titre stylisé pour coller au design Cyber/Sport de l'appli 
      */}
      <div className="mb-10 flex flex-col gap-1">
        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">
          MON <span className="text-blue-500">PROFIL</span>
        </h1>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest ml-1">
          Gestion du compte et habilitations
        </p>
      </div>

      {/* On passe l'objet user complet au client. 
          Il contient maintenant :
          - user.password (pour bcrypt dans l'action de changement de mot de passe)
          - user.role.permissions (permissions du groupe)
          - user.permissionsPerso (tes permissions custom)
      */}
      <ProfileClient user={user} notifications={notifications} />
    </div>
  );
}