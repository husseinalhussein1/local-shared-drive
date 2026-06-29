import { NextResponse } from 'next/server'

export async function GET(request) {
  // User info is injected by middleware into request headers
  const id = request.headers.get('x-user-id')
  const role = request.headers.get('x-user-role')
  const email = request.headers.get('x-user-email')
  const name = request.headers.get('x-user-name')

  if (!id) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized.' },
      { status: 401 }
    )
  }

  return NextResponse.json({
    success: true,
    user: { id: parseInt(id), name, email, role },
  })
}
