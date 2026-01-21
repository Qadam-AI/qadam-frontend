import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { QueryProvider } from './_components/query-provider'
import { I18nProvider } from '@/lib/i18n'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Edusistent - Personalized Learning',
  description: 'Personalized, auto-graded practice that adapts to every learner',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <QueryProvider>
            <I18nProvider>
              {children}
              <Toaster richColors position="top-right" />
            </I18nProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

