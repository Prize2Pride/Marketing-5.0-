import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { BookOpen, Check, TrendingUp, Award, ChevronRight } from "lucide-react";

export default function UserDashboard() {
  const { t, language, dir } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const { data: enrollments } = trpc.course.getMyEnrollments.useQuery(undefined, { enabled: isAuthenticated });
  const { data: progress } = trpc.course.getMyProgress.useQuery(undefined, { enabled: isAuthenticated });
  const { data: levels } = trpc.course.getLevels.useQuery();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen" dir={dir}>
        <Navbar />
        <div className="pt-24 container max-w-2xl text-center py-24">
          <h2 className="text-2xl font-display font-bold mb-4">{t("auth.loginRequired")}</h2>
          <Button onClick={() => window.location.href = getLoginUrl()} className="bg-primary text-primary-foreground">
            {t("auth.loginBtn")}
          </Button>
        </div>
      </div>
    );
  }

  const enrolledLevelIds = new Set(enrollments?.map(e => e.levelId) ?? []);
  const enrolledLevels = levels?.filter(l => enrolledLevelIds.has(l.id)) ?? [];
  const completedChapters = progress?.length ?? 0;

  return (
    <div className="min-h-screen" dir={dir}>
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container max-w-4xl">
          {/* Welcome */}
          <div className="glass-card rounded-2xl p-8 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-primary-foreground">
                {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold">{user?.name}</h1>
                <p className="text-muted-foreground text-sm">{t("progress.title")}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { icon: BookOpen, label: language === "ar" ? "مستويات مسجّلة" : language === "fr" ? "Niveaux inscrits" : "Enrolled Levels", value: enrolledLevels.length },
              { icon: Check, label: language === "ar" ? "فصول مكتملة" : language === "fr" ? "Chapitres terminés" : "Chapters Done", value: completedChapters },
              { icon: Award, label: language === "ar" ? "نقاط التقدم" : language === "fr" ? "Points de progression" : "Progress Points", value: completedChapters * 10 },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="glass-card rounded-xl p-5 text-center">
                <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-2xl font-display font-bold text-primary">{value}</div>
                <div className="text-xs text-muted-foreground mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* Enrolled levels */}
          <h2 className="text-xl font-display font-semibold mb-4">
            {language === "ar" ? "مستوياتي" : language === "fr" ? "Mes Niveaux" : "My Levels"}
          </h2>
          {enrolledLevels.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {language === "ar" ? "لم تسجّل في أي مستوى بعد" : language === "fr" ? "Vous n'êtes inscrit à aucun niveau" : "You haven't enrolled in any levels yet"}
              </p>
              <Link href="/levels">
                <Button className="bg-primary text-primary-foreground">{t("levels.enroll")}</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {enrolledLevels.map(level => {
                const title = language === "ar" ? level.titleAr : language === "fr" ? level.titleFr : level.titleEn;
                return (
                  <div key={level.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Level {level.order}</div>
                      <div className="font-medium">{title}</div>
                    </div>
                    <Link href={`/level/${level.slug}`}>
                      <Button size="sm" variant="outline" className="gap-2 text-primary border-primary/30">
                        {t("levels.continue")}
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

