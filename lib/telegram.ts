import TelegramBot from 'node-telegram-bot-api';
import prisma from '@/lib/prisma';

interface TelegramNotificationData {
  projectName: string;
  feedbackContent: string;
  feedbackId: string;
  projectUrl?: string;
}

class TelegramService {
  private bot: TelegramBot | null = null;
  private isPolling = false;

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (token) {
      this.bot = new TelegramBot(token);
      this.startPolling();
    }
  }

  /**
   * Start polling for bot messages to handle /link commands
   */
  private startPolling() {
    if (!this.bot || this.isPolling) return;
    
    try {
      this.bot.startPolling({ restart: false });
      this.isPolling = true;
      
      // Handle /start command
      this.bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        const welcomeMessage = `🎉 Welcome to FeedbackBasket notifications!

To link your account:
1. Generate a link code in your FeedbackBasket settings
2. Send the command: /link YOUR_CODE
3. You'll start receiving notifications for your projects

Commands:
/start - Show this welcome message
/link <code> - Link your account with the provided code
/chatid - Get your Chat ID for manual setup`;

        this.bot?.sendMessage(chatId, welcomeMessage);
      });

      // Handle /chatid command
      this.bot.onText(/\/chatid/, (msg) => {
        const chatId = msg.chat.id;
        this.bot?.sendMessage(chatId, `Your Chat ID is: ${chatId}\n\nYou can use this Chat ID instead of your username in FeedbackBasket settings for more reliable notifications.`);
      });

      // Handle /link command
      this.bot.onText(/\/link (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const linkCode = match?.[1]?.trim();

        if (!linkCode) {
          this.bot?.sendMessage(chatId, '❌ Please provide a link code. Usage: /link YOUR_CODE');
          return;
        }

        try {
          await this.handleLinkCommand(chatId, linkCode);
        } catch (error) {
          console.error('Error handling link command:', error);
          this.bot?.sendMessage(chatId, '❌ An error occurred while linking your account. Please try again.');
        }
      });

      console.log('Telegram bot polling started');
    } catch (error) {
      console.error('Error starting Telegram bot polling:', error);
      this.isPolling = false;
    }
  }

  /**
   * Handle the /link command to connect a user's Chat ID with their account
   */
  private async handleLinkCommand(chatId: number, linkCode: string) {
    try {
      // Find user with matching link code that hasn't expired
      const user = await prisma.user.findFirst({
        where: {
          telegramLinkCode: linkCode,
          telegramLinkCodeExp: {
            gt: new Date(), // Code hasn't expired
          },
        },
      });

      if (!user) {
        this.bot?.sendMessage(chatId, '❌ Invalid or expired link code. Please generate a new code from your FeedbackBasket settings.');
        return;
      }

      // Update user with Chat ID and clear link code
      await prisma.user.update({
        where: { id: user.id },
        data: {
          telegramChatId: chatId.toString(),
          telegramLinkCode: null,
          telegramLinkCodeExp: null,
        },
      });

      // Send success message
      this.bot?.sendMessage(chatId, `✅ Account linked successfully!

You'll now receive notifications for feedback submitted to your FeedbackBasket projects.

Your Chat ID (${chatId}) has been saved to your account for reliable message delivery.`);

      console.log(`Successfully linked user ${user.id} with Chat ID ${chatId}`);
    } catch (error) {
      console.error('Error in handleLinkCommand:', error);
      throw error;
    }
  }

  /**
   * Check if Telegram service is properly configured
   */
  isConfigured(): boolean {
    return this.bot !== null;
  }

  /**
   * Send a test message to verify the Telegram handle or chat ID
   */
  async sendTestMessage(telegramHandle: string): Promise<{ success: boolean; error?: string }> {
    if (!this.bot) {
      return { success: false, error: 'Telegram bot not configured' };
    }

    try {
      const message = `🎉 Hello! Your Telegram integration with FeedbackBasket is working correctly.\n\nYou'll now receive notifications for new feedback on your projects.`;

      // Check if it's a numeric chat ID or username
      if (/^\d+$/.test(telegramHandle.trim())) {
        // It's a chat ID (numeric)
        await this.bot.sendMessage(telegramHandle, message);
      } else {
        // It's a username - remove @ if present and add it back for consistency
        const cleanHandle = telegramHandle.replace(/^@/, '');
        await this.bot.sendMessage(`@${cleanHandle}`, message);
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Telegram test message error:', error);
      
      // Common error messages
      if (error.code === 'ETELEGRAM' && error.response?.body) {
        const errorDescription = error.response.body.description;
        
        if (errorDescription?.includes('chat not found')) {
          const handleText = /^\d+$/.test(telegramHandle.trim()) ? telegramHandle : `@${telegramHandle.replace(/^@/, '')}`;
          return { 
            success: false, 
            error: `Chat not found for ${handleText}. Please:\n1. Make sure you've started a chat with @FeedbackBasketNotifyBot\n2. Send the /start command to the bot\n3. Check that your username matches exactly (case-sensitive): ${handleText}\n4. If your username is different, update it or try using your Chat ID instead.` 
          };
        }
        
        if (errorDescription?.includes('bot was blocked')) {
          return { 
            success: false, 
            error: 'The bot was blocked by the user. Please unblock @FeedbackBasketNotifyBot in Telegram and try again.' 
          };
        }

        if (errorDescription?.includes('username not found')) {
          const cleanHandle = telegramHandle.replace(/^@/, '');
          return { 
            success: false, 
            error: `Username @${cleanHandle} not found. Please check:\n1. Username spelling and capitalization (case-sensitive)\n2. Make sure this is your current Telegram username\n3. Try using your Chat ID if you have it` 
          };
        }
        
        return { 
          success: false, 
          error: `Telegram API error: ${errorDescription}` 
        };
      }
      
      return { 
        success: false, 
        error: 'Failed to send test message. Please check your Telegram handle and make sure you\'ve started a chat with the bot.' 
      };
    }
  }

  /**
   * Send a feedback notification to the user
   * First tries to use stored Chat ID, falls back to handle if needed
   */
  async sendFeedbackNotification(
    userId: string,
    notificationData: TelegramNotificationData
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.bot) {
      return { success: false, error: 'Telegram bot not configured' };
    }

    try {
      // Get user's Telegram settings
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          telegramChatId: true,
          telegramHandle: true,
        },
      });

      if (!user || (!user.telegramChatId && !user.telegramHandle)) {
        return { success: false, error: 'No Telegram configuration found for user' };
      }

      // Extract project ID from feedback ID or use the provided project URL to derive project ID
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://feedbackbasket.com';
      const dashboardUrl = `${baseUrl}/dashboard/projects`; // Will show all projects, user can navigate to specific one
      
      const message = `📝 **New Feedback Received!**\n\n` +
        `**Project:** ${notificationData.projectName}\n\n` +
        `**Feedback:**\n${notificationData.feedbackContent}\n\n` +
        `[View in Dashboard](${dashboardUrl})`;

      // Prefer Chat ID over handle for better reliability
      if (user.telegramChatId) {
        await this.bot.sendMessage(user.telegramChatId, message, {
          parse_mode: 'Markdown',
          disable_web_page_preview: false
        });
      } else if (user.telegramHandle) {
        // Fallback to handle if no Chat ID
        const telegramHandle = user.telegramHandle;
        if (/^\d+$/.test(telegramHandle.trim())) {
          // It's a chat ID (numeric)
          await this.bot.sendMessage(telegramHandle, message, {
            parse_mode: 'Markdown',
            disable_web_page_preview: false
          });
        } else {
          // It's a username - remove @ if present and add it back for consistency
          const cleanHandle = telegramHandle.replace(/^@/, '');
          await this.bot.sendMessage(`@${cleanHandle}`, message, {
            parse_mode: 'Markdown',
            disable_web_page_preview: false
          });
        }
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Telegram notification error:', error);
      
      // Log the error but don't fail the feedback submission
      return { 
        success: false, 
        error: error.message || 'Failed to send notification' 
      };
    }
  }

  /**
   * Validate a Telegram handle or chat ID format
   */
  validateTelegramHandle(handle: string): { valid: boolean; error?: string } {
    if (!handle || handle.trim().length === 0) {
      return { valid: false, error: 'Telegram handle or Chat ID is required' };
    }

    const trimmed = handle.trim();

    // Check if it's a numeric chat ID
    if (/^\d+$/.test(trimmed)) {
      // Chat ID validation - should be positive integer
      const chatId = parseInt(trimmed);
      if (chatId <= 0) {
        return { 
          valid: false, 
          error: 'Chat ID must be a positive number' 
        };
      }
      return { valid: true };
    }

    // It's a username - validate username format
    const cleanHandle = trimmed.replace(/^@/, '');
    
    // Telegram username validation rules:
    // - 5-32 characters
    // - Can contain a-z, 0-9, and underscores
    // - Must start with a letter
    // - Cannot end with underscore
    // - Cannot have consecutive underscores
    const telegramUsernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/;
    
    if (!telegramUsernameRegex.test(cleanHandle)) {
      return { 
        valid: false, 
        error: 'Invalid Telegram username format. Must be 5-32 characters, start with a letter, and contain only letters, numbers, and underscores. Or use your numeric Chat ID.' 
      };
    }

    if (cleanHandle.endsWith('_') || cleanHandle.includes('__')) {
      return { 
        valid: false, 
        error: 'Telegram username cannot end with underscore or contain consecutive underscores.' 
      };
    }

    return { valid: true };
  }

  /**
   * Get bot info for verification
   */
  async getBotInfo(): Promise<{ success: boolean; botInfo?: any; error?: string }> {
    if (!this.bot) {
      return { success: false, error: 'Telegram bot not configured' };
    }

    try {
      const botInfo = await this.bot.getMe();
      return { success: true, botInfo };
    } catch (error: any) {
      console.error('Get bot info error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to get bot info' 
      };
    }
  }
}

// Create a singleton instance
const telegramService = new TelegramService();

export default telegramService;
export type { TelegramNotificationData };