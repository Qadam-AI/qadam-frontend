'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'
import { 
  Sparkles, 
  Download,
  FileText,
  Image,
  Palette,
  ArrowRight
} from 'lucide-react'

export default function PressPage() {
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
            <Badge variant="outline" className="mb-6">Press Kit</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Press &amp; Media <span className="text-primary">Resources</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to write about Qadam. Logos, brand guidelines, 
              and company information.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Company Info */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold mb-6">About Qadam</h2>
            <Card>
              <CardContent className="py-6">
                <p className="text-muted-foreground mb-4">
                  <strong>Qadam</strong> (meaning &quot;step&quot; in Uzbek) is an AI-powered 
                  adaptive learning platform that creates personalized educational 
                  experiences for every learner. Founded in Tashkent, Uzbekistan, 
                  Qadam aims to democratize quality education through cutting-edge 
                  artificial intelligence.
                </p>
                <p className="text-muted-foreground mb-4">
                  Our proprietary AI engine analyzes individual learning patterns 
                  and adapts content in real-time, ensuring optimal learning outcomes 
                  for students of all backgrounds and abilities.
                </p>
                <div className="grid md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
                  <div>
                    <div className="text-sm text-muted-foreground">Founded</div>
                    <div className="font-bold">2024</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Headquarters</div>
                    <div className="font-bold">Tashkent, Uzbekistan</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Stage</div>
                    <div className="font-bold">Prototype</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Brand Assets */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl font-bold mb-8"
          >
            Brand Assets
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="h-full">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Image className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-bold">Logo Package</div>
                      <div className="text-sm text-muted-foreground">PNG, SVG formats</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Primary logo, icon, and wordmark in various formats and backgrounds.
                  </p>
                  <Button variant="outline" className="w-full gap-2" disabled>
                    <Download className="w-4 h-4" /> Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="h-full">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Palette className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-bold">Brand Colors</div>
                      <div className="text-sm text-muted-foreground">Primary palette</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary" title="Primary"></div>
                    <div className="w-12 h-12 rounded-lg bg-violet-600" title="Secondary"></div>
                    <div className="w-12 h-12 rounded-lg bg-gray-900 dark:bg-gray-100" title="Dark/Light"></div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Primary: #7C3AED • Secondary: #8B5CF6
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Media Contact */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-gradient-to-br from-primary to-violet-600 text-primary-foreground">
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-90" />
              <h2 className="text-2xl font-bold mb-4">Media Inquiries</h2>
              <p className="opacity-90 mb-6 max-w-xl mx-auto">
                For press inquiries, interviews, or additional information, 
                please contact our communications team.
              </p>
              <Link href="/contact">
                <Button size="lg" variant="secondary" className="gap-2">
                  Contact Press Team <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
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
