import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { Link, useParams } from "wouter";
import { Check, Clock, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

function renderMarkdown(content: string): string {
  return content
    .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-display font-bold mb-6 mt-0" style="background:linear-gradient(135deg,oklch(0.85 0.16 85),oklch(0.72 0.18 85));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold text-foreground mb-4 mt-8 pb-2 border-b border-border">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-primary mb-3 mt-6">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-primary font-semibold">$1</strong>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-primary pl-4 italic text-muted-foreground my-4 py-1">$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li class="text-foreground/85 mb-1">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g, '<ul class="list-disc list-inside mb-4 space-y-1">$&</ul>')
    .replace(/^(?!<[h|u|b|l])(.*\S.*)$/gm, '<p class="mb-4 text-foreground/85 leading-relaxed">$1</p>');
}

export default function ChapterViewer() {
  const { t, language, dir } = useLanguage();
  const { isAuthenticated } = useAuth();
  const params = useParams<{ slug: string }>();
  const { data: chapter, isLoading } = trpc.course.getChapter.useQuery({ slug: params.slug ?? "" }, { enabled: !!params.slug });
  const { data: progress } = trpc.course.getMyProgress.useQuery(undefined, { enabled: isAuthenticated });
  const completeMutation = trpc.course.completeChapter.useMutation();
  const utils = trpc.useUtils();

  const isCompleted = progress?.some(p => p.chapterId === chapter?.id) ?? false;

  const handleComplete = () => {
    if (!chapter) return;
    completeMutation.mutate({ chapterId: chapter.id }, {
      onSuccess: () => {
        utils.course.getMyProgress.invalidate();
        toast.success(language === "ar" ? "تم إكمال الفصل!" : language === "fr" ? "Chapitre terminé!" : "Chapter completed!");
      },
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen" dir={dir}>
        <Navbar />
        <div className="pt-24 container max-w-2xl text-center py-24">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
          <h2 className="text-2xl font-display font-bold mb-4">{t("auth.loginRequired")}</h2>
          <Button onClick={() => window.location.href = getLoginUrl()} className="bg-primary text-primary-foreground">
            {t("auth.loginBtn")}
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen" dir={dir}>
        <Navbar />
        <div className="pt-24 container max-w-4xl">
          <div className="a4-page mx-auto animate-pulse">
            <div className="h-8 w-3/4 bg-card/50 rounded mb-6" />
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-4 bg-card/50 rounded" style={{ width: `${70 + Math.random() * 30}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!chapter) return (
    <div className="min-h-screen" dir={dir}>
      <Navbar />
      <div className="pt-24 container text-center">
        <p className="text-muted-foreground">Chapter not found</p>
        <Link href="/levels"><Button className="mt-4">Back to Levels</Button></Link>
      </div>
    </div>
  );

  const title = language === "ar" ? chapter.titleAr : language === "fr" ? chapter.titleFr : chapter.titleEn;
  const content = language === "ar" ? chapter.contentAr : language === "fr" ? chapter.contentFr : chapter.contentEn;

  return (
    <div className="min-h-screen" dir={dir}>
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container max-w-5xl">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main content - A4 viewer */}
            <main className="flex-1 min-w-0">
              {/* Chapter meta */}
              <div className="flex items-center justify-between mb-6">
                <Link href="/levels">
                  <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="w-4 h-4" />
                    {t("nav.levels")}
                  </Button>
                </Link>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {chapter.estimatedMinutes} {t("viewer.minutes")}
                </div>
              </div>

              {/* A4 page */}
              <div className="a4-page mx-auto" dir={dir}>
                <div
                  className="prose-p2p"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(content ?? "") }}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-8 max-w-[210mm] mx-auto">
                <Button variant="outline" className="gap-2" onClick={() => window.history.back()}>
                  <ChevronLeft className="w-4 h-4" />
                  {t("viewer.prev")}
                </Button>
                {isCompleted ? (
                  <div className="flex items-center gap-2 text-emerald-400 font-medium">
                    <Check className="w-5 h-5" />
                    {t("viewer.completed")}
                  </div>
                ) : (
                  <Button
                    className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={handleComplete}
                    disabled={completeMutation.isPending}
                  >
                    <Check className="w-4 h-4" />
                    {t("viewer.complete")}
                  </Button>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

