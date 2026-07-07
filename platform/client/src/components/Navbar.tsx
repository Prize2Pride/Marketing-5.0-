import { useLanguage, Language } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, Menu, X, BookOpen, Bot, LayoutDashboard, Crown } from "lucide-react";

const LANGS: { code: Language; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "ar", label: "العربية", flag: "🇹🇳" },
];

export default function Navbar() {
  const { t, language, setLanguage, dir } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/levels", label: t("nav.levels"), icon: BookOpen },
    { href: "/ai-tutor", label: t("nav.aiTutor"), icon: Bot },
    ...(isAuthenticated ? [{ href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard }] : []),
    ...(user?.role === "admin" ? [{ href: "/admin", label: t("nav.admin"), icon: Crown }] : []),
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm">
            P2
          </div>
          <span className="font-display font-bold text-lg hidden sm:block" style={{background:"linear-gradient(135deg,oklch(0.85 0.16 85),oklch(0.72 0.18 85))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>
            Prize2Pride
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 text-sm ${location === href ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Button>
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Language switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                <Globe className="w-4 h-4" />
                <span className="text-xs font-medium uppercase hidden sm:block">{language}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={dir === "rtl" ? "start" : "end"} className="bg-card border-border">
              {LANGS.map(({ code, label, flag }) => (
                <DropdownMenuItem
                  key={code}
                  onClick={() => setLanguage(code)}
                  className={`gap-2 cursor-pointer ${language === code ? "text-primary" : ""}`}
                >
                  <span>{flag}</span>
                  <span>{label}</span>
                  {language === code && <span className="ml-auto text-primary">✓</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Auth */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-primary-foreground">
                    {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                  </div>
                  <span className="hidden sm:block text-sm max-w-[100px] truncate">{user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={dir === "rtl" ? "start" : "end"} className="bg-card border-border">
                <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-destructive">
                  {t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              onClick={() => window.location.href = getLoginUrl()}
            >
              {t("nav.login")}
            </Button>
          )}

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card/95 backdrop-blur-xl">
          <div className="container py-3 flex flex-col gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start gap-2 ${location === href ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
