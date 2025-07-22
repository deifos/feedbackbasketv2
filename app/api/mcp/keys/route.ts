import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import { apiKeyCreateSchema } from '@/lib/validation';
import { generateApiKey } from '@/lib/api-key-utils';
import { handleApiError, logError } from '@/lib/error-handler';
import prisma from '@/lib/prisma';

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

    // Fetch user's API keys with project access information
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        projectAccess: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                url: true,
              },
            },
          },
          where: {
            enabled: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform data to hide the actual key value for security
    const safeApiKeys = apiKeys.map(apiKey => ({
      id: apiKey.id,
      name: apiKey.name,
      keyPreview: `${apiKey.key.substring(0, 14)}...${apiKey.key.substring(apiKey.key.length - 4)}`,
      isActive: apiKey.isActive,
      lastUsed: apiKey.lastUsed,
      usageCount: apiKey.usageCount,
      createdAt: apiKey.createdAt,
      projects: apiKey.projectAccess.map(access => access.project),
    }));

    return NextResponse.json({ apiKeys: safeApiKeys });
  } catch (error) {
    logError(error, 'GET /api/mcp/keys');
    const apiError = handleApiError(error);
    return NextResponse.json(apiError, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    // Check if user already has too many API keys (limit to 5)
    const existingKeysCount = await prisma.apiKey.count({
      where: {
        userId: session.user.id,
        isActive: true,
      },
    });

    if (existingKeysCount >= 5) {
      return NextResponse.json(
        {
          error: 'Limit Exceeded',
          message: 'You can have a maximum of 5 active API keys. Please deactivate unused keys first.',
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = apiKeyCreateSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid input data',
          details: errors,
        },
        { status: 400 }
      );
    }

    const { name, projectIds } = validationResult.data;

    // Validate that all provided project IDs belong to the user
    if (projectIds.length > 0) {
      const userProjects = await prisma.project.findMany({
        where: {
          id: { in: projectIds },
          userId: session.user.id,
        },
        select: { id: true },
      });

      if (userProjects.length !== projectIds.length) {
        return NextResponse.json(
          {
            error: 'Invalid Projects',
            message: 'Some projects do not exist or do not belong to you',
          },
          { status: 400 }
        );
      }
    }

    // Generate unique API key
    const apiKey = generateApiKey();

    // Create API key with project access in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the API key
      const createdApiKey = await tx.apiKey.create({
        data: {
          userId: session.user.id,
          name,
          key: apiKey,
        },
      });

      // Create project access records if any projects were specified
      if (projectIds.length > 0) {
        await tx.apiKeyProjectAccess.createMany({
          data: projectIds.map(projectId => ({
            apiKeyId: createdApiKey.id,
            projectId,
            enabled: true,
          })),
        });
      }

      return createdApiKey;
    });

    // Fetch project details to include in response
    const projectDetails = projectIds.length > 0 ? await prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, name: true, url: true }
    }) : [];

    // Return the full API key only once (for the user to copy)
    // Future responses will only show the preview
    return NextResponse.json({
      id: result.id,
      name: result.name,
      key: apiKey, // Full key returned only on creation
      keyPreview: `${apiKey.substring(0, 14)}...${apiKey.substring(apiKey.length - 4)}`,
      isActive: result.isActive,
      lastUsed: result.lastUsed,
      usageCount: result.usageCount,
      createdAt: result.createdAt,
      projects: projectDetails,
    }, { status: 201 });
  } catch (error) {
    logError(error, 'POST /api/mcp/keys');
    
    // Handle unique constraint violations
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Conflict', message: 'An API key with this name already exists' },
        { status: 409 }
      );
    }

    const apiError = handleApiError(error);
    return NextResponse.json(apiError, { status: 500 });
  }
}