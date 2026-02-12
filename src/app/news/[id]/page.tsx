import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, FileText, ExternalLink, Pencil, Trash2, Download, ChevronLeft } from "lucide-react";
import styles from "./details.module.css";
import { getUserSession } from "@/lib/auth";
import { canEditCategory } from "@/lib/mappings";
import { deleteNews } from "../actions";

export default async function NewsDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const newsId = parseInt(params.id);
  const session = await getUserSession();

  const news = await prisma.news.findUnique({
    where: { id: newsId },
    include: { auteur: true },
  });

  if (!news) notFound();

  // ✅ RÉPARATION DES LIENS (Anciens vs Nouveaux)
  let displayPdfUrl = news.pdfUrl;
  if (displayPdfUrl && (displayPdfUrl.startsWith('/uploads/pdf/') || !displayPdfUrl.startsWith('/api/'))) {
    const filename = displayPdfUrl.split('/').pop();
    displayPdfUrl = `/api/uploads/${filename}`;
  }

  const isAuthor = news.auteurId === session?.user?.id;
  const canDelete = session?.isSuperAdmin || session?.permissions.includes("manage_news") || (isAuthor && canEditCategory(session?.allTags || [], news.categorie));

  return (
    <div className={styles.fullPageContainer}>
      {/* ✅ BOUTON RETOUR FLOTTANT (Haut Gauche) */}
      <Link href="/news" className={styles.floatingBack} title="Retour au journal">
        <ChevronLeft size={24} />
        <span>Retour</span>
      </Link>

      <article className={styles.article}>
        {/* --- HERO SECTION --- */}
        <section className={styles.hero}>
          {news.imageUrl ? (
            <Image src={news.imageUrl} alt={news.titre} fill className={styles.heroImage} priority unoptimized />
          ) : (
            <div className={styles.heroPlaceholder} />
          )}
          <div className={styles.heroContent}>
            <div className={styles.meta}>
              <span className={styles.badge}>{news.categorie}</span>
              <span className={styles.dot}>•</span>
              <span className={styles.date}>
                {new Date(news.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <h1 className={styles.title}>{news.titre}</h1>
          </div>
        </section>

        {/* --- ADMIN BAR --- */}
        {canDelete && (
          <div className={styles.adminBar}>
            <Link href={`/news/edit/${news.id}`} className={styles.editBtn}>
              <Pencil size={16} /> Éditer
            </Link>
            <form action={async () => { "use server"; await deleteNews(news.id); redirect("/news"); }}>
              <button type="submit" className={styles.deleteBtn}>
                <Trash2 size={16} /> Supprimer
              </button>
            </form>
          </div>
        )}

        {/* --- TEXT CONTENT --- */}
        <div className={styles.textSection}>
          <div className={styles.authorInfo}>
            <div className={styles.avatar}>{news.auteur.prenom?.[0]}</div>
            <div>
              <p className={styles.authorName}>{news.auteur.prenom} {news.auteur.nom}</p>
              <p className={styles.subText}>Publication officielle</p>
            </div>
          </div>
          
          <div className={styles.body}>
            {news.contenu.split('\n').map((p, i) => p.trim() && <p key={i}>{p}</p>)}
          </div>
        </div>

        {/* --- PDF SECTION --- */}
        {news.pdfUrl && (
          <section className={styles.pdfSection}>
            <div className={styles.pdfBar}>
              <div className={styles.pdfLabel}>
                <FileText size={22} className={styles.pdfIcon} />
                <span>Document attaché</span>
              </div>
              <div className={styles.pdfActions}>
                <a href={news.pdfUrl} download className={styles.downloadBtn}>
                  <Download size={18} /> Télécharger
                </a>
                <a href={news.pdfUrl} target="_blank" rel="noopener noreferrer" className={styles.externalBtn}>
                  <ExternalLink size={18} />
                </a>
              </div>
            </div>
            <div className={styles.iframeWrapper}>
              <iframe 
                src={displayPdfUrl} // Enlève le #view=FitH pour tester d'abord si le PDF brut s'affiche
                className={styles.iframe}
                title="Visualiseur PDF"
              />
            </div>
          </section>
        )}

        {/* ✅ LIEN DE SORTIE (Bas de page) */}
        <footer className={styles.footer}>
          <Link href="/news" className={styles.bottomBackLink}>
            <ArrowLeft size={18} /> Revenir à la liste des actualités
          </Link>
        </footer>
      </article>
    </div>
  );
}