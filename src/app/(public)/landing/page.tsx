'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useTranslations } from '@/lib/i18n';
import { 
  Play, 
  Sparkles, 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight,
  Zap,
  Brain,
  Trophy,
  Users,
  Video,
  MessageSquare,
  Github,
  Twitter,
  Building2,
  GraduationCap,
  Globe,
  Shield,
  BarChart3,
  Linkedin,
  ChevronLeft,
  ChevronRight
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

// Animated gradient orbs
function GradientOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-500/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 right-1/3 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '0.5s' }} />
    </div>
  );
}

// Metric card for the metrics section
function MetricCard({ value, label, compare, delay = 0 }: { value: string; label: string; compare: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all h-full bg-gradient-to-br from-background to-muted/30">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-violet-500 to-primary" />
        <CardContent className="pt-8 pb-6 text-center">
          <div className="text-5xl font-bold text-primary mb-2">{value}</div>
          <div className="text-lg font-semibold mb-1">{label}</div>
          <div className="text-sm text-muted-foreground">{compare}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Use case card
function UseCaseCard({ icon: Icon, title, description, features, delay = 0, gradient }: { icon: React.ElementType; title: string; description: string; features: string[]; delay?: number; gradient: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay }}>
      <Card className={`h-full border-2 hover:border-primary/30 transition-all overflow-hidden group ${gradient}`}>
        <CardContent className="pt-8">
          <div className="w-14 h-14 rounded-2xl bg-background/80 backdrop-blur flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
            <Icon className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-2xl font-bold mb-3">{title}</h3>
          <p className="text-muted-foreground mb-6">{description}</p>
          <ul className="space-y-3">
            {features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Feature card with icon
function FeatureCard({ icon: Icon, title, description, delay = 0 }: { icon: React.ElementType; title: string; description: string; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay }}>
      <Card className="h-full border hover:border-primary/30 hover:shadow-xl transition-all duration-300 group">
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

// Step component for How it Works
function StepCard({ number, title, description, icon: Icon, isLast }: { number: number; title: string; description: string; icon: React.ElementType; isLast?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: number * 0.15 }}>
      <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 group h-full">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-violet-500" />
        <CardContent className="pt-8 pb-6 px-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center text-primary-foreground shadow-lg group-hover:scale-110 transition-transform">
                <Icon className="w-7 h-7" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">0{number}</span>
              </div>
              <h3 className="text-xl font-bold mb-2">{title}</h3>
              <p className="text-muted-foreground">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Team member data
const teamMembers = [
  {
    name: "Shukrullo Jumanazarov",
    role: "Backend Developer",
    image: "https://www.dropbox.com/scl/fi/okf59jf1e7e6vvj6ejrvj/1740572402226.jpg?rlkey=twighk7nq8kws6vvs7y65gn6m&dl=1",
    linkedin: "https://www.linkedin.com/in/shukrullo-jumanazarov/",
    skills: ["Python", "FastAPI", "PostgreSQL", "Docker"]
  },
  {
    name: "Shoislom Abloberdiev",
    role: "Backend Developer",
    image: "/team/shoislom.jpg",
    linkedin: "https://www.linkedin.com/in/shoislom-abloberdiev-797264287",
    skills: ["Python", "FastAPI", "SQLAlchemy", "Redis"]
  },
  {
    name: "Sohibjon Qurolov",
    role: "Data Analyst",
    image: "/team/sohibjon.jpg",
    linkedin: "https://www.linkedin.com/in/sohibjon-qurolov/",
    skills: ["Python", "Pandas", "Data Visualization", "SQL"]
  },
];

// Team member card component
function TeamMemberCard({ member, isActive }: { member: typeof teamMembers[0]; isActive: boolean }) {
  const [imageError, setImageError] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: isActive ? 1 : 0.5, scale: isActive ? 1 : 0.85 }}
      transition={{ duration: 0.4 }}
      className={`${isActive ? 'z-10' : 'z-0'}`}
    >
      <Card className={`overflow-hidden border-2 transition-all duration-300 ${isActive ? 'border-primary shadow-2xl' : 'border-muted'}`}>
        <CardContent className="p-0">
          <div className="relative aspect-square bg-gradient-to-br from-primary/20 to-violet-600/20 flex items-center justify-center overflow-hidden">
            {member.image && !imageError ? (
              <img
                src={member.image}
                alt={member.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center text-4xl font-bold text-white">
                {member.name.split(' ').map(n => n[0]).join('')}
              </div>
            )}
          </div>
          <div className="p-6 text-center">
            <h3 className="text-xl font-bold mb-1">{member.name}</h3>
            <p className="text-primary font-medium mb-3">{member.role}</p>
            <div className="flex flex-wrap justify-center gap-1 mb-4">
              {member.skills.map((skill, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
              ))}
            </div>
            <a 
              href={member.linkedin} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Linkedin className="w-4 h-4" />
              LinkedIn Profile
            </a>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Team carousel component
function TeamCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % teamMembers.length);
  }, []);

  const prevSlide = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + teamMembers.length) % teamMembers.length);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(nextSlide, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Carousel Container */}
      <div className="flex items-center justify-center gap-4 md:gap-8">
        {/* Previous Button */}
        <Button 
          variant="outline" 
          size="icon" 
          onClick={prevSlide}
          className="rounded-full shrink-0 hidden md:flex"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        {/* Cards Container */}
        <div className="relative w-full max-w-4xl overflow-hidden">
          <div className="flex items-center justify-center">
            <AnimatePresence mode="wait">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full px-4">
                {teamMembers.map((member, index) => {
                  // Calculate position relative to active index
                  const diff = index - activeIndex;
                  const isActive = index === activeIndex;
                  const isVisible = Math.abs(diff) <= 1 || (activeIndex === 0 && index === teamMembers.length - 1) || (activeIndex === teamMembers.length - 1 && index === 0);
                  
                  // On mobile, only show active card
                  return (
                    <div 
                      key={member.name} 
                      className={`${isActive ? 'block' : 'hidden md:block'} ${!isActive && 'md:opacity-60 md:scale-95'} transition-all duration-300`}
                    >
                      <TeamMemberCard member={member} isActive={isActive} />
                    </div>
                  );
                })}
              </div>
            </AnimatePresence>
          </div>
        </div>

        {/* Next Button */}
        <Button 
          variant="outline" 
          size="icon" 
          onClick={nextSlide}
          className="rounded-full shrink-0 hidden md:flex"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Mobile Navigation */}
      <div className="flex justify-center gap-4 mt-6 md:hidden">
        <Button variant="outline" size="icon" onClick={prevSlide} className="rounded-full">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <Button variant="outline" size="icon" onClick={nextSlide} className="rounded-full">
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-2 mt-6">
        {teamMembers.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === activeIndex 
                ? 'w-8 bg-primary' 
                : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const t = useTranslations('landing');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.15], [1, 0.98]);

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
              <span className="font-bold text-xl">{tCommon('appName')}</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#use-cases" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Use Cases</a>
              <a href="#team" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Team</a>
              <a href="#roadmap" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Roadmap</a>
            </div>
            
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
              <Link href="/login"><Button variant="ghost" size="sm">{tNav('login')}</Button></Link>
              <Link href="/login"><Button size="sm" className="hidden sm:flex gap-1">{t('hero.cta')}<ArrowRight className="w-4 h-4" /></Button></Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        <GradientOrbs />
        <motion.div style={{ opacity, scale }} className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Badge variant="outline" className="mb-6 px-4 py-2 text-sm border-primary/30 bg-primary/5">
                <Sparkles className="w-4 h-4 mr-2 text-primary" />
                {t('hero.badge')}
              </Badge>
            </motion.div>
            
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
              {t('hero.title')}{' '}
              <span className="bg-gradient-to-r from-primary via-violet-500 to-primary bg-clip-text text-transparent">{t('hero.titleHighlight')}</span>
            </motion.h1>
            
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
              {t('hero.subtitle')}
            </motion.p>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/login">
                <Button size="lg" className="text-lg px-8 h-14 gap-2 group bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90">
                  {t('hero.cta')}<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 h-14 gap-2"><Play className="w-5 h-5" />{t('hero.secondaryCta')}</Button>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-sm text-muted-foreground">
              <p className="mb-4">{t('hero.trustedBy')}</p>
              <div className="flex justify-center items-center gap-8 opacity-50">
                <Building2 className="w-8 h-8" /><GraduationCap className="w-8 h-8" /><Globe className="w-8 h-8" /><Building2 className="w-8 h-8" /><GraduationCap className="w-8 h-8" />
              </div>
            </motion.div>
          </div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center">
            <motion.div animate={{ y: [0, 12, 0] }} transition={{ duration: 2, repeat: Infinity }} className="w-1.5 h-3 bg-primary rounded-full mt-2" />
          </motion.div>
        </motion.div>
      </section>

      {/* Problem Section */}
      <section className="py-24 bg-muted/30 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <Badge variant="outline" className="mb-4">The Problem</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t('problem.title')}</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t('problem.subtitle')}</p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { value: '85%', label: t('problem.stat1.label') },
              { value: '67%', label: t('problem.stat2.label') },
              { value: '3x', label: t('problem.stat3.label') },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center p-6">
                <div className="text-5xl font-bold text-destructive mb-3">{stat.value}</div>
                <p className="text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <Badge variant="outline" className="mb-4 border-primary/30">The Solution</Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">{t('solution.title')}</h2>
              <p className="text-xl text-muted-foreground mb-6">{t('solution.subtitle')}</p>
              <p className="text-lg text-muted-foreground mb-8">{t('solution.description')}</p>
              <Link href="/login"><Button size="lg" className="gap-2">Try It Free <ArrowRight className="w-4 h-4" /></Button></Link>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
              <div className="relative rounded-2xl overflow-hidden border-2 shadow-2xl bg-gradient-to-br from-card to-muted/50 p-8">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold">Qadam Cognitive Engine</div>
                      <div className="text-sm text-muted-foreground">Real-time adaptation</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-background/60">
                      <Target className="w-5 h-5 text-primary" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">Learning Style Detected</div>
                        <div className="text-xs text-muted-foreground">Visual + Interactive</div>
                      </div>
                      <Badge variant="secondary">94% match</Badge>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-background/60">
                      <BarChart3 className="w-5 h-5 text-violet-500" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">Knowledge Gaps Identified</div>
                        <div className="text-xs text-muted-foreground">3 concepts need reinforcement</div>
                      </div>
                      <Badge variant="secondary">Adapting...</Badge>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <Zap className="w-5 h-5 text-green-500" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-green-600 dark:text-green-400">Optimal Path Generated</div>
                        <div className="text-xs text-muted-foreground">Personalized for maximum retention</div>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Platform Features</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t('features.title')}</h2>
            <p className="text-xl text-muted-foreground">{t('features.subtitle')}</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard icon={Brain} title={t('features.adaptive.title')} description={t('features.adaptive.description')} delay={0} />
            <FeatureCard icon={Video} title={t('features.video.title')} description={t('features.video.description')} delay={0.1} />
            <FeatureCard icon={Zap} title={t('features.feedback.title')} description={t('features.feedback.description')} delay={0.2} />
            <FeatureCard icon={BarChart3} title={t('features.progress.title')} description={t('features.progress.description')} delay={0.3} />
            <FeatureCard icon={Shield} title={t('features.enterprise.title')} description={t('features.enterprise.description')} delay={0.4} />
            <FeatureCard icon={Globe} title={t('features.multilingual.title')} description={t('features.multilingual.description')} delay={0.5} />
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="py-24">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Use Cases</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t('useCases.title')}</h2>
            <p className="text-xl text-muted-foreground">{t('useCases.subtitle')}</p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <UseCaseCard icon={Users} title={t('useCases.b2c.title')} description={t('useCases.b2c.description')} features={[t('useCases.b2c.features.0'), t('useCases.b2c.features.1'), t('useCases.b2c.features.2')]} gradient="bg-gradient-to-br from-blue-500/5 to-blue-600/10" delay={0} />
            <UseCaseCard icon={Building2} title={t('useCases.b2b.title')} description={t('useCases.b2b.description')} features={[t('useCases.b2b.features.0'), t('useCases.b2b.features.1'), t('useCases.b2b.features.2')]} gradient="bg-gradient-to-br from-violet-500/5 to-violet-600/10" delay={0.1} />
            <UseCaseCard icon={GraduationCap} title={t('useCases.b2b2c.title')} description={t('useCases.b2b2c.description')} features={[t('useCases.b2b2c.features.0'), t('useCases.b2b2c.features.1'), t('useCases.b2b2c.features.2')]} gradient="bg-gradient-to-br from-primary/5 to-primary/10" delay={0.2} />
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section id="metrics" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Proven Results</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t('metrics.title')}</h2>
            <p className="text-xl text-muted-foreground">{t('metrics.subtitle')}</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard value={t('metrics.completion.value')} label={t('metrics.completion.label')} compare={t('metrics.completion.compare')} delay={0} />
            <MetricCard value={t('metrics.speed.value')} label={t('metrics.speed.label')} compare={t('metrics.speed.compare')} delay={0.1} />
            <MetricCard value={t('metrics.retention.value')} label={t('metrics.retention.label')} compare={t('metrics.retention.compare')} delay={0.2} />
            <MetricCard value={t('metrics.nps.value')} label={t('metrics.nps.label')} compare={t('metrics.nps.compare')} delay={0.3} />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Process</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t('howItWorks.title')}</h2>
            <p className="text-xl text-muted-foreground">{t('howItWorks.subtitle')}</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StepCard number={1} icon={Target} title={t('howItWorks.step1.title')} description={t('howItWorks.step1.description')} />
            <StepCard number={2} icon={Sparkles} title={t('howItWorks.step2.title')} description={t('howItWorks.step2.description')} />
            <StepCard number={3} icon={MessageSquare} title={t('howItWorks.step3.title')} description={t('howItWorks.step3.description')} />
            <StepCard number={4} icon={Trophy} title={t('howItWorks.step4.title')} description={t('howItWorks.step4.description')} isLast />
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Our Team</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t('team.title')}</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t('team.subtitle')}</p>
          </motion.div>
          
          <TeamCarousel />

          {/* Why We Can Solve This */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            className="mt-16 max-w-4xl mx-auto"
          >
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-violet-500/5">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4 text-center">{t('team.whyUs.title')}</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Brain className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-semibold mb-2">{t('team.whyUs.expertise.title')}</h4>
                    <p className="text-sm text-muted-foreground">{t('team.whyUs.expertise.description')}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Target className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-semibold mb-2">{t('team.whyUs.motivation.title')}</h4>
                    <p className="text-sm text-muted-foreground">{t('team.whyUs.motivation.description')}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-semibold mb-2">{t('team.whyUs.experience.title')}</h4>
                    <p className="text-sm text-muted-foreground">{t('team.whyUs.experience.description')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section id="roadmap" className="py-24">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Development Journey</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t('roadmap.title')}</h2>
            <p className="text-xl text-muted-foreground">{t('roadmap.subtitle')}</p>
          </motion.div>

          {/* Current Stage Highlight */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            whileInView={{ opacity: 1, scale: 1 }} 
            viewport={{ once: true }}
            className="max-w-2xl mx-auto mb-12"
          >
            <Card className="border-2 border-primary bg-gradient-to-r from-primary/10 to-violet-500/10">
              <CardContent className="p-6 text-center">
                <Badge className="mb-3 bg-primary">Current Stage</Badge>
                <h3 className="text-3xl font-bold mb-2">🚀 Prototype</h3>
                <p className="text-muted-foreground">{t('roadmap.currentStage')}</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Roadmap Timeline */}
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-muted via-primary to-muted hidden md:block" />
              
              {/* Timeline Items */}
              <div className="space-y-8">
                {[
                  { stage: 'Idea', status: 'completed', description: t('roadmap.stages.idea') },
                  { stage: 'Prototype', status: 'current', description: t('roadmap.stages.prototype') },
                  { stage: 'MVP', status: 'upcoming', description: t('roadmap.stages.mvp') },
                  { stage: 'Launch', status: 'upcoming', description: t('roadmap.stages.launch') }
                ].map((item, index) => (
                  <motion.div
                    key={item.stage}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center gap-4 md:gap-8 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                  >
                    <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                      <Card className={`border-2 ${item.status === 'current' ? 'border-primary shadow-lg' : item.status === 'completed' ? 'border-green-500/50' : 'border-muted'}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            {item.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                            {item.status === 'current' && <Sparkles className="w-5 h-5 text-primary animate-pulse" />}
                            {item.status === 'upcoming' && <Target className="w-5 h-5 text-muted-foreground" />}
                            <span className="font-bold">{item.stage}</span>
                            {item.status === 'current' && <Badge variant="secondary" className="ml-2">Now</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </CardContent>
                      </Card>
                    </div>
                    <div className={`w-4 h-4 rounded-full shrink-0 hidden md:block ${
                      item.status === 'completed' ? 'bg-green-500' : 
                      item.status === 'current' ? 'bg-primary ring-4 ring-primary/30' : 
                      'bg-muted'
                    }`} />
                    <div className="flex-1 hidden md:block" />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            className="mt-16 max-w-3xl mx-auto"
          >
            <h3 className="text-2xl font-bold mb-6 text-center">{t('roadmap.nextSteps.title')}</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                t('roadmap.nextSteps.step1'),
                t('roadmap.nextSteps.step2'),
                t('roadmap.nextSteps.step3'),
                t('roadmap.nextSteps.step4')
              ].map((step, i) => (
                <Card key={i} className="border hover:border-primary/50 transition-colors">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">{i + 1}</span>
                    </div>
                    <span className="text-sm">{step}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-violet-600" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center max-w-3xl mx-auto text-primary-foreground">
            <Badge variant="secondary" className="mb-4">🚀 Prototype Stage</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">{t('cta.title')}</h2>
            <p className="text-xl opacity-90 mb-10">{t('cta.subtitle')}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Link href="/login"><Button size="lg" variant="secondary" className="text-lg px-10 h-14 gap-2 group">{t('cta.button')}<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></Button></Link>
              <Link href="/contact"><Button size="lg" variant="outline" className="text-lg px-10 h-14 gap-2 bg-transparent border-white/30 text-white hover:bg-white/10">{t('cta.secondary')}</Button></Link>
            </div>
            <p className="text-sm opacity-70">{t('cta.note')}</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-xl">{tCommon('appName')}</span>
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
                <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#use-cases" className="hover:text-primary transition-colors">Use Cases</a></li>
                <li><a href="#metrics" className="hover:text-primary transition-colors">Goals</a></li>
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
              <span>🇺🇿</span><span>Made in Uzbekistan</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
