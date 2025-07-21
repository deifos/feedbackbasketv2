import { NextRequest, NextResponse } from 'next/server';
import telegramService from '@/lib/telegram';

export async function GET() {
  try {
    const mode = telegramService.getMode();
    const configured = telegramService.isConfigured();
    
    let webhookInfo = null;
    if (configured) {
      const webhookResult = await telegramService.getWebhookInfo();
      if (webhookResult.success) {
        webhookInfo = webhookResult.webhookInfo;
      }
    }

    return NextResponse.json({
      configured,
      mode,
      webhookInfo,
      environment: {
        useWebhook: process.env.TELEGRAM_USE_WEBHOOK === 'true',
        webhookUrl: process.env.TELEGRAM_WEBHOOK_URL || null,
        hasWebhookSecret: !!process.env.TELEGRAM_WEBHOOK_SECRET,
      }
    });
  } catch (error) {
    console.error('Telegram config error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'remove_webhook':
        const result = await telegramService.removeWebhook();
        if (result.success) {
          return NextResponse.json({ success: true, message: 'Webhook removed, switched to polling' });
        } else {
          return NextResponse.json({ error: result.error }, { status: 500 });
        }

      case 'get_bot_info':
        const botResult = await telegramService.getBotInfo();
        if (botResult.success) {
          return NextResponse.json({ success: true, botInfo: botResult.botInfo });
        } else {
          return NextResponse.json({ error: botResult.error }, { status: 500 });
        }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Telegram config action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
