'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useTranslations } from '@/lib/i18n';
import { 
  Play, 
  Code, 
  Sparkles, 
  Target, 
  BookOpen, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight,
  Zap,
  Brain,
  Trophy,
  Users,
  Video,
  MessageSquare,
  ChevronRight,
  Github,
  Twitter
} from 'lucide-react';

// Animated counter component
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return <span>{count.toLocaleString()}{suffix}</span>;
}

// Floating code elements for hero
function FloatingCode() {
  const codeSnippets = [
    { code: 'def hello():', top: '20%', left: '5%', delay: 0 },
    { code: 'for i in range(10):', top: '60%', left: '8%', delay: 0.5 },
    { code: 'if x > 0:', top: '40%', right: '5%', delay: 1 },
    { code: 'return result', top: '70%', right: '10%', delay: 1.5 },
    { code: 'print("Hello")', top: '30%', right: '15%', delay: 2 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {codeSnippets.map((snippet, i) => (
        <motion.div
          key={i}
          className="absolute font-mono text-xs sm:text-sm text-primary/20 dark:text-primary/10"
          style={{ top: snippet.top, left: snippet.left, right: snippet.right }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: [0, 0.5, 0],
            y: [20, 0, -20]
          }}
          transition={{ 
            duration: 4,
            delay: snippet.delay,
            repeat: Infinity,
            repeatDelay: 2
          }}
        >
          {snippet.code}
        </motion.div>
      ))}
    </div>
  );
}

// Step card with connection line
function StepCard({ 
  number, 
  title, 
  description, 
  icon: Icon, 
  isLast 
}: { 
  number: number;
  title: string;
  description: string;
  icon: React.ElementType;
  isLast?: boolean;
}) {
  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: number * 0.2 }}
        className="relative z-10"
      >
        <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50" />
          <CardContent className="pt-8 pb-6 px-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground shadow-lg group-hover:scale-110 transition-transform">
                  <Icon className="w-7 h-7" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    Step {number}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-muted-foreground">{description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Connection line */}
      {!isLast && (
        <div className="hidden md:block absolute top-1/2 -right-8 w-16 h-0.5 bg-gradient-to-r from-primary/50 to-transparent z-0" />
      )}
    </div>
  );
}

