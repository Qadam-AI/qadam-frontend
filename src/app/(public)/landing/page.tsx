'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useTranslations } from '@/lib/i18n';
import { FEATURES } from '@/lib/feature-flags';
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
  ChevronRight,
  Lock,
  Star,
  Flame,
  BookOpen,
  Code,
  Rocket
} from 'lucide-react';

// Animated gradient orbs - optimized for performance
function GradientOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/4 left-1/4 w-[40vw] max-w-[500px] h-[40vw] max-h-[500px] bg-primary/15 rounded-full blur-[80px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[35vw] max-w-[400px] h-[35vw] max-h-[400px] bg-violet-500/10 rounded-full blur-[60px]" />
    </div>
  );
}

// Game-Style Learning Map - Like a real game world map
function GameLearningMap({ t }: { t: (key: string) => string }) {
  const levels = [
    { id: 1, nameKey: 'gameLearningMap.fundamentals', icon: BookOpen, status: 'completed', xp: 500, color: 'from-emerald-400 to-green-500' },
    { id: 2, nameKey: 'gameLearningMap.coreConcepts', icon: Brain, status: 'completed', xp: 750, color: 'from-blue-400 to-cyan-500' },
    { id: 3, nameKey: 'gameLearningMap.practiceArena', icon: Zap, status: 'current', xp: 1000, color: 'from-orange-400 to-amber-500' },
    { id: 4, nameKey: 'gameLearningMap.codeChallenges', icon: Code, status: 'locked', xp: 1500, color: 'from-violet-400 to-purple-500' },
    { id: 5, nameKey: 'gameLearningMap.masteryPeak', icon: Trophy, status: 'locked', xp: 2500, color: 'from-yellow-400 to-orange-500' },
  ];

  return (
    <div className="relative w-full py-8 md:py-16 overflow-hidden">
      {/* The winding path SVG - hidden on mobile */}
      <svg className="absolute inset-0 w-full h-full hidden md:block" viewBox="0 0 1000 300" preserveAspectRatio="none">
        <path
          d="M 50 150 Q 150 50, 250 150 T 450 150 T 650 150 T 850 150 T 950 150"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          className="text-muted-foreground/20"
          strokeDasharray="20,10"
        />
        <path
          d="M 50 150 Q 150 50, 250 150 T 450 150"
          fill="none"
          stroke="url(#pathGradient)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
      </svg>

      {/* Level nodes - grid on mobile, flex on desktop */}
      <div className="relative grid grid-cols-3 gap-4 md:flex md:justify-between md:items-center px-4 md:px-16">
        {levels.map((level, index) => {
          const Icon = level.icon;
          const isCompleted = level.status === 'completed';
          const isCurrent = level.status === 'current';
          const isLocked = level.status === 'locked';

          return (
            <div
              key={level.id}
              className={`relative flex flex-col items-center ${index >= 3 ? 'col-span-1' : ''} ${index === 3 ? 'col-start-1' : ''} ${index === 4 ? 'col-start-3' : ''}`}
            >
              {/* Level node */}
              <div
                className={`
                  relative w-12 h-12 md:w-16 lg:w-20 md:h-16 lg:h-20 rounded-full
                  flex items-center justify-center shadow-lg transition-transform hover:scale-105
                  ${isLocked 
                    ? 'bg-muted border-2 border-dashed border-muted-foreground/30' 
                    : `bg-gradient-to-br ${level.color}`
                  }
                  ${isCurrent ? 'ring-4 ring-offset-2 ring-offset-background ring-orange-400' : ''}
                `}
              >
                {isLocked ? (
                  <Lock className="w-5 h-5 md:w-6 lg:w-8 md:h-6 lg:h-8 text-muted-foreground/50" />
                ) : (
                  <Icon className="w-5 h-5 md:w-6 lg:w-8 md:h-6 lg:h-8 text-white" />
                )}

                {/* Completion badge */}
                {isCompleted && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-background shadow">
                    <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-white" />
                  </div>
                )}

                {/* Current level indicator */}
                {isCurrent && (
                  <div className="absolute -top-6 md:-top-8">
                    <div className="bg-orange-500 text-white text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded-full">
                      YOU
                    </div>
                  </div>
                )}
              </div>

              {/* Level info */}
              <div className="mt-2 md:mt-4 text-center">
                <div className={`font-bold text-xs md:text-sm lg:text-base leading-tight ${isLocked ? 'text-muted-foreground/50' : ''}`}>
                  {t(level.nameKey)}
                </div>
                <div className="flex items-center justify-center gap-1 mt-0.5 md:mt-1">
                  <Star className={`w-2.5 h-2.5 md:w-3 md:h-3 ${isLocked ? 'text-muted-foreground/30' : 'text-yellow-500'}`} />
                  <span className={`text-[10px] md:text-xs font-semibold ${isLocked ? 'text-muted-foreground/50' : 'text-yellow-600 dark:text-yellow-400'}`}>
                    {level.xp} XP
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress stats bar */}
      <div className="flex flex-wrap justify-center mt-6 md:mt-12 gap-2 md:gap-8 px-4">
        <div className="flex items-center gap-1.5 md:gap-2 bg-background/80 backdrop-blur px-2 md:px-4 py-1.5 md:py-2 rounded-full border shadow-lg text-sm md:text-base">
          <Flame className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
          <span className="font-bold">5 {t('gameLearningMap.dayStreak')}</span>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2 bg-background/80 backdrop-blur px-2 md:px-4 py-1.5 md:py-2 rounded-full border shadow-lg text-sm md:text-base">
          <Trophy className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
          <span className="font-bold">2,250 XP</span>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2 bg-background/80 backdrop-blur px-2 md:px-4 py-1.5 md:py-2 rounded-full border shadow-lg text-sm md:text-base">
          <Target className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
          <span className="font-bold">{t('gameLearningMap.level')} 3</span>
        </div>
      </div>
    </div>
  );
}

// Hexagonal Feature Grid - Game style
function HexFeatureGrid({ t }: { t: (key: string) => string }) {
  const features = [
    { icon: Brain, key: 'aiTutor', color: 'from-blue-500 to-cyan-500' },
    { icon: Video, key: 'videoLessons', color: 'from-violet-500 to-purple-500' },
    { icon: Zap, key: 'practiceMode', color: 'from-orange-500 to-amber-500' },
    { icon: Users, key: 'communities', color: 'from-pink-500 to-rose-500' },
    { icon: Trophy, key: 'achievements', color: 'from-yellow-500 to-orange-500' },
    { icon: BarChart3, key: 'analytics', color: 'from-green-500 to-emerald-500' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 max-w-4xl mx-auto px-4">
      {features.map((feature) => {
        const Icon = feature.icon;
        return (
          <div
            key={feature.key}
            className="group cursor-pointer"
          >
            <div className="relative p-4 md:p-6 rounded-2xl md:rounded-3xl bg-gradient-to-br from-background to-muted/50 border-2 border-transparent hover:border-primary/30 transition-all shadow-lg hover:shadow-2xl">
              {/* Animated background gradient on hover */}
              <div className={`absolute inset-0 rounded-2xl md:rounded-3xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
              
              {/* Icon container */}
              <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3 md:mb-4 shadow-lg`}>
                <Icon className="w-5 h-5 md:w-7 md:h-7 text-white" />
              </div>

              <h3 className="font-bold text-sm md:text-lg mb-1">{t(`featureGrid.${feature.key}.title`)}</h3>
              <p className="text-xs md:text-sm text-muted-foreground">{t(`featureGrid.${feature.key}.desc`)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Metric card for the metrics section
function MetricCard({ value, label, compare }: { value: string; label: string; compare: string }) {
  return (
    <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all h-full bg-gradient-to-br from-background to-muted/30">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-violet-500 to-primary" />
      <CardContent className="pt-6 md:pt-8 pb-4 md:pb-6 text-center">
        <div className="text-3xl md:text-5xl font-bold text-primary mb-1 md:mb-2">{value}</div>
        <div className="text-base md:text-lg font-semibold mb-1">{label}</div>
        <div className="text-xs md:text-sm text-muted-foreground">{compare}</div>
      </CardContent>
    </Card>
  );
}

// Use case card
function UseCaseCard({ icon: Icon, title, description, features, gradient }: { icon: React.ElementType; title: string; description: string; features: string[]; gradient: string }) {
  return (
    <Card className={`h-full border-2 hover:border-primary/30 transition-all overflow-hidden group ${gradient}`}>
      <CardContent className="pt-6 md:pt-8">
        <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-background/80 backdrop-blur flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform shadow-lg">
          <Icon className="w-5 h-5 md:w-7 md:h-7 text-primary" />
        </div>
        <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">{title}</h3>
        <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">{description}</p>
        <ul className="space-y-2 md:space-y-3">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
              <span className="text-xs md:text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// Feature card with icon
function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <Card className="h-full border hover:border-primary/30 hover:shadow-xl transition-all duration-300 group">
      <CardContent className="pt-4 md:pt-6">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-primary/10 flex items-center justify-center mb-3 md:mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
          <Icon className="w-5 h-5 md:w-6 md:h-6" />
        </div>
        <h3 className="text-base md:text-lg font-bold mb-1 md:mb-2">{title}</h3>
        <p className="text-muted-foreground text-xs md:text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}

// Step component for How it Works
function StepCard({ number, title, description, icon: Icon }: { number: number; title: string; description: string; icon: React.ElementType }) {
  return (
    <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 group h-full">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-violet-500" />
      <CardContent className="pt-6 md:pt-8 pb-4 md:pb-6 px-4 md:px-6">
        <div className="flex items-start gap-3 md:gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center text-primary-foreground shadow-lg group-hover:scale-110 transition-transform">
              <Icon className="w-5 h-5 md:w-7 md:h-7" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 md:mb-2">
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">0{number}</span>
            </div>
            <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2">{title}</h3>
            <p className="text-sm md:text-base text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Team member data
const teamMembers = [
  {
    name: "Shukrullo Jumanazarov",
    role: "CEO, Co-Founder",
    company: "Yandex Uzbekistan",
    image: "https://www.dropbox.com/scl/fi/okf59jf1e7e6vvj6ejrvj/1740572402226.jpg?rlkey=twighk7nq8kws6vvs7y65gn6m&dl=1",
    linkedin: "https://www.linkedin.com/in/shukrullo-jumanazarov/",
    skills: ["Backend", "Teaching", "Python"]
  },
  {
    name: "Ziyobek Khazratkulov",
    role: "Co-Founder",
    company: "Wildberries",
    image: "https://www.dropbox.com/scl/fi/xrab0fn0nt5aouw416dtd/2025-12-25-20.25.04.jpg?rlkey=xnw1skq1nkhclxjusbzaatr5m&st=lrp1x5a0&dl=1",
    linkedin: "https://www.linkedin.com/in/ziyobek-khazratkulov-677098211/",
    skills: ["Data Science", "ML Engineering", "AI"]
  },
  {
    name: "Bahrom Abdimuminov",
    role: "Co-Founder",
    company: "Qatar Airways, Ohio State University",
    image: "https://www.dropbox.com/scl/fi/8r9bm89udtmtiljcj4d2j/2025-12-25-19.04.50.jpg?rlkey=wfh5tx9a88iktutauqdxp2qzy&st=sde7de5u&dl=1",
    linkedin: "https://www.linkedin.com/in/bakhrom-abdimuminov-0a479218a/",
    skills: ["Teaching", "Law", "Operations"]
  },
  {
    name: "Saidorif Kadirov",
    role: "Co-Founder",
    company: "Uzum Nasiya",
    image: "https://www.dropbox.com/scl/fi/13sdmpiifu10kqr6z1ora/1648523182106.jpg?rlkey=9058kw1gbu9hn9xmbkeshkv42&st=9416r2bf&dl=1",
    linkedin: "https://www.linkedin.com/in/saidorif-kadirov-046b47235/",
    skills: ["Full Stack", "12+ years experience"]
  },
  {
    name: "Sergey Nazarov",
    role: "Advisor",
    company: "Yandex",
    image: "https://www.dropbox.com/scl/fi/3d1lsob94p05ujp42zyea/2025-12-26-15.06.46.jpg?rlkey=j7ew7iwmg0lf61qanbyy0fo3w&st=0m9sncrz&dl=1",
    skills: ["Product Analytics", "Director", "Strategy"]
  },
  {
    name: "Samandar Mirzaev",
    role: "Advisor",
    company: "MultiBank Group",
    image: "https://www.dropbox.com/scl/fi/xjo8q8ein87wzabfejomv/2025-12-25-19.05.01.jpg?rlkey=izj6efkaskisy70kcwxg3r3n3&st=7dp8dv2a&dl=1",
    linkedin: "https://www.linkedin.com/in/samandar-mirzaev-802181b3/",
    skills: ["Full Stack", "15+ years experience"]
  },
];

// Team member card component - Compact Circular Avatar Style
function TeamMemberCard({ member, isActive }: { member: typeof teamMembers[0]; isActive: boolean }) {
  const [imageError, setImageError] = useState(false);
  
  const roleColor = member.role === 'CEO & Founder' 
    ? 'from-yellow-500 to-amber-600' 
    : member.role === 'Co-Founder' 
      ? 'from-violet-500 to-purple-600' 
      : 'from-blue-500 to-cyan-600';
    
  return (
    <div className={`text-center transition-transform ${isActive ? 'scale-100' : 'scale-90 opacity-80'}`}>
      {/* Circular Avatar with Ring */}
      <div className="relative inline-block mb-3 md:mb-4">
        {isActive && (
          <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${roleColor} p-[3px]`} style={{ width: 'calc(100% + 8px)', height: 'calc(100% + 8px)', left: '-4px', top: '-4px' }} />
        )}
        <div className={`relative w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden border-4 ${isActive ? 'border-background' : 'border-muted'} transition-all`}>
          {member.image && !imageError ? (
            <img
              src={member.image}
              alt={member.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${roleColor} flex items-center justify-center text-xl md:text-2xl font-bold text-white`}>
              {member.name.split(' ').map(n => n[0]).join('')}
            </div>
          )}
        </div>
        {/* Role badge */}
        
      </div>
      
      {/* Info */}
      <h3 className={`font-bold text-xs md:text-sm mb-0.5 transition-all ${isActive ? '' : 'text-muted-foreground'}`}>{member.name}</h3>
      {member.company && (
        <p className="text-xs text-muted-foreground mb-2">{member.company.split(',')[0]}</p>
      )}
      
      {/* Skills pills */}
      <div className="flex flex-wrap justify-center gap-1">
        {member.skills.slice(0, 2).map((skill, i) => (
          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{skill}</span>
        ))}
      </div>
      
      {/* LinkedIn - only for active */}
      {isActive && member.linkedin && (
        <a 
          href={member.linkedin} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-3 text-xs text-primary hover:underline"
        >
          <Linkedin className="w-3 h-3" />
          LinkedIn
        </a>
      )}
    </div>
  );
}

// Team carousel component - Compact Horizontal Layout
function TeamCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="relative">
      {/* All team members in a row */}
      <div className="flex flex-wrap justify-center gap-4 md:gap-6 lg:gap-10">
        {teamMembers.map((member, index) => (
          <div
            key={member.name}
            onMouseEnter={() => setActiveIndex(index)}
            className="cursor-pointer hover:-translate-y-1 transition-transform"
          >
            <TeamMemberCard member={member} isActive={index === activeIndex} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const t = useTranslations('landing');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-bold text-xl bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">{tCommon('appName')}</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('nav.features')}</a>
              <a href="#use-cases" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('nav.useCases')}</a>
              <a href="#team" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('nav.team')}</a>
              <a href="#roadmap" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('nav.roadmap')}</a>
            </div>
            
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <Link href="/login"><Button variant="ghost" size="sm">{tNav('login')}</Button></Link>
              <Link href="/login"><Button size="sm" className="hidden sm:flex gap-1">{t('hero.cta')}<ArrowRight className="w-4 h-4" /></Button></Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Clean and Professional */}
      <section className="relative min-h-screen flex flex-col justify-center pt-20 pb-10 overflow-hidden">
        <GradientOrbs />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center mb-8 md:mb-12">
            <div>
              <Badge variant="outline" className="mb-4 md:mb-6 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm border-primary/30 bg-primary/5">
                <Sparkles className="w-3 h-3 md:w-4 md:h-4 mr-2 text-primary" />
                {t('hero.badge')}
              </Badge>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-4 md:mb-6">
              {t('hero.title')}{' '}
              <span className="bg-gradient-to-r from-primary via-violet-500 to-primary bg-clip-text text-transparent">{t('hero.titleHighlight')}</span>
            </h1>
            
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed">
              {t('hero.subtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="text-base md:text-lg px-6 md:px-8 h-12 md:h-14 gap-2 group bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 w-full sm:w-auto">
                  {t('hero.cta')}<ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="text-base md:text-lg px-6 md:px-8 h-12 md:h-14 gap-2 w-full sm:w-auto"><Rocket className="w-4 h-4 md:w-5 md:h-5" />{t('hero.secondaryCta')}</Button>
              </Link>
            </div>
          </div>

          {/* Game-Style Learning Map - hidden in demo mode */}
          {FEATURES.gamification && (
          <div className="max-w-5xl mx-auto">
            <GameLearningMap t={t} />
          </div>
          )}
        </div>
      </section>

      {/* Problem Section - Game Boss Battle Style */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 to-background" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-8 md:mb-12">
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{t('problem.title')}</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">{t('problem.subtitle')}</p>
          </div>
          
          {/* Boss Cards - Obstacles to defeat */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
            {[
              { value: '85%', label: t('problem.stat1.label'), color: 'from-red-500 to-orange-500' },
              { value: '67%', label: t('problem.stat2.label'), color: 'from-purple-500 to-pink-500' },
              { value: '3x', label: t('problem.stat3.label'), color: 'from-amber-500 to-red-500' },
            ].map((stat, i) => (
              <div 
                key={i} 
                className="group cursor-pointer"
              >
                <div className="relative p-4 md:p-6 rounded-2xl md:rounded-3xl bg-gradient-to-br from-background to-muted/50 border-2 border-red-500/20 hover:border-red-500/50 transition-all shadow-lg hover:scale-[1.02] hover:-translate-y-1">
                  {/* Glow effect */}
                  <div className={`absolute inset-0 rounded-2xl md:rounded-3xl bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity blur-xl`} />
                  
                  <div className="text-center relative z-10">
                    <div className={`text-4xl md:text-5xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2 md:mb-3`}>
                      {stat.value}
                    </div>
                    <p className="text-sm md:text-base text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section - Power-Up Unlocked Style */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-green-950/10 to-background" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{t('solution.title')}</h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">{t('solution.subtitle')}</p>
            </div>

            {/* AI Engine Card - Like unlocking special ability */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-cyan-500/20 rounded-3xl blur-xl" />
              <div className="relative rounded-2xl md:rounded-3xl overflow-hidden border-2 border-green-500/30 bg-background/80 backdrop-blur-sm p-4 md:p-8">
                {/* Animated border */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-400 to-cyan-500" />
                
                <div className="flex flex-col lg:flex-row items-center gap-6 md:gap-8">
                  {/* AI Brain Icon */}
                  <div className="relative">
                    <div className="w-20 h-20 md:w-32 md:h-32 rounded-2xl md:rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl">
                      <Brain className="w-10 h-10 md:w-16 md:h-16 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 md:w-8 md:h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                      <Star className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                  </div>

                  {/* Power descriptions */}
                  <div className="flex-1 text-center lg:text-left">
                    <h3 className="text-xl md:text-2xl font-bold mb-2">{t('solution.engineTitle')}</h3>
                    <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">{t('solution.description')}</p>
                    
                    <div className="grid grid-cols-3 gap-2 md:gap-4">
                      {[
                        { icon: Target, label: t('solution.smartDetection'), value: '94%', color: 'text-blue-500' },
                        { icon: Zap, label: t('solution.adaptationSpeed'), value: t('solution.realtime'), color: 'text-orange-500' },
                        { icon: Trophy, label: t('solution.successRate'), value: t('solution.successValue'), color: 'text-yellow-500' },
                      ].map((stat, i) => (
                        <div
                          key={i}
                          className="p-2 md:p-4 rounded-xl md:rounded-2xl bg-muted/50 text-center"
                        >
                          <stat.icon className={`w-5 h-5 md:w-6 md:h-6 ${stat.color} mx-auto mb-1 md:mb-2`} />
                          <div className="text-sm md:text-base font-bold">{stat.value}</div>
                          <div className="text-[10px] md:text-xs text-muted-foreground">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 md:mt-8 text-center">
                  <Link href="/login">
                    <Button size="lg" className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                      <Rocket className="w-5 h-5" />
                      {t('solution.activateCta')}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Preview Section - Game-Style Features */}
      <section id="preview" className="py-16 md:py-24 bg-gradient-to-b from-background via-muted/10 to-background relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-[20vw] max-w-32 h-[20vw] max-h-32 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-[25vw] max-w-40 h-[25vw] max-h-40 bg-violet-500/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{t('platformPreview.title')}</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('platformPreview.subtitle')}
            </p>
          </div>
          
          <HexFeatureGrid t={t} />

          <div className="text-center mt-8 md:mt-12">
            <Link href="/login">
              <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-violet-600">
                Start Your Journey <Rocket className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      <section id="features" className="py-16 md:py-24 relative overflow-hidden">
        {/* Skill Tree Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[30vw] max-w-96 h-[30vw] max-h-96 bg-violet-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[30vw] max-w-96 h-[30vw] max-h-96 bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{t('features.title')}</h2>
            <p className="text-lg md:text-xl text-muted-foreground">{t('features.subtitle')}</p>
          </div>
          
          {/* Skill Tree Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
            {[
              { icon: Brain, title: t('features.adaptive.title'), description: t('features.adaptive.description'), color: 'from-violet-500 to-purple-600', unlocked: true },
              { icon: Video, title: t('features.video.title'), description: t('features.video.description'), color: 'from-blue-500 to-cyan-500', unlocked: true },
              { icon: Zap, title: t('features.feedback.title'), description: t('features.feedback.description'), color: 'from-orange-500 to-amber-500', unlocked: true },
              { icon: BarChart3, title: t('features.progress.title'), description: t('features.progress.description'), color: 'from-green-500 to-emerald-500', unlocked: true },
              { icon: Shield, title: t('features.enterprise.title'), description: t('features.enterprise.description'), color: 'from-red-500 to-pink-500', unlocked: false },
              { icon: Globe, title: t('features.multilingual.title'), description: t('features.multilingual.description'), color: 'from-cyan-500 to-blue-500', unlocked: true },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group cursor-pointer hover:scale-[1.02] hover:-translate-y-1 transition-all"
                >
                  <div className={`relative p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 transition-all h-full ${
                    feature.unlocked 
                      ? 'bg-gradient-to-br from-background to-muted/30 border-primary/20 hover:border-primary/50' 
                      : 'bg-muted/30 border-dashed border-muted-foreground/20'
                  }`}>
                    {/* Skill icon */}
                    <div className="flex items-start gap-3 md:gap-4">
                      <div
                        className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg ${
                          feature.unlocked 
                            ? `bg-gradient-to-br ${feature.color}` 
                            : 'bg-muted'
                        }`}
                      >
                        {feature.unlocked ? (
                          <Icon className="w-5 h-5 md:w-7 md:h-7 text-white" />
                        ) : (
                          <Lock className="w-5 h-5 md:w-7 md:h-7 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`text-sm md:text-base font-bold ${feature.unlocked ? '' : 'text-muted-foreground'}`}>
                            {feature.title}
                          </h3>
                          {feature.unlocked && (
                            <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
                          )}
                        </div>
                        <p className={`text-xs md:text-sm ${feature.unlocked ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                          {feature.description}
                        </p>
                      </div>
                    </div>


                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases Section - Character Classes Style */}
      <section id="use-cases" className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/20 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{t('useCases.title')}</h2>
            <p className="text-lg md:text-xl text-muted-foreground">{t('useCases.subtitle')}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 max-w-5xl mx-auto">
            {[
              { 
                icon: Users, 
                title: t('useCases.b2c.title'), 
                description: t('useCases.b2c.description'), 
                features: [t('useCases.b2c.features.0'), t('useCases.b2c.features.1'), t('useCases.b2c.features.2')],
                color: 'from-blue-500 to-cyan-500',
              },
              { 
                icon: Building2, 
                title: t('useCases.b2b.title'), 
                description: t('useCases.b2b.description'), 
                features: [t('useCases.b2b.features.0'), t('useCases.b2b.features.1'), t('useCases.b2b.features.2')],
                color: 'from-violet-500 to-purple-500',
              },
              { 
                icon: GraduationCap, 
                title: t('useCases.b2b2c.title'), 
                description: t('useCases.b2b2c.description'), 
                features: [t('useCases.b2b2c.features.0'), t('useCases.b2b2c.features.1'), t('useCases.b2b2c.features.2')],
                color: 'from-amber-500 to-orange-500',              },
            ].map((useCase, index) => {
              const Icon = useCase.icon;
              return (
                <div
                  key={useCase.title}
                  className="group hover:-translate-y-2 transition-all"
                >
                  <div className="relative h-full rounded-2xl md:rounded-3xl overflow-hidden border-2 border-primary/10 hover:border-primary/30 transition-all bg-gradient-to-b from-background to-muted/30">
                    {/* Header with gradient */}
                    <div className={`h-16 md:h-24 bg-gradient-to-br ${useCase.color} relative`}>
                      <div
                        className="absolute inset-0 opacity-20"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.3"%3E%3Ccircle cx="3" cy="3" r="3"/%3E%3C/g%3E%3C/svg%3E")' }}
                      />
                      <div className="absolute -bottom-6 md:-bottom-8 left-1/2 -translate-x-1/2">
                        <div
                          className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br ${useCase.color} flex items-center justify-center shadow-2xl border-4 border-background`}
                        >
                          <Icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 md:pt-12 pb-4 md:pb-6 px-4 md:px-6">
                      <div className="text-center mb-4">
                        <h3 className="text-lg md:text-xl font-bold mt-1">{useCase.title}</h3>
                        <p className="text-xs md:text-sm text-muted-foreground mt-2">{useCase.description}</p>
                      </div>

                      <ul className="space-y-2 md:space-y-3 mt-4 md:mt-6">
                        {useCase.features.map((feature, i) => (
                          <li 
                            key={i}
                            className="flex items-center gap-2"
                          >
                            <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full bg-gradient-to-br ${useCase.color} flex items-center justify-center`}>
                              <CheckCircle2 className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                            </div>
                            <span className="text-xs md:text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Metrics Section - Achievement Badges Style */}
      <section id="metrics" className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-950/10 to-background" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{t('metrics.title')}</h2>
            <p className="text-lg md:text-xl text-muted-foreground">{t('metrics.subtitle')}</p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 max-w-5xl mx-auto">
            {[
              { value: t('metrics.completion.value'), label: t('metrics.completion.label'), compare: t('metrics.completion.compare'), color: 'from-green-500 to-emerald-500', icon: '🎯' },
              { value: t('metrics.speed.value'), label: t('metrics.speed.label'), compare: t('metrics.speed.compare'), color: 'from-blue-500 to-cyan-500', icon: '⚡' },
              { value: t('metrics.retention.value'), label: t('metrics.retention.label'), compare: t('metrics.retention.compare'), color: 'from-violet-500 to-purple-500', icon: '🧠' },
              { value: t('metrics.nps.value'), label: t('metrics.nps.label'), compare: t('metrics.nps.compare'), color: 'from-yellow-500 to-amber-500', icon: '⭐' },
            ].map((metric, index) => (
              <div
                key={metric.label}
                className="group cursor-pointer hover:scale-[1.02] hover:-translate-y-1 transition-all"
              >
                <div className="relative p-3 md:p-6 rounded-2xl md:rounded-3xl border-2 border-yellow-500/20 hover:border-yellow-500/50 bg-gradient-to-br from-background to-yellow-500/5 transition-all">
                  {/* Badge icon */}
                  <div className="text-3xl md:text-4xl text-center mb-2 md:mb-4">{metric.icon}</div>

                  <div className={`text-2xl md:text-4xl font-bold text-center bg-gradient-to-r ${metric.color} bg-clip-text text-transparent mb-1 md:mb-2`}>
                    {metric.value}
                  </div>
                  <div className="text-xs md:text-base text-center font-semibold mb-1">{metric.label}</div>
                  <div className="text-[10px] md:text-xs text-center text-muted-foreground">{metric.compare}</div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs md:text-sm text-muted-foreground mt-6 md:mt-8">
            {t('metrics.note')}
          </p>
        </div>
      </section>

      {/* How It Works Section - Quest Journey Style */}
      <section className="py-16 md:py-24 relative overflow-hidden bg-gradient-to-b from-muted/20 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{t('howItWorks.title')}</h2>
            <p className="text-lg md:text-xl text-muted-foreground">{t('howItWorks.subtitle')}</p>
          </div>
          
          {/* Quest Steps */}
          <div className="max-w-4xl mx-auto relative">
            {/* Connecting line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 via-violet-500 to-yellow-500 hidden lg:block transform -translate-x-1/2" />

            <div className="space-y-12">
              {[
                { number: 1, icon: Target, title: t('howItWorks.step1.title'), description: t('howItWorks.step1.description'), color: 'from-cyan-500 to-blue-500', emoji: '📤' },
                { number: 2, icon: Sparkles, title: t('howItWorks.step2.title'), description: t('howItWorks.step2.description'), color: 'from-violet-500 to-purple-500', emoji: '🧠' },
                { number: 3, icon: MessageSquare, title: t('howItWorks.step3.title'), description: t('howItWorks.step3.description'), color: 'from-orange-500 to-amber-500', emoji: '📝' },
                { number: 4, icon: Trophy, title: t('howItWorks.step4.title'), description: t('howItWorks.step4.description'), color: 'from-yellow-500 to-orange-500', emoji: '📊' },
              ].map((step, index) => {
                const Icon = step.icon;
                const isEven = index % 2 === 0;
                
                return (
                  <div
                    key={step.number}
                    className={`flex items-center gap-4 md:gap-8 ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
                  >
                    {/* Content */}
                    <div className={`flex-1 ${isEven ? 'lg:text-right' : 'lg:text-left'}`}>
                      <div className="inline-block p-4 md:p-6 rounded-2xl md:rounded-3xl bg-gradient-to-br from-background to-muted/50 border-2 border-primary/10 hover:border-primary/30 transition-all hover:scale-[1.01]">
                        <div className={`flex items-center gap-2 md:gap-3 mb-2 md:mb-3 ${isEven ? 'lg:justify-end' : ''}`}>
                          <span className="text-xl md:text-2xl">{step.emoji}</span>
                          <h3 className="text-base md:text-xl font-bold">{step.title}</h3>
                        </div>
                        <p className="text-sm md:text-base text-muted-foreground">{step.description}</p>
                        {FEATURES.gamification && (
                        <div className={`flex items-center gap-2 mt-3 md:mt-4 ${isEven ? 'lg:justify-end' : ''}`}>
                          <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-500" />
                          <span className="text-xs md:text-sm text-yellow-600 dark:text-yellow-400 font-bold">+{(step.number) * 100} XP</span>
                        </div>
                        )}
                      </div>
                    </div>

                    {/* Center node */}
                    <div className={`hidden lg:flex w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br ${step.color} items-center justify-center shadow-2xl z-10 border-4 border-background`}>
                      <Icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                    </div>

                    {/* Spacer */}
                    <div className="flex-1 hidden lg:block" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section - Compact */}
      <section id="team" className="py-12 md:py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background to-violet-950/10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-6 md:mb-10">
            
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">{t('team.title')}</h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">{t('team.subtitle')}</p>
          </div>
          
          <TeamCarousel />

          {/* Why We Can Solve This - Compact Inline */}
          <div className="mt-8 md:mt-12 max-w-4xl mx-auto">
            <div className="p-4 md:p-6 rounded-xl md:rounded-2xl bg-muted/30 border border-border">
              <h3 className="text-base md:text-lg font-bold text-center mb-4 md:mb-6">{t('team.whyUs.title')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: Brain, title: t('team.whyUs.expertise.title'), description: t('team.whyUs.expertise.description'), color: 'text-violet-500' },
                  { icon: Target, title: t('team.whyUs.motivation.title'), description: t('team.whyUs.motivation.description'), color: 'text-rose-500' },
                  { icon: Zap, title: t('team.whyUs.experience.title'), description: t('team.whyUs.experience.description'), color: 'text-amber-500' }
                ].map((ability, index) => {
                  const Icon = ability.icon;
                  return (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-muted flex items-center justify-center shrink-0 ${ability.color}`}>
                        <Icon className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-xs md:text-sm mb-1">{ability.title}</h4>
                        <p className="text-[10px] md:text-xs text-muted-foreground leading-relaxed">{ability.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap Section - Game Progression World Map */}
      <section id="roadmap" className="py-16 md:py-24 relative overflow-hidden bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{t('roadmap.title')}</h2>
            <p className="text-lg md:text-xl text-muted-foreground">{t('roadmap.subtitle')}</p>
          </div>

          {/* Current Stage - Highlighted */}
          <div className="max-w-md mx-auto mb-8 md:mb-16">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-violet-500/30 rounded-2xl md:rounded-3xl blur-xl" />
              <div className="relative rounded-2xl md:rounded-3xl overflow-hidden border-2 border-primary bg-background p-4 md:p-6 text-center">
                <Badge className="mb-2 md:mb-3 bg-primary">{t('roadmap.currentBadge')}</Badge>
                <h3 className="text-xl md:text-2xl font-bold mb-2">{t('roadmap.currentTitle')}</h3>
                <p className="text-sm md:text-base text-muted-foreground">{t('roadmap.currentStage')}</p>
              </div>
            </div>
          </div>

          {/* Roadmap Progression Path - Winding Game Path */}
          <div className="max-w-4xl mx-auto relative">
            {/* SVG Winding Path */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none hidden md:block" viewBox="0 0 800 300" preserveAspectRatio="none">
              <defs>
                <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="35%" stopColor="#22c55e" />
                  <stop offset="50%" stopColor="hsl(var(--primary))" />
                  <stop offset="70%" stopColor="#6b7280" />
                  <stop offset="100%" stopColor="#6b7280" />
                </linearGradient>
              </defs>
              {/* Dotted background path */}
              <path
                d="M 50 150 Q 150 50, 250 150 T 450 150 T 650 150 T 750 150"
                fill="none"
                stroke="#6b7280"
                strokeWidth="4"
                strokeDasharray="8 8"
                opacity="0.3"
              />
              {/* Main path with gradient - progress */}
              <path
                d="M 50 150 Q 150 50, 250 150 T 450 150"
                fill="none"
                stroke="url(#pathGradient)"
                strokeWidth="6"
                strokeLinecap="round"
              />
            </svg>

            {/* Roadmap Items - Positioned along the path */}
            <div className="relative min-h-[250px] md:min-h-[300px]">
              {[
                { stage: t('roadmap.stages.ideaName'), status: 'completed', description: t('roadmap.stages.idea'), position: 'left-[3%] top-[40%]' },
                { stage: t('roadmap.stages.prototypeName'), status: 'current', description: t('roadmap.stages.prototype'), position: 'left-[28%] top-[10%]' },
                { stage: t('roadmap.stages.mvpName'), status: 'upcoming', description: t('roadmap.stages.mvp'), position: 'left-[53%] top-[40%]' },
                { stage: t('roadmap.stages.launchName'), status: 'upcoming', description: t('roadmap.stages.launch'), position: 'left-[78%] top-[10%]' }
              ].map((item, index) => (
                <div
                  key={item.stage}
                  className={`absolute ${item.position} -translate-x-1/2 w-28 md:w-36 lg:w-44`}
                >
                  <div className="relative hover:scale-105 hover:-translate-y-1 transition-all">
                    {/* Glow effect for current */}
                    {item.status === 'current' && (
                      <div className="absolute inset-0 bg-primary/30 rounded-xl md:rounded-2xl blur-xl" />
                    )}
                    
                    <div className={`relative p-2 md:p-4 rounded-xl md:rounded-2xl border-2 transition-all bg-background ${
                      item.status === 'current' 
                        ? 'border-primary shadow-lg shadow-primary/20' 
                        : item.status === 'completed'
                          ? 'border-green-500'
                          : 'border-dashed border-muted-foreground/30'
                    }`}>
                      {/* Status indicator */}
                      <div className={`absolute -top-1.5 -right-1.5 md:-top-2 md:-right-2 w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center ${
                        item.status === 'completed' ? 'bg-green-500' : item.status === 'current' ? 'bg-primary' : 'bg-muted'
                      }`}>
                        {item.status === 'completed' && <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-white" />}
                        {item.status === 'current' && <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-white" />}
                        {item.status === 'upcoming' && <Lock className="w-2 h-2 md:w-3 md:h-3 text-muted-foreground" />}
                      </div>
                    
                      <div className="text-center">
                        <span className={`font-bold text-xs md:text-sm ${item.status === 'upcoming' ? 'text-muted-foreground' : ''}`}>
                          {item.stage}
                        </span>
                        <p className="text-[10px] md:text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps - Quest objectives */}
          <div className="mt-8 md:mt-16 max-w-3xl mx-auto">
            <div className="text-center mb-6 md:mb-8">
              <span className="text-2xl">📋</span>
              <h3 className="text-xl md:text-2xl font-bold mt-2">{t('roadmap.nextSteps.title')}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {[
                t('roadmap.nextSteps.step1'),
                t('roadmap.nextSteps.step2'),
                t('roadmap.nextSteps.step3'),
                t('roadmap.nextSteps.step4')
              ].map((step, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-2 md:gap-3 p-3 md:p-4 rounded-xl md:rounded-2xl border-2 border-primary/10 hover:border-primary/30 bg-gradient-to-br from-background to-muted/30 transition-all hover:scale-[1.01]"
                >
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-sm md:text-base">{i + 1}</span>
                  </div>
                  <span className="text-xs md:text-sm">{step}</span>
                  <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground/30 ml-auto shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Epic Game Call to Action */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Static gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-violet-600 to-purple-700" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto text-primary-foreground">
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">{t('cta.title')}</h2>
            <p className="text-lg md:text-xl opacity-90 mb-6 md:mb-10">{t('cta.subtitle')}</p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mb-4 md:mb-6">
              <Link href="/login">
                <Button size="lg" variant="secondary" className="text-base md:text-lg px-6 md:px-10 h-12 md:h-14 gap-2 group shadow-2xl w-full sm:w-auto">
                  <Rocket className="w-4 h-4 md:w-5 md:h-5" />
                  {t('cta.button')}
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="text-base md:text-lg px-6 md:px-10 h-12 md:h-14 gap-2 bg-transparent border-white/30 text-white hover:bg-white/10 w-full sm:w-auto">
                  <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
                  {t('cta.secondary')}
                </Button>
              </Link>
            </div>
            <p className="text-xs md:text-sm opacity-70">{t('cta.note')}</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 md:py-16 border-t">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-8 mb-8 md:mb-12">
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <span className="font-bold text-lg md:text-xl bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">{tCommon('appName')}</span>
              </Link>
              <p className="text-sm text-muted-foreground mb-4 max-w-xs">{t('footer.description')}</p>
              <div className="flex gap-3">
                <a href="#" className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"><Twitter className="w-4 h-4" /></a>
                <a href="#" className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"><Linkedin className="w-4 h-4" /></a>
                <a href="#" className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"><Github className="w-4 h-4" /></a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm md:text-base mb-3 md:mb-4">{t('footer.product')}</h4>
              <ul className="space-y-2 text-xs md:text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-primary transition-colors">{t('nav.features')}</a></li>
                <li><a href="#use-cases" className="hover:text-primary transition-colors">{t('nav.useCases')}</a></li>
                <li><a href="#metrics" className="hover:text-primary transition-colors">{t('nav.goals')}</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm md:text-base mb-3 md:mb-4">{t('footer.company')}</h4>
              <ul className="space-y-2 text-xs md:text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-primary transition-colors">{t('footer.about')}</Link></li>
                <li><Link href="/careers" className="hover:text-primary transition-colors">{t('footer.careers')}</Link></li>
                <li><Link href="/investors" className="hover:text-primary transition-colors">{t('footer.investors')}</Link></li>
                <li><Link href="/press" className="hover:text-primary transition-colors">{t('footer.press')}</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm md:text-base mb-3 md:mb-4">{t('footer.legal')}</h4>
              <ul className="space-y-2 text-xs md:text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-primary transition-colors">{t('footer.privacy')}</Link></li>
                <li><Link href="/terms" className="hover:text-primary transition-colors">{t('footer.terms')}</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors">{t('footer.contact')}</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs md:text-sm text-muted-foreground">{t('footer.copyright')}</p>
            
          </div>
        </div>
      </footer>
    </div>
  );
}
