import { getUserSession, hasPermission, getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BoquetteCard from "./BoquetteCard";
import AddBoquetteButton from "./AddBoquetteButton";
import styles from "./boquettes.module.css";
import { Store } from "lucide-react";
import { getPublishingTags } from "@/app/admin/actions";
import AuthGuard from "@/components/AuthGuard";

export default async function BoquettesPage() {
  const user = await getUser().catch(() => null);
  const session = await getUserSession();
  const { isSuperAdmin, allTags } = session || { isSuperAdmin: false, allTags: [] };

  // 1. Vérification de la permission globale
  const hasGlobalManagePermission = await hasPermission("manage_boquettes");
  const canAddBoquette = isSuperAdmin || hasGlobalManagePermission;

  // 2. Récupération des tags autorisés pour la création
  const publishingTags = canAddBoquette ? await getPublishingTags() : [];

  // 3. Récupération des boquettes
  const boquettes = await prisma.boquette.findMany({
    orderBy: { nom: 'asc' }
  });

  // 4. Récupération des managers
    // 1. On récupère TOUS les tags concernés (Propriétaires et Autorisés) pour toutes les boquettes
  const allRequiredTags = boquettes.flatMap(b => b.requiredTag || []);
  const allAllowedTags = boquettes.flatMap(b => b.allowedTags || []);
  const uniqueTags = Array.from(new Set([...allRequiredTags, ...allAllowedTags]));

    // 2. Récupération des managers via Prisma
  const allManagers = await prisma.user.findMany({
    where: {
      tags: {
        some: {
          nom: { in: uniqueTags } // Récupère si le tag est dans la liste globale
        }
      }
    },
    select: { 
      id: true, 
      prenom: true, 
      nom: true, 
      tags: { select: { nom: true } } // On ne récupère que le nom du tag pour la performance
    }
  });

  // 5. Mapping avec logique de droits ET redirection d'URL pour l'API
  const boquettesWithData = boquettes.map(b => {

    let safeImageFullUrl = b.imageUrl;
    if (safeImageFullUrl && !safeImageFullUrl.startsWith('/api/') && !safeImageFullUrl.startsWith('http')) {
      const filename = safeImageFullUrl.split('/').pop();
      safeImageFullUrl = `/api/uploads/${filename}`;
    }

    return {
      ...b,
      imageFullUrl: safeImageFullUrl,
      canManage: isSuperAdmin || (hasGlobalManagePermission && (
        session?.allTags.some(tag => b.requiredTag.includes(tag)) ||
        session?.allTags.some(tag => b.allowedTags.includes(tag))
      )),
      managers: allManagers.filter(u => 
        u.tags.some(t => 
          b.requiredTag.includes(t.nom) || b.allowedTags.includes(t.nom)
        )
      )
    };
  });

  return (
    <AuthGuard user={user}>
      <div className={styles.container}>
        
        <div className={styles.backgroundWrapper}>
          <div className={styles.gridPattern} />
          <div className={`${styles.auroraBlob} ${styles.blobBlue}`} />
          <div className={`${styles.auroraBlob} ${styles.blobPurple}`} />
          <div className={`${styles.auroraBlob} ${styles.blobCyan}`} />
        </div>
        
        <header className={styles.header}>
          <div className={styles.headerFlex}>
            <div className={styles.titleGroup}>
              <h1 className={styles.title}>
                <Store className={styles.titleIcon} /> LES <span>BOQUETTES</span>
              </h1>
              <p className={styles.subtitle}>Lieux de vie et boutiques de la communauté</p>
            </div>

            {canAddBoquette && (
              <AddBoquetteButton 
                availableTags={publishingTags.map(t => ({ id: t.nom, label: `#${t.nom}` }))} 
                isSuperAdmin={isSuperAdmin}
              />
            )}
          </div>
        </header>

        <section className={styles.gridSection}>
          <div className={styles.grid}>
            {boquettesWithData.map(b => (
              <BoquetteCard key={b.id} boquette={b} canManage={b.canManage} availableTags={publishingTags.map(t => ({ id: t.nom, label: `#${t.nom}` }))}/>
            ))}
          </div>
        </section>
      </div>
    </AuthGuard>
  );
}