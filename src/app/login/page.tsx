'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from '@/lib/i18n'
import { Twitter, Linkedin, Github } from 'lucide-react'

export default function LoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoggingIn, isAuthenticated } = useAuth()
  const router = useRouter()
  const t = useTranslations('landing')
  const tCommon = useTranslations('common')
  const tAuth = useTranslations('auth')

  // Redirect if already authenticated
  const { user } = useAuth()
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'instructor' || user.role === 'admin') {
        router.push('/instructor')
      } else {
        router.push('/')
      }
    }
  }, [isAuthenticated, user, router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Determine if input is email or username
    const isEmail = emailOrUsername.includes('@')
    if (isEmail) {
      login({ email: emailOrUsername, password })
    } else {
      login({ username: emailOrUsername, password })
    }
  }

  if (isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navigation - same as landing page */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-bold text-xl bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">{tCommon('appName')}</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-6">
              <Link href="/#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('nav.features')}</Link>
              <Link href="/#use-cases" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('nav.useCases')}</Link>
              <Link href="/#team" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('nav.team')}</Link>
              <Link href="/#roadmap" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('nav.roadmap')}</Link>
            </div>
            
            <div className="flex items-center gap-2">
              
            </div>
          </div>
        </div>
      </nav>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center pt-24 pb-16 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <Card className="border-2">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold">{tAuth('login.title')}</CardTitle>
              <CardDescription>
                {tAuth('login.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emailOrUsername">Email or Username</Label>
                  <Input
                    id="emailOrUsername"
                    type="text"
                    placeholder="email@example.com or username"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{tAuth('login.password')}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? tCommon('loading') : tAuth('login.submit')}
                </Button>
              </form>

              <div className="mt-6 p-4 rounded-lg bg-muted/50 text-sm">
                <p className="font-medium mb-2">Demo Credentials:</p>
                <code className="block text-xs">learner@qadam.dev / demo123</code>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Footer - same as landing page */}
      <footer className="py-16 border-t">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <span className="font-bold text-xl bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">{tCommon('appName')}</span>
              </Link>
              <p className="text-muted-foreground text-sm mb-4 max-w-xs">{t('footer.description')}</p>
              <div className="flex gap-3">
                <a href="#" className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"><Twitter className="w-4 h-4" /></a>
                <a href="#" className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"><Linkedin className="w-4 h-4" /></a>
                <a href="#" className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"><Github className="w-4 h-4" /></a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">{t('footer.product')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/#features" className="hover:text-primary transition-colors">{t('nav.features')}</Link></li>
                <li><Link href="/#use-cases" className="hover:text-primary transition-colors">{t('nav.useCases')}</Link></li>
                <li><Link href="/#metrics" className="hover:text-primary transition-colors">{t('nav.goals')}</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">{t('footer.company')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-primary transition-colors">{t('footer.about')}</Link></li>
                <li><Link href="/careers" className="hover:text-primary transition-colors">{t('footer.careers')}</Link></li>
                <li><Link href="/investors" className="hover:text-primary transition-colors">{t('footer.investors')}</Link></li>
                <li><Link href="/press" className="hover:text-primary transition-colors">{t('footer.press')}</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">{t('footer.legal')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-primary transition-colors">{t('footer.privacy')}</Link></li>
                <li><Link href="/terms" className="hover:text-primary transition-colors">{t('footer.terms')}</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors">{t('footer.contact')}</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">{t('footer.copyright')}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>🇺🇿</span><span>{t('footer.madeIn')}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

