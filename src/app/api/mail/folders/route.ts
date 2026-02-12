import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth";

// BIEN UTILISER "export async function GET" et non "default"
export async function GET() {
  try {
    const session = await getUserSession();
    if (!session) return NextResponse.json([], { status: 401 });

    const folders = await prisma.folder.findMany({
      where: { 
        userId: session.user.id,
      },
      orderBy: { nom: 'asc' }
    });

    return NextResponse.json(folders);
  } catch (error) {
    console.error("Erreur API Folders:", error);
    return NextResponse.json([], { status: 500 });
  }
}