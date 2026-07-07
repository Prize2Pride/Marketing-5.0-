import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "fr" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Nav
    "nav.home": "Home",
    "nav.encyclopedia": "Encyclopedia",
    "nav.levels": "Course Levels",
    "nav.coach": "Coach Roued",
    "nav.aiTutor": "AI Tutor",
    "nav.dashboard": "Dashboard",
    "nav.admin": "Admin",
    "nav.login": "Start Learning",
    "nav.logout": "Sign Out",
    // Hero
    "hero.badge": "Digital Marketing 5.0 Encyclopedia",
    "hero.title1": "From Zero to",
    "hero.title2": "Autonomous Giant",
    "hero.subtitle": "The most comprehensive digital marketing encyclopedia ever created. 10 progressive levels from absolute beginner to ASI-scale autonomous commerce mastery.",
    "hero.cta.primary": "Start Your Journey",
    "hero.cta.secondary": "Explore Levels",
    "hero.stats.levels": "Course Levels",
    "hero.stats.modules": "Modules",
    "hero.stats.chapters": "Chapters",
    "hero.stats.languages": "Languages",
    // Levels
    "levels.title": "Your Learning Path",
    "levels.subtitle": "10 progressive levels from Digital Marketing fundamentals to Autonomous Commerce Giants",
    "levels.enroll": "Enroll Now",
    "levels.continue": "Continue",
    "levels.start": "Start Level",
    "levels.enrolled": "Enrolled",
    "levels.modules": "modules",
    "levels.chapters": "chapters",
    // Coach
    "coach.title": "Meet Your Coach",
    "coach.name": "Coach Roued El Fadhel",
    "coach.role": "Founder of Prize2Pride | Digital Marketing Expert",
    "coach.bio": "Coach Roued El Fadhel is a digital marketing strategist, e-commerce expert, and the founder of Prize2Pride. With years of experience building and scaling businesses across Tunisia, France, and the MENA region, he has developed the Prize2Pride methodology — a systematic approach to building digital businesses from zero to autonomous scale.",
    "coach.powered": "Powered by CodinCloud",
    // AI Tutor
    "ai.title": "Coach Roued AI Avatar",
    "ai.subtitle": "Your 24/7 AI-powered marketing mentor",
    "ai.placeholder": "Ask Coach Roued anything about digital marketing...",
    "ai.send": "Send",
    "ai.thinking": "Coach Roued is thinking...",
    "ai.clear": "Clear History",
    // Course viewer
    "viewer.toc": "Table of Contents",
    "viewer.complete": "Mark as Complete",
    "viewer.completed": "Completed",
    "viewer.next": "Next Chapter",
    "viewer.prev": "Previous Chapter",
    "viewer.minutes": "min read",
    // Auth
    "auth.loginRequired": "Sign in to access this content",
    "auth.loginBtn": "Sign In",
    // Progress
    "progress.title": "Your Progress",
    "progress.completed": "Completed",
    "progress.of": "of",
    // Footer
    "footer.brand": "Prize2Pride",
    "footer.tagline": "Empowered by CodinCloud",
    "footer.rights": "All rights reserved",
    "footer.by": "by Coach Roued El Fadhel",
    // Tiers
    "tier.beginner": "Beginner",
    "tier.intermediate": "Intermediate",
    "tier.advanced": "Advanced",
    "tier.expert": "Expert",
    "tier.master": "Master",
    "tier.autonomous": "Autonomous",
    // Admin
    "admin.title": "Admin Dashboard",
    "admin.users": "Users",
    "admin.enrollments": "Enrollments",
    "admin.content": "Content",
    "admin.analytics": "Analytics",
  },
  fr: {
    "nav.home": "Accueil",
    "nav.encyclopedia": "Encyclopédie",
    "nav.levels": "Niveaux du Cours",
    "nav.coach": "Coach Roued",
    "nav.aiTutor": "Tuteur IA",
    "nav.dashboard": "Tableau de Bord",
    "nav.admin": "Admin",
    "nav.login": "Commencer",
    "nav.logout": "Déconnexion",
    "hero.badge": "Encyclopédie Marketing Digital 5.0",
    "hero.title1": "De Zéro au",
    "hero.title2": "Géant Autonome",
    "hero.subtitle": "L'encyclopédie de marketing digital la plus complète jamais créée. 10 niveaux progressifs du débutant absolu à la maîtrise du commerce autonome à l'échelle ASI.",
    "hero.cta.primary": "Commencer Votre Parcours",
    "hero.cta.secondary": "Explorer les Niveaux",
    "hero.stats.levels": "Niveaux",
    "hero.stats.modules": "Modules",
    "hero.stats.chapters": "Chapitres",
    "hero.stats.languages": "Langues",
    "levels.title": "Votre Parcours d'Apprentissage",
    "levels.subtitle": "10 niveaux progressifs des fondamentaux du Marketing Digital aux Géants du Commerce Autonome",
    "levels.enroll": "S'inscrire",
    "levels.continue": "Continuer",
    "levels.start": "Commencer le Niveau",
    "levels.enrolled": "Inscrit",
    "levels.modules": "modules",
    "levels.chapters": "chapitres",
    "coach.title": "Rencontrez Votre Coach",
    "coach.name": "Coach Roued El Fadhel",
    "coach.role": "Fondateur de Prize2Pride | Expert en Marketing Digital",
    "coach.bio": "Le Coach Roued El Fadhel est un stratège en marketing digital, expert en e-commerce et fondateur de Prize2Pride. Avec des années d'expérience dans la construction et le développement d'entreprises en Tunisie, en France et dans la région MENA, il a développé la méthodologie Prize2Pride.",
    "coach.powered": "Propulsé par CodinCloud",
    "ai.title": "Avatar IA Coach Roued",
    "ai.subtitle": "Votre mentor marketing IA disponible 24h/24",
    "ai.placeholder": "Posez au Coach Roued n'importe quelle question sur le marketing digital...",
    "ai.send": "Envoyer",
    "ai.thinking": "Coach Roued réfléchit...",
    "ai.clear": "Effacer l'Historique",
    "viewer.toc": "Table des Matières",
    "viewer.complete": "Marquer comme Terminé",
    "viewer.completed": "Terminé",
    "viewer.next": "Chapitre Suivant",
    "viewer.prev": "Chapitre Précédent",
    "viewer.minutes": "min de lecture",
    "auth.loginRequired": "Connectez-vous pour accéder à ce contenu",
    "auth.loginBtn": "Se Connecter",
    "progress.title": "Votre Progression",
    "progress.completed": "Terminé",
    "progress.of": "sur",
    "footer.brand": "Prize2Pride",
    "footer.tagline": "Propulsé par CodinCloud",
    "footer.rights": "Tous droits réservés",
    "footer.by": "par Coach Roued El Fadhel",
    "tier.beginner": "Débutant",
    "tier.intermediate": "Intermédiaire",
    "tier.advanced": "Avancé",
    "tier.expert": "Expert",
    "tier.master": "Maître",
    "tier.autonomous": "Autonome",
    "admin.title": "Tableau de Bord Admin",
    "admin.users": "Utilisateurs",
    "admin.enrollments": "Inscriptions",
    "admin.content": "Contenu",
    "admin.analytics": "Analytiques",
  },
  ar: {
    "nav.home": "الرئيسية",
    "nav.encyclopedia": "الموسوعة",
    "nav.levels": "مستويات الدورة",
    "nav.coach": "الكوتش رائد",
    "nav.aiTutor": "المدرب الذكي",
    "nav.dashboard": "لوحة التحكم",
    "nav.admin": "الإدارة",
    "nav.login": "ابدأ التعلم",
    "nav.logout": "تسجيل الخروج",
    "hero.badge": "موسوعة التسويق الرقمي 5.0",
    "hero.title1": "من الصفر إلى",
    "hero.title2": "العملاق المستقل",
    "hero.subtitle": "أشمل موسوعة للتسويق الرقمي تم إنشاؤها على الإطلاق. 10 مستويات تدريجية من المبتدئ المطلق إلى إتقان التجارة المستقلة على نطاق الذكاء الاصطناعي الفائق.",
    "hero.cta.primary": "ابدأ رحلتك",
    "hero.cta.secondary": "استكشف المستويات",
    "hero.stats.levels": "مستويات",
    "hero.stats.modules": "وحدات",
    "hero.stats.chapters": "فصول",
    "hero.stats.languages": "لغات",
    "levels.title": "مسار تعلمك",
    "levels.subtitle": "10 مستويات تدريجية من أسس التسويق الرقمي إلى عمالقة التجارة المستقلة",
    "levels.enroll": "سجّل الآن",
    "levels.continue": "متابعة",
    "levels.start": "ابدأ المستوى",
    "levels.enrolled": "مسجّل",
    "levels.modules": "وحدات",
    "levels.chapters": "فصول",
    "coach.title": "تعرّف على كوتشك",
    "coach.name": "الكوتش رائد الفاضل",
    "coach.role": "مؤسس Prize2Pride | خبير التسويق الرقمي",
    "coach.bio": "الكوتش رائد الفاضل هو استراتيجي تسويق رقمي وخبير تجارة إلكترونية ومؤسس Prize2Pride. بسنوات من الخبرة في بناء وتوسيع الأعمال في تونس وفرنسا ومنطقة الشرق الأوسط وشمال أفريقيا، طوّر منهجية Prize2Pride.",
    "coach.powered": "مدعوم من CodinCloud",
    "ai.title": "أفاتار الكوتش رائد الذكي",
    "ai.subtitle": "مرشدك التسويقي الذكي المتاح على مدار الساعة",
    "ai.placeholder": "اسأل الكوتش رائد أي سؤال عن التسويق الرقمي...",
    "ai.send": "إرسال",
    "ai.thinking": "الكوتش رائد يفكر...",
    "ai.clear": "مسح السجل",
    "viewer.toc": "جدول المحتويات",
    "viewer.complete": "وضع علامة مكتمل",
    "viewer.completed": "مكتمل",
    "viewer.next": "الفصل التالي",
    "viewer.prev": "الفصل السابق",
    "viewer.minutes": "دقيقة قراءة",
    "auth.loginRequired": "سجّل دخولك للوصول إلى هذا المحتوى",
    "auth.loginBtn": "تسجيل الدخول",
    "progress.title": "تقدمك",
    "progress.completed": "مكتمل",
    "progress.of": "من",
    "footer.brand": "Prize2Pride",
    "footer.tagline": "مدعوم من CodinCloud",
    "footer.rights": "جميع الحقوق محفوظة",
    "footer.by": "بواسطة الكوتش رائد الفاضل",
    "tier.beginner": "مبتدئ",
    "tier.intermediate": "متوسط",
    "tier.advanced": "متقدم",
    "tier.expert": "خبير",
    "tier.master": "محترف",
    "tier.autonomous": "مستقل",
    "admin.title": "لوحة تحكم الإدارة",
    "admin.users": "المستخدمون",
    "admin.enrollments": "التسجيلات",
    "admin.content": "المحتوى",
    "admin.analytics": "التحليلات",
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key) => key,
  dir: "ltr",
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("p2p_lang") as Language;
    return saved && ["en", "fr", "ar"].includes(saved) ? saved : "en";
  });

  const dir = language === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    localStorage.setItem("p2p_lang", language);
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
  }, [language, dir]);

  const setLanguage = (lang: Language) => setLanguageState(lang);

  const t = (key: string): string => {
    return translations[language][key] ?? translations["en"][key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
