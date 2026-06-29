import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request) {
  try {
    const role = request.headers.get('x-user-role')

    let folders

    if (role === 'ADMIN' || role === 'USER_PLUS') {
      // ADMIN and USER_PLUS see all folders with their files
      folders = await prisma.folder.findMany({
        include: {
          files: {
            include: {
              uploadedBy: { select: { id: true, name: true, email: true } },
            },
          },
          createdBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
    } else {
      // USER sees only public folders
      folders = await prisma.folder.findMany({
        where: { isPublic: true },
        include: {
          files: {
            include: {
              uploadedBy: { select: { id: true, name: true, email: true } },
            },
          },
          createdBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
    }

    return NextResponse.json({ success: true, folders })
  } catch (error) {
    console.error('[GET /api/folders]', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    )
  }
}
