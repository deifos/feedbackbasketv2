import { PrismaClient } from '../app/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('✅ Created test user:', user.email);

  // Create a test project
  const project = await prisma.project.upsert({
    where: { id: 'test-project-id' },
    update: {},
    create: {
      id: 'test-project-id',
      name: 'My Awesome App',
      url: 'https://myawesomeapp.com',
      description:
        'A comprehensive feedback collection platform that helps businesses gather, manage, and act on user feedback with AI-powered insights.',
      logoUrl: 'https://myawesomeapp.com/favicon.ico',
      ogImageUrl: 'https://myawesomeapp.com/og-image.jpg',
      aiGenerated: true,
      lastAnalyzedAt: new Date(),
      userId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('✅ Created test project:', project.name);

  // Create project customization
  const customization = await prisma.projectCustomization.upsert({
    where: { projectId: project.id },
    update: {},
    create: {
      projectId: project.id,
      buttonColor: '#3b82f6',
      buttonRadius: 8,
      buttonLabel: 'Send Feedback',
      introMessage: "We'd love to hear your thoughts!",
      successMessage: 'Thank you for your feedback!',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('✅ Created project customization');

  // Sample feedback data with different categories and sentiments
  const feedbackData = [
    {
      content:
        'This app is amazing! I love the new dashboard feature. It makes everything so much easier to manage.',
      email: 'happy.user@example.com',
      category: 'REVIEW',
      sentiment: 'POSITIVE',
      status: 'PENDING',
    },
    {
      content:
        "Found a bug where the login button doesn't work on mobile devices. Very frustrating!",
      email: 'bug.reporter@example.com',
      category: 'BUG',
      sentiment: 'NEGATIVE',
      status: 'PENDING',
    },
    {
      content: 'Could you please add a dark mode feature? It would be great for night time usage.',
      email: 'feature.requester@example.com',
      category: 'FEATURE',
      sentiment: 'NEUTRAL',
      status: 'REVIEWED',
    },
    {
      content:
        'The app crashes every time I try to upload a large file. This is a serious issue that needs fixing.',
      email: 'crash.reporter@example.com',
      category: 'BUG',
      sentiment: 'NEGATIVE',
      status: 'PENDING',
    },
    {
      content: 'Great work on the recent updates! The performance improvements are noticeable.',
      email: 'satisfied.user@example.com',
      category: 'REVIEW',
      sentiment: 'POSITIVE',
      status: 'DONE',
    },
    {
      content: 'It would be nice to have keyboard shortcuts for common actions.',
      email: 'power.user@example.com',
      category: 'FEATURE',
      sentiment: 'NEUTRAL',
      status: 'REVIEWED',
    },
    {
      content: 'The interface is okay, nothing special but it gets the job done.',
      email: 'neutral.user@example.com',
      category: 'REVIEW',
      sentiment: 'NEUTRAL',
      status: 'DONE',
    },
    {
      content: 'Terrible experience! The app is slow and buggy. Needs major improvements.',
      email: 'angry.user@example.com',
      category: 'BUG',
      sentiment: 'NEGATIVE',
      status: 'PENDING',
    },
    {
      content: 'Please add integration with Google Calendar. That would make this app perfect!',
      email: 'integration.fan@example.com',
      category: 'FEATURE',
      sentiment: 'POSITIVE',
      status: 'REVIEWED',
    },
    {
      content: 'The new color scheme looks professional. Good design choices overall.',
      email: 'design.lover@example.com',
      category: 'REVIEW',
      sentiment: 'POSITIVE',
      status: 'DONE',
    },
    {
      content: 'Export functionality is broken. Cannot download my data in CSV format.',
      email: 'data.user@example.com',
      category: 'BUG',
      sentiment: 'NEGATIVE',
      status: 'PENDING',
    },
    {
      content: 'Would love to see a mobile app version of this tool.',
      email: 'mobile.user@example.com',
      category: 'FEATURE',
      sentiment: 'NEUTRAL',
      status: 'PENDING',
    },
    {
      content: 'Outstanding customer support! They helped me resolve my issue quickly.',
      email: 'support.fan@example.com',
      category: 'REVIEW',
      sentiment: 'POSITIVE',
      status: 'DONE',
    },
    {
      content: "The search function doesn't work properly. It misses obvious results.",
      email: 'search.user@example.com',
      category: 'BUG',
      sentiment: 'NEGATIVE',
      status: 'REVIEWED',
    },
    {
      content:
        'Add support for multiple languages please. International users would appreciate it.',
      email: 'international.user@example.com',
      category: 'FEATURE',
      sentiment: 'NEUTRAL',
      status: 'PENDING',
    },
  ];

  // Create feedback entries
  for (const feedback of feedbackData) {
    await prisma.feedback.create({
      data: {
        projectId: project.id,
        content: feedback.content,
        email: feedback.email,
        category: feedback.category as any,
        sentiment: feedback.sentiment as any,
        status: feedback.status as any,
        isAiAnalyzed: true,
        aiAnalyzedAt: new Date(),
        categoryConfidence: Math.random() * 0.3 + 0.7, // Random confidence between 0.7-1.0
        sentimentConfidence: Math.random() * 0.3 + 0.7,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last week
        updatedAt: new Date(),
      },
    });
  }

  console.log(`✅ Created ${feedbackData.length} feedback entries`);

  // Create some feedback with manual overrides
  await prisma.feedback.create({
    data: {
      projectId: project.id,
      content:
        "This feature request was initially categorized as a bug, but it's actually a feature request.",
      email: 'override.user@example.com',
      category: 'BUG',
      sentiment: 'NEUTRAL',
      manualCategory: 'FEATURE',
      manualSentiment: 'POSITIVE',
      categoryOverridden: true,
      sentimentOverridden: true,
      status: 'REVIEWED',
      isAiAnalyzed: true,
      aiAnalyzedAt: new Date(),
      categoryConfidence: 0.6,
      sentimentConfidence: 0.7,
      notes: 'Manually recategorized after review',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('✅ Created feedback with manual overrides');

  console.log('🎉 Database seeding completed successfully!');
  console.log('📊 Summary:');
  console.log(`   - 1 user created`);
  console.log(`   - 1 project created`);
  console.log(`   - ${feedbackData.length + 1} feedback entries created`);
  console.log(`   - Project customization created`);
}

main()
  .catch(e => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
