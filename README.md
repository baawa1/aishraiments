# A'ish Raiments - Inventory & Accounting Management System

> **Fashion Designer with Panache** - A comprehensive business management solution for fashion sewing businesses

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [Development Status](#development-status)
- [Contributing](#contributing)
- [Support](#support)

---

## 🎯 Overview

A'ish Raiments Management System is a modern web application designed to replace Excel-based tracking for fashion sewing businesses. It provides real-time inventory management, customer order tracking, expense monitoring, and comprehensive business analytics.

### Why This App?

- ✅ **Eliminate Manual Errors** - Automatic calculations for profit, balances, and inventory
- ✅ **Real-time Insights** - Dashboard with instant business metrics
- ✅ **Mobile Accessible** - Manage your business from any device
- ✅ **Multi-user Support** - Team collaboration with 2-3 users
- ✅ **Automated Alerts** - Low stock warnings and overdue payment tracking
- ✅ **Brand Identity** - Custom colors and professional design

### Target Users

- Fashion designers and tailors
- Small sewing businesses
- Bespoke garment makers
- Fashion entrepreneurs

---

## ✨ Features

### Completed ✅

#### 🔐 Authentication
- Secure login/logout
- Session management
- Protected routes

#### 📊 Dashboard
- 7 Key Performance Indicators:
  - Total Sales
  - Amount Collected
  - Outstanding Balance
  - Total Expenses
  - Material Cost
  - Profit
  - Inventory Value
- Recent jobs list
- Low stock alerts

#### 📦 Inventory Management
- Full CRUD operations (Create, Read, Update, Delete)
- Search and filter by category
- Low stock alerts with reorder levels
- Automatic quantity and cost calculations
- Supplier tracking
- Storage location management

### In Progress 🔄

- Sewing Jobs module
- Customers database
- Expenses tracking
- Sales summary
- Receivables view
- Collections log

### Planned 📋

- Monthly reports with charts
- Settings page
- Form validation
- Mobile responsive optimization
- PDF export
- Email notifications

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** [Next.js 14](https://nextjs.org/) - React framework with server-side rendering
- **Language:** [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/) - Beautifully designed components
- **Icons:** [Lucide React](https://lucide.dev/) - Modern icon library
- **Charts:** [Recharts](https://recharts.org/) - Composable charting library

### Backend & Database
- **Database:** [Supabase](https://supabase.com/) (PostgreSQL)
- **Authentication:** Supabase Auth
- **Real-time:** Supabase Realtime
- **Storage:** Supabase Storage (future)

### Development
- **Package Manager:** npm
- **Linting:** ESLint
- **Formatting:** Prettier (recommended)
- **Version Control:** Git

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Supabase Account** ([Sign up free](https://supabase.com/))
- **Git** (optional, for version control)

### Installation

1. **Clone the repository** (or download ZIP)
   ```bash
   git clone <repository-url>
   cd aishraiments-new
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for setup to complete (1-2 minutes)

4. **Run database migration**
   - In Supabase dashboard, go to **SQL Editor**
   - Click **New Query**
   - Copy/paste contents of `supabase/migrations/001_initial_schema.sql`
   - Click **Run**

5. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` and add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

6. **Create users**
   - In Supabase dashboard, go to **Authentication** → **Users**
   - Click **Add User** → **Create new user**
   - Enter email and password
   - ✅ Check "Auto Confirm User"
   - Click **Create user**

7. **Run the development server**
   ```bash
   npm run dev
   ```

8. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### First Login

Use the email and password you created in Supabase to log in.

---

## 📁 Project Structure

```
aishraiments-new/
├── src/
│   ├── app/                      # Next.js 14 App Router
│   │   ├── dashboard/            # Dashboard page
│   │   ├── inventory/            # Inventory management
│   │   ├── jobs/                 # Sewing jobs (pending)
│   │   ├── expenses/             # Expenses (pending)
│   │   ├── sales/                # Sales summary (pending)
│   │   ├── customers/            # Customer database (pending)
│   │   ├── receivables/          # Receivables view (pending)
│   │   ├── reports/              # Monthly reports (pending)
│   │   ├── settings/             # Settings (pending)
│   │   ├── login/                # Login page
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Home page (redirects to dashboard)
│   │   └── globals.css           # Global styles
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── dashboard/            # Dashboard-specific components
│   │   └── navigation.tsx        # Sidebar navigation
│   ├── lib/
│   │   ├── supabase/             # Supabase client configuration
│   │   └── utils.ts              # Utility functions
│   └── types/
│       └── database.ts           # TypeScript types
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Database schema
├── public/                       # Static assets
├── .env.local.example            # Environment variables template
├── .gitignore                    # Git ignore rules
├── components.json               # shadcn/ui configuration
├── next.config.mjs               # Next.js configuration
├── package.json                  # Dependencies
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── PRD.md                        # Product Requirements Document
├── SETUP.md                      # Setup guide
└── README.md                     # This file
```

---

## 📚 Documentation

- **[PRD.md](./PRD.md)** - Complete Product Requirements Document
  - Feature specifications
  - Database schema
  - User personas
  - Implementation roadmap
  - Success criteria

- **[SETUP.md](./SETUP.md)** - Step-by-step setup guide
  - Supabase configuration
  - Environment setup
  - User creation
  - Troubleshooting

- **[Database Schema](./supabase/migrations/001_initial_schema.sql)** - Complete SQL schema
  - All tables and relationships
  - Computed columns
  - Indexes and constraints
  - Row-level security

---

## 🎨 Brand Identity

- **Primary Color:** #72D0CF (Teal) - Creativity & sophistication
- **Accent Color:** #EC88C7 (Pink) - Fashion & elegance
- **Fonts:** Inter (Google Fonts)
- **Logo:** [Your logo here]

---

## 📊 Development Status

### Phase 1: Foundation ✅ (100% Complete)
- [x] Project setup
- [x] Database schema
- [x] Authentication
- [x] Navigation
- [x] Dashboard
- [x] Inventory module

### Phase 2: Core Features 🔄 (0% Complete)
- [ ] Sewing Jobs
- [ ] Customers
- [ ] Expenses
- [ ] Sales Summary
- [ ] Collections Log
- [ ] Receivables

### Phase 3: Polish 📋 (0% Complete)
- [ ] Monthly Reports
- [ ] Settings
- [ ] Mobile optimization
- [ ] Form validation
- [ ] Error handling

### Phase 4: Enhancements 💡 (Future)
- [ ] Email/SMS notifications
- [ ] PDF generation
- [ ] Photo uploads
- [ ] Advanced analytics
- [ ] Mobile app

---

## 🧪 Testing

### Manual Testing Checklist

Before deploying, verify:

- [ ] Login/logout works
- [ ] Dashboard displays correct metrics
- [ ] Inventory CRUD operations work
- [ ] Search and filters work
- [ ] Low stock alerts show
- [ ] Calculations are accurate
- [ ] Mobile responsive
- [ ] No console errors

### Automated Tests (Future)
- Unit tests with Jest
- Integration tests with React Testing Library
- E2E tests with Playwright

---

## 🚢 Deployment

### Recommended: Vercel

1. Push code to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy

### Alternative: Other Platforms
- Netlify
- Railway
- Render
- AWS Amplify

---

## 🔐 Security

- ✅ Authentication required for all routes
- ✅ Row-level security in database
- ✅ Server-side validation
- ✅ HTTPS in production
- ✅ Environment variables for secrets
- ✅ No sensitive data in client code

---

## 🤝 Contributing

This is a private business application, but contributions are welcome:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Use TypeScript
- Follow ESLint rules
- Write clear commit messages
- Test before submitting PR

---

## 📄 License

This project is licensed under the MIT License.

---

## 💬 Support

### Need Help?

- **Setup Issues:** See [SETUP.md](./SETUP.md)
- **Feature Questions:** Check [PRD.md](./PRD.md)
- **Bug Reports:** Create an issue with screenshots
- **Feature Requests:** Add to product backlog

### Troubleshooting

**Build errors?**
- Check Node.js version (18+)
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Next.js cache: `rm -rf .next`

**Database errors?**
- Verify `.env.local` has correct Supabase credentials
- Check migration ran successfully in Supabase SQL Editor
- Verify tables exist in Supabase Table Editor

**Authentication errors?**
- Verify user exists in Supabase Authentication dashboard
- Check user is confirmed (auto-confirm enabled)
- Try password reset

---

## 🎯 Quick Links

- [Supabase Dashboard](https://app.supabase.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 📞 Contact

**Business:** A'ish Raiments
**Email:** [Your email]
**Location:** [Your location]

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Lucide](https://lucide.dev/) - Icon library

---

**Built with ❤️ for Fashion Entrepreneurs**

*A'ish Raiments - Fashion Designer with Panache*
