import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import prisma from '@/lib/prisma'

// DELETE /api/files/[id]
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

    const file = await prisma.file.findUnique({
      where: { id: parseInt(id) },
    })

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'File not found.' },
        { status: 404 }
      )
    }

    // USER_PLUS can only delete their own uploaded files
    if (role === 'USER_PLUS' && file.uploadedById !== userId) {
      return NextResponse.json(
        { success: false, message: 'Forbidden: You can only delete files you uploaded.' },
        { status: 403 }
      )
    }

    // Delete from disk
    const filePath = path.join(process.cwd(), 'uploads', file.storedName)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    // Delete from database (cascades DownloadLog entries)
    await prisma.file.delete({ where: { id: parseInt(id) } })

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully.',
    })
  } catch (error) {
    console.error('[DELETE /api/files/[id]]', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    )
  }
}
