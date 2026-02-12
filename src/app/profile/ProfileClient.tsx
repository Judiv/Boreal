"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { 
  updateProfileInfo, 
  changePassword, 
  logout, 
  markAsRead, 
  clearNotifications,
  deleteAccount // Assure-toi que cette action est exportée dans ton fichier actions.ts
} from "./actions";
import { NOTIFICATION_CONFIG } from "./config";
import { 
  User, Shield, Tag, LogOut, Save, KeyRound, 
  Fingerprint, Bell, Beer, Trash2, Circle, BellOff,
  Store, Info, AlertTriangle, RefreshCw, Wallet, CheckCircle2,
  Eye, EyeOff, AlertCircle, X
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import styles from "./profile.module.css";
import { useBorgia } from "@/context/BorgiaContext";

const IconMap: Record<string, any> = {
  Store,
  Shield,
  Bell,
  Beer,
  Info,
  AlertTriangle
};

type ProfileClientProps = {
  user: any;
  notifications: any[]; 
};

export default function ProfileClient({ user, notifications }: ProfileClientProps) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"infos" | "security" | "badges" | "notifications">("infos");
  const { balance, isConnected, refreshBalance, isLoading } = useBorgia();

  // --- ÉTATS POUR LA SÉCURITÉ & SUPPRESSION ---
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "notifications" || tab === "infos" || tab === "security" || tab === "badges") {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  // --- LOGIQUE DE CHANGEMENT DE MOT DE PASSE ---
  const handlePasswordChange = async (formData: FormData) => {
    setError(null);
    setIsSuccess(false);
    setIsPending(true);

    try {
      const result = await changePassword(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setIsSuccess(true);
      }
    } catch (e) {
      setError("Une erreur inattendue est survenue.");
    } finally {
      setIsPending(false);
    }
  };

  // --- LOGIQUE DE SUPPRESSION DE COMPTE ---
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAccount();
      if (result?.error) {
        alert(result.error);
        setIsDeleting(false);
        setShowDeleteModal(false);
      }
      // Le redirect est géré par l'action (logout)
    } catch (e) {
      alert("Erreur lors de la suppression.");
      setIsDeleting(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className={styles.layout}>
      
      {/* === MENU LATÉRAL === */}
      <div className={styles.sidebar}>
        <div className={`${styles.balanceCard} ${!isConnected ? styles.balanceWarn : ""}`}>
           <div className="relative z-10">
              <div className="flex justify-between items-start">
                <p className="opacity-80 font-bold uppercase tracking-widest text-[10px] mb-1">
                  {isConnected ? "Solde Sibers" : "Non connecté"}
                </p>
                {isConnected && (
                  <button 
                    onClick={() => refreshBalance()} 
                    className={`${styles.refreshBtn} ${isLoading ? styles.spinning : ""}`}
                  >
                    <RefreshCw size={12} />
                  </button>
                )}
              </div>
              <div className="text-3xl font-black tracking-tighter flex items-center gap-2">
                {isConnected ? (
                  <>
                    {balance?.toFixed(2)} <span className="text-sm font-bold opacity-60">€</span>
                  </>
                ) : (
                  <div className="text-lg flex items-center gap-2">
                    <AlertTriangle size={18} /> Reconnecte-toi
                  </div>
                )}
              </div>
           </div>
           <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
        </div>

        <div className={styles.navMenu}>
          <button onClick={() => setActiveTab("infos")} className={`${styles.navButton} ${activeTab === "infos" ? styles.active : ""}`}>
            <User size={18} /> Informations Perso
          </button>
          
          <button onClick={() => setActiveTab("notifications")} className={`${styles.navButton} ${activeTab === "notifications" ? styles.active : ""}`}>
            <div className="relative">
              < Bell size={18} />
              {unreadCount > 0 && <span className={styles.unreadBadge}>{unreadCount}</span>}
            </div>
            Notifications
          </button>

          <button onClick={() => setActiveTab("security")} className={`${styles.navButton} ${activeTab === "security" ? styles.active : ""}`}>
            <Shield size={18} /> Sécurité
          </button>
          
          <button onClick={() => setActiveTab("badges")} className={`${styles.navButton} ${activeTab === "badges" ? styles.active : ""}`}>
            <Tag size={18} /> Rôles & Droits
          </button>
        </div>

        <form action={logout}>
          <button className={styles.dangerBtn}>
            <LogOut size={18} /> Déconnexion
          </button>
        </form>
      </div>

      {/* === CONTENU CENTRAL === */}
      <div className="animate-in fade-in duration-500 flex-1">
        
        {/* --- ONGLET 1 : INFORMATIONS --- */}
        {activeTab === "infos" && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
               <User className="text-blue-500" size={24} />
               <h2 className={styles.cardTitle}>Mes Informations</h2>
            </div>
            
            {!isConnected && (
              <div className={styles.borgiaAlert}>
                <Wallet size={20} />
                <p>Ton solde Borgia n'est pas synchronisé.</p>
              </div>
            )}

            <form action={updateProfileInfo} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={styles.label}>Prénom</label>
                  <input name="prenom" type="text" defaultValue={user.prenom} className={styles.input} />
                </div>
                <div>
                  <label className={styles.label}>Nom</label>
                  <input name="nom" type="text" defaultValue={user.nom} className={styles.input} />
                </div>
                <div>
                  <label className={styles.label}>Bucque</label>
                  <input name="bucque" type="text" defaultValue={user.bucque || ""} className={styles.input} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className={styles.label}>N° Fams</label>
                    <input name="numFams" type="text" defaultValue={user.numFams || ""} className={styles.input} />
                  </div>
                  <div>
                    <label className={styles.label}><div className="flex items-center gap-1"><Fingerprint size={12}/> Identifiant LISE</div></label>
                    <input name="liseId" type="text" defaultValue={user.liseId || ""} className={styles.input} />
                  </div>
              </div>
              <div>
                <label className={styles.label}>Email Ensam (Non modifiable)</label>
                <input type="email" disabled value={user.emailEnsam} className={styles.input} />
              </div>
              <div className="flex justify-end pt-4">
                <button type="submit" className={styles.primaryBtn}>
                  <Save size={18} /> Enregistrer
                </button>
              </div>
            </form>
          </div>
        )}

        {/* --- ONGLET 2 : SÉCURITÉ --- */}
        {activeTab === "security" && (
          <div className="flex flex-col gap-6">
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <KeyRound className="text-blue-500" size={24} />
                <h2 className={styles.cardTitle}>Sécurité</h2>
              </div>

              <form 
                action={handlePasswordChange} 
                className={`${styles.passwordForm} ${error ? styles.shake : ""}`}
              >
                {error && (
                  <div className={styles.errorBanner}>
                    <AlertCircle size={18} />
                    <span>{error}</span>
                  </div>
                )}

                {isSuccess && (
                  <div className={styles.successBanner}>
                    <CheckCircle2 size={18} />
                    <span>Mot de passe mis à jour avec succès !</span>
                  </div>
                )}

                <div className={styles.inputGroup} style={{ marginBottom: '1.5rem' }}>
                  <label className={styles.label}>Mot de passe actuel</label>
                  <div className={styles.passwordWrapper}>
                    <input 
                      name="currentPassword" 
                      type={showCurrent ? "text" : "password"} 
                      className={`${styles.input} ${error ? styles.inputError : ""}`} 
                      required 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowCurrent(!showCurrent)}
                      className={styles.eyeBtn}
                    >
                      {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Nouveau mot de passe</label>
                    <div className={styles.passwordWrapper}>
                      <input 
                        name="newPassword" 
                        type={showNew ? "text" : "password"} 
                        className={styles.input} 
                        required 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowNew(!showNew)}
                        className={styles.eyeBtn}
                      >
                        {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Confirmation</label>
                    <input 
                      name="confirmPassword" 
                      type={showNew ? "text" : "password"} 
                      className={styles.input} 
                      required 
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button type="submit" className={styles.primaryBtn} disabled={isPending}>
                    {isPending ? (
                      <RefreshCw size={18} className={styles.spinning} />
                    ) : (
                      <><RefreshCw size={18} /> Mettre à jour</>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* ZONE DE DANGER */}
            <div className={`${styles.card} ${styles.dangerZone}`}>
              <div className={styles.cardHeader}>
                <AlertTriangle className="text-red-500" size={24} />
                <h2 className={styles.cardTitle}>Zone de Danger</h2>
              </div>
              <p className="text-sm text-slate-400 mb-6">
                La suppression de votre compte est <strong>définitive</strong>. Toutes vos données personnelles seront effacées de nos serveurs.
              </p>
              <button 
                type="button" 
                onClick={() => setShowDeleteModal(true)} 
                className={styles.deleteAccountBtn}
              >
                <Trash2 size={18} /> Supprimer mon compte
              </button>
            </div>
          </div>
        )}

        {/* --- ONGLET 3 : BADGES --- */}
        {activeTab === "badges" && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <Shield className="text-blue-500" size={24} />
              <h2 className={styles.cardTitle}>Accès & Habilitations</h2>
            </div>

            <div className="mb-8">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Statut Actuel</h3>
              <div className={styles.roleCard}>
                <span className="text-xl font-black italic text-white uppercase">{user.role?.nom || "ÉTUDIANT"}</span>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Permissions (Rôle + Perso)</h3>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const rolePerms = user.role?.permissions || [];
                  const customPerms = user.permissionsPerso || [];
                  const allPerms = [...rolePerms, ...customPerms];
                  const uniquePerms = Array.from(new Map(allPerms.map(p => [p.code || p.nom, p])).values());

                  return uniquePerms.length > 0 ? (
                    uniquePerms.map((p: any) => (
                      <span key={p.id} className={styles.permissionTag}>
                        {p.nom || p.code}
                      </span>
                    ))
                  ) : (
                    <p className="text-slate-500 text-sm italic">Aucune permission active.</p>
                  );
                })()}
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Responsabilités (Tags)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {user.tags?.map((tag: any) => (
                  <div key={tag.id} className={styles.badgeItem}>
                    <CheckCircle2 size={16} className="text-blue-500" />
                    <span className="font-bold text-sm text-slate-200">{tag.nom}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- ONGLET 4 : NOTIFICATIONS --- */}
        {activeTab === "notifications" && (
           <div className={styles.card}>
             <div className={styles.cardHeader} style={{ justifyContent: 'space-between' }}>
               <div className="flex items-center gap-3">
                 < Bell className="text-blue-500" size={24} />
                 <h2 className={styles.cardTitle}>Notifications</h2>
               </div>
               {notifications.length > 0 && (
                 <button onClick={() => clearNotifications()} className={styles.clearAllBtn}>
                   <Trash2 size={14} /> Tout effacer
                 </button>
               )}
             </div>
             <div className={styles.notificationList}>
               {notifications.length === 0 ? (
                 <div className={styles.emptyState}>
                   <BellOff size={48} className="opacity-10 mb-4" />
                   <p>Aucune notification.</p>
                 </div>
               ) : (
                 notifications.map((n) => {
                   const config = NOTIFICATION_CONFIG[n.type as keyof typeof NOTIFICATION_CONFIG] || NOTIFICATION_CONFIG.INFO;
                   const IconComponent = IconMap[config.icon] || Bell;
                   return (
                     <div key={n.id} className={`${styles.notifItem} ${n.isRead ? styles.notifRead : styles.notifUnread}`} onClick={() => !n.isRead && markAsRead(n.id)}>
                       <div className={styles.notifIcon} style={{ backgroundColor: `${config.color}15` }}>
                         <IconComponent size={20} style={{ color: config.color }} />
                       </div>
                       <div className={styles.notifContent}>
                         <div className={styles.notifHeader}>
                           <span className={styles.notifTitle} style={{ color: n.isRead ? '#94a3b8' : '#f8fafc' }}>{n.title}</span>
                           <div style={{ width: '20px' }} />
                           <span className={styles.notifDate}>{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: fr })}</span>
                         </div>
                         <p className={styles.notifMessage}>{n.message}</p>
                       </div>
                     </div>
                   );
                 })
               )}
             </div>
           </div>
        )}
      </div>

      {/* --- MODALE DE SUPPRESSION --- */}
      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} animate-in zoom-in duration-200`}>
            <div className={styles.modalHeader}>
              <div className={styles.warningIcon}>
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-white">Supprimer le compte ?</h3>
              <button onClick={() => !isDeleting && setShowDeleteModal(false)} className={styles.closeModal}>
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <p className="text-slate-400 text-center my-4">
                Êtes-vous certain de vouloir supprimer votre compte ? Cette action est <strong>irréversible</strong>.
              </p>
            </div>

            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelBtn} 
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Annuler
              </button>
              <button 
                className={styles.confirmDeleteBtn} 
                onClick={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? <RefreshCw className={styles.spinning} size={18} /> : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}