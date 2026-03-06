"use client";

import { registerUser } from "./actions";
import { useActionState } from "react";
import Link from "next/link";
import styles from "./registration.module.css";
// Icons
import { User, Mail, Hash, Lock, Info, ArrowRight, Fingerprint, AlertTriangle, Quote } from "lucide-react";

const initialState = {
  error: null as string | null,
};

export default function RegisterPage() {
  const currentYear = new Date().getFullYear(); 
  const [state, formAction, isPending] = useActionState(registerUser, initialState);

  return (
    <div className={styles.container}>
      
      <video autoPlay muted loop playsInline className={styles.videoBackground}>
        <source src="/aurora-dark.mp4" type="video/mp4" />
      </video>

      <div className={styles.overlay}></div>

      <div className={styles.contentWrapper}>
        <div className={styles.registerCard}>
          
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic mb-2">
              Rejoindre <span className="text-blue-500">Boréal</span>
            </h1>
            <p className="text-slate-400 text-sm font-medium">
              Veuillez renseigner vos identifiants Gadz'Arts
            </p>
          </div>

          {state?.error && (
             <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-lg flex items-center gap-3 mb-6 text-sm font-medium animate-pulse">
               <AlertTriangle size={18} className="text-red-500 shrink-0" />
               {state.error}
             </div>
           )}

          <form action={formAction} className="space-y-6">
            
            {/* GRILLE NOM / PRENOM */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  <User size={14} className="text-blue-500" /> Prénom
                </label>
                <input name="prenom" type="text" required placeholder="Archibald" className={styles.input} />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  <User size={14} className="text-blue-500" /> Nom
                </label>
                <input name="nom" type="text" required placeholder="Haddock" className={styles.input} />
              </div>
            </div>

            {/* SECTION BUCQUE (Pleine largeur ou grille selon tes goûts) */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                <Quote size={14} className="text-blue-500" /> Bucque
              </label>
              <input 
                name="bucque" 
                type="text" 
                required 
                placeholder="Ex: Ma Bucque" 
                className={styles.input} 
              />
            </div>

            {/* GRILLE EMAIL / FAMS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  <Mail size={14} className="text-blue-500" /> Email
                </label>
                <input name="email" type="email" required placeholder="your email" className={styles.input} />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  <Hash size={14} className="text-blue-500" /> N° Fam's
                </label>
                <input name="numFams" type="text" required placeholder="123" className={styles.input} />
              </div>
            </div>

            {/* ID LISE + MOT DE PASSE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  <Fingerprint size={14} className="text-blue-500" /> Identifiant LISE
                </label>
                <input 
                  name="liseId" 
                  type="text" 
                  required 
                  placeholder={`${currentYear}-XXXX`} 
                  pattern="20[0-9]{2}-[0-9]{4}"
                  title="Format attendu : Année-Matricule (ex: 2025-1234)"
                  className={styles.input} 
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  <Lock size={14} className="text-blue-500" /> Mot de passe (pas forcément le même que LISE)
                </label>
                <input name="password" type="password" required placeholder="••••••••" className={styles.input} />
              </div>
            </div>

            <div className={styles.infoBox}>
               <Info size={24} className="shrink-0" />
               <p>
                 Vos accès <strong>Borgia</strong> et <strong>Ensam</strong> seront synchronisés automatiquement.
               </p>
            </div>

            <button type="submit" disabled={isPending} className={styles.submitBtn}>
              {isPending ? "Création en cours..." : "Créer mon compte"}
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-white/10">
            <p className="text-slate-400 text-xs font-medium">
              Déjà inscrit ? 
              <Link href="/login" className="text-blue-400 font-bold hover:text-white ml-2 inline-flex items-center transition-colors">
                Se connecter <ArrowRight size={12} className="ml-1" />
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}