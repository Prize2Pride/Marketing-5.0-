import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { BookOpen, Brain, Bot, Crown, Zap, Globe, TrendingUp, Star, ChevronRight, Layers, Check } from "lucide-react";
import { toast } from "sonner";

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
  BookOpen: <BookOpen className="w-6 h-6" />,
  Share2: <Globe className="w-6 h-6" />,
  ShoppingCart: <TrendingUp className="w-6 h-6" />,
  Heart: <Star className="w-6 h-6" />,
  BarChart3: <TrendingUp className="w-6 h-6" />,
  Bot: <Bot className="w-6 h-6" />,
  Brain: <Brain className="w-6 h-6" />,
  Building2: <Layers className="w-6 h-6" />,
  Cpu: <Zap className="w-6 h-6" />,
  Crown: <Crown className="w-6 h-6" />,
};

export default function CourseLevels() {
  const { t, language, dir } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { data: levels, isLoading } = trpc.course.getLevels.useQuery();
  const { data: enrollments } = trpc.course.getMyEnrollments.useQuery(undefined, { enabled: isAuthenticated });
  const enrollMutation = trpc.course.enroll.useMutation({
    onSuccess: () => toast.success(language === "ar" ? "تم التسجيل بنجاح!" : language === "fr" ? "Inscription réussie!" : "Enrolled successfully!"),
    onError: () => toast.error("Failed to enroll"),
  });
  const utils = trpc.useUtils();

  const enrolledLevelIds = new Set(enrollments?.map(e => e.levelId) ?? []);

  const handleEnroll = (levelId: number) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    enrollMutation.mutate({ levelId }, {
      onSuccess: () => utils.course.getMyEnrollments.invalidate(),
    });
  };

  return (
    <div className="min-h-screen" dir={dir}>
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              {t("levels.title")}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              {t("levels.subtitle")}
            </p>
          </div>

          {/* Levels grid */}
          <div className="space-y-6">
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-48 rounded-2xl bg-card/50 animate-pulse" />
                ))}
              </div>
            )}

            {levels?.map((level) => {
              const title = language === "ar" ? level.titleAr : language === "fr" ? level.titleFr : level.titleEn;
              const desc = language === "ar" ? level.descriptionAr : language === "fr" ? level.descriptionFr : level.descriptionEn;
              const tierColor = TIER_COLORS[level.tier] ?? TIER_COLORS.beginner;
              const tierText = TIER_TEXT[level.tier] ?? TIER_TEXT.beginner;
              const isEnrolled = enrolledLevelIds.has(level.id);

              return (
                <div key={level.id} className={`group relative rounded-2xl border bg-gradient-to-r ${tierColor} p-6 transition-all duration-200 hover:shadow-xl`}>
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    {/* Level number + icon */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="w-14 h-14 rounded-2xl bg-background/50 border border-border/50 flex items-center justify-center">
                        <span className={tierText}>
                          {LEVEL_ICONS[level.icon ?? "BookOpen"] ?? <BookOpen className="w-6 h-6" />}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-muted-foreground/60 mb-1">LEVEL {level.order}</div>
                        <Badge className={`text-xs ${tierText} bg-background/30 border-0`}>
                          {t(`tier.${level.tier}`)}
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-display font-bold mb-2">{title}</h2>
                      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">{desc}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {isEnrolled && (
                        <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
                          <Check className="w-4 h-4" />
                          {t("levels.enrolled")}
                        </div>
                      )}
                      <Link href={`/level/${level.slug}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className={`gap-2 border-current ${tierText} hover:bg-background/30`}
                        >
                          {isEnrolled ? t("levels.continue") : t("levels.start")}
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                      {!isEnrolled && (
                        <Button
                          size="sm"
                          className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                          onClick={() => handleEnroll(level.id)}
                          disabled={enrollMutation.isPending}
                        >
                          {t("levels.enroll")}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

