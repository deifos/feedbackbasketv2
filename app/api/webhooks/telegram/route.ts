import { NextRequest, NextResponse } from 'next/server';
import telegramService from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from Telegram
    const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (secretToken) {
      const providedToken = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
      if (providedToken !== secretToken) {
        console.error('Invalid Telegram webhook secret token');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await request.json();
    
    // Handle the webhook update
    const result = await telegramService.handleWebhookUpdate(body);
    
    if (result.success) {
      return NextResponse.json({ ok: true });
    } else {
      console.error('Webhook handling failed:', result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    service: 'telegram-webhook',
    configured: telegramService.isConfigured()
  });
}
