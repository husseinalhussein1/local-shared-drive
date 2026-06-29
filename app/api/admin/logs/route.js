import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request) {
  try {
    const role = request.headers.get('x-user-role')

    if (role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Forbidden: Administrator access required.' },
        { status: 403 }
      )
    }

    const [
      totalFiles,
      totalFolders,
      publicFolders,
      privateFolders,
      totalUsers,
      totalDownloads,
      recentLogs,
      fileSizeAgg,
    ] = await Promise.all([
      prisma.file.count(),
      prisma.folder.count(),
      prisma.folder.count({ where: { isPublic: true } }),
      prisma.folder.count({ where: { isPublic: false } }),
      prisma.user.count(),
      prisma.downloadLog.count(),
      prisma.downloadLog.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          file: {
            select: {
              id: true,
              originalName: true,
              size: true,
              mimeType: true,
              uploadedBy: { select: { id: true, name: true, email: true } },
              folder: { select: { id: true, name: true } },
            },
          },
          downloadedBy: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
      prisma.file.aggregate({ _sum: { size: true } }),
    ])

    const totalStorageBytes = fileSizeAgg._sum.size || 0

    return NextResponse.json({
      success: true,
      stats: {
        totalFiles,
        totalFolders,
        publicFolders,
        privateFolders,
        totalUsers,
        totalDownloads,
        totalStorageBytes,
        totalStorageMB: parseFloat((totalStorageBytes / (1024 * 1024)).toFixed(2)),
      },
      logs: recentLogs.map((log) => ({
        id: log.id,
        createdAt: log.createdAt,
        file: {
          id: log.file.id,
          originalName: log.file.originalName,
          size: log.file.size,
          mimeType: log.file.mimeType,
          uploadedBy: log.file.uploadedBy,
          folder: log.file.folder,
        },
        downloadedBy: log.downloadedBy,
      })),
    })
  } catch (error) {
    console.error('[GET /api/admin/logs]', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    )
  }
}
