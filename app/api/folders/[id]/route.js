import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import prisma from '@/lib/prisma'

// PATCH /api/folders/[id] — update folder permissions (ADMIN only)
export async function PATCH(request, { params }) {
  try {
    const { id } = await params
    const role = request.headers.get('x-user-role')

    if (role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          message: 'Forbidden: Administrator access required.',
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { isPublic } = body

    if (typeof isPublic !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'isPublic must be a boolean value.' },
        { status: 400 }
      )
    }

    const folder = await prisma.folder.findUnique({
      where: { id: parseInt(id) },
    })

    if (!folder) {
      return NextResponse.json(
        { success: false, message: 'Folder not found.' },
        { status: 404 }
      )
    }

    const updated = await prisma.folder.update({
      where: { id: parseInt(id) },
      data: { isPublic },
    })

    return NextResponse.json({
      success: true,
      message: `Folder is now ${isPublic ? 'public' : 'private'}.`,
      folder: updated,
    })
  } catch (error) {
    console.error('[PATCH /api/folders/[id]]', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    )
  }
}

// DELETE /api/folders/[id] — delete folder and all its files (USER_PLUS or ADMIN)
export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    const role = request.headers.get('x-user-role')
    const userId = parseInt(request.headers.get('x-user-id'))

    if (role !== 'USER_PLUS' && role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Forbidden: Insufficient permissions.' },
        { status: 403 }
      )
    }

    const folder = await prisma.folder.findUnique({
      where: { id: parseInt(id) },
      include: { files: true },
    })

    if (!folder) {
      return NextResponse.json(
        { success: false, message: 'Folder not found.' },
        { status: 404 }
      )
    }

    // USER_PLUS can only delete their own folders
    if (role === 'USER_PLUS' && folder.createdById !== userId) {
      return NextResponse.json(
        { success: false, message: 'Forbidden: You can only delete your own folders.' },
        { status: 403 }
      )
    }

    // Delete physical files from disk
    const uploadsDir = path.join(process.cwd(), 'uploads')
    for (const file of folder.files) {
      const filePath = path.join(uploadsDir, file.storedName)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }

    // Delete folder record (cascades to files and download logs via Prisma)
    await prisma.folder.delete({ where: { id: parseInt(id) } })

    return NextResponse.json({
      success: true,
      message: 'Folder and all its files deleted successfully.',
    })
  } catch (error) {
    console.error('[DELETE /api/folders/[id]]', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    )
  }
}
