"use client";

import { useEffect, useState, useMemo } from "react";
import { loginUser } from "./actions";
import { requestPasswordReset } from "./actions"; // ✅ Import de l'action de reset
import Link from "next/link";
import styles from "./login.module.css";
import { X, Mail, Lock, ArrowLeft, Send, CheckCircle2 } from "lucide-react";
import { useLoginModal } from "@/context/LoginModalContext";

// Particules
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

export default function LoginPage() {
  const { isLoginModalOpen, openLoginModal, closeLoginModal } = useLoginModal();
  const [init, setInit] = useState(false);

  // ✅ États pour le mot de passe oublié
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesOptions = useMemo(() => ({
    fpsLimit: 60,
    particles: {
      number: { value: 30, density: { enable: true, area: 800 } },
      color: { value: "#ffffff" },
      shape: { type: "circle" },
      opacity: { value: { min: 0.05, max: 0.2 } },
      size: { value: { min: 1, max: 2 } },
      move: {
        enable: true,
        speed: 0.15,
        direction: "top",
        random: true,
        straight: false,
        outModes: { default: "out" },
      },
    },
    interactivity: {
      events: { onHover: { enable: true, mode: "bubble" } },
      modes: { bubble: { size: 4, duration: 2, opacity: 0.6 } },
    },
    detectRetina: true,
  }), []);

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("📨 [Client] Tentative d'envoi pour :", resetEmail);
    setResetLoading(true);
    
    try {
      const result = await requestPasswordReset(resetEmail);
      console.log("📥 [Client] Réponse du serveur :", result);
      
      if (result?.error) {
        alert("Erreur serveur : " + result.error);
      } else {
        setResetSent(true);
      }
    } catch (err) {
      console.error("🔥 [Client] Erreur critique :", err);
      alert("Impossible de contacter le serveur.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.auroraWrapper}>
        <div className={styles.aurora} />
      </div>
      <div className={styles.noise} />
      
      {init && (
        <Particles
          id="tsparticles"
          options={particlesOptions as any}
          className="absolute inset-0 pointer-events-none"
        />
      )}

      <div className={styles.landingContent}>
        <h1 className={styles.brandName}>BOREAL</h1>
        <p className="text-slate-400 text-sm uppercase tracking-[0.5em] font-black">
          Portail Résident Gadz'Arts
        </p>
        <button onClick={openLoginModal} className={styles.openButton}>
          Entrer
        </button>
      </div>

      {isLoginModalOpen && (
        <div className={styles.modalOverlay} onClick={closeLoginModal}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => {
              closeLoginModal();
              setShowReset(false);
              setResetSent(false);
            }}>
              <X size={24} />
            </button>

            {!showReset ? (
              /* --- FORMULAIRE DE CONNEXION --- */
              <>
                <div className="text-center mb-10">
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                    Accès Authentifié
                  </h2>
                  <p className="text-slate-500 text-[10px] uppercase tracking-widest mt-2 font-bold">
                    Système de gestion Boreal v1
                  </p>
                </div>

                <form action={loginUser}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>
                      <Mail size={10} className="inline mr-2 opacity-50" />
                      Email
                    </label>
                    <input name="email" type="email" required placeholder="your mail" className={styles.input} />
                  </div>

                  <div className={styles.inputGroup}>
                    <div className="flex justify-between items-center mb-1">
                      <label className={styles.label}>
                        <Lock size={10} className="inline mr-2 opacity-50" />
                        Mot de passe
                      </label>
                      <button 
                        type="button" 
                        onClick={() => setShowReset(true)}
                        className={styles.forgotBtn}
                      >
                        Oublié ?
                      </button>
                    </div>
                    <input name="password" type="password" required placeholder="••••••••" className={styles.input} />
                  </div>

                  <div className={styles.rememberRow}>
                     <input type="checkbox" name="remember" id="remember" className="rounded bg-white/5 border-white/10 text-blue-600 focus:ring-0 cursor-pointer" />
                     <label htmlFor="remember" className="text-[10px] font-black text-slate-500 uppercase cursor-pointer">
                       Rester connecté
                     </label>
                  </div>

                  <button type="submit" className={styles.submitBtn}>Connexion</button>
                </form>
              </>
            ) : (
              /* --- FORMULAIRE MOT DE PASSE OUBLIÉ --- */
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <button onClick={() => {setShowReset(false); setResetSent(false);}} className={styles.backBtn}>
                  <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Retour</span>
                </button>

                <div className="text-center mb-8">
                  <h2 className="text-xl font-black text-white uppercase italic">Récupération</h2>
                  <p className="text-slate-500 text-[10px] uppercase tracking-widest mt-2">
                    Un lien sécurisé vous sera transmis
                  </p>
                </div>

                {!resetSent ? (
                  <form onSubmit={handleResetSubmit}>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Email</label>
                      <input 
                        type="email" 
                        required 
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="your email" 
                        className={styles.input} 
                      />
                    </div>
                    <button type="submit" disabled={resetLoading} className={styles.submitBtn}>
                      {resetLoading ? "Chiffrement..." : "Envoyer le lien"}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-4">
                    <CheckCircle2 size={40} className="text-green-500 mx-auto mb-4 animate-bounce" />
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Si cet email est reconnu, un lien de réinitialisation vient d'être généré.
                    </p>
                    <p className="text-[9px] text-slate-500 uppercase mt-4 font-bold">
                      Vérifiez vos spams ou la console Docker
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <Link href="/registration" className="text-[10px] uppercase font-black text-slate-500 hover:text-blue-400 transition-colors">
                Demander un accès résident
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}