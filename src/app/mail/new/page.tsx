"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../mail.module.css";
import { ChevronLeft, Send, Paperclip, Loader2, FileText, X, PenLine } from "lucide-react";
import RecipientSearch from "./RecipientSearch";
import RichEditor from "./RichEditor";
import { sendInternalMessage } from "../actions";

// 1. On crée un composant interne pour gérer la logique des paramètres d'URL
function NewMailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const replyToId = searchParams.get("replyToId");
  const replyToBucque = searchParams.get("replyToBucque");
  const subjectParam = searchParams.get("subject");
  const parentMessageId = searchParams.get("parentMessageId");

  const [isSending, setIsSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [recipientIds, setRecipientIds] = useState<string[]>([]);
  const [contenuHtml, setContenuHtml] = useState(""); 
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (replyToId) {
      setRecipientIds([replyToId]);
    }
  }, [replyToId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const objetValue = (form.elements.namedItem("objet") as HTMLInputElement).value;
    
    if (recipientIds.length === 0) {
      alert("Veuillez sélectionner au moins un destinataire.");
      return;
    }

    setIsSending(true);

    try {
      const formData = new FormData();
      formData.append("objet", objetValue);
      formData.append("contenu", contenuHtml);
      formData.append("recipientIds", JSON.stringify(recipientIds));
      
      if (selectedFiles.length > 0) {
        selectedFiles.forEach((file) => {
          formData.append("files", file);
        });
      }
      
      if (parentMessageId) {
        formData.append("parentMessageId", parentMessageId);
      }

      const result = await sendInternalMessage(null, formData);

      if (result?.error) {
        alert("Erreur : " + result.error);
      } else {
        router.push("/mail");
        router.refresh();
      }
    } catch (err: any) {
      alert("Erreur lors de l'envoi : " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <button className={styles.backBtnFlat} onClick={() => router.back()}>
          <ChevronLeft size={20} /> Retour au courrier
        </button>
        
        <div className={styles.composeInfoCard}>
          <div className={styles.avatarLarge}>
            <PenLine size={24} />
          </div>
          <h3>Rédaction</h3>
          <p>Utilisez la barre d'outils pour mettre en forme votre message.</p>
        </div>
      </aside>

      <main className={styles.mainContent}>
        <div className={styles.detailWrapper}>
          <div className={styles.headerRow}>
            <h1 className={styles.title}>
              {parentMessageId ? "Répondre" : "Nouveau message"}
            </h1>
          </div>

          <form onSubmit={handleSubmit} encType="multipart/form-data" className={styles.glassCardCompose}>
            <div className={styles.composeRow}>
              <label className={styles.composeLabel}>À :</label>
              <div className={styles.composeField}>
                <RecipientSearch 
                  onSelectionChange={setRecipientIds} 
                  initialRecipient={replyToId ? { id: replyToId, bucque: replyToBucque || "" } : undefined}
                />
              </div>
            </div>

            <div className={styles.composeRow}>
              <label className={styles.composeLabel}>Objet :</label>
              <div className={styles.composeField}>
                <input 
                  name="objet" 
                  defaultValue={subjectParam || ""}
                  placeholder="Sujet de votre message..." 
                  className={styles.composeInput} 
                  required 
                  autoComplete="off" 
                />
              </div>
            </div>

            <div className={styles.composeAreaWrapper}>
              <RichEditor 
                onChange={setContenuHtml} 
                initialContent={parentMessageId ? "En réponse à votre message..." : ""}
              />
            </div>

            {selectedFiles.length > 0 && (
              <div className={styles.attachmentGalleryCompose}>
                {selectedFiles.map((f, i) => (
                  <div key={i} className={styles.fileCardSmall}>
                    <FileText size={16} className={styles.fileIconBlue} />
                    <span className={styles.fileNameTiny}>{f.name}</span>
                    <button 
                      type="button"
                      className={styles.removeFileBtn}
                      onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.composeFooter}>
              <input 
                type="file" multiple ref={fileInputRef} 
                onChange={(e) => {
                  if (e.target.files) {
                    setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                  }
                }} 
                style={{ display: 'none' }} 
              />
              
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()} 
                className={styles.attachBtnCompose}
              >
                <Paperclip size={18} /> Joindre des fichiers
              </button>
              
              <button type="submit" className={styles.sendBtnPremium} disabled={isSending}>
                {isSending ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <><Send size={18} /> Envoyer le message</>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

// 2. Le composant exporté par défaut qui enveloppe tout dans un Suspense Boundary
export default function NewMailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-[#0f0f11] text-white">
        <Loader2 className="animate-spin mr-2" /> Chargement du formulaire...
      </div>
    }>
      <NewMailForm />
    </Suspense>
  );
}