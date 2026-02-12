// src/app/news/edit/[id]/page.tsx
import { getUserSession } from "@/lib/auth";
import { updateNews } from "../../actions";
import ImageSelector from "@/components/ImageSelector";
import { notFound, redirect } from "next/navigation";
import styles from "./edit.module.css"; 
import { Type, AlignLeft, Save, ImageIcon, FileIcon, X } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAuthorizedCategories } from "@/app/admin/actions"; 
import CategorySelector from "@/components/CategorySelector";
import PdfSelector from "@/components/PdfSelector";

export default async function EditNewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const newsId = parseInt(id);
  const session = await getUserSession();
  
  if (!session) redirect("/login");

  const canManage = session.isSuperAdmin || session.permissions.includes("manage_news");
  if (!canManage) return <div className="text-white p-10">Accès refusé.</div>;

  const news = await prisma.news.findUnique({ where: { id: newsId } });
  if (!news) notFound();

  const authorizedCats = await getAuthorizedCategories();
  
  let options = authorizedCats.map(c => ({
    id: c.code,
    label: c.label
  }));

  if (news.categorie && !options.some(opt => opt.id === news.categorie)) {
    const currentCatDoc = await prisma.category.findUnique({ 
      where: { code: news.categorie } 
    });
    
    options.unshift({
      id: news.categorie,
      label: `${currentCatDoc?.label || news.categorie} (Actuel - Restreint)`
    });
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <h1 className={styles.title}>Modifier <span>l'Annonce #{id}</span></h1>
        
        {/* NOTE: On ne met pas encType="multipart/form-data" manuellement 
          car Next.js le gère automatiquement avec les Server Actions.
        */}
        <form 
          action={updateNews} 
          className={styles.formCard} 
          style={{ position: 'relative' }}
        >
          <Link href="/news" className={styles.closeButton} title="Annuler">
            <X size={20} />
          </Link>

          {/* ID de la news pour l'action update */}
          <input type="hidden" name="id" value={news.id} />

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <div className="flex items-center gap-2"><Type size={14}/> Titre</div>
            </label>
            <input 
              name="titre" 
              type="text" 
              required 
              defaultValue={news.titre} 
              className={styles.input} 
            />
          </div>

          <div className={styles.fieldGroup}>
            <CategorySelector 
              name="categorie" 
              label="Catégorie de l'annonce" 
              categories={options}
              defaultValue={news.categorie} 
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <div className="flex items-center gap-2"><ImageIcon size={14}/> Illustration</div>
            </label>
            <ImageSelector 
              defaultValue={news.imageUrl || ""} 
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <div className="flex items-center gap-2"><FileIcon size={14}/> Document PDF (Optionnel)</div>
            </label>
            <PdfSelector 
              currentPdfUrl={news.pdfUrl} 
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <div className="flex items-center gap-2"><AlignLeft size={14}/> Contenu</div>
            </label>
            <textarea 
              name="contenu" 
              rows={8} 
              required 
              defaultValue={news.contenu} 
              className={styles.textarea}
            ></textarea>
          </div>

          <button type="submit" className={styles.submitButton}>
            <div className="flex items-center justify-center gap-2">
              <Save size={18} /> Enregistrer les modifications
            </div>
          </button>
        </form>
      </div>
    </div>
  );
}