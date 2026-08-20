import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { Users, BookOpen, TrendingUp, Award, Check, ClipboardCheck, Crown, Send, Shield, X } from "lucide-react";

export default function AdminDashboard() {
  const { t, language, dir } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const { data: stats } = trpc.admin.getStats.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: users } = trpc.admin.getUsers.useQuery({ limit: 20, offset: 0 }, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: artifactQueue } = trpc.admin.listArtifactsForReview.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: modules } = trpc.admin.getModulesForIngestion.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: educatorApplications } = trpc.admin.listEducatorApplications.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({});
  const [targetModules, setTargetModules] = useState<Record<number, string>>({});
  const utils = trpc.useUtils();
  const reviewArtifact = trpc.admin.reviewArtifact.useMutation({
    onSuccess: () => {
      utils.admin.listArtifactsForReview.invalidate();
      toast.success(language === "ar" ? "تم تحديث المراجعة" : language === "fr" ? "Révision mise à jour" : "Artifact review updated");
    },
    onError: error => toast.error(error.message),
  });
  const ingestArtifact = trpc.admin.publishArtifactAsChapter.useMutation({
    onSuccess: () => {
      utils.admin.listArtifactsForReview.invalidate();
      utils.admin.getStats.invalidate();
      toast.success(language === "ar" ? "تمت إضافة الدرس كمسودة" : language === "fr" ? "Leçon ajoutée comme brouillon" : "Lesson added as a draft chapter");
    },
    onError: error => toast.error(error.message),
  });
  const reviewEducator = trpc.admin.reviewEducatorApplication.useMutation({
    onSuccess: () => {
      utils.admin.listEducatorApplications.invalidate();
      utils.admin.getUsers.invalidate();
      toast.success(language === "ar" ? "تمت مراجعة طلب المعلم" : language === "fr" ? "Candidature enseignant revue" : "Educator application reviewed");
    },
    onError: error => toast.error(error.message),
  });

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen" dir={dir}>
        <Navbar />
        <div className="pt-24 container max-w-2xl text-center py-24">
          <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
          <h2 className="text-2xl font-display font-bold mb-4">
            {language === "ar" ? "وصول مقيّد" : language === "fr" ? "Accès Restreint" : "Access Restricted"}
          </h2>
          <p className="text-muted-foreground">
            {language === "ar" ? "هذه الصفحة مخصصة للمسؤولين فقط" : language === "fr" ? "Cette page est réservée aux administrateurs" : "This page is for administrators only"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" dir={dir}>
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container max-w-6xl">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Crown className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-display font-bold">{t("admin.title")}</h1>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Users, label: t("admin.users"), value: stats?.totalUsers ?? 0, color: "text-blue-400" },
              { icon: TrendingUp, label: t("admin.enrollments"), value: stats?.totalEnrollments ?? 0, color: "text-emerald-400" },
              { icon: BookOpen, label: language === "ar" ? "المستويات" : language === "fr" ? "Niveaux" : "Levels", value: stats?.totalLevels ?? 0, color: "text-purple-400" },
              { icon: Award, label: language === "ar" ? "الفصول" : language === "fr" ? "Chapitres" : "Chapters", value: stats?.totalChapters ?? 0, color: "text-amber-400" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="glass-card rounded-xl p-5">
                <Icon className={`w-6 h-6 ${color} mb-3`} />
                <div className="text-2xl font-display font-bold">{value}</div>
                <div className="text-xs text-muted-foreground mt-1">{label}</div>
              </div>
            ))}
          </div>

          <section className="glass-card rounded-2xl overflow-hidden mb-8">
            <div className="p-6 border-b border-border/50 flex items-center gap-3"><div className="rounded-xl bg-primary/10 p-2"><Users className="w-5 h-5 text-primary" /></div><div><h2 className="font-display font-semibold">{language === "ar" ? "طلبات المعلمين" : language === "fr" ? "Candidatures enseignants" : "Educator applications"}</h2><p className="text-sm text-muted-foreground mt-1">{language === "ar" ? "اعتمد الحساب لتفعيل إنشاء المدرسة الفرعية." : language === "fr" ? "Approuvez un compte pour activer la création d'une sous-plateforme." : "Approve an account to activate teacher subplatform creation."}</p></div></div>
            <div className="p-5 space-y-3">{educatorApplications?.length ? educatorApplications.map(application => <article key={application.id} className="rounded-xl border border-border/60 bg-card/35 p-4"><p className="text-sm font-medium">{users?.find(candidate => candidate.id === application.userId)?.name ?? `User #${application.userId}`}</p><p className="text-xs text-primary mt-1">{application.expertise}</p><p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">{application.bio}</p><Textarea value={reviewNotes[application.userId] ?? ""} onChange={event => setReviewNotes(notes => ({ ...notes, [application.userId]: event.target.value }))} className="mt-3 min-h-16 text-sm" placeholder={language === "ar" ? "ملاحظة مراجعة (اختياري)" : language === "fr" ? "Note de revue (facultatif)" : "Review note (optional)"} /><div className="flex gap-2 mt-2"><Button size="sm" disabled={reviewEducator.isPending} onClick={() => reviewEducator.mutate({ userId: application.userId, decision: "approve", reviewNotes: reviewNotes[application.userId] || undefined })}><Check className="w-4 h-4 mr-1" />{language === "ar" ? "اعتماد" : language === "fr" ? "Approuver" : "Approve"}</Button><Button size="sm" variant="outline" className="text-destructive border-destructive/40" disabled={reviewEducator.isPending} onClick={() => reviewEducator.mutate({ userId: application.userId, decision: "reject", reviewNotes: reviewNotes[application.userId] || undefined })}><X className="w-4 h-4 mr-1" />{language === "ar" ? "رفض" : language === "fr" ? "Rejeter" : "Reject"}</Button></div></article>) : <p className="py-5 text-center text-sm text-muted-foreground">{language === "ar" ? "لا توجد طلبات معلّقة." : language === "fr" ? "Aucune candidature en attente." : "No educator applications are waiting for review."}</p>}</div>
          </section>

          {/* Artifact review and lesson-ingestion queue */}
          <section className="glass-card rounded-2xl overflow-hidden mb-8">
            <div className="p-6 border-b border-border/50 flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2"><ClipboardCheck className="w-5 h-5 text-primary" /></div>
              <div><h2 className="font-display font-semibold">{language === "ar" ? "مراجعة موارد الاستوديو" : language === "fr" ? "Révision des ressources Studio" : "Studio artifact review"}</h2><p className="text-sm text-muted-foreground mt-1">{language === "ar" ? "اعتمد المورد قبل إضافته كمسودة درس." : language === "fr" ? "Approuvez une ressource avant de l'intégrer comme brouillon de leçon." : "Approve an artifact before ingesting it as a draft course chapter."}</p></div>
            </div>
            <div className="p-5 space-y-4">
              {artifactQueue?.length ? artifactQueue.map(artifact => {
                const isReady = artifact.status === "ready";
                const selectedModule = targetModules[artifact.id] ?? "";
                return <article key={artifact.id} className="rounded-xl border border-border/60 bg-card/35 p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between"><div><div className="flex items-center gap-2"><h3 className="font-medium">{artifact.title}</h3><span className={`text-xs rounded-full px-2 py-0.5 ${isReady ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"}`}>{artifact.status}</span></div><p className="text-xs text-muted-foreground mt-1 capitalize">{artifact.kind} · {artifact.language} · {new Date(artifact.createdAt).toLocaleDateString()}</p></div></div>
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-3 whitespace-pre-line">{artifact.content || artifact.prompt}</p>
                  {isReady ? <div className="mt-4 space-y-2"><Textarea value={reviewNotes[artifact.id] ?? ""} onChange={event => setReviewNotes(notes => ({ ...notes, [artifact.id]: event.target.value }))} placeholder={language === "ar" ? "ملاحظات المراجعة (اختياري)" : language === "fr" ? "Notes de révision (facultatif)" : "Review notes (optional)"} className="min-h-20 text-sm" /><div className="flex flex-wrap gap-2"><Button size="sm" className="gap-2" disabled={reviewArtifact.isPending} onClick={() => reviewArtifact.mutate({ artifactId: artifact.id, decision: "approve", reviewNotes: reviewNotes[artifact.id] || undefined })}><Check className="w-4 h-4" />{language === "ar" ? "اعتماد" : language === "fr" ? "Approuver" : "Approve"}</Button><Button size="sm" variant="outline" className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10" disabled={reviewArtifact.isPending} onClick={() => reviewArtifact.mutate({ artifactId: artifact.id, decision: "reject", reviewNotes: reviewNotes[artifact.id] || undefined })}><X className="w-4 h-4" />{language === "ar" ? "رفض" : language === "fr" ? "Rejeter" : "Reject"}</Button></div></div> : <div className="mt-4 flex flex-col gap-2 sm:flex-row"><select aria-label="Target module" value={selectedModule} onChange={event => setTargetModules(current => ({ ...current, [artifact.id]: event.target.value }))} className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm"><option value="">{language === "ar" ? "اختر وحدة لإضافة الدرس" : language === "fr" ? "Choisir un module cible" : "Choose target module"}</option>{modules?.map(module => <option key={module.id} value={module.id}>{module.titleEn} · {module.titleFr}</option>)}</select><Button size="sm" className="gap-2" disabled={!selectedModule || ingestArtifact.isPending} onClick={() => ingestArtifact.mutate({ artifactId: artifact.id, moduleId: Number(selectedModule), publishImmediately: false })}><Send className="w-4 h-4" />{language === "ar" ? "أضف كمسودة" : language === "fr" ? "Ajouter en brouillon" : "Ingest as draft"}</Button></div>}
                </article>;
              }) : <p className="py-6 text-center text-sm text-muted-foreground">{language === "ar" ? "لا توجد موارد جاهزة للمراجعة." : language === "fr" ? "Aucune ressource prête à réviser." : "No ready artifacts waiting for review."}</p>}
            </div>
          </section>

          {/* Users table */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-border/50">
              <h2 className="font-display font-semibold">{t("admin.users")}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left px-6 py-3 text-muted-foreground font-medium">Name</th>
                    <th className="text-left px-6 py-3 text-muted-foreground font-medium">Email</th>
                    <th className="text-left px-6 py-3 text-muted-foreground font-medium">Role</th>
                    <th className="text-left px-6 py-3 text-muted-foreground font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.map(u => (
                    <tr key={u.id} className="border-b border-border/30 hover:bg-card/50 transition-colors">
                      <td className="px-6 py-4 font-medium">{u.name ?? "—"}</td>
                      <td className="px-6 py-4 text-muted-foreground">{u.email ?? "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === "admin" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Course management link */}
          <div className="mt-6">
            <Link href="/levels">
              <Button variant="outline" className="gap-2 border-primary/30 text-primary hover:border-primary">
                <BookOpen className="w-4 h-4" />
                {language === "ar" ? "إدارة المحتوى" : language === "fr" ? "Gérer le Contenu" : "Manage Course Content"}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
