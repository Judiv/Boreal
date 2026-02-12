"use client";

import { useState } from "react";
import { Wallet, X, Lock, Loader2, AlertCircle, User } from "lucide-react";
import styles from "./borgiaModal.module.css";

export default function BorgiaModal({ isOpen, onClose, onLoginSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    
    try {
      // On appelle une action serveur qui va tenter de se connecter à Borgia
      const res = await fetch("/api/borgia/login", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(formData)),
      });

      if (res.ok) {
        onLoginSuccess();
        onClose();
      } else {
        setError("Identifiants Borgia incorrects");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur Borgia");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}><X /></button>
        
        <div className={styles.header}>
          <div className={styles.iconBox}><Wallet size={32} /></div>
          <h2>Connexion Borgia</h2>
          <p>Connecte-toi pour synchroniser ton solde en temps réel.</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <User size={18} />
            <input name="username" placeholder="Login Borgia" required />
          </div>
          <div className={styles.inputGroup}>
            <Lock size={18} />
            <input name="password" type="password" placeholder="Mot de passe" required />
          </div>

          {error && <div className={styles.error}><AlertCircle size={16} /> {error}</div>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <Loader2 className={styles.spin} /> : "Se connecter"}
          </button>
        </form>
        
        <button className={styles.skipBtn} onClick={onClose}>Plus tard</button>
      </div>
    </div>
  );
}