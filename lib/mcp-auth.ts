import { NextRequest } from 'next/server';
import { extractApiKeyFromHeader } from '@/lib/api-key-utils';
import prisma from '@/lib/prisma';

export interface AuthenticatedApiKey {
  id: string;
  userId: string;
  name: string;
  usageCount: number;
  projectAccess: Array<{
    projectId: string;
    enabled: boolean;
  }>;
  user: {
    id: string;
    email: string;
    subscription?: {
      plan: string;
      status: string;
      feedbackLimit: number;
      projectLimit: number;
    } | null;
  };
}

/**
 * Authenticate API key from request headers
 */
export async function authenticateApiKey(request: NextRequest): Promise<AuthenticatedApiKey | null> {
  const authHeader = request.headers.get('Authorization');
  const apiKey = extractApiKeyFromHeader(authHeader);
  
  if (!apiKey) {
    return null;
  }

  // Find the API key with user and project access info
  const keyRecord = await prisma.apiKey.findUnique({
    where: { 
      key: apiKey,
      isActive: true,
    },
    include: {
      user: {
        include: {
          subscription: true,
        },
      },
      projectAccess: {
        where: {
          enabled: true,
        },
        select: {
          projectId: true,
          enabled: true,
        },
      },
    },
  });

  if (!keyRecord) {
    return null;
  }

  // Update last used timestamp and usage count asynchronously
  // Don't await this to avoid slowing down the request
  prisma.apiKey.update({
    where: { id: keyRecord.id },
    data: { 
      lastUsed: new Date(),
      usageCount: { increment: 1 },
    },
  }).catch(error => {
    console.error('Failed to update API key usage:', error);
  });

  return {
    id: keyRecord.id,
    userId: keyRecord.userId,
    name: keyRecord.name,
    usageCount: keyRecord.usageCount,
    projectAccess: keyRecord.projectAccess,
    user: {
      id: keyRecord.user.id,
      email: keyRecord.user.email,
      subscription: keyRecord.user.subscription,
    },
  };
}

/**
 * Check if API key has access to a specific project
 */
export function hasProjectAccess(apiKey: AuthenticatedApiKey, projectId: string): boolean {
  // If no project access records exist, deny access by default
  if (apiKey.projectAccess.length === 0) {
    return false;
  }
  
  return apiKey.projectAccess.some(access => 
    access.projectId === projectId && access.enabled
  );
}

/**
 * Get list of project IDs the API key has access to
 */
export function getAccessibleProjectIds(apiKey: AuthenticatedApiKey): string[] {
  return apiKey.projectAccess
    .filter(access => access.enabled)
    .map(access => access.projectId);
}