import { getAdminDashboardData } from "./actions";
import AdminDashboardClient from "@/components/AdminDashboardClient";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  
  // On récupère TOUTES les données (Logs + Users + Tags)
  const data = await getAdminDashboardData(query);

  // On délègue l'affichage au Client Component qui gère les onglets
  return <AdminDashboardClient data={data} />;
}