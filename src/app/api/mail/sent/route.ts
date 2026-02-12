import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getUserSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sentMessages = await prisma.message.findMany({
      where: { 
        expediteurId: session.user.id,
        supprimePourExpediteur: false
       },
      include: {
        destinataires: {
          include: { 
            user: { // <-- C'est cette imbrication qui manquait probablement
              select: { bucque: true, prenom: true } 
            } 
          }
        },
        attachments: true
      },
      orderBy: { dateEnvoi: 'desc' }
    });

    return NextResponse.json(sentMessages);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}