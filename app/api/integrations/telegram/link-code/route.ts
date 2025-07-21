import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { nanoid } from 'nanoid';

export async function POST(_request: NextRequest) {
  try {
    // Get the authenticated session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Generate a unique link code (8 characters, alphanumeric)
    const linkCode = nanoid(8);
    
    // Set expiration to 10 minutes from now
    const expirationTime = new Date(Date.now() + 10 * 60 * 1000);

    // Update user with the link code and expiration
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        telegramLinkCode: linkCode,
        telegramLinkCodeExp: expirationTime,
      },
    });

    return NextResponse.json({
      success: true,
      linkCode,
      expiresAt: expirationTime.toISOString(),
      message: 'Link code generated successfully',
    });
  } catch (error) {
    console.error('Error generating Telegram link code:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to generate link code' },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    // Get the authenticated session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get current link code and check if it's still valid
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        telegramLinkCode: true,
        telegramLinkCodeExp: true,
        telegramChatId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if link code exists and is still valid
    const isValid = user.telegramLinkCode && 
                   user.telegramLinkCodeExp && 
                   new Date() < user.telegramLinkCodeExp;

    return NextResponse.json({
      hasValidCode: isValid,
      linkCode: isValid ? user.telegramLinkCode : null,
      expiresAt: isValid ? user.telegramLinkCodeExp?.toISOString() : null,
      isLinked: !!user.telegramChatId,
    });
  } catch (error) {
    console.error('Error getting Telegram link code:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to get link code' },
      { status: 500 }
    );
  }
}