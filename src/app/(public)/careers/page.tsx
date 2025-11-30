'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'
import { 
  Sparkles, 
  Rocket,
  Heart,
  Code2,
  Brain,
  Users,
  MapPin,
  ArrowRight
} from 'lucide-react'

const openPositions = [
  {
    title: 'Senior AI/ML Engineer',
    type: 'Full-time',
    location: 'Remote / Tashkent',
    description: 'Build and optimize our adaptive learning AI engine. Experience with NLP, transformers, and recommendation systems.',
  },
  {
    title: 'Full Stack Developer',
    type: 'Full-time',
    location: 'Remote / Tashkent',
    description: 'Create delightful learning experiences with React, Next.js, and Python/FastAPI.',
  },
  {
    title: 'Product Designer',
    type: 'Full-time',
    location: 'Remote / Tashkent',
    description: 'Design intuitive, beautiful interfaces that make learning joyful. Experience with EdTech is a plus.',
  },
]

export default function CareersPage() {
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

      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Badge variant="outline" className="mb-6">We&apos;re Hiring!</Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Join the <span className="text-primary">Education Revolution</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Help us build AI that transforms how the world learns. 
              We&apos;re looking for passionate people who want to make a real impact.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Why Join Us */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center mb-12"
          >
            Why Join Qadam?
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Rocket, title: 'Startup Energy', desc: 'Move fast, ship often, see your impact immediately' },
              { icon: Brain, title: 'Cutting-Edge AI', desc: 'Work with state-of-the-art ML and NLP technologies' },
              { icon: Heart, title: 'Mission Driven', desc: 'Make education accessible to millions worldwide' },
              { icon: Users, title: 'Great Team', desc: 'Collaborate with passionate, talented people' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full text-center">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-bold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Open Positions</h2>
            <p className="text-muted-foreground">Find your next opportunity with us</p>
          </motion.div>

          <div className="space-y-4">
            {openPositions.map((job, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="hover:border-primary/30 transition-all">
                  <CardContent className="py-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Code2 className="w-5 h-5 text-primary" />
                          <h3 className="text-xl font-bold">{job.title}</h3>
                        </div>
                        <p className="text-muted-foreground text-sm mb-2">{job.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {job.location}
                          </span>
                          <Badge variant="secondary">{job.type}</Badge>
                        </div>
                      </div>
                      <Button className="gap-2 whitespace-nowrap">
                        Apply Now <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <p className="text-muted-foreground mb-4">
              Don&apos;t see a role that fits? We&apos;re always looking for talented people.
            </p>
            <Link href="/contact">
              <Button variant="outline">Send us your resume</Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">© 2025 Qadam. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
