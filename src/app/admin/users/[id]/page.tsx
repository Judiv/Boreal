import { getUserData } from "./actions";
import { notFound } from "next/navigation";
import UserEditForm from "./UserEditForm";

export default async function AdminUserEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = id;

  if (!userId) notFound();

  // On récupère toutes les données nécessaires via l'action serveur
  const data = await getUserData(userId);

  if (!data) notFound();

  // On passe tout au Client Component
  return (
    <div className="min-h-screen bg-[#0f0f11] pt-24 pb-12">
      <UserEditForm data={data} />
    </div>
  );
}