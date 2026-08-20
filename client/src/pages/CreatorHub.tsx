import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import { getLoginUrl } from "@/const";
import { Streamdown } from "streamdown";
import { useEffect, useMemo, useState } from "react";
import { AudioLines, BookOpen, Braces, ChartNoAxesCombined, Clapperboard, Download, FileText, ImageIcon, LayoutTemplate, Loader2, Plus, Sparkles, Table2, WandSparkles } from "lucide-react";
import { toast } from "sonner";

const modes = [
  { id: "lesson", icon: BookOpen },
  { id: "book", icon: BookOpen },
  { id: "document", icon: FileText },
  { id: "code", icon: Braces },
  { id: "spreadsheet", icon: Table2 },
  { id: "chart_spec", icon: ChartNoAxesCombined },
  { id: "infographic", icon: ImageIcon },
  { id: "poster", icon: LayoutTemplate },
  { id: "audio_brief", icon: AudioLines },
  { id: "video_brief", icon: Clapperboard },
  { id: "quiz", icon: Sparkles },
] as const;

type CreatorKind = (typeof modes)[number]["id"];

const copy = {
  en: {
    title: "Creator & Practice Hub", subtitle: "Turn every lesson into an applied project, a structured artifact, or a visual learning aid.",
    create: "Create an artifact", titleLabel: "Working title", titlePlaceholder: "e.g. TikTok launch plan for a Tunisian skincare store",
    brief: "Your learning brief", briefPlaceholder: "Describe the audience, business context, objective, constraints, and what you want to create…",
    generate: "Create with Coach Roued", library: "Your artifact library", projects: "Practice projects", newProject: "Add project", projectTitle: "Project title", projectBrief: "What will you apply?", noArtifacts: "Your creations will appear here.", noProjects: "Create a practice project to turn knowledge into action.",
    blueprintNote: "Long-form books begin as a reviewable blueprint and expand section by section to protect quality and reliability.",
  },
  fr: {
    title: "Hub de Création & Pratique", subtitle: "Transformez chaque leçon en projet appliqué, document structuré ou support visuel.",
    create: "Créer un artefact", titleLabel: "Titre de travail", titlePlaceholder: "Ex. Plan de lancement TikTok pour une marque tunisienne",
    brief: "Votre brief d'apprentissage", briefPlaceholder: "Décrivez l'audience, le contexte business, l'objectif, les contraintes et votre création…",
    generate: "Créer avec Coach Roued", library: "Votre bibliothèque", projects: "Projets pratiques", newProject: "Ajouter un projet", projectTitle: "Titre du projet", projectBrief: "Que souhaitez-vous appliquer ?", noArtifacts: "Vos créations apparaîtront ici.", noProjects: "Créez un projet pratique pour transformer le savoir en action.",
    blueprintNote: "Les livres long format démarrent par un plan révisable puis sont développés section par section pour protéger la qualité.",
  },
  ar: {
    title: "مركز الإبداع والتطبيق", subtitle: "حوّل كل درس إلى مشروع تطبيقي أو وثيقة منظمة أو وسيلة تعلم بصرية.",
    create: "إنشاء مورد", titleLabel: "عنوان العمل", titlePlaceholder: "مثال: خطة إطلاق TikTok لمتجر عناية بالبشرة تونسي",
    brief: "وصف التعلم", briefPlaceholder: "اشرح الجمهور والسياق التجاري والهدف والقيود وما تريد إنشاءه…",
    generate: "أنشئ مع الكوتش رائد", library: "مكتبتك", projects: "مشاريع تطبيقية", newProject: "أضف مشروعاً", projectTitle: "عنوان المشروع", projectBrief: "ماذا ستطبق؟", noArtifacts: "ستظهر إبداعاتك هنا.", noProjects: "أنشئ مشروعاً تطبيقياً لتحويل المعرفة إلى عمل.",
    blueprintNote: "تبدأ الكتب الطويلة بمخطط قابل للمراجعة ثم تتوسع قسماً بعد قسم لحماية الجودة والموثوقية.",
  },
};

const modeLabels: Record<string, Record<CreatorKind, string>> = {
  en: { lesson: "Lesson", book: "Book", document: "Document", code: "Code", spreadsheet: "Spreadsheet", chart_spec: "Chart spec", infographic: "Infographic", poster: "Poster", audio_brief: "Audio brief", video_brief: "Video brief", quiz: "Quiz" },
  fr: { lesson: "Leçon", book: "Livre", document: "Document", code: "Code", spreadsheet: "Tableur", chart_spec: "Spécification graphique", infographic: "Infographie", poster: "Affiche", audio_brief: "Brief audio", video_brief: "Brief vidéo", quiz: "Quiz" },
  ar: { lesson: "درس", book: "كتاب", document: "وثيقة", code: "كود", spreadsheet: "جدول", chart_spec: "مواصفات الرسم البياني", infographic: "إنفوجرافيك", poster: "ملصق", audio_brief: "موجز صوتي", video_brief: "موجز فيديو", quiz: "اختبار" },
};

export default function CreatorHub() {
  const { language, dir } = useLanguage();
  const { isAuthenticated } = useAuth();
  const text = copy[language];
  const labels = modeLabels[language];
  const utils = trpc.useUtils();
  const [kind, setKind] = useState<CreatorKind>("lesson");
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [activeArtifactId, setActiveArtifactId] = useState<number | null>(null);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectBrief, setProjectBrief] = useState("");
  const [transformSource, setTransformSource] = useState(false);
  const [sourceResourceId, setSourceResourceId] = useState("");

  const { data: artifacts, isLoading: artifactsLoading } = trpc.creator.listMine.useQuery(undefined, { enabled: isAuthenticated });
  const { data: projects } = trpc.creator.listProjects.useQuery(undefined, { enabled: isAuthenticated });
  const { data: teachingResources } = trpc.creator.listTeachingResources.useQuery(undefined, { enabled: isAuthenticated });
  const { data: activeArtifact } = trpc.creator.getArtifact.useQuery({ artifactId: activeArtifactId ?? 0 }, { enabled: !!activeArtifactId });
  const createArtifact = trpc.creator.createArtifact.useMutation({
    onSuccess: artifact => {
      setActiveArtifactId(artifact?.id ?? null);
      setTitle("");
      setBrief("");
      setTransformSource(false);
      setSourceResourceId("");
      utils.creator.listMine.invalidate();
      toast.success(language === "ar" ? "تم إنشاء المورد" : language === "fr" ? "Ressource créée" : "Artifact created");
    },
    onError: error => toast.error(error.message),
  });
  const createProject = trpc.creator.createProject.useMutation({
    onSuccess: () => {
      setProjectTitle("");
      setProjectBrief("");
      utils.creator.listProjects.invalidate();
      toast.success(language === "ar" ? "تمت إضافة المشروع" : language === "fr" ? "Projet ajouté" : "Project added");
    },
    onError: error => toast.error(error.message),
  });
  const exportDocx = trpc.creator.exportDocx.useMutation({
    onSuccess: ({ url }) => {
      utils.creator.getArtifact.invalidate({ artifactId: activeArtifactId ?? 0 });
      window.location.assign(url);
    },
    onError: error => toast.error(error.message),
  });

  useEffect(() => {
    if (!activeArtifactId && artifacts?.[0]) setActiveArtifactId(artifacts[0].id);
  }, [activeArtifactId, artifacts]);

  const imageUrl = useMemo(() => {
    const metadata = activeArtifact?.metadata as { imageUrl?: string } | null;
    return metadata?.imageUrl;
  }, [activeArtifact]);

  if (!isAuthenticated) {
    return <div className="min-h-screen" dir={dir}><Navbar /><main className="pt-32 container max-w-xl text-center"><Sparkles className="w-12 h-12 mx-auto text-primary mb-5" /><h1 className="font-display text-3xl font-bold mb-3">{text.title}</h1><p className="text-muted-foreground mb-7">Please sign in to save your learning creations.</p><Button onClick={() => window.location.href = getLoginUrl()}>{language === "ar" ? "تسجيل الدخول" : language === "fr" ? "Se connecter" : "Sign in"}</Button></main></div>;
  }

  return (
    <div className="min-h-screen" dir={dir}>
      <Navbar />
      <main className="container pt-24 pb-12">
        <section className="mb-8 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 p-7 md:p-10">
          <div className="flex gap-4 items-start"><div className="rounded-2xl bg-primary/15 p-3"><Sparkles className="w-7 h-7 text-primary" /></div><div><p className="text-xs uppercase tracking-[0.18em] text-primary font-semibold mb-2">Prize2Pride Studio</p><h1 className="font-display text-3xl md:text-4xl font-bold">{text.title}</h1><p className="text-muted-foreground mt-3 max-w-3xl">{text.subtitle}</p></div></div>
        </section>

        <div className="grid lg:grid-cols-[390px_1fr] gap-6 items-start">
          <section className="glass-card rounded-2xl p-5 lg:sticky lg:top-24">
            <h2 className="font-display font-semibold text-lg mb-4">{text.create}</h2>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {modes.map(({ id, icon: Icon }) => <button key={id} onClick={() => setKind(id)} className={`rounded-xl border p-2.5 text-xs transition-colors ${kind === id ? "border-primary bg-primary/15 text-primary" : "border-border hover:border-primary/50 text-muted-foreground"}`}><Icon className="w-4 h-4 mx-auto mb-1" />{labels[id]}</button>)}
            </div>
            <label className="text-sm font-medium block mb-2">{text.titleLabel}</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={text.titlePlaceholder} className="mb-4" />
            <label className="text-sm font-medium block mb-2">{text.brief}</label>
            <Textarea value={brief} onChange={e => setBrief(e.target.value)} placeholder={text.briefPlaceholder} className="min-h-32 mb-3" />
            {kind === "book" && <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{text.blueprintNote}</p>}
            {activeArtifact ? <div className="rounded-lg border border-border/60 bg-card/35 p-3 mb-3"><div className="flex items-center justify-between gap-2"><p className="text-xs text-muted-foreground truncate">{language === "ar" ? "حوّل المورد المحدد" : language === "fr" ? "Transformer la ressource sélectionnée" : "Transform selected artifact"}</p><Button size="sm" variant={transformSource ? "default" : "outline"} onClick={() => { setTransformSource(value => !value); setSourceResourceId(""); }}><WandSparkles className="w-3.5 h-3.5 mr-1" />{transformSource ? (language === "ar" ? "مستخدم" : language === "fr" ? "Source active" : "Source active") : (language === "ar" ? "استخدم" : language === "fr" ? "Utiliser" : "Use")}</Button></div>{transformSource ? <p className="text-xs text-primary mt-2">{activeArtifact.title}</p> : null}</div> : null}
            {teachingResources?.length ? <label className="block text-xs text-muted-foreground mb-3">{language === "ar" ? "أو حوّل مورداً تعليمياً" : language === "fr" ? "Ou transformer une ressource pédagogique" : "Or transform a teaching resource"}<select value={sourceResourceId} onChange={event => { setSourceResourceId(event.target.value); setTransformSource(false); }} className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"><option value="">{language === "ar" ? "بدون مورد مصدر" : language === "fr" ? "Aucune ressource source" : "No source resource"}</option>{teachingResources.map(resource => <option key={resource.id} value={resource.id}>{resource.title} · {resource.kind}</option>)}</select></label> : null}
            <Button className="w-full gap-2" disabled={title.trim().length < 3 || brief.trim().length < 12 || createArtifact.isPending} onClick={() => createArtifact.mutate({ kind, title, prompt: brief, language, sourceArtifactId: transformSource && activeArtifactId ? activeArtifactId : undefined, sourceResourceId: sourceResourceId ? Number(sourceResourceId) : undefined })}>{createArtifact.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}{text.generate}</Button>
          </section>

          <section className="space-y-6 min-w-0">
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="border-b border-border px-5 py-4 flex items-center justify-between gap-3"><div><h2 className="font-display font-semibold">{activeArtifact?.title ?? text.library}</h2><p className="text-xs text-muted-foreground mt-1">{activeArtifact ? labels[activeArtifact.kind as CreatorKind] : text.noArtifacts}</p></div><div className="flex items-center gap-2 shrink-0">{activeArtifact && (activeArtifact.kind === "book" || activeArtifact.kind === "document") && <Button size="sm" variant="outline" className="gap-2" disabled={exportDocx.isPending} onClick={() => exportDocx.mutate({ artifactId: activeArtifact.id })}>{exportDocx.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}{language === "ar" ? "DOCX تحميل" : language === "fr" ? "Télécharger DOCX" : "Download DOCX"}</Button>}{activeArtifact && <span className="text-xs rounded-full bg-primary/10 text-primary px-2.5 py-1 capitalize">{activeArtifact.status}</span>}</div></div>
              <div className="p-5 min-h-72">
                {activeArtifact ? <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-display"><Streamdown>{activeArtifact.content ?? ""}</Streamdown>{imageUrl && <img src={imageUrl} alt={activeArtifact.title} className="mt-6 rounded-xl border border-border w-full max-h-[520px] object-contain bg-background" />}{activeArtifact.sections.length > 0 && <div className="not-prose mt-7 pt-5 border-t border-border"><h3 className="font-display font-semibold mb-3">{language === "ar" ? "خطة الأقسام" : language === "fr" ? "Plan des sections" : "Section plan"}</h3><ol className="space-y-2">{activeArtifact.sections.map(section => <li key={section.id} className="rounded-lg bg-card/60 p-3"><p className="font-medium text-sm">{section.sectionOrder}. {section.title}</p><p className="text-xs text-muted-foreground mt-1">{section.content}</p></li>)}</ol></div>}</div> : <div className="h-full flex items-center justify-center text-center text-muted-foreground"><div><Sparkles className="w-8 h-8 mx-auto mb-3 opacity-50" /><p>{artifactsLoading ? "Loading…" : text.noArtifacts}</p></div></div>}
              </div>
            </div>

            <div className="grid md:grid-cols-[1fr_1.2fr] gap-6">
              <div className="glass-card rounded-2xl p-5"><div className="flex items-center justify-between mb-4"><h2 className="font-display font-semibold">{text.library}</h2><span className="text-xs text-muted-foreground">{artifacts?.length ?? 0}</span></div><div className="space-y-2 max-h-56 overflow-y-auto">{artifacts?.map(artifact => <button key={artifact.id} onClick={() => setActiveArtifactId(artifact.id)} className={`w-full text-start rounded-xl border p-3 transition-colors ${activeArtifactId === artifact.id ? "border-primary/50 bg-primary/10" : "border-border/60 hover:bg-card"}`}><p className="text-sm font-medium truncate">{artifact.title}</p><p className="text-xs text-muted-foreground mt-1">{labels[artifact.kind as CreatorKind]} · {artifact.status}</p></button>)}</div></div>
              <div className="glass-card rounded-2xl p-5"><h2 className="font-display font-semibold mb-4">{text.projects}</h2><div className="space-y-2 mb-4 max-h-28 overflow-y-auto">{projects?.length ? projects.map(project => <div key={project.id} className="rounded-xl bg-card/60 p-3"><p className="text-sm font-medium">{project.title}</p><p className="text-xs text-muted-foreground truncate mt-1">{project.brief}</p></div>) : <p className="text-sm text-muted-foreground">{text.noProjects}</p>}</div><div className="flex gap-2"><Input value={projectTitle} onChange={e => setProjectTitle(e.target.value)} placeholder={text.projectTitle} /><Button size="icon" variant="outline" disabled={projectTitle.trim().length < 3 || createProject.isPending} onClick={() => createProject.mutate({ title: projectTitle, brief: projectBrief || projectTitle, language })}><Plus className="w-4 h-4" /></Button></div><Textarea value={projectBrief} onChange={e => setProjectBrief(e.target.value)} placeholder={text.projectBrief} className="min-h-16 mt-2 text-xs" /></div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
