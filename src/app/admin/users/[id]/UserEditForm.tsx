"use client";

import { updateUser } from "./actions";
import { useState } from "react";
import Link from "next/link";
import { 
  Save, ArrowLeft, Shield, Tag, Lock, User, AlertTriangle 
} from "lucide-react";
// ✅ Import du CSS Module
import styles from "./user-edit.module.css"; 

export default function UserEditForm({ data }: { data: any }) {
  const { user, allRoles, allTags, allPermissions } = data;
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true);
    await updateUser(formData);
    setIsPending(false);
    alert("Utilisateur mis à jour avec succès !");
  };

  return (
    <div className={styles.container}>
      
      {/* HEADER */}
      <div className={styles.header}>
        <Link href="/admin?tab=users" className={styles.backLink}>
          <ArrowLeft size={18} /> Retour Dashboard
        </Link>
        <h1 className={styles.title}>
          Éditer <span className={styles.highlight}>{user.prenom} {user.nom}</span>
        </h1>
      </div>

      <form action={handleSubmit}>
        <input type="hidden" name="userId" value={user.id} />

        <div className={styles.grid}>
          
          {/* --- COLONNE GAUCHE (Identité + Rôle) --- */}
          <div className={styles.leftColumn}>
            
            {/* Carte Identité */}
            <div className={styles.card}>
              <h3 className={`${styles.cardHeader} ${styles.accentGray}`}>
                <User size={16} /> Identité
              </h3>
              <div className={styles.infoItem}>
                <span className={styles.label}>Email Ensam</span>
                <div className={styles.value}>{user.emailEnsam}</div>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>ID Lise</span>
                <div className={styles.value}>{user.liseId}</div>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Fam's</span>
                <div className={styles.value}>{user.numFams || "N/A"}</div>
              </div>
            </div>

            {/* Carte Rôle */}
            <div className={styles.card}>
              <h3 className={`${styles.cardHeader} ${styles.accentBlue}`}>
                <Shield size={16} /> Rôle Principal
              </h3>
              <div className={styles.selectWrapper}>
                <select name="roleId" defaultValue={user.roleId} className={styles.select}>
                  {allRoles.map((role: any) => (
                    <option key={role.id} value={role.id}>{role.nom}</option>
                  ))}
                </select>
              </div>
              <p className={styles.helperText}>
                Le rôle détermine les droits d'accès fondamentaux sur la plateforme.
              </p>
            </div>
          </div>

          {/* --- COLONNE DROITE (Tags + Permissions) --- */}
          <div className={styles.rightColumn}>
            
            {/* Carte Tags */}
            <div className={styles.card}>
              <h3 className={`${styles.cardHeader} ${styles.accentGreen}`}>
                <Tag size={16} /> Gestion des Tags
              </h3>
              <div className={styles.checkboxGrid}>
                {allTags.map((tag: any) => {
                  const hasTag = user.tags.some((t: any) => t.id === tag.id);
                  return (
                    <label key={tag.id} className={styles.checkboxLabel}>
                      <input 
                        type="checkbox" 
                        name="tags" 
                        value={tag.id} 
                        defaultChecked={hasTag}
                        className={styles.checkbox}
                      />
                      <span className="text-sm font-medium">#{tag.nom}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Carte Permissions */}
            <div className={styles.card}>
              <h3 className={`${styles.cardHeader} ${styles.accentAmber}`}>
                <Lock size={16} /> Permissions Exceptionnelles
              </h3>
              
              <div className={styles.warningBox}>
                 <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                 <p className={styles.warningText}>
                   Attention : Ces permissions s'ajoutent manuellement à celles du rôle. Utile pour donner des droits temporaires ou spécifiques.
                 </p>
              </div>

              <div className={styles.checkboxGrid}>
                {allPermissions.map((perm: any) => {
                  const hasPerm = user.permissionsPerso.some((p: any) => p.id === perm.id);
                  return (
                    <label key={perm.id} className={styles.checkboxLabel}>
                      <input 
                        type="checkbox" 
                        name="permissions" 
                        value={perm.id} 
                        defaultChecked={hasPerm}
                        className={styles.checkbox}
                        style={{ accentColor: '#fbbf24', borderColor: '#fbbf24' }} 
                      />
                      <span className="text-sm font-mono text-slate-300">{perm.code}</span>
                    </label>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Bouton Sauvegarder (Flottant en bas) */}
        <div className={styles.stickyFooter}>
          <button type="submit" disabled={isPending} className={styles.saveButton}>
            {isPending ? (
              <span>Sauvegarde...</span>
            ) : (
              <>
                <Save size={20} /> Enregistrer les modifications
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}