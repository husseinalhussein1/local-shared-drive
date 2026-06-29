import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request) {
  try {
    const role = request.headers.get('x-user-role')
    const userId = parseInt(request.headers.get('x-user-id'))

    // Only USER_PLUS and ADMIN can create folders
    if (role !== 'USER_PLUS' && role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Forbidden: Insufficient permissions.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, isPublic } = body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Folder name is required.' },
        { status: 400 }
      )
    }

    const folder = await prisma.folder.create({
      data: {
        name: name.trim(),
        isPublic: Boolean(isPublic),
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json(
      { success: true, message: 'Folder created successfully.', folder },
      { status: 201 }
    )
  } catch (error) {
    console.error('[POST /api/folders/create]', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    )
  }
}
