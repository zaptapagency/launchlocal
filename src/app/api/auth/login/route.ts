import { setSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Create a session with the provided credentials
    // In production, you'd validate against database
    const userId = `user_${Date.now()}`;
    await setSession({
      userId,
      email,
      name: name || email.split('@')[0],
    });

    return NextResponse.json(
      { success: true, userId, email },
      { status: 200 }
    );
  } catch (error) {
    console.error('[AUTH] Login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
