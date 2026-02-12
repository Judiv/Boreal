// src/app/(app)/planning/add/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import styles from "../form.module.css";
import AddEventForm from "./AddEventForm";
import { getAuthorizedCategories } from "@/app/admin/actions"; 

export default async function AddEventPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  if (!userId) redirect("/login");

  const authorizedCats = await getAuthorizedCategories();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { tags: true, role: true } 
  });

  if (!user) redirect("/login");

  // On prépare les options proprement
  const categoryOptions = authorizedCats.map(c => ({
    id: c.code,
    label: c.label
  }));

  return (
    <div className={styles.container}>
      <div className={styles.auroraBlob} />
      {/* ✅ IL FAUT PASSER 'categories' ICI */}
      <AddEventForm 
        userTags={user.tags.map(t => t.nom)} 
        userRole={user.role?.nom || "GADZ"} 
        categories={categoryOptions} 
      />
    </div>
  );
}