"use client";

import { createContext, useContext, ReactNode } from "react";

// Structure de notre session client
type AuthState = {
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  permissions: string[];
  user: any | null;
};

const AuthContext = createContext<AuthState>({
  isAuthenticated: false,
  isSuperAdmin: false,
  permissions: [],
  user: null,
});

// 1. LE PROVIDER (À mettre dans le layout)
export function AuthProvider({ 
  session, 
  children 
}: { 
  session: any, 
  children: ReactNode 
}) {
  const value = session 
    ? { isAuthenticated: true, ...session }
    : { isAuthenticated: false, isSuperAdmin: false, permissions: [], user: null };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 2. LE HOOK (Pour la logique JS : if (can('edit')) ...)
export function useAuth() {
  const context = useContext(AuthContext);
  
  const can = (permissionCode: string) => {
    if (!context.isAuthenticated) return false;
    if (context.isSuperAdmin) return true; // Le chef peut tout faire
    return context.permissions.includes(permissionCode);
  };

  return { ...context, can };
}

// 3. LE COMPOSANT D'AFFICHAGE (Pour le JSX)
// Affiche les enfants SEULEMENT si la permission est validée
export function Protect({ 
  code, 
  children, 
  fallback = null 
}: { 
  code: string, 
  children: ReactNode, 
  fallback?: ReactNode 
}) {
  const { can } = useAuth();

  if (can(code)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}