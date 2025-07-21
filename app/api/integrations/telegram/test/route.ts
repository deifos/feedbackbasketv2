import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import telegramService from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { telegramHandle, testLinkedAccount } = await request.json();

    if (testLinkedAccount || !telegramHandle) {
      // Test the bot-linked account using Chat ID or saved handle
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { 
          telegramHandle: true,
          telegramChatId: true 
        }
      });

      if (!user?.telegramChatId && !user?.telegramHandle) {
        return NextResponse.json({ 
          error: 'No Telegram configuration found' 
        }, { status: 400 });
      }

      // Use Chat ID if available (more reliable), otherwise fall back to handle
      const testTarget = user.telegramChatId || user.telegramHandle;
      const testResult = await telegramService.sendTestMessage(testTarget);
      
      return NextResponse.json({
        success: testResult.success,
        message: testResult.success 
          ? 'Test message sent successfully!' 
          : testResult.error,
      });
    }

    // Validate the provided handle
    const validation = telegramService.validateTelegramHandle(telegramHandle);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Check if Telegram service is configured
    if (!telegramService.isConfigured()) {
      return NextResponse.json({ 
        error: 'Telegram bot is not configured on the server' 
      }, { status: 500 });
    }

    const testResult = await telegramService.sendTestMessage(telegramHandle);
    
    return NextResponse.json({
      success: testResult.success,
      message: testResult.success 
        ? 'Test message sent successfully!' 
        : testResult.error,
    });
  } catch (error) {
    console.error('Error testing telegram integration:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}