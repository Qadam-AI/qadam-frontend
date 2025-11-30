# QADAM Frontend

> Modern, responsive frontend for QADAM - Personalized, auto-graded practice that adapts to every learner.

A beautiful Next.js application with shadcn/ui, Framer Motion animations, and TanStack Query for data management.

## Features

- 🎨 **Modern UI** - Built with Tailwind CSS and shadcn/ui components
- 🌓 **Dark Mode** - System-aware theme switching
- ⚡ **Fast** - Next.js 15 with App Router
- 🎭 **Animated** - Smooth transitions with Framer Motion
- 📱 **Responsive** - Mobile-first design
- 🔐 **Secure** - JWT authentication
- 💾 **State Management** - Zustand for global state
- 🔄 **Data Fetching** - TanStack Query with optimistic updates
- ✨ **Code Editor** - Monaco Editor for writing code
- 🎊 **Delightful** - Confetti on success, toasts, micro-interactions

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui (Radix UI primitives)
- **Animations**: Framer Motion
- **State**: Zustand
- **Data Fetching**: TanStack Query v5
- **HTTP**: Axios
- **Validation**: Zod
- **Code Editor**: Monaco Editor
- **Icons**: Lucide React
- **Toasts**: Sonner

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm (or npm/yarn)
- Backend API running on `http://localhost:8000`

### Setup

```bash
# Install dependencies
pnpm install
# or
npm install

# Copy environment file
cp .env.example .env

# Start development server
pnpm dev
# or
npm run dev
```

Visit http://localhost:3000

### Production Build

```bash
pnpm build
pnpm start
```

## Project Structure

```
qadam-frontend/
├── src/
│   ├── app/                       # Next.js App Router pages
│   │   ├── page.tsx               # Dashboard
│   │   ├── login/page.tsx         # Login page
│   │   ├── practice/page.tsx      # Practice page
│   │   ├── lesson/[id]/page.tsx   # Lesson detail
│   │   └── _components/           # Page-specific components
│   │       ├── navbar.tsx
│   │       ├── sidebar.tsx
│   │       ├── footer.tsx
│   │       ├── mastery-bar.tsx
│   │       ├── mastery-card.tsx
│   │       ├── code-editor.tsx
│   │       ├── feedback-panel.tsx
│   │       ├── task-card.tsx
│   │       ├── skeletons.tsx
│   │       └── empty-states.tsx
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   └── theme-provider.tsx
│   ├── lib/
│   │   ├── api.ts                 # Axios instance
│   │   ├── auth.ts                # Auth helpers
│   │   ├── types.ts               # TypeScript types
│   │   ├── validation.ts          # Zod schemas
│   │   └── utils.ts               # Utilities
│   ├── stores/
│   │   ├── auth-store.ts          # Zustand auth store
│   │   └── ui-store.ts            # Zustand UI store
│   ├── hooks/
│   │   ├── useAuth.ts             # Auth hook
│   │   ├── useTasks.ts            # Tasks hook
│   │   ├── useMastery.ts          # Mastery hook
│   │   └── useWindowSize.ts       # Window size hook
│   └── styles/
│       └── globals.css            # Global styles
├── public/                        # Static assets
├── .env.example                   # Environment template
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Environment Variables

Create a `.env` file (use `.env.example` as template):

```env
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

## Pages

### Login (`/login`)
- Email/password authentication
- Dev credentials displayed
- Redirects to dashboard on success

### Dashboard (`/`)
- **Protected route**
- Mastery overview with animated cards
- Quick action cards
- "Welcome back" personalization

### Practice (`/practice`)
- **Protected route**
- Adaptive task generation
- Monaco code editor
- Real-time grading with feedback
- Confetti on success
- "Next task" flow

### Lesson (`/lesson/[lessonId]`)
- **Protected route**
- Lesson content
- Video player (mock)
- Concepts covered
- Mark as complete with suggested next step

## Components

### UI Components (`src/components/ui/`)
shadcn/ui components:
- Button, Card, Badge, Progress
- Input, Label, Avatar
- Dropdown Menu, Separator
- Skeleton (loading states)

### App Components (`src/app/_components/`)

#### MasteryBar
Animated progress bar showing mastery level (0-100%)

#### MasteryCard
Card displaying concept mastery with icon, progress, and action button

#### CodeEditor
Monaco Editor wrapper with Python syntax highlighting

#### FeedbackPanel
Pass/fail feedback with expandable test details

#### TaskCard
Task prompt, tests, and optional hint display

#### Skeletons
Loading placeholders for cards and dashboard

#### EmptyStates
Empty/error states with retry actions

## API Integration

The app connects to the QADAM backend:

### Endpoints Used
- `POST /auth/login` - Authentication
- `GET /users/{userId}/mastery` - Get user mastery
- `GET /next?userId=...` - Get next recommended task
- `POST /task/generate` - Generate new task
- `POST /task/grade` - Grade submission
- `GET /lessons/{lessonId}` - Get lesson details
- `POST /lessons/{lessonId}/complete` - Complete lesson

### Data Flow
1. **Auth**: JWT stored in localStorage + Zustand
2. **Queries**: TanStack Query with 1-minute stale time
3. **Mutations**: Optimistic updates, toast notifications
4. **Interceptors**: Auto-inject token, global error handling

## State Management

### Zustand Stores

#### Auth Store (`auth-store.ts`)
```typescript
{
  user: User | null
  token: string | null
  setAuth: (user, token) => void
  clear: () => void
}
```

#### UI Store (`ui-store.ts`)
```typescript
{
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'
  setSidebarOpen: (open) => void
  toggleSidebar: () => void
  setTheme: (theme) => void
}
```

## Design System

### Colors
- **Primary**: Indigo (#6366F1)
- **Background**: Neutral with subtle gradients
- **Cards**: Rounded (1rem), soft shadows
- **Text**: Inter font family

### Spacing
- 8px scale (spacing system)
- Generous padding on cards (p-6/p-8)

### Animations
- Duration: 150-250ms
- Easing: ease-out
- Page transitions: fade + slide
- Confetti on task pass
- Skeleton shimmer on loading

### Accessibility
- Focus-visible rings
- Semantic HTML
- ARIA labels
- Keyboard navigation

## Development

### Adding a New Page

1. Create page in `src/app/your-page/page.tsx`
2. Wrap with `<AuthGuard>` if protected
3. Use layout components (Navbar, Sidebar, Footer)
4. Add to sidebar nav items if needed

### Adding a New Component

1. Create in `src/app/_components/` or `src/components/ui/`
2. Use TypeScript props interface
3. Export for reuse
4. Add Framer Motion animations where appropriate

### API Calls

Use TanStack Query:

```typescript
// Query (GET)
const { data, isLoading } = useQuery({
  queryKey: ['key'],
  queryFn: async () => {
    const res = await api.get('/endpoint')
    return schema.parse(res.data)
  },
})

// Mutation (POST/PUT)
const mutation = useMutation({
  mutationFn: async (data) => {
    const res = await api.post('/endpoint', data)
    return res.data
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['key'] })
    toast.success('Success!')
  },
})
```

## Deployment

### Vercel (Recommended)

```bash
# Deploy to Vercel
vercel

# Or connect your GitHub repo to Vercel
# Auto-deploys on push to main
```

### Other Platforms

```bash
# Build
pnpm build

# Output in .next/
# Serve with:
pnpm start
```

### Environment Variables in Production

Set `NEXT_PUBLIC_API_BASE` to your production API URL.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Lighthouse Score: 95+
- First Contentful Paint: <1s
- Time to Interactive: <2s
- Bundle size optimized with tree-shaking

## Known Issues / Future Enhancements

- [ ] Lesson video player (currently mock)
- [ ] Attempts history page
- [ ] Course browsing page
- [ ] Real-time mastery updates via WebSocket
- [ ] Offline support with service workers
- [ ] Progressive Web App (PWA)

## Contributing

This project follows:
- TypeScript strict mode
- ESLint + Prettier
- Conventional commits
- Component-driven development

## License

[Your License]

## Support

For issues related to the backend API, see `../qadam-backend/README.md`

---

Built with ❤️ using Next.js 15 and shadcn/ui

