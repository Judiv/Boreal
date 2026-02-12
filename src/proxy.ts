import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Next.js attend explicitement une fonction nommée "proxy"
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Lecture du cookie
  const userId = request.cookies.get('userId')?.value;

  // 1. Définition des accès libres
  const isAuthPage = pathname === '/login' || pathname === '/registration' || pathname.startsWith('/reset-password');
  const isTechnical = pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.');

  // Autorisation si page publique ou fichier technique
  if (isAuthPage || isTechnical) {
    return NextResponse.next();
  }

  // 2. Blocage si non connecté
  if (!userId) {
    console.log(`[PROXY] Refusé: ${pathname} -> Login`);
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Autorisation si connecté
  return NextResponse.next();
}

// Obligatoire pour que Next.js sache quoi filtrer
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};