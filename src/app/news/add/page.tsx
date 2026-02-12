import { createNews } from "../actions";
import { getUserSession } from "@/lib/auth";
import ImageSelector from "@/components/ImageSelector";
import styles from "./add.module.css";
import { Type, ImageIcon, FileIcon, AlignLeft, Send, X } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthorizedCategories } from "@/app/admin/actions";
import CategorySelector from "@/components/CategorySelector";
import PdfSelector from "@/components/PdfSelector";

export default async function AddNewsPage() {
  const session = await getUserSession();
  if (!session) redirect("/login");

  const authorizedCats = await getAuthorizedCategories();

  if (!session.isSuperAdmin && authorizedCats.length === 0) {
    return (
      <div className={styles.container}>
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-red-400 text-center">
          <h2 className="font-black uppercase italic mb-2">Accès Refusé</h2>
          <p className="text-sm">Vous n'avez pas les tags requis pour publier une annonce.</p>
          <Link href="/news" className="mt-4 inline-block text-xs underline">Retour aux news</Link>
        </div>
      </div>
    );
  }

  const options = authorizedCats.map(cat => ({
    id: cat.code,
    label: cat.label
  }));

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <h1 className={styles.title}>Nouvelle <span>Annonce</span></h1>
        
        <form 
          action={createNews} 
          className={styles.formCard} 
          style={{ position: 'relative' }}
        >
          <Link href="/news" className={styles.closeButton} title="Annuler">
            <X size={20} />
          </Link>

          <div className={styles.authorHeader}>
            <div className={styles.tagsContainer}>
              {session.allTags.length > 0 ? session.allTags.map((tag: string) => (
                <span key={tag} className={styles.tagBadge}>{tag}</span>
              )) : (
                <span className={styles.tagBadge} style={{borderColor: '#52525b', color:'#71717a'}}>Membre</span>
              )}
            </div>
            <span className={styles.authorName}>Auteur : <span>{session.user.prenom}</span></span>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <div className="flex items-center gap-2"><Type size={14}/> Titre</div>
            </label>
            <input name="titre" type="text" required placeholder="Ex: Tournoi de Foot" className={styles.input} />
          </div>

          <div className={styles.fieldGroup}>
            <CategorySelector 
              name="categorie" 
              label="Catégorie de l'annonce" 
              categories={options} 
              placeholder={options.length > 0 ? "Choisir une catégorie..." : "Aucune catégorie autorisée"}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <div className="flex items-center gap-2"><ImageIcon size={14}/> Illustration</div>
            </label>
            <ImageSelector />
          </div>
          
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <div className="flex items-center gap-2"><FileIcon size={14}/> Document PDF (Optionnel)</div>
            </label>
            <PdfSelector />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <div className="flex items-center gap-2"><AlignLeft size={14}/> Message</div>
            </label>
            <textarea name="contenu" rows={6} required className={styles.textarea} placeholder="Écrivez votre annonce ici..."></textarea>
          </div>

          <button type="submit" disabled={options.length === 0} className={styles.submitButton}>
            <div className="flex items-center justify-center gap-2">
              <Send size={18} /> 
              {options.length > 0 ? "Diffuser l'annonce" : "Diffusion impossible"}
            </div>
          </button>
        </form>
      </div>
    </div>
  );
}