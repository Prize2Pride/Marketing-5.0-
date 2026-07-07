import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { Link } from "wouter";
import { Users, BookOpen, TrendingUp, Award, Crown, Shield } from "lucide-react";

export default function AdminDashboard() {
  const { t, language, dir } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const { data: stats } = trpc.admin.getStats.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: users } = trpc.admin.getUsers.useQuery({ limit: 20, offset: 0 }, { enabled: isAuthenticated && user?.role === "admin" });

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

