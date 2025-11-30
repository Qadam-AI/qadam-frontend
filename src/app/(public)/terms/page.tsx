'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Sparkles } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">Qadam</span>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/login"><Button size="sm">Get Started</Button></Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
            <p className="text-muted-foreground mb-8">Last updated: November 30, 2025</p>

            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <h2>1. Acceptance of Terms</h2>
              <p>
                By accessing or using Qadam&apos;s services, you agree to be bound by these 
                Terms of Service and all applicable laws and regulations. If you do not 
                agree with any of these terms, you are prohibited from using our services.
              </p>

              <h2>2. Description of Service</h2>
              <p>
                Qadam provides an AI-powered adaptive learning platform that offers 
                personalized educational experiences. Our services include but are not 
                limited to: interactive lessons, practice exercises, progress tracking, 
                and AI-generated feedback.
              </p>

              <h2>3. User Accounts</h2>
              <p>
                To use certain features, you must create an account. You are responsible 
                for maintaining the confidentiality of your account credentials and for 
                all activities under your account.
              </p>

              <h2>4. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul>
                <li>Use our services for any illegal purpose</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Share account credentials with others</li>
                <li>Interfere with or disrupt our services</li>
                <li>Copy, modify, or distribute our content without permission</li>
                <li>Use automated systems to access our services</li>
              </ul>

              <h2>5. Intellectual Property</h2>
              <p>
                All content, features, and functionality of our services are owned by 
                Qadam and are protected by international copyright, trademark, and other 
                intellectual property laws.
              </p>

              <h2>6. User Content</h2>
              <p>
                You retain ownership of content you submit. By submitting content, you 
                grant us a license to use, store, and process it for providing our services 
                and improving our AI systems.
              </p>

              <h2>7. Disclaimer</h2>
              <p>
                Our services are provided &quot;as is&quot; without warranties of any kind. 
                We do not guarantee that our services will be uninterrupted, secure, or 
                error-free.
              </p>

              <h2>8. Limitation of Liability</h2>
              <p>
                Qadam shall not be liable for any indirect, incidental, special, or 
                consequential damages arising from your use of our services.
              </p>

              <h2>9. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. Continued use 
                of our services after changes constitutes acceptance of the new terms.
              </p>

              <h2>10. Termination</h2>
              <p>
                We may terminate or suspend your account at our discretion, without 
                prior notice, for violations of these terms or for any other reason.
              </p>

              <h2>11. Governing Law</h2>
              <p>
                These terms shall be governed by the laws of the Republic of Uzbekistan, 
                without regard to conflict of law provisions.
              </p>

              <h2>12. Contact</h2>
              <p>
                Questions about these Terms should be directed to{' '}
                <a href="mailto:shukrullo.coder@gmail.com">shukrullo.coder@gmail.com</a>.
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">© 2025 Qadam. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
