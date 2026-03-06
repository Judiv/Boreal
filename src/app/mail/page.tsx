"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Inbox, Send, Plus, Trash2, Folder as FolderIcon, 
  ChevronLeft, Reply, Paperclip, X, Loader2, Eye, Download, FileText,
  FolderPlus, FolderMinus, Eraser, RotateCcw
} from "lucide-react";
import styles from "./mail.module.css";
import { 
  createFolder, deleteFolder, moveMessageToFolder, 
  markAsRead, deleteMessage, restoreMessage, emptyTrash 
} from "./actions";

export default function MailPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("inbox");
  const [messages, setMessages] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [selectedMsg, setSelectedMsg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [toast, setToast] = useState<{ msg: string; visible: boolean; showUndo: boolean }>({ 
    msg: "", visible: false, showUndo: false 
  });
  const [lastDeletedId, setLastDeletedId] = useState<string | null>(null);

  // Fonction pour nettoyer le HTML des balises <p>, <b> etc. dans l'aperçu
  const stripHtml = (html: string) => {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, ' ');
  };

  const showToast = (message: string, canUndo = false) => {
    setToast({ msg: message, visible: true, showUndo: canUndo });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 5000);
  };

  const fetchFolders = async () => {
    try {
      const res = await fetch("/api/mail/folders");
      const data = await res.json();
      setFolders(data);
    } catch (e) { console.error(e); }
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      let url = `/api/mail/inbox`;
      if (activeTab === "sent") url = `/api/mail/sent`;
      else if (activeTab === "trash") url = `/api/mail/trash`;
      else if (!["inbox", "sent", "trash"].includes(activeTab)) url = "/api/mail/folders/" + activeTab;
      
      const res = await fetch(url);
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (e) {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFolders(); }, []);
  useEffect(() => { fetchMessages(); setSelectedMsg(null); }, [activeTab]);

  const handleOpenMessage = async (msg: any) => {
    setSelectedMsg(msg);
    if (!["sent", "trash"].includes(activeTab) && !msg.destinataires?.[0]?.lu) {
      await markAsRead(msg.id);
      setMessages(prev => prev.map(m => m.id === msg.id ? {
        ...m, destinataires: m.destinataires.map((d:any) => ({ ...d, lu: true }))
      } : m));
    }
  };

  const handleUndo = async () => {
    if (!lastDeletedId) return;
    const res = await restoreMessage(lastDeletedId);
    if (res.success) {
      setLastDeletedId(null);
      setToast({ msg: "", visible: false, showUndo: false });
      fetchMessages();
    }
  };

  const handleCreateFolder = async () => {
    const name = prompt("📂 Nom du nouveau dossier :");
    if (name) {
      const res = await createFolder(name);
      if (res.success) {
        fetchFolders();
        showToast("Dossier créé");
      }
    }
  };

  const handleDeleteFolder = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("🗑️ Supprimer ce dossier ?")) {
      const res = await deleteFolder(id);
      if (res.success) {
        if (activeTab === id) setActiveTab("inbox");
        fetchFolders();
        showToast("Dossier supprimé");
      }
    }
  };

  const handleEmptyTrash = async () => {
    if (!confirm("Voulez-vous vider définitivement toute la corbeille ?")) return;
    const res = await emptyTrash();
    if (res.success) {
      fetchMessages();
      showToast("Corbeille vidée");
    }
  };

  const handleReply = () => {
    if (!selectedMsg || !selectedMsg.expediteur) return;
    const replyParams = new URLSearchParams({
      replyToId: selectedMsg.expediteur?.id || "",
      replyToBucque: selectedMsg.expediteur?.bucque || "Inconnu",
      subject: `Re: ${selectedMsg.objet}`,
      parentMessageId: selectedMsg.id
    });
    router.push(`/mail/new?${replyParams.toString()}`);
  };

  const handleDeleteMsg = async () => {
    if (!selectedMsg) return;
    const msgId = selectedMsg.id;
    const isTrash = activeTab === "trash";

    if (isTrash && !confirm("Supprimer définitivement ce message ?")) return;

    const res = await deleteMessage(msgId);
    if (res.success) {
      setLastDeletedId(isTrash ? null : msgId);
      setSelectedMsg(null);
      fetchMessages();
      showToast(
        isTrash ? "Message supprimé définitivement" : "Message mis à la corbeille", 
        !isTrash
      );
    }
  };

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <button className={styles.composeBtn} onClick={() => router.push("/mail/new")}>
          <Plus size={20} /> Nouveau message
        </button>

        <nav className={styles.sideNav}>
          <button className={`${styles.navItem} ${activeTab === 'inbox' ? styles.navActive : ''}`} onClick={() => setActiveTab('inbox')}>
            <Inbox size={20} /> Boîte de réception
          </button>
          <button className={`${styles.navItem} ${activeTab === 'sent' ? styles.navActive : ''}`} onClick={() => setActiveTab('sent')}>
            <Send size={20} /> Envoyés
          </button>
          <button className={`${styles.navItem} ${activeTab === 'trash' ? styles.navActive : ''}`} onClick={() => setActiveTab('trash')}>
            <Trash2 size={20} /> Corbeille
          </button>

          <div className={styles.navHeaderRow}>
            <span className={styles.navSeparator}>Mes Dossiers</span>
            <button className={styles.iconActionBtn} onClick={handleCreateFolder}><FolderPlus size={18}/></button>
          </div>

          <div className={styles.foldersList}>
            {folders.map(f => (
              <div key={f.id} className={`${styles.navItem} ${activeTab === f.id ? styles.navActive : ''}`} onClick={() => setActiveTab(f.id)}>
                <FolderIcon size={18} style={{ color: f.color || '#3b82f6' }} />
                <span className={styles.folderNameText}>{f.nom}</span>
                <button className={styles.delFolderBtn} onClick={(e) => handleDeleteFolder(e, f.id)}><FolderMinus size={16}/></button>
              </div>
            ))}
          </div>
        </nav>
      </aside>

      <main className={styles.mainContent}>
        {selectedMsg ? (
          <div className={styles.detailWrapper}>
            <div className={styles.detailHeader}>
              <button className={styles.backBtnFlat} onClick={() => setSelectedMsg(null)}>
                <ChevronLeft size={24} /> <span>Retour</span>
              </button>
              
              <div className={styles.detailActionsBar}>
                {!["sent", "trash"].includes(activeTab) && (
                  <>
                    <div className={styles.selectWrapper}>
                      <FolderIcon size={16} className={styles.selectIcon} />
                      <select 
                        className={styles.folderSelectStyled}
                        value={selectedMsg.destinataires?.[0]?.folderId || ""}
                        onChange={async (e) => {
                          await moveMessageToFolder(selectedMsg.id, e.target.value);
                          setSelectedMsg(null);
                          fetchMessages();
                          showToast("Message classé");
                        }}
                      >
                        <option value="">Ranger dans...</option>
                        <option value="inbox">📥 Boîte de réception</option>
                        {folders.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                      </select>
                    </div>
                    <div className={styles.actionsDivider} />
                    <button onClick={handleReply} className={styles.actionBtnIcon} title="Répondre"><Reply size={20} /></button>
                  </>
                )}
                <button onClick={handleDeleteMsg} className={`${styles.actionBtnIcon} ${styles.danger}`} title="Supprimer">
                  <Trash2 size={20}/>
                </button>
              </div>
            </div>

            <div className={styles.glassCard}>
              <div className={styles.cardTop}>
                <h1 className={styles.objetMainTitle}>{selectedMsg.objet}</h1>
                <div className={styles.senderInfo}>
                  <div className={styles.avatarLarge}>
                    {selectedMsg.expediteur?.bucque?.[0]?.toUpperCase() || 
                    selectedMsg.expediteur?.prenom?.[0]?.toUpperCase() || 
                    "?"}
                  </div>
                  <div className={styles.senderMeta}>
                    <span className={styles.senderBucque}>{selectedMsg.expediteur?.bucque}</span>
                    <span className={styles.sendDate}>{new Date(selectedMsg.dateEnvoi).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div 
                className={`${styles.messageBody} ${styles.messageBodyRich}`} 
                dangerouslySetInnerHTML={{ __html: selectedMsg.contenu }} 
              />

              {selectedMsg.attachments?.length > 0 && (
                <div className={styles.attachmentGallery}>
                  <div className={styles.galleryHeader}><Paperclip size={16} /> Fichiers joints</div>
                  <div className={styles.gridAttachments}>
                    {selectedMsg.attachments.map((file: any) => (
                      <div key={file.id} className={styles.fileCard}>
                        <FileText size={20} className={styles.fileIconMain} />
                        <div className={styles.fileInfo}>
                          <span className={styles.fileNameSmall}>{file.name}</span>
                          <span className={styles.fileSizeSmall}>{(file.size / 1024).toFixed(0)} KB</span>
                        </div>
                        <div className={styles.fileActions}>
                           <button className={styles.fileActionBtn} onClick={() => window.open(file.url, '_blank')}><Eye size={16} /></button>
                           <a href={file.url} download={file.name} className={styles.fileActionBtn}><Download size={16} /></a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.inboxWrapper}>
            <div className={styles.headerRow}>
              <h1 className={styles.title}>
                {activeTab === 'inbox' ? "Réception" : activeTab === 'sent' ? "Envoyés" : activeTab === 'trash' ? "Corbeille" : folders.find(f => f.id === activeTab)?.nom || "Dossier"}
              </h1>
              {activeTab === 'trash' && messages.length > 0 && (
                <button className={styles.emptyTrashBtn} onClick={handleEmptyTrash}>
                    <Eraser size={16} /> Vider la corbeille
                </button>
              )}
            </div>
            
            {loading ? (
              <div className={styles.loaderCenter}><Loader2 className="animate-spin" size={32} /></div>
            ) : (
              <div className={styles.list}>
                {messages.map(msg => {
                  const isUnread = !["sent", "trash"].includes(activeTab) && !msg.destinataires?.[0]?.lu;
                  return (
                    <div key={msg.id} className={`${styles.messageItem} ${isUnread ? styles.unreadItem : ''}`} onClick={() => handleOpenMessage(msg)}>
                      {isUnread && <div className={styles.unreadDot} />}
                      <div className={styles.itemMain}>
                        <div className={styles.itemHeader}>
                          <span className={styles.itemBucque}>
                            {activeTab === 'sent' ? `À: ${msg.destinataires?.map((d:any) => d.user?.bucque || "Inconnu").join(', ')}` : msg.expediteur?.bucque}
                          </span>
                          <div style={{ width: '20px' }} />
                          <span className={styles.itemDate}>{new Date(msg.dateEnvoi).toLocaleDateString()}</span>
                        </div>
                        <div className={styles.itemObjet}>{msg.objet}</div>
                        <div className={styles.itemSnippet}>{stripHtml(msg.contenu)}</div>
                      </div>
                    </div>
                  );
                })}
                {messages.length === 0 && <div className={styles.emptyState}>Aucun message trouvé</div>}
              </div>
            )}
          </div>
        )}
      </main>

      {toast.visible && (
        <div className={styles.toastNotification}>
          <div className={styles.toastContent}>
            <div className={styles.toastPulse}><Trash2 size={18} className={styles.toastIcon} /></div>
            <div className={styles.toastTextGroup}>
              <span>{toast.msg}</span>
              {toast.showUndo && (
                <button onClick={handleUndo} className={styles.undoBtn}>
                  <RotateCcw size={14} /> ANNULER
                </button>
              )}
            </div>
          </div>
          <button onClick={() => setToast(prev => ({ ...prev, visible: false }))} className={styles.toastClose}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}