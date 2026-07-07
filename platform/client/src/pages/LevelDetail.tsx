import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { Link, useParams } from "wouter";
import { ChevronRight, BookOpen, Clock, ChevronLeft, Lock } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function LevelDetail() {
  const { t, language, dir } = useLanguage();
  const { isAuthenticated } = useAuth();
  const params = useParams<{ slug: string }>();
  const { data: level, isLoading } = trpc.course.getLevel.useQuery({ slug: params.slug ?? "" }, { enabled: !!params.slug });
  const { data: progress } = trpc.course.getMyProgress.useQuery(undefined, { enabled: isAuthenticated });

  const completedChapterIds = new Set(progress?.map(p => p.chapterId) ?? []);

  if (isLoading) {
    return (
      <div className="min-h-screen" dir={dir}>
        <Navbar />
        <div className="pt-24 container">
          <div className="h-8 w-64 bg-card/50 rounded animate-pulse mb-4" />
          <div className="h-4 w-96 bg-card/50 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!level) return (
    <div className="min-h-screen" dir={dir}>
      <Navbar />
      <div className="pt-24 container text-center">
        <p className="text-muted-foreground">Level not found</p>
        <Link href="/levels"><Button className="mt-4">Back to Levels</Button></Link>
      </div>
    </div>
  );

  const title = language === "ar" ? level.titleAr : language === "fr" ? level.titleFr : level.titleEn;
  const desc = language === "ar" ? level.descriptionAr : language === "fr" ? level.descriptionFr : level.descriptionEn;

  return (
    <div className="min-h-screen" dir={dir}>
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container max-w-4xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link href="/levels" className="hover:text-foreground transition-colors">{t("nav.levels")}</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{title}</span>
          </div>

          {/* Level header */}
          <div className="glass-card rounded-2xl p-8 mb-8">
            <div className="flex items-start gap-4 mb-4">
              <Badge className="text-xs">{t(`tier.${level.tier}`)}</Badge>
              <Badge variant="outline" className="text-xs">Level {level.order}</Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">{title}</h1>
            <p className="text-muted-foreground leading-relaxed">{desc}</p>
          </div>

          {/* Modules */}
          <div className="space-y-6">
            {level.modules?.map((mod, modIdx) => {
              const modTitle = language === "ar" ? mod.titleAr : language === "fr" ? mod.titleFr : mod.titleEn;
              const modDesc = language === "ar" ? mod.descriptionAr : language === "fr" ? mod.descriptionFr : mod.descriptionEn;
              return (
                <div key={mod.id} className="glass-card rounded-2xl overflow-hidden">
                  <div className="p-6 border-b border-border/50">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-bold text-muted-foreground/60">MODULE {modIdx + 1}</span>
                    </div>
                    <h2 className="text-xl font-display font-semibold mb-2">{modTitle}</h2>
                    <p className="text-sm text-muted-foreground">{modDesc}</p>
                  </div>
                  <div className="divide-y divide-border/30">
                    {(mod as any).chapters?.map((chapter: any, chapIdx: number) => {
                      const chapTitle = language === "ar" ? chapter.titleAr : language === "fr" ? chapter.titleFr : chapter.titleEn;
                      const isCompleted = completedChapterIds.has(chapter.id);
                      return (
                        <div key={chapter.id} className="flex items-center justify-between px-6 py-4 hover:bg-card/50 transition-colors group">
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs flex-shrink-0 ${isCompleted ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "border-border/50 text-muted-foreground"}`}>
                              {isCompleted ? "✓" : chapIdx + 1}
                            </div>
                            <span className="text-sm font-medium">{chapTitle}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {chapter.estimatedMinutes} {t("viewer.minutes")}
                            </span>
                            {isAuthenticated ? (
                              <Link href={`/chapter/${chapter.slug}`}>
                                <Button size="sm" variant="ghost" className="gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                                  <BookOpen className="w-3.5 h-3.5" />
                                  {language === "ar" ? "اقرأ" : language === "fr" ? "Lire" : "Read"}
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </Button>
                              </Link>
                            ) : (
                              <Button size="sm" variant="ghost" className="gap-1 text-muted-foreground" onClick={() => window.location.href = getLoginUrl()}>
                                <Lock className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
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

