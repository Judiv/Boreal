"use client";

import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Bell, Beer, Check, Trash2, Circle } from "lucide-react";
import { markAsRead, clearNotifications } from "./actions";
import styles from "./notifications.module.css";

export default function NotificationList({ notifications }: { notifications: any[] }) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.sectionTitle}>
          <Bell size={18} className="text-blue-500" /> Notifications
        </h3>
        {notifications.length > 0 && (
          <button onClick={() => clearNotifications()} className={styles.clearBtn}>
            Tout effacer
          </button>
        )}
      </div>

      <div className={styles.list}>
        {notifications.length === 0 ? (
          <div className={styles.empty}>
            <p>Rien à signaler, circulez ! 🫡</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id} 
              className={`${styles.item} ${n.isRead ? styles.read : styles.unread}`}
              onClick={() => !n.isRead && markAsRead(n.id)}
            >
              <div className={styles.iconWrapper}>
                {n.type === "ROTANCE" ? <Beer size={20} className="text-amber-500" /> : <Bell size={20} />}
              </div>
              
              <div className={styles.textData}>
                <div className={styles.itemHeader}>
                  <span className={styles.itemTitle}>{n.title}</span>
                  <span className={styles.time}>
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: fr })}
                  </span>
                </div>
                <p className={styles.message}>{n.message}</p>
              </div>

              {!n.isRead && (
                <div className={styles.statusDot}>
                  <Circle size={8} fill="currentColor" className="text-blue-500" />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}