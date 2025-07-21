import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import telegramService from '@/lib/telegram';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        telegramHandle: true,
      }
    });

    return NextResponse.json({
      telegramHandle: user?.telegramHandle || null,
      isConfigured: !!user?.telegramHandle,
    });
  } catch (error) {
    console.error('Error fetching telegram config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { telegramHandle } = await request.json();

    // Validate the telegram handle
    const validation = telegramService.validateTelegramHandle(telegramHandle);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Normalize the handle (ensure it starts with @)
    const normalizedHandle = telegramHandle.startsWith('@') 
      ? telegramHandle 
      : `@${telegramHandle}`;

    // Update user's telegram handle
    await prisma.user.update({
      where: { id: session.user.id },
      data: { telegramHandle: normalizedHandle }
    });

    return NextResponse.json({
      success: true,
      message: 'Telegram handle updated successfully',
      telegramHandle: normalizedHandle
    });
  } catch (error) {
    console.error('Error updating telegram handle:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Remove user's telegram configuration (both handle and Chat ID)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { 
        telegramHandle: null,
        telegramChatId: null,
        telegramLinkCode: null,
        telegramLinkCodeExp: null
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Telegram integration removed successfully'
    });
  } catch (error) {
    console.error('Error removing telegram integration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}