// Feature card with hover effect
function FeatureCard({ 
  icon: Icon, 
  title, 
  description,
  delay = 0
}: { 
  icon: React.ElementType;
  title: string;
  description: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="h-full border-2 hover:border-primary/30 hover:shadow-xl transition-all duration-300 group overflow-hidden">
        <CardContent className="pt-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
            <Icon className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold mb-2">{title}</h3>
          <p className="text-muted-foreground text-sm">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function LandingPage() {
  const t = useTranslations('landing');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Code className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">{tCommon('appName')}</span>
            </Link>
            
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
              <Link href="/login">
                <Button variant="ghost">{tNav('login')}</Button>
              </Link>
              <Link href="/login">
                <Button className="hidden sm:flex">{t('hero.cta')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        <FloatingCode />
        
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        
        <motion.div 
          style={{ opacity, scale }}
          className="container mx-auto px-4 py-20 relative z-10"
        >
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm">
                <Sparkles className="w-4 h-4 mr-2" />
                AI-Powered Learning Platform
              </Badge>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-6"
            >
              {t('hero.title')}{' '}
              <span className="text-primary relative">
                {t('hero.titleHighlight')}
                <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 200 8">
                  <path 
                    d="M0,4 Q50,0 100,4 T200,4" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="3"
                    className="text-primary/30"
                  />
                </svg>
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
            >
              {t('hero.subtitle')}
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/login">
                <Button size="lg" className="text-lg px-8 h-14 gap-2 group">
                  {t('hero.cta')}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 h-14 gap-2">
                <Play className="w-5 h-5" />
                {t('hero.secondaryCta')}
              </Button>
            </motion.div>
            
            {/* Scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="absolute bottom-10 left-1/2 -translate-x-1/2"
            >
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center"
              >
                <motion.div
                  animate={{ y: [0, 12, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-1.5 h-3 bg-primary rounded-full mt-2"
                />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 5000, label: t('stats.students'), suffix: '+' },
              { value: 100, label: t('stats.lessons'), suffix: '+' },
              { value: 500, label: t('stats.exercises'), suffix: '+' },
              { value: 98, label: t('stats.satisfaction'), suffix: '%' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">{t('features.title')}</h2>
            <p className="text-xl text-muted-foreground">{t('features.subtitle')}</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={Brain}
              title={t('features.adaptive.title')}
              description={t('features.adaptive.description')}
              delay={0}
            />
            <FeatureCard
              icon={Video}
              title={t('features.video.title')}
              description={t('features.video.description')}
              delay={0.1}
            />
            <FeatureCard
              icon={MessageSquare}
              title={t('features.feedback.title')}
              description={t('features.feedback.description')}
              delay={0.2}
            />
            <FeatureCard
              icon={TrendingUp}
              title={t('features.progress.title')}
              description={t('features.progress.description')}
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">{t('howItWorks.title')}</h2>
            <p className="text-xl text-muted-foreground">{t('howItWorks.subtitle')}</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <StepCard
              number={1}
              icon={BookOpen}
              title={t('howItWorks.step1.title')}
              description={t('howItWorks.step1.description')}
            />
            <StepCard
              number={2}
              icon={Code}
              title={t('howItWorks.step2.title')}
              description={t('howItWorks.step2.description')}
            />
            <StepCard
              number={3}
              icon={Zap}
              title={t('howItWorks.step3.title')}
              description={t('howItWorks.step3.description')}
            />
            <StepCard
              number={4}
              icon={Trophy}
              title={t('howItWorks.step4.title')}
              description={t('howItWorks.step4.description')}
              isLast
            />
          </div>
        </div>
      </section>

      {/* Demo/Preview Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold mb-6">
                Learn by doing, not just watching
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Our platform combines the best of video learning with hands-on practice. 
                Watch a concept, then immediately apply it with personalized coding challenges.
              </p>
              <ul className="space-y-4">
                {[
                  'Personalized difficulty based on your progress',
                  'Instant code execution and feedback',
                  'AI-powered hints when you get stuck',
                  'Track your mastery over time',
                ].map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative rounded-xl overflow-hidden border-2 shadow-2xl bg-card">
                {/* Code editor preview */}
                <div className="bg-muted px-4 py-2 flex items-center gap-2 border-b">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <span className="text-sm text-muted-foreground ml-2">solution.py</span>
                </div>
                <div className="p-4 font-mono text-sm">
                  <div className="text-muted-foreground"># Write a function that returns the sum</div>
                  <div><span className="text-purple-500">def</span> <span className="text-blue-500">sum_numbers</span>(numbers):</div>
                  <div className="pl-4"><span className="text-purple-500">return</span> <span className="text-blue-500">sum</span>(numbers)</div>
                  <div className="mt-4 text-muted-foreground"># Test your solution</div>
                  <div><span className="text-blue-500">print</span>(sum_numbers([<span className="text-orange-500">1</span>, <span className="text-orange-500">2</span>, <span className="text-orange-500">3</span>]))</div>
                  <div className="mt-2 text-green-500"># Output: 6 ✓</div>
                </div>
              </div>
              
              {/* Floating badge */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">All tests passed!</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">{t('cta.title')}</h2>
            <p className="text-xl opacity-90 mb-10">{t('cta.subtitle')}</p>
            <Link href="/login">
              <Button size="lg" variant="secondary" className="text-lg px-10 h-14 gap-2 group">
                {t('cta.button')}
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Code className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-xl">{tCommon('appName')}</span>
              </Link>
              <p className="text-muted-foreground text-sm">{t('footer.description')}</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">{t('footer.product')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/lessons" className="hover:text-primary transition-colors">{tNav('lessons')}</Link></li>
                <li><Link href="/practice" className="hover:text-primary transition-colors">{tNav('practice')}</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">{t('footer.company')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary transition-colors">{t('footer.about')}</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">{t('footer.blog')}</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">{t('footer.careers')}</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">{t('footer.legal')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary transition-colors">{t('footer.privacy')}</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">{t('footer.terms')}</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">{t('footer.copyright')}</p>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
