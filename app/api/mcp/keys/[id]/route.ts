import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import { apiKeyUpdateSchema } from '@/lib/validation';
import { handleApiError, logError } from '@/lib/error-handler';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  
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

    const apiKeyId = params.id;

    // Fetch the API key with project access, ensuring it belongs to the user
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: apiKeyId,
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
        },
      },
    });

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Not Found', message: 'API key not found or access denied' },
        { status: 404 }
      );
    }

    // Return safe data (no full key)
    const safeApiKey = {
      id: apiKey.id,
      name: apiKey.name,
      keyPreview: `${apiKey.key.substring(0, 14)}...${apiKey.key.substring(apiKey.key.length - 4)}`,
      isActive: apiKey.isActive,
      lastUsed: apiKey.lastUsed,
      usageCount: apiKey.usageCount,
      createdAt: apiKey.createdAt,
      projects: apiKey.projectAccess.map(access => ({
        ...access.project,
        enabled: access.enabled,
      })),
    };

    return NextResponse.json(safeApiKey);
  } catch (error) {
    logError(error, `GET /api/mcp/keys/${params.id}`);
    const apiError = handleApiError(error);
    return NextResponse.json(apiError, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  
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

    const apiKeyId = params.id;

    // Verify the API key belongs to the user
    const existingApiKey = await prisma.apiKey.findFirst({
      where: {
        id: apiKeyId,
        userId: session.user.id,
      },
    });

    if (!existingApiKey) {
      return NextResponse.json(
        { error: 'Not Found', message: 'API key not found or access denied' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = apiKeyUpdateSchema.safeParse(body);
    
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

    const { name, projectIds, isActive } = validationResult.data;

    // Validate project IDs if provided
    if (projectIds && projectIds.length > 0) {
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

    // Update API key and project access in a transaction
    const updatedApiKey = await prisma.$transaction(async (tx) => {
      // Update the API key basic info
      const updated = await tx.apiKey.update({
        where: { id: apiKeyId },
        data: {
          ...(name && { name }),
          ...(typeof isActive === 'boolean' && { isActive }),
        },
      });

      // Update project access if projectIds were provided
      if (projectIds !== undefined) {
        // Remove existing project access
        await tx.apiKeyProjectAccess.deleteMany({
          where: { apiKeyId },
        });

        // Add new project access if any projects specified
        if (projectIds.length > 0) {
          await tx.apiKeyProjectAccess.createMany({
            data: projectIds.map(projectId => ({
              apiKeyId,
              projectId,
              enabled: true,
            })),
          });
        }
      }

      return updated;
    });

    // Fetch updated data with project access
    const apiKeyWithProjects = await prisma.apiKey.findUnique({
      where: { id: apiKeyId },
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
    });

    const safeApiKey = {
      id: updatedApiKey.id,
      name: updatedApiKey.name,
      keyPreview: `${updatedApiKey.key.substring(0, 14)}...${updatedApiKey.key.substring(updatedApiKey.key.length - 4)}`,
      isActive: updatedApiKey.isActive,
      lastUsed: updatedApiKey.lastUsed,
      usageCount: updatedApiKey.usageCount,
      createdAt: updatedApiKey.createdAt,
      updatedAt: updatedApiKey.updatedAt,
      projects: apiKeyWithProjects?.projectAccess.map(access => access.project) || [],
    };

    return NextResponse.json(safeApiKey);
  } catch (error) {
    logError(error, `PATCH /api/mcp/keys/${params.id}`);
    const apiError = handleApiError(error);
    return NextResponse.json(apiError, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  
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

    const apiKeyId = params.id;

    // Verify the API key belongs to the user and delete it
    const deletedApiKey = await prisma.apiKey.deleteMany({
      where: {
        id: apiKeyId,
        userId: session.user.id,
      },
    });

    if (deletedApiKey.count === 0) {
      return NextResponse.json(
        { error: 'Not Found', message: 'API key not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'API key deleted successfully' });
  } catch (error) {
    logError(error, `DELETE /api/mcp/keys/${params.id}`);
    const apiError = handleApiError(error);
    return NextResponse.json(apiError, { status: 500 });
  }
}