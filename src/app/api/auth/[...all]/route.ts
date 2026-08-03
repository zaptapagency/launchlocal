import { getSession, clearSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const path = request.nextUrl.pathname.replace(/^\/api\/auth\//, '');

  // Health check endpoint
  if (path === 'health') {
    return NextResponse.json({ status: 'ok' });
  }

  // Get current session
  if (path === 'session') {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }
    return NextResponse.json({ authenticated: true, session });
  }

  // Logout endpoint
  if (path === 'logout') {
    await clearSession();
    return NextResponse.json({ success: true });
  }

  return NextResponse.json(
    { error: 'Not found' },
    { status: 404 }
  );
}

export async function POST(request: NextRequest) {
  const path = request.nextUrl.pathname.replace(/^\/api\/auth\//, '');

  if (path === 'login') {
    return NextResponse.json(
      { error: 'Use /api/auth/login for login' },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { error: 'Not found' },
    { status: 404 }
  );
}
