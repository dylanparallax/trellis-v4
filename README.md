# Trellis AI - Teacher Evaluation Platform

An AI-powered teacher evaluation and observation system designed for school districts. Transform rough observation notes into professional, growth-oriented feedback using advanced AI.

## 🚀 Features

- **AI-Enhanced Observations** - Transform rough notes into professional feedback
- **Teacher Management** - Comprehensive profiles with performance tracking
- **Evaluation Generation** - AI-powered comprehensive teacher evaluations
- **Analytics Dashboard** - District-wide insights and trends
- **Real-time Updates** - Live collaboration and notifications
- **File Upload & OCR** - Process lesson plans, student work, and artifacts
- **Demo Mode** - Interactive demo with sample data for presentations

## 🛠 Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Shadcn/UI
- **Backend**: Supabase (PostgreSQL), Prisma ORM
- **AI**: Vercel AI SDK, Claude 3, GPT-4
- **File Storage**: Uploadthing/AWS S3
- **Real-time**: Supabase subscriptions
- **Infrastructure**: Vercel, Redis (Upstash)

## 📦 Project Structure

```
trellis-ai/
├── apps/
│   └── web/                    # Next.js main application
│       ├── src/
│       │   ├── app/           # App Router pages
│       │   ├── components/    # React components
│       │   └── lib/          # Utilities and services
├── packages/
│   ├── database/              # Shared Prisma schema
│   ├── ai-prompts/           # Centralized AI prompts
│   └── types/                # Shared TypeScript types
└── infrastructure/           # Deployment configs
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- PostgreSQL database (or Supabase)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd trellis-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cd apps/web
   cp env.example .env.local
   ```
   
   Update `.env.local` with your configuration:
   ```env
   # Database
   DATABASE_URL="postgresql://..."
   
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # AI Services
   ANTHROPIC_API_KEY=your_anthropic_key
   OPENAI_API_KEY=your_openai_key
   ```

4. **Set up the database**
   ```bash
   cd packages/database
   npx prisma generate
   npx prisma db push
   ```

5. **Start the development server**
   ```bash
   cd apps/web
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Demo Mode

The application includes a comprehensive demo mode with:
- Sample teacher profiles and data
- Interactive AI enhancement demonstration
- Guided tour of features
- Realistic observation examples

Perfect for district presentations and demos!

## 📚 Key Features

### AI Enhancement
- Transform rough observation notes into professional feedback
- Connect observations to teacher goals and previous feedback
- Generate actionable next steps and growth recommendations
- Maintain supportive, growth-oriented tone

### Teacher Management
- Comprehensive teacher profiles
- Performance tracking and history
- Goal setting and progress monitoring
- Strength and growth area identification

### Observations
- Multiple observation types (Formal, Informal, Walkthrough)
- File upload and OCR processing
- Focus area tracking
- Real-time collaboration

### Evaluations
- AI-generated comprehensive evaluations
- Framework-aligned scoring
- Goal setting and recommendations
- Progress tracking over time

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run test         # Run tests

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio
```

### Adding New Features

1. **Components**: Add to `apps/web/src/components/`
2. **Pages**: Add to `apps/web/src/app/`
3. **API Routes**: Add to `apps/web/src/app/api/`
4. **Database**: Update `packages/database/prisma/schema.prisma`
5. **Types**: Add to `packages/types/src/index.ts`

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables

Required for production:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `ANTHROPIC_API_KEY` - Anthropic API key
- `OPENAI_API_KEY` - OpenAI API key

## 📄 License

This project is proprietary software. All rights reserved.

## 🤝 Contributing

This is a private project. Please contact the development team for contribution guidelines.

## 📞 Support

For support and questions, please contact the development team. 