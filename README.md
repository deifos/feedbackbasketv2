# FeedbackBasket 🗂️

**Turn feedback into action, instantly**

A modern, secure feedback collection platform that helps you gather, manage, and act on user feedback with ease. Built with Next.js, TypeScript, and modern web technologies.

## 🌟 Features

### 📝 **Feedback Collection**

- **Embeddable Widget** - Add a customizable feedback widget to any website
- **Real-time Submission** - Instant feedback collection with validation
- **Optional Email Collection** - Capture user contact information
- **Responsive Design** - Works perfectly on desktop and mobile

### 🎨 **Customization**

- **Widget Appearance** - Customize colors, border radius, and labels
- **Custom Messages** - Personalize intro and success messages
- **Live Preview** - See changes in real-time before deployment
- **Brand Integration** - Match your website's design seamlessly(Coming soon)

### 📊 **Management Dashboard**

- **Project Organization** - Manage multiple feedback projects
- **Status Tracking** - Mark feedback as Pending, Reviewed, or Done
- **Advanced Filtering** - Search, filter, and sort feedback efficiently
- **Bulk Operations** - Update multiple feedback items at once
- **Private Notes** - Add internal notes to feedback items
- **Pagination** - Handle large volumes of feedback smoothly

### 🛡️ **Security & Performance**

- **Input Validation** - Comprehensive client and server-side validation
- **XSS Prevention** - HTML sanitization to prevent malicious content
- **Rate Limiting** - Prevent spam and abuse
- **Authentication** - Secure user accounts and project access
- **Data Sanitization** - Clean and safe data storage

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **npm** or **yarn**
- **PostgreSQL** database
- **Git**

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd feedbackbasket
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Configure your `.env` file with:

   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/feedbackbasket"

   # Authentication (Better Auth)
   BETTER_AUTH_SECRET="your-secret-key-here"
   BETTER_AUTH_URL="http://localhost:3000"

   # Optional: Email configuration
   EMAIL_SERVER_HOST="smtp.example.com"
   EMAIL_SERVER_PORT=587
   EMAIL_SERVER_USER="your-email@example.com"
   EMAIL_SERVER_PASSWORD="your-password"
   EMAIL_FROM="noreply@yourapp.com"
   ```

4. **Set up the database**

   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run database migrations
   npx prisma migrate deploy

   # Optional: Seed the database
   npx prisma db seed
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage

### Creating Your First Project

1. **Sign up** for an account at `/sign-up`
2. **Complete onboarding** - You'll be guided through creating your first project
3. **Customize your widget** - Set colors, messages, and appearance
4. **Get the embed code** - Copy the JavaScript snippet
5. **Add to your website** - Paste the code before the closing `</body>` tag

### Embedding the Widget

Add this code to your website:

```html
<script>
  window.FeedbackWidget.init({
    projectId: 'your-project-id',
    apiEndpoint: 'https://yourapp.com/api/widget/feedback',
    buttonColor: '#3b82f6',
    buttonRadius: 8,
    buttonLabel: 'Feedback',
    introMessage: "We'd love to hear your thoughts!",
    successMessage: 'Thank you for your feedback!',
  });
</script>
<script src="https://yourapp.com/widget/feedback-widget.js"></script>
```

### Managing Feedback

1. **View Dashboard** - See all your projects and feedback counts
2. **Filter & Search** - Find specific feedback quickly
3. **Update Status** - Mark feedback as reviewed or done
4. **Add Notes** - Keep internal notes on feedback items
5. **Bulk Actions** - Update multiple items simultaneously

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: Better Auth
- **Validation**: Zod schemas
- **Security**: DOMPurify, Rate limiting
- **Styling**: Tailwind CSS, Radix UI components

### Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── (auth)/           # Authentication pages
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── ...               # Feature components
├── lib/                  # Utility libraries
│   ├── validation.ts     # Zod schemas
│   ├── sanitization.ts   # Input sanitization
│   └── rate-limit.ts     # Rate limiting
├── prisma/               # Database schema and migrations
├── public/               # Static assets
│   └── widget/          # Embeddable widget files
└── ...
```

### API Endpoints

| Endpoint                           | Method           | Description                  |
| ---------------------------------- | ---------------- | ---------------------------- |
| `/api/projects`                    | GET, POST        | List and create projects     |
| `/api/projects/[id]`               | GET, PUT, DELETE | Manage individual projects   |
| `/api/projects/[id]/customization` | GET, PUT         | Widget customization         |
| `/api/widget/feedback`             | POST             | Submit feedback (public)     |
| `/api/feedback/[id]`               | PUT, DELETE      | Update feedback status/notes |

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks

# Database
npx prisma studio    # Open Prisma Studio
npx prisma migrate dev # Create and apply migration
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema changes
```

### Environment Setup

1. **Database Setup**
   - Install PostgreSQL
   - Create a database for the project
   - Update `DATABASE_URL` in `.env`

2. **Authentication Setup**
   - Generate a secure secret for `BETTER_AUTH_SECRET`
   - Configure OAuth providers if needed

3. **Development Tools**
   - Install recommended VS Code extensions
   - Configure Prettier and ESLint

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Configure environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

### Manual Deployment

1. **Build the application**

   ```bash
   npm run build
   ```

2. **Set up production database**

   ```bash
   npx prisma migrate deploy
   ```

3. **Start the production server**
   ```bash
   npm start
   ```

### Environment Variables for Production

```env
DATABASE_URL="your-production-database-url"
BETTER_AUTH_SECRET="your-production-secret"
BETTER_AUTH_URL="https://yourdomain.com"
NODE_ENV="production"
```

## 📊 Features Overview

### ✅ Completed Features

- [x] User authentication and authorization
- [x] Project creation and management
- [x] Widget customization with live preview
- [x] Embeddable JavaScript widget
- [x] Feedback submission and storage
- [x] Dashboard with feedback management
- [x] Advanced filtering and search
- [x] Pagination for large datasets
- [x] Bulk status management
- [x] Input validation and sanitization
- [x] Rate limiting and security measures
- [x] Responsive design
- [x] Onboarding flow for new users

### 🚧 Planned Features

- [ ] AI sentiment analysis
- [ ] MCP server
- [ ] AI assistant to generate feedback responses or suggestion
- [ ] Email notifications
- [ ] Analytics and reporting
- [ ] API webhooks
- [ ] Team collaboration
- [ ] Advanced customization options
- [ ] Export functionality
- [ ] Integration with third-party tools such as Linea and Trello
- [ ] Public feature board with voting support.

## 🛡️ Security

This application implements multiple security measures:

- **Input Validation**: Zod schemas for all user inputs
- **XSS Prevention**: DOMPurify sanitization
- **Rate Limiting**: Prevents spam and abuse
- **Authentication**: Secure user sessions
- **CSRF Protection**: Built-in Next.js protection
- **SQL Injection Prevention**: Prisma ORM with parameterized queries

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs and request features via GitHub Issues
- **Discussions**: Join community discussions in GitHub Discussions

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Shadcn](https://ui.shadcn.com)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Database management with [Prisma](https://www.prisma.io/)
- Authentication by [Better Auth](https://www.better-auth.com/)

---

**Made with ❤️ for better user feedback collection**
