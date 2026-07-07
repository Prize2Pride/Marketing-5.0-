import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import {
  ArrowRight, BookOpen, Brain, Bot, Crown, Zap, Globe, TrendingUp,
  Star, ChevronRight, Award, Users, Layers, MessageSquare
} from "lucide-react";

const TIER_COLORS: Record<string, string> = {
  beginner: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
  intermediate: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
  advanced: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
  expert: "from-amber-500/20 to-amber-600/10 border-amber-500/30",
  master: "from-orange-500/20 to-orange-600/10 border-orange-500/30",
  autonomous: "from-yellow-400/20 to-yellow-500/10 border-yellow-400/30",
};

const TIER_TEXT: Record<string, string> = {
  beginner: "text-blue-300",
  intermediate: "text-emerald-300",
  advanced: "text-purple-300",
  expert: "text-amber-300",
  master: "text-orange-300",
  autonomous: "text-yellow-300",
};

const LEVEL_ICONS: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen className="w-5 h-5" />,
  Share2: <Globe className="w-5 h-5" />,
  ShoppingCart: <TrendingUp className="w-5 h-5" />,
  Heart: <Star className="w-5 h-5" />,
  BarChart3: <TrendingUp className="w-5 h-5" />,
  Bot: <Bot className="w-5 h-5" />,
  Brain: <Brain className="w-5 h-5" />,
  Building2: <Layers className="w-5 h-5" />,
  Cpu: <Zap className="w-5 h-5" />,
  Crown: <Crown className="w-5 h-5" />,
};

export default function Home() {
  const { t, language, dir } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { data: levels } = trpc.course.getLevels.useQuery();

  return (
    <div className="min-h-screen" dir={dir}>
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div className="container relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8">
              <Zap className="w-4 h-4" />
              {t("hero.badge")}
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight mb-6">
              <span className="text-foreground">{t("hero.title1")} </span>
              <span
                style={{
                  background: "linear-gradient(135deg, oklch(0.85 0.16 85), oklch(0.72 0.18 85), oklch(0.60 0.15 85))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {t("hero.title2")}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              {t("hero.subtitle")}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {isAuthenticated ? (
                <Link href="/levels">
                  <Button size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-8 h-12">
                    {t("hero.cta.primary")}
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              ) : (
                <Button
                  size="lg"
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-8 h-12"
                  onClick={() => window.location.href = getLoginUrl()}
                >
                  {t("hero.cta.primary")}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              )}
              <Link href="/levels">
                <Button size="lg" variant="outline" className="gap-2 border-border hover:border-primary/50 h-12 px-8">
                  {t("hero.cta.secondary")}
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-2xl mx-auto">
              {[
                { value: "10", label: t("hero.stats.levels") },
                { value: "30+", label: t("hero.stats.modules") },
                { value: "90+", label: t("hero.stats.chapters") },
                { value: "3", label: t("hero.stats.languages") },
              ].map(({ value, label }) => (
                <div key={label} className="glass-card rounded-xl p-4 text-center">
                  <div className="text-3xl font-display font-bold text-primary">{value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── COURSE LEVELS PREVIEW ── */}
      <section className="py-24 border-t border-border/50">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              {t("levels.title")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("levels.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(levels ?? Array.from({ length: 10 }, (_, i) => ({ id: i, order: i + 1, slug: "", tier: "beginner", icon: "BookOpen", titleEn: "Loading...", titleFr: "Chargement...", titleAr: "جاري التحميل...", descriptionEn: "", descriptionFr: "", descriptionAr: "" }))).map((level) => {
              const title = language === "ar" ? level.titleAr : language === "fr" ? level.titleFr : level.titleEn;
              const desc = language === "ar" ? level.descriptionAr : language === "fr" ? level.descriptionFr : level.descriptionEn;
              const tierColor = TIER_COLORS[level.tier] ?? TIER_COLORS.beginner;
              const tierText = TIER_TEXT[level.tier] ?? TIER_TEXT.beginner;
              return (
                <Link key={level.id} href={`/level/${level.slug}`}>
                  <div className={`group relative rounded-xl border bg-gradient-to-br ${tierColor} p-5 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg h-full`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-lg bg-background/50 flex items-center justify-center ${tierText}`}>
                        {LEVEL_ICONS[level.icon ?? "BookOpen"] ?? <BookOpen className="w-5 h-5" />}
                      </div>
                      <span className="text-xs font-bold text-muted-foreground/60">L{level.order}</span>
                    </div>
                    <h3 className="font-display font-semibold text-sm text-foreground mb-2 leading-tight">{title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{desc}</p>
                    <Badge className={`text-xs ${tierText} bg-background/30 border-0`}>
                      {t(`tier.${level.tier}`)}
                    </Badge>
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className={`w-4 h-4 ${tierText}`} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <Link href="/levels">
              <Button variant="outline" className="gap-2 border-primary/30 hover:border-primary text-primary">
                {t("hero.cta.secondary")}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── COACH SECTION ── */}
      <section className="py-24 border-t border-border/50 bg-gradient-to-b from-transparent to-card/30">
        <div className="container">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Coach info */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs font-medium mb-6">
                  <Award className="w-3.5 h-3.5" />
                  {t("coach.title")}
                </div>
                <h2 className="text-3xl md:text-4xl font-display font-bold mb-2">
                  {t("coach.name")}
                </h2>
                <p className="text-primary font-medium mb-6">{t("coach.role")}</p>
                <p className="text-muted-foreground leading-relaxed mb-8">
                  {t("coach.bio")}
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card/50 text-sm">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">{t("coach.powered")}</span>
                  </div>
                </div>
              </div>

              {/* Coach avatar card */}
              <div className="relative">
                <div className="glass-card rounded-2xl p-8 text-center gold-glow">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent mx-auto mb-4 flex items-center justify-center text-4xl font-display font-bold text-primary-foreground">
                    R
                  </div>
                  <h3 className="font-display font-bold text-xl mb-1">{t("coach.name")}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{t("coach.role")}</p>
                  <div className="flex justify-center gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <Link href="/ai-tutor">
                    <Button className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                      <Bot className="w-4 h-4" />
                      {t("nav.aiTutor")}
                    </Button>
                  </Link>
                </div>
                {/* CodinCloud badge */}
                <div className="absolute -bottom-4 -right-4 px-4 py-2 rounded-xl border border-primary/30 bg-card/90 backdrop-blur text-xs font-medium text-primary flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" />
                  CodinCloud
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── AI TUTOR PROMO ── */}
      <section className="py-24 border-t border-border/50">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-primary mx-auto mb-6 flex items-center justify-center">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              {t("ai.title")}
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              {t("ai.subtitle")}
            </p>
            <div className="glass-card rounded-2xl p-6 mb-8 text-left">
              <div className="flex gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex-shrink-0 flex items-center justify-center text-xs font-bold text-primary-foreground">R</div>
                <div className="bg-card/80 rounded-xl rounded-tl-none px-4 py-3 text-sm text-foreground/90 max-w-sm">
                  {language === "ar"
                    ? "مرحباً! أنا الكوتش رائد الذكي. اسألني أي شيء عن التسويق الرقمي والتجارة الإلكترونية."
                    : language === "fr"
                    ? "Bonjour! Je suis l'Avatar IA Coach Roued. Posez-moi n'importe quelle question sur le marketing digital."
                    : "Hello! I'm Coach Roued AI Avatar. Ask me anything about digital marketing and e-commerce."}
                </div>
              </div>
            </div>
            <Link href="/ai-tutor">
              <Button size="lg" className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-8">
                <MessageSquare className="w-5 h-5" />
                {language === "ar" ? "تحدث مع الكوتش رائد" : language === "fr" ? "Parler avec Coach Roued" : "Chat with Coach Roued"}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border/50 py-12 bg-card/30">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <div className="font-display font-bold text-xl mb-1">
                <span
                  style={{
                    background: "linear-gradient(135deg, oklch(0.85 0.16 85), oklch(0.72 0.18 85))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {t("footer.brand")}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{t("footer.tagline")}</p>
            </div>
            <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
              <span>© 2025 Prize2Pride. {t("footer.rights")}.</span>
              <span>{t("footer.by")}</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/levels">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs">
                  {t("nav.levels")}
                </Button>
              </Link>
              <Link href="/ai-tutor">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs">
                  {t("nav.aiTutor")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
