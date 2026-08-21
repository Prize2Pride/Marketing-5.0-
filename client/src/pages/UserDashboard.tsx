import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BookOpen, Brain, Check, ChevronRight, Compass, Award, Sparkles, TrendingUp } from "lucide-react";

export default function UserDashboard() {
  const { t, language, dir } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const { data: enrollments } = trpc.course.getMyEnrollments.useQuery(undefined, { enabled: isAuthenticated });
  const { data: progress } = trpc.course.getMyProgress.useQuery(undefined, { enabled: isAuthenticated });
  const { data: levels } = trpc.course.getLevels.useQuery();
  const { data: profile } = trpc.course.getLearningProfile.useQuery(undefined, { enabled: isAuthenticated });
  const { data: adaptivePlan } = trpc.course.getAdaptivePlan.useQuery(undefined, { enabled: isAuthenticated });
  const { data: certificates } = trpc.course.listMyCertificates.useQuery(undefined, { enabled: isAuthenticated });
  const [editingProfile, setEditingProfile] = useState(false);
  const [experienceLevel, setExperienceLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [learningStyle, setLearningStyle] = useState<"visual" | "practical" | "reading" | "mixed">("mixed");
  const [primaryGoal, setPrimaryGoal] = useState<"marketing" | "ecommerce" | "automation" | "career" | "business">("marketing");
  const [weeklyHours, setWeeklyHours] = useState(3);
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState<"guided" | "standard" | "challenge">("guided");
  const [certificateLevelId, setCertificateLevelId] = useState<number | null>(null);
  const utils = trpc.useUtils();
  const { data: certificateEligibility } = trpc.course.getCertificateEligibility.useQuery({ levelId: certificateLevelId ?? 0 }, { enabled: isAuthenticated && !!certificateLevelId });
  const issueCertificate = trpc.course.issueMyCertificate.useMutation({
    onSuccess: () => {
      utils.course.listMyCertificates.invalidate();
      utils.course.getCertificateEligibility.invalidate();
      toast.success(language === "ar" ? "تم إصدار الشهادة" : language === "fr" ? "Certificat délivré" : "Certificate issued");
    },
    onError: (error) => toast.error(error.message),
  });
  const saveProfile = trpc.course.saveLearningProfile.useMutation({
    onSuccess: () => {
      setEditingProfile(false);
      utils.course.getLearningProfile.invalidate();
      utils.course.getAdaptivePlan.invalidate();
      toast.success(language === "ar" ? "تم حفظ ملف التعلم" : language === "fr" ? "Profil d'apprentissage enregistré" : "Learning profile saved");
    },
    onError: error => toast.error(error.message),
  });

  useEffect(() => {
    if (!profile) return;
    setExperienceLevel(profile.experienceLevel);
    setLearningStyle(profile.learningStyle);
    setPrimaryGoal(profile.primaryGoal);
    setWeeklyHours(profile.weeklyHours);
    setAdaptiveDifficulty(profile.adaptiveDifficulty);
  }, [profile]);

  const enrolledLevelIds = new Set(enrollments?.map(e => e.levelId) ?? []);
  const enrolledLevels = levels?.filter(l => enrolledLevelIds.has(l.id)) ?? [];
  const completedChapters = progress?.length ?? 0;

  useEffect(() => {
    if (!certificateLevelId && enrolledLevels[0]) setCertificateLevelId(enrolledLevels[0].id);
  }, [certificateLevelId, enrolledLevels]);

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

          {/* Adaptive profile and recommended path */}
          <section className="glass-card rounded-2xl p-6 mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex gap-3"><div className="rounded-xl bg-primary/10 p-2.5"><Brain className="w-5 h-5 text-primary" /></div><div><h2 className="font-display font-semibold">{language === "ar" ? "مسار التعلّم المتكيف" : language === "fr" ? "Parcours d'apprentissage adaptatif" : "Adaptive learning path"}</h2><p className="text-sm text-muted-foreground mt-1">{language === "ar" ? "اضبط تفضيلاتك لتحصل على توصيات عملية مخصصة." : language === "fr" ? "Définissez vos préférences pour obtenir des recommandations pratiques personnalisées." : "Set your preferences to receive practical, personalized recommendations."}</p></div></div><Button size="sm" variant="outline" onClick={() => setEditingProfile(current => !current)}>{editingProfile ? (language === "fr" ? "Annuler" : language === "ar" ? "إلغاء" : "Cancel") : (profile ? (language === "fr" ? "Modifier" : language === "ar" ? "تعديل" : "Edit profile") : (language === "fr" ? "Créer mon profil" : language === "ar" ? "أنشئ ملفي" : "Set my profile"))}</Button></div>
            {editingProfile ? <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-5"><label className="text-sm">{language === "fr" ? "Niveau" : language === "ar" ? "المستوى" : "Experience"}<select value={experienceLevel} onChange={event => setExperienceLevel(event.target.value as typeof experienceLevel)} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2"><option value="beginner">{language === "fr" ? "Débutant" : language === "ar" ? "مبتدئ" : "Beginner"}</option><option value="intermediate">{language === "fr" ? "Intermédiaire" : language === "ar" ? "متوسط" : "Intermediate"}</option><option value="advanced">{language === "fr" ? "Avancé" : language === "ar" ? "متقدم" : "Advanced"}</option></select></label><label className="text-sm">{language === "fr" ? "Style" : language === "ar" ? "أسلوب" : "Learning style"}<select value={learningStyle} onChange={event => setLearningStyle(event.target.value as typeof learningStyle)} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2"><option value="mixed">{language === "fr" ? "Mixte" : language === "ar" ? "مختلط" : "Mixed"}</option><option value="visual">{language === "fr" ? "Visuel" : language === "ar" ? "مرئي" : "Visual"}</option><option value="practical">{language === "fr" ? "Pratique" : language === "ar" ? "عملي" : "Practical"}</option><option value="reading">{language === "fr" ? "Lecture" : language === "ar" ? "قراءة" : "Reading"}</option></select></label><label className="text-sm">{language === "fr" ? "Objectif" : language === "ar" ? "الهدف" : "Primary goal"}<select value={primaryGoal} onChange={event => setPrimaryGoal(event.target.value as typeof primaryGoal)} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2"><option value="marketing">Marketing</option><option value="ecommerce">E-commerce</option><option value="automation">AI Automation</option><option value="career">Career</option><option value="business">Business</option></select></label><label className="text-sm">{language === "fr" ? "Heures / semaine" : language === "ar" ? "ساعات / أسبوع" : "Hours / week"}<select value={weeklyHours} onChange={event => setWeeklyHours(Number(event.target.value))} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2">{[1, 3, 6, 10].map(hours => <option key={hours} value={hours}>{hours}</option>)}</select></label><label className="text-sm">{language === "fr" ? "Rythme" : language === "ar" ? "الصعوبة" : "Pace"}<select value={adaptiveDifficulty} onChange={event => setAdaptiveDifficulty(event.target.value as typeof adaptiveDifficulty)} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2"><option value="guided">{language === "fr" ? "Guidé" : language === "ar" ? "موجّه" : "Guided"}</option><option value="standard">{language === "fr" ? "Standard" : language === "ar" ? "عادي" : "Standard"}</option><option value="challenge">{language === "fr" ? "Défi" : language === "ar" ? "تحدي" : "Challenge"}</option></select></label><Button className="sm:col-span-2 lg:col-span-5 gap-2" disabled={saveProfile.isPending} onClick={() => saveProfile.mutate({ experienceLevel, learningStyle, primaryGoal, weeklyHours, adaptiveDifficulty })}><Sparkles className="w-4 h-4" />{language === "fr" ? "Enregistrer mon profil" : language === "ar" ? "احفظ ملف التعلم" : "Save learning profile"}</Button></div> : <div className="mt-5"><div className="flex flex-wrap gap-2 mb-4">{profile ? [profile.experienceLevel, profile.learningStyle, profile.primaryGoal, `${profile.weeklyHours}h/week`, adaptivePlan?.difficulty ?? profile.adaptiveDifficulty].map(item => <span key={item} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary capitalize">{item}</span>) : <p className="text-sm text-muted-foreground">{language === "fr" ? "Créez votre profil pour orienter vos prochaines recommandations." : language === "ar" ? "أنشئ ملفك لتوجيه التوصيات القادمة." : "Set your profile to guide your next recommendations."}</p>}</div>{adaptivePlan?.nextChapters?.length ? <div><div className="flex items-center gap-2 text-sm font-medium mb-2"><Compass className="w-4 h-4 text-primary" />{language === "fr" ? "Vos prochaines leçons" : language === "ar" ? "دروسك القادمة" : "Your next lessons"}</div><div className="grid md:grid-cols-3 gap-2">{adaptivePlan.nextChapters.map(chapter => <Link key={chapter.id} href={`/chapter/${chapter.slug}`} className="rounded-xl border border-border/70 p-3 hover:border-primary/50 transition-colors"><p className="text-sm font-medium line-clamp-2">{language === "ar" ? chapter.titleAr : language === "fr" ? chapter.titleFr : chapter.titleEn}</p><p className="text-xs text-muted-foreground mt-1">{chapter.estimatedMinutes ?? 15} min</p></Link>)}</div></div> : null}</div>}
          </section>

          {/* Certificates */}
          <section className="glass-card rounded-2xl p-6 mb-8">
            <div className="flex gap-3"><div className="rounded-xl bg-primary/10 p-2.5"><Award className="w-5 h-5 text-primary" /></div><div><h2 className="font-display font-semibold">{language === "ar" ? "شهادات المسار" : language === "fr" ? "Certificats de parcours" : "Learning-path certificates"}</h2><p className="text-sm text-muted-foreground mt-1">{language === "ar" ? "الشهادات مبنية على إتمام كل الدروس المنشورة في المسار. لا تتضمن أي ادعاء باعتماد خارجي." : language === "fr" ? "Les certificats reposent sur l'achèvement de toutes les leçons publiées du parcours; ils ne prétendent à aucune accréditation externe." : "Certificates require completion of every published lesson in a path and do not claim external accreditation."}</p></div></div>
            {enrolledLevels.length ? <div className="mt-5 grid md:grid-cols-[1fr_auto] gap-3 items-end"><label className="text-sm">{language === "ar" ? "المسار" : language === "fr" ? "Parcours" : "Learning path"}<select value={certificateLevelId ?? ""} onChange={(event) => setCertificateLevelId(Number(event.target.value))} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-2">{enrolledLevels.map((level) => <option key={level.id} value={level.id}>{language === "ar" ? level.titleAr : language === "fr" ? level.titleFr : level.titleEn}</option>)}</select></label><Button disabled={!certificateEligibility?.eligible || !!certificateEligibility?.certificate || issueCertificate.isPending} onClick={() => certificateLevelId && issueCertificate.mutate({ levelId: certificateLevelId, language })}>{issueCertificate.isPending ? (language === "fr" ? "Émission…" : language === "ar" ? "جارٍ الإصدار…" : "Issuing…") : certificateEligibility?.certificate ? (language === "fr" ? "Déjà délivré" : language === "ar" ? "تم الإصدار" : "Already issued") : (language === "fr" ? "Demander le certificat" : language === "ar" ? "اطلب الشهادة" : "Request certificate")}</Button></div> : <p className="mt-5 text-sm text-muted-foreground">{language === "ar" ? "سجّل في مسار لتتبع أهلية الشهادة." : language === "fr" ? "Inscrivez-vous à un parcours pour suivre votre éligibilité." : "Enroll in a learning path to track certificate eligibility."}</p>}
            {certificateEligibility && <p className={`mt-3 text-sm ${certificateEligibility.eligible ? "text-primary" : "text-muted-foreground"}`}>{certificateEligibility.eligible ? (language === "ar" ? "أنت مؤهل لإصدار هذه الشهادة." : language === "fr" ? "Vous êtes admissible à ce certificat." : "You are eligible for this certificate.") : (language === "ar" ? `أكملت ${certificateEligibility.completedChapters} من ${certificateEligibility.requiredChapters} دروس منشورة.` : language === "fr" ? `${certificateEligibility.completedChapters} sur ${certificateEligibility.requiredChapters} leçons publiées terminées.` : `${certificateEligibility.completedChapters} of ${certificateEligibility.requiredChapters} published lessons completed.`)}</p>}
            {certificates?.length ? <div className="mt-5 border-t border-border pt-4"><p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{language === "ar" ? "شهاداتي الصادرة" : language === "fr" ? "Mes certificats délivrés" : "My issued certificates"}</p>{certificates.map((certificate) => <div key={certificate.id} className="flex items-center justify-between gap-3 rounded-xl bg-card/60 p-3"><div><p className="text-sm font-medium">{language === "ar" ? "شهادة مسار Prize2Pride" : language === "fr" ? "Certificat de parcours Prize2Pride" : "Prize2Pride learning-path certificate"}</p><p className="text-xs text-muted-foreground mt-1">{language === "ar" ? "رمز التحقق:" : language === "fr" ? "Code de vérification :" : "Verification code:"} <span className="font-mono">{certificate.verificationCode}</span></p></div><Award className="w-5 h-5 text-primary shrink-0" /></div>)}</div> : null}
          </section>

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
