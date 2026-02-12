import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth";

// ATTENTION : Pas de "default export", juste "export async function GET"
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUserSession();
    if (!session) return NextResponse.json([], { status: 401 });

    const { id } = await params;

    const messages = await prisma.message.findMany({
      where: {
        destinataires: {
          some: {
            userId: session.user.id,
            folderId: id,
            supprime: false 
          }
        }
      },
      include: {
        expediteur: { select: { id: true, bucque: true, prenom: true } },
        destinataires: {
          where: { userId: session.user.id }
        },
        attachments: true
      },
      orderBy: { dateEnvoi: 'desc' }
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("ERREUR API FOLDER:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}