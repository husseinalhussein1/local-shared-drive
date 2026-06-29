import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

export async function POST(request) {
  try {
    const role = request.headers.get('x-user-role')

    // Only ADMIN can create users (enforced by middleware too)
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
    const { name, email, password, userRole } = body

    if (!name || !email || !password || !userRole) {
      return NextResponse.json(
        {
          success: false,
          message: 'name, email, password, and userRole are all required.',
        },
        { status: 400 }
      )
    }

    const allowedRoles = ['USER', 'USER_PLUS']
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json(
        {
          success: false,
          message: `userRole must be one of: ${allowedRoles.join(', ')}.`,
        },
        { status: 400 }
      )
    }

    // Check if email already taken
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'A user with this email already exists.' },
        { status: 409 }
      )
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: userRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      { success: true, message: 'User created successfully.', user },
      { status: 201 }
    )
  } catch (error) {
    console.error('[POST /api/admin/users/create]', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    )
  }
}
