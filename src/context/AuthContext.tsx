"use client";

import { createContext, useContext, ReactNode } from "react";

// 1. DÉFINITION DE LA STRUCTURE
type AuthState = {
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  permissions: string[];
  user: any | null;
};

const AuthPermissionsContext = createContext<AuthState>({
  isAuthenticated: false,
  isSuperAdmin: false,
  permissions: [],
  user: null,
});

// 2. LE PROVIDER UNIFIÉ (SANS NEXT-AUTH)
export default function AuthContext({ 
  session, 
  children 
}: { 
  session: any, 
  children: ReactNode 
}) {
  // session correspond ici à ce que renvoie getUserSession() dans ton layout
  const value = session 
    ? { 
        isAuthenticated: true, 
        isSuperAdmin: session.isSuperAdmin || false, 
        permissions: session.permissions || [], 
        user: session.user 
      }
    : { 
        isAuthenticated: false, 
        isSuperAdmin: false, 
        permissions: [], 
        user: null 
      };

  return (
    <AuthPermissionsContext.Provider value={value}>
      {children}
    </AuthPermissionsContext.Provider>
  );
}

// 3. LE HOOK useAuth
export function useAuth() {
  const context = useContext(AuthPermissionsContext);
  
  const can = (permissionCode: string) => {
    if (!context || !context.isAuthenticated) return false;
    if (context.isSuperAdmin) return true; 
    return context.permissions.includes(permissionCode);
  };

  return { ...context, can };
}

// 4. LE COMPOSANT Protect
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