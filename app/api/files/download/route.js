import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import prisma from '@/lib/prisma'

export async function POST(request) {
  try {
    const userId = parseInt(request.headers.get('x-user-id'))
    const role = request.headers.get('x-user-role')

    const body = await request.json()
    const { fileId } = body

    if (!fileId) {
      return NextResponse.json(
        { success: false, message: 'fileId is required.' },
        { status: 400 }
      )
    }

    const file = await prisma.file.findUnique({
      where: { id: parseInt(fileId) },
      include: { folder: true },
    })

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'File not found.' },
        { status: 404 }
      )
    }

    // Check folder access for regular USER
    if (role === 'USER' && !file.folder.isPublic) {
      return NextResponse.json(
        { success: false, message: 'Forbidden: You do not have access to this file.' },
        { status: 403 }
      )
    }

    const filePath = path.join(process.cwd(), 'uploads', file.storedName)

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, message: 'File not found on disk.' },
        { status: 404 }
      )
    }

    // Log the download
    await prisma.downloadLog.create({
      data: {
        fileId: file.id,
        downloadedById: userId,
      },
    })

    // Stream the file back to the client
    const fileStream = fs.createReadStream(filePath)
    const readableStream = new ReadableStream({
      start(controller) {
        fileStream.on('data', (chunk) => controller.enqueue(chunk))
        fileStream.on('end', () => controller.close())
        fileStream.on('error', (err) => controller.error(err))
      },
    })

    return new Response(readableStream, {
      status: 200,
      headers: {
        'Content-Type': file.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
        'Content-Length': String(file.size),
      },
    })
  } catch (error) {
    console.error('[POST /api/files/download]', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    )
  }
}
