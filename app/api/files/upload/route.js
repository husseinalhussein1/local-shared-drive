import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import prisma from '@/lib/prisma'

export async function POST(request) {
  try {
    const role = request.headers.get('x-user-role')
    const userId = parseInt(request.headers.get('x-user-id'))

    if (role !== 'USER_PLUS' && role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Forbidden: Insufficient permissions.' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const folderId = formData.get('folderId')

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { success: false, message: 'No file provided.' },
        { status: 400 }
      )
    }

    if (!folderId) {
      return NextResponse.json(
        { success: false, message: 'folderId is required.' },
        { status: 400 }
      )
    }

    const folderIdInt = parseInt(folderId)

    // Verify folder exists
    const folder = await prisma.folder.findUnique({
      where: { id: folderIdInt },
    })

    if (!folder) {
      return NextResponse.json(
        { success: false, message: 'Target folder not found.' },
        { status: 404 }
      )
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    // Generate unique stored filename to avoid collisions
    const ext = path.extname(file.name)
    const storedName = `${randomUUID()}${ext}`
    const filePath = path.join(uploadsDir, storedName)

    // Write file to disk
    const arrayBuffer = await file.arrayBuffer()
    fs.writeFileSync(filePath, Buffer.from(arrayBuffer))

    // Save file record to database
    const dbFile = await prisma.file.create({
      data: {
        originalName: file.name,
        storedName,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        folderId: folderIdInt,
        uploadedById: userId,
      },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
        folder: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'File uploaded successfully.',
        file: {
          id: dbFile.id,
          originalName: dbFile.originalName,
          size: dbFile.size,
          mimeType: dbFile.mimeType,
          folderId: dbFile.folderId,
          folder: dbFile.folder,
          uploadedBy: dbFile.uploadedBy,
          createdAt: dbFile.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[POST /api/files/upload]', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    )
  }
}
