import Link from "next/link";
import Image from "next/image";
import { deleteNews } from "./actions";
import styles from "./news.module.css";
import { Plus, Pencil, Trash2, Image as ImageIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getUserSession, getUser } from "@/lib/auth"; 
import { canEditCategory } from "@/lib/mappings";
import AuthGuard from "@/components/AuthGuard";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const user = await getUser().catch(() => null);
  const allNews = await prisma.news.findMany({
    include: { auteur: true },
    orderBy: { createdAt: 'desc' }
  });

  const session = await getUserSession();
  const isSuperAdmin = session?.isSuperAdmin;
  const permissions = session?.permissions || [];
  const userTags = session?.allTags || []; 
  const currentUserId = session?.user?.id;

  const canGlobalManage = isSuperAdmin || permissions.includes("manage_news");

  return (
    <AuthGuard user={user}>
      <div className={styles.container}>
        <div className={styles.wrapper}>
          
          <div className={styles.header}>
            <h1 className={styles.title}>Journal <br/><span>de Boréal</span></h1>
            {canGlobalManage && (
              <Link href="/news/add" className={styles.addButton}>
                <Plus size={18} strokeWidth={4} /> Publier
              </Link>
            )}
          </div>

          <div className={styles.grid}>
            {allNews.map((news) => {
              const isAuthor = news.auteurId === currentUserId;
              const matchesCategory = canEditCategory(userTags, news.categorie);
              const canEditThisNews = canGlobalManage && (isSuperAdmin || matchesCategory || isAuthor);

              return (
                <article key={news.id} className={styles.card}>
                  
                  {/* ✅ BOUTONS D'ACTION (ÉDITER & SUPPRIMER) */}
                  {canEditThisNews && (
                    <div className={styles.actions}>
                      <Link href={`/news/edit/${news.id}`} className={styles.actionBtn} title="Modifier">
                        <Pencil size={14} />
                      </Link>
                      
                      {/* Formulaire de suppression direct */}
                      <form action={async () => {
                        "use server";
                        await deleteNews(news.id);
                      }}>
                        <button type="submit" className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Supprimer">
                          <Trash2 size={14} />
                        </button>
                      </form>
                    </div>
                  )}

                  {/* LIEN GLOBAL SUR LA CARTE */}
                  <Link href={`/news/${news.id}`} className={styles.cardLink}>
                    <div className={styles.imageWrapper}>
                      {news.imageUrl ? (
                        <Image src={news.imageUrl} alt={news.titre} fill className={styles.image} unoptimized />
                      ) : (
                        <div className={styles.noImage}><ImageIcon size={40} className="opacity-20" /></div>
                      )}
                    </div>

                    <div className={styles.cardBody}>
                      <div className={styles.cardHeader}>
                        <span className={styles.category}>{news.categorie}</span>
                        <span className={styles.date}>{new Date(news.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <h2 className={styles.cardTitle}>{news.titre}</h2>
                      <p className={styles.cardContent}>
                        {news.contenu.length > 120 ? news.contenu.substring(0, 120) + "..." : news.contenu}
                      </p>
                      
                      <div className={styles.cardFooter}>
                        <div className={styles.avatar}>{news.auteur.prenom?.[0]}</div>
                        <span className={styles.authorName}>{news.auteur.prenom} {news.auteur.nom}</span>
                      </div>
                    </div>
                  </Link>

                </article>
              );
            })}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}