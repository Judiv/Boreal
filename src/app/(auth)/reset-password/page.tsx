"use client";

import { useState, Suspense } from "react"; // ✅ Ajout de Suspense
import { useSearchParams, useRouter } from "next/navigation";
import { resetPassword } from "./actions";
import styles from "../login/login.module.css";

// 1. On crée un sous-composant qui contient la logique du formulaire
function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirm = formData.get("confirm") as string;

    if (password !== confirm) return alert("Mots de passe différents.");
    
    setLoading(true);
    const res = await resetPassword(token || "", password);
    
    if (res.success) {
      alert("Mot de passe mis à jour !");
      router.push("/");
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  return (
    <div className={styles.modalCard}>
      <h2 className="text-white font-black uppercase italic text-xl mb-6">Nouveau Code d'Accès</h2>
      <form onSubmit={handleUpdate}>
        <div className={styles.inputGroup}>
          <input name="password" type="password" placeholder="NOUVEAU MOT DE PASSE" required className={styles.input} />
        </div>
        <div className={styles.inputGroup}>
          <input name="confirm" type="password" placeholder="CONFIRMATION" required className={styles.input} />
        </div>
        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? "Mise à jour..." : "Valider le changement"}
        </button>
      </form>
    </div>
  );
}

// 2. Le composant principal exporté enveloppe le contenu dans un Suspense
export default function ResetPasswordPage() {
  return (
    <div className={styles.container}>
      {/* ✅ C'est ce Suspense qui permet à Docker de build sans erreur */}
      <Suspense fallback={<div className="text-white">Chargement du formulaire...</div>}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}