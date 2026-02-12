import { getUser } from "@/lib/auth";
import EvasionClient from "./EvasionClient";
import { redirect } from "next/navigation";

export default async function EvasionPage() {
  // Récupération serveur de l'utilisateur
  const user = await getUser().catch(() => null);

  // Protection serveur : si pas d'user, on redirige avant même de charger le client
  if (!user) {
    redirect("/login");
  }

  return <EvasionClient user={user} />;
}