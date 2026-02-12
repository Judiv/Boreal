// src/app/profile/config.ts

export const NOTIFICATION_CONFIG = {
  ROTANCE: {
    icon: "Store",
    color: "#f59e0b",
    sound: "/sounds/notify.mp3",
    label: "Boquettes"
  },
  SYSTEM: {
    icon: "Shield",
    color: "#3b82f6",
    sound: "/sounds/notify.mp3",
    label: "Système"
  },
  INFO: {
    icon: "Bell",
    color: "#94a3b8",
    sound: "/sounds/notify.mp3",
    label: "Info"
  },
  URGENT: {
    icon: "AlertTriangle",
    color: "#ef4444",
    sound: "/sounds/alert.mp3",
    label: "Urgent"
  }
} as const;

export type NotificationType = keyof typeof NOTIFICATION_CONFIG;