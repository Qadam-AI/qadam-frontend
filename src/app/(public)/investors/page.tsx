'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'
import { 
  Sparkles, 
  TrendingUp,
  Globe,
  Target,
  Users,
  ArrowRight,
  CheckCircle2,
  Building2
} from 'lucide-react'

export default function InvestorsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-bold text-xl bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">Edusistent</span>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/contact"><Button size="sm">Contact Us</Button></Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Badge variant="outline" className="mb-6">For Investors</Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Invest in the <span className="text-primary">Future of Education</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Edusistent is building AI-powered adaptive learning infrastructure 
              to serve the $8 trillion global education market.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Opportunity */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center mb-12"
          >
            The Opportunity
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { value: '$8T', label: 'Global Education Market', icon: Globe },
              { value: '2B+', label: 'Learners Underserved', icon: Users },
              { value: '85%', label: 'Students Disengaged', icon: Target },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-8 h-8 text-primary" />
                </div>
                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <p className="text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Edusistent */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Why Edusistent?</h2>
            <p className="text-muted-foreground">Our competitive advantages</p>
          </motion.div>

          <div className="space-y-4">
            {[
              'Proprietary AI engine with cognitive learning models',
              'Universal content compatibility (video, text, code, simulations)',
              'Enterprise-ready architecture with full API access',
              'Strong B2B + B2C + B2B2C go-to-market strategy',
              'Experienced team with EdTech and AI expertise',
              'First-mover advantage in emerging markets',
            ].map((point, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-4 rounded-lg bg-muted/50"
              >
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                <span>{point}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stage */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <Card className="border-2">
            <CardContent className="py-8">
              <div className="flex items-center gap-3 mb-6">
                <Badge className="bg-orange-500">Current Stage</Badge>
                <span className="font-bold text-xl">Prototype / Pre-Seed</span>
              </div>
              <p className="text-muted-foreground mb-6">
                We are currently in the prototype stage, validating our core technology 
                and gathering early user feedback. We&apos;re seeking visionary investors 
                who want to be part of transforming education from the ground floor.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-background">
                  <div className="font-bold mb-1">What we&apos;ve built</div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Working prototype with adaptive AI</li>
                    <li>• Multi-language support (EN/UZ/RU)</li>
                    <li>• Enterprise-ready architecture</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-background">
                  <div className="font-bold mb-1">Next milestones</div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Pilot with 3-5 institutions</li>
                    <li>• Enhanced AI with video analysis</li>
                    <li>• Seed funding round</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-gradient-to-br from-primary to-violet-600 text-primary-foreground">
            <CardContent className="py-12 text-center">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-90" />
              <h2 className="text-3xl font-bold mb-4">Partner With Us</h2>
              <p className="opacity-90 mb-8 max-w-xl mx-auto">
                We&apos;re looking for investors who share our vision of 
                democratizing quality education through AI.
              </p>
              <Link href="/contact">
                <Button size="lg" variant="secondary" className="gap-2">
                  Schedule a Call <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">© 2025 Edusistent. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
