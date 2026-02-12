import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getUserSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const inbox = await prisma.message.findMany({
      where: {
        destinataires: {
          some: {
            userId: session.user.id,
            supprime: false,
            folderId: null 
          }
        }
      },
      include: {
        // ✅ On récupère plus d'infos au cas où la bucque est vide
        expediteur: { 
          select: { 
            id: true,
            bucque: true, 
            prenom: true, 
            nom: true 
          } 
        },
        destinataires: { 
          where: { userId: session.user.id } 
        },
        attachments: true
      },
      orderBy: { dateEnvoi: 'desc' }
    });

    return NextResponse.json(inbox);
  } catch (error) {
    console.error("Erreur Inbox API:", error);
    return NextResponse.json({ error: "Failed to fetch inbox" }, { status: 500 });
  }
}