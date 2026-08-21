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
import { AudioLines, BookOpen, Braces, ChartNoAxesCombined, CheckCircle2, Clapperboard, Download, FileCheck2, FileText, ImageIcon, LayoutTemplate, Loader2, Plus, Printer, Sparkles, Table2, WandSparkles } from "lucide-react";
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

const productionGuides: Record<CreatorKind, string> = {
  lesson: "Include a learning objective, clear sections, one worked example, guided practice, and a knowledge check.",
  book: "Use a reader promise, chapter hierarchy, a practical table of contents, and section-by-section expansion notes.",
  document: "Use a title, executive summary, concise sections, a practical conclusion, and a publication-ready review pass.",
  code: "Use secure, commented examples, setup steps, expected output, and testing guidance without secrets.",
  spreadsheet: "Define tabs, headers, formulas, example rows clearly labelled as examples, and validation rules.",
  chart_spec: "Specify the question, evidence assumptions, chart type, fields, calculations, accessible title, alt text, and interpretation note.",
  infographic: "Use one message, visual hierarchy, short labels, accessibility alt text, and no unsourced numerical claim.",
  poster: "Use a clear headline, supporting message, call to action, hierarchy, contrast, and accessibility alt text.",
  audio_brief: "Plan duration, audience, narration or lyric-safe concept, timing, sound direction, transcript, and rights-safe sourcing.",
  video_brief: "Plan a hook, scene timeline, narration, visual direction, on-screen text, captions, and a final learner action.",
  quiz: "Use learning-aligned questions, answer explanations, difficulty balance, and an actionable improvement note.",
};

function formatForPrint(content: string) {
  const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return content.split(/\r?\n/).map((line) => {
    const safe = escape(line.replace(/\*\*(.*?)\*\*/g, "$1"));
    if (line.startsWith("# ")) return `<h1>${safe.slice(2)}</h1>`;
    if (line.startsWith("## ")) return `<h2>${safe.slice(3)}</h2>`;
    if (line.startsWith("### ")) return `<h3>${safe.slice(4)}</h3>`;
    if (line.startsWith("- ")) return `<p class="bullet">• ${safe.slice(2)}</p>`;
    if (!line.trim()) return "<div class=\"spacer\"></div>";
    return `<p>${safe}</p>`;
  }).join("\n");
}

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
  const [qualityChecks, setQualityChecks] = useState<string[]>([]);
  const [studioStep, setStudioStep] = useState<1 | 2 | 3>(1);

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
      setQualityChecks([]);
      setStudioStep(1);
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
  const production = useMemo(() => {
    const metadata = activeArtifact?.metadata as { production?: { script?: string; timing?: string; transcript?: string; rightsNotes?: string; evidenceChecks?: string; accessibilityNotes?: string; hierarchyNotes?: string } } | null;
    return metadata?.production;
  }, [activeArtifact]);
  const qualityLabels = language === "ar" ? ["هدف وجمهور واضحان", "تدقيق لغوي وإملائي", "تحقق من الوقائع والمصادر", "مراجعة الوصول والحقوق"] : language === "fr" ? ["Objectif et public clairs", "Relecture de la langue et de l'orthographe", "Vérification des faits et sources", "Accessibilité et droits vérifiés"] : ["Objective and audience are clear", "Language and spelling reviewed", "Facts and sources checked", "Accessibility and rights reviewed"];
  const languageTip = language === "ar" ? "راجع اتجاه النص من اليمين إلى اليسار، واختر عربية واضحة أو دارجة تونسية مناسبة لجمهورك، وحافظ على المصطلحات التقنية ثابتة." : language === "fr" ? "Relisez les accords, la ponctuation et les anglicismes. Gardez un ton clair et adaptez les termes techniques au niveau du public." : "Review spelling, plain-language clarity, consistent terminology, and whether any technical term needs a learner-friendly explanation.";
  const productionPrompt = `${brief}\n\nProduction requirements: ${productionGuides[kind]}\nQuality checks selected by the author: ${qualityChecks.length ? qualityChecks.join("; ") : "Complete a professional self-review before publication."}\nDo not claim a file, audio, chart, poster, or video was rendered unless the result actually exists.`;
  const printArtifact = () => {
    if (!activeArtifact?.content) return;
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) return toast.error(language === "ar" ? "اسمح بالنوافذ المنبثقة لطباعة الملف" : language === "fr" ? "Autorisez les fenêtres contextuelles pour imprimer" : "Allow pop-ups to print this artifact");
    printWindow.document.write(`<!doctype html><html lang="${language}" dir="${dir}"><head><title>${activeArtifact.title}</title><style>@page{size:A4;margin:18mm}body{font-family:Georgia,serif;color:#171717;line-height:1.58;max-width:178mm;margin:auto}h1{font-size:25pt;margin:0 0 14pt}h2{font-size:17pt;margin:22pt 0 9pt;border-bottom:1px solid #d4a300;padding-bottom:4pt}h3{font-size:13pt;margin:17pt 0 7pt}p{font-size:11pt;margin:0 0 9pt}.bullet{margin-left:12pt}.spacer{height:6pt}</style></head><body>${formatForPrint(activeArtifact.content)}<hr><p style="font-size:9pt;color:#666">Prepared in Prize2Pride Studio — review before publication.</p><script>window.onload=()=>window.print()<\/script></body></html>`);
    printWindow.document.close();
  };

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
            <div className="grid grid-cols-3 gap-1 mb-5 text-[10px]">{[[1, language === "ar" ? "التنسيق" : language === "fr" ? "Format" : "Format"], [2, language === "ar" ? "المصدر" : language === "fr" ? "Source" : "Source"], [3, language === "ar" ? "المراجعة" : language === "fr" ? "Révision" : "Review"]].map(([step, label]) => <button key={step} onClick={() => setStudioStep(step as 1 | 2 | 3)} className={`rounded-lg border py-2 ${studioStep === step ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"}`}>{step}. {label}</button>)}</div>
            {studioStep === 1 && <><p className="text-xs text-muted-foreground mb-3">{language === "ar" ? "اختر الشكل الذي تريد تحويل الدرس إليه." : language === "fr" ? "Choisissez le format dans lequel transformer la leçon." : "Choose the output format for the lesson."}</p><div className="grid grid-cols-3 gap-2 mb-5">{modes.map(({ id, icon: Icon }) => <button key={id} onClick={() => setKind(id)} className={`rounded-xl border p-2.5 text-xs transition-colors ${kind === id ? "border-primary bg-primary/15 text-primary" : "border-border hover:border-primary/50 text-muted-foreground"}`}><Icon className="w-4 h-4 mx-auto mb-1" />{labels[id]}</button>)}</div><div className="rounded-xl border border-primary/20 bg-primary/5 p-3 mb-4"><p className="text-xs text-muted-foreground leading-relaxed">{productionGuides[kind]}</p></div><Button className="w-full" onClick={() => setStudioStep(2)}>{language === "ar" ? "التالي: اختر المصدر" : language === "fr" ? "Suivant : choisir la source" : "Next: choose source"}</Button></>}
            {studioStep === 2 && <><p className="text-xs text-muted-foreground mb-3">{language === "ar" ? "يمكنك البدء من درس جديد أو تحويل مورد قائم." : language === "fr" ? "Partez d'un nouveau brief ou transformez une ressource existante." : "Start from a new brief or transform an existing resource."}</p>{activeArtifact ? <div className="rounded-lg border border-border/60 bg-card/35 p-3 mb-3"><div className="flex items-center justify-between gap-2"><p className="text-xs text-muted-foreground truncate">{language === "ar" ? "تحويل المورد المحدد" : language === "fr" ? "Transformer la ressource sélectionnée" : "Transform selected artifact"}</p><Button size="sm" variant={transformSource ? "default" : "outline"} onClick={() => { setTransformSource(value => !value); setSourceResourceId(""); }}><WandSparkles className="w-3.5 h-3.5 mr-1" />{transformSource ? "Active" : language === "fr" ? "Utiliser" : language === "ar" ? "استخدم" : "Use"}</Button></div>{transformSource ? <p className="text-xs text-primary mt-2">{activeArtifact.title}</p> : null}</div> : null}{teachingResources?.length ? <label className="block text-xs text-muted-foreground mb-4">{language === "ar" ? "أو مورد منشور" : language === "fr" ? "Ou une ressource publiée" : "Or a published teaching resource"}<select value={sourceResourceId} onChange={event => { setSourceResourceId(event.target.value); setTransformSource(false); }} className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"><option value="">{language === "ar" ? "بدون مورد مصدر" : language === "fr" ? "Aucune ressource source" : "No source resource"}</option>{teachingResources.map(resource => <option key={resource.id} value={resource.id}>{resource.title} · {resource.kind}</option>)}</select></label> : null}<div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={() => setStudioStep(1)}>{language === "ar" ? "رجوع" : language === "fr" ? "Retour" : "Back"}</Button><Button className="flex-1" onClick={() => setStudioStep(3)}>{language === "ar" ? "التالي: راجع" : language === "fr" ? "Suivant : réviser" : "Next: review"}</Button></div></>}
            {studioStep === 3 && <><label className="text-sm font-medium block mb-2">{text.titleLabel}</label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder={text.titlePlaceholder} className="mb-4" /><label className="text-sm font-medium block mb-2">{text.brief}</label><Textarea value={brief} onChange={e => setBrief(e.target.value)} placeholder={text.briefPlaceholder} className="min-h-28 mb-3" />{kind === "book" && <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{text.blueprintNote}</p>}<div className="rounded-xl border border-border/60 p-3 mb-3"><p className="text-xs font-medium mb-2">{language === "ar" ? "فحص الجودة قبل الإنشاء" : language === "fr" ? "Contrôle qualité avant création" : "Quality check before creation"}</p><div className="grid grid-cols-1 gap-1.5">{qualityLabels.map(item => <label key={item} className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer"><input type="checkbox" checked={qualityChecks.includes(item)} onChange={() => setQualityChecks(current => current.includes(item) ? current.filter(value => value !== item) : [...current, item])} className="accent-primary" /><CheckCircle2 className="w-3.5 h-3.5 text-primary/70" />{item}</label>)}</div><p className="text-[11px] text-muted-foreground leading-relaxed mt-3 pt-3 border-t border-border/50">{languageTip}</p></div><div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={() => setStudioStep(2)}>{language === "ar" ? "رجوع" : language === "fr" ? "Retour" : "Back"}</Button><Button className="flex-[1.4] gap-2" disabled={title.trim().length < 3 || brief.trim().length < 12 || createArtifact.isPending} onClick={() => createArtifact.mutate({ kind, title, prompt: productionPrompt, language, sourceArtifactId: transformSource && activeArtifactId ? activeArtifactId : undefined, sourceResourceId: sourceResourceId ? Number(sourceResourceId) : undefined })}>{createArtifact.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}{text.generate}</Button></div></>}
          </section>

          <section className="space-y-6 min-w-0">
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="border-b border-border px-5 py-4 flex items-center justify-between gap-3">
                <div><h2 className="font-display font-semibold">{activeArtifact?.title ?? text.library}</h2><p className="text-xs text-muted-foreground mt-1">{activeArtifact ? labels[activeArtifact.kind as CreatorKind] : text.noArtifacts}</p></div>
                <div className="flex items-center gap-2 shrink-0">
                  {activeArtifact && (activeArtifact.kind === "book" || activeArtifact.kind === "document" || activeArtifact.kind === "lesson") ? (
                    <>
                      <Button size="sm" variant="outline" className="gap-2" onClick={printArtifact}><Printer className="w-4 h-4" />{language === "ar" ? "اطبع / احفظ PDF" : language === "fr" ? "Imprimer / enregistrer PDF" : "Print / Save PDF"}</Button>
                      <Button size="sm" variant="outline" className="gap-2" disabled={exportDocx.isPending} onClick={() => exportDocx.mutate({ artifactId: activeArtifact.id })}>{exportDocx.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}{language === "ar" ? "DOCX تحميل" : language === "fr" ? "Télécharger DOCX" : "Download DOCX"}</Button>
                    </>
                  ) : null}
                  {activeArtifact && <span className="text-xs rounded-full bg-primary/10 text-primary px-2.5 py-1 capitalize">{activeArtifact.status}</span>}
                </div>
              </div>
              <div className="p-5 min-h-72">
                {activeArtifact ? <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-display"><Streamdown>{activeArtifact.content ?? ""}</Streamdown>{imageUrl && <img src={imageUrl} alt={activeArtifact.title} className="mt-6 rounded-xl border border-border w-full max-h-[520px] object-contain bg-background" />}{production && activeArtifact.kind === "audio_brief" && <div className="not-prose mt-6 rounded-xl border border-primary/25 bg-primary/5 p-4"><h3 className="font-display font-semibold">{language === "ar" ? "خطة إنتاج الصوت / الموسيقى" : language === "fr" ? "Plan de production audio / musicale" : "Audio / music production plan"}</h3><div className="grid md:grid-cols-2 gap-3 mt-3 text-sm"><p><strong>{language === "ar" ? "السكريبت:" : language === "fr" ? "Script :" : "Script:"}</strong> {production.script}</p><p><strong>{language === "ar" ? "التوقيت:" : language === "fr" ? "Timing :" : "Timing:"}</strong> {production.timing}</p><p><strong>{language === "ar" ? "النص المكتوب:" : language === "fr" ? "Transcription :" : "Transcript:"}</strong> {production.transcript}</p><p><strong>{language === "ar" ? "الحقوق:" : language === "fr" ? "Droits :" : "Rights:"}</strong> {production.rightsNotes}</p></div></div>}{production && (activeArtifact.kind === "chart_spec" || activeArtifact.kind === "infographic" || activeArtifact.kind === "poster") && <div className="not-prose mt-6 rounded-xl border border-primary/25 bg-primary/5 p-4"><h3 className="font-display font-semibold">{language === "ar" ? "مراجعة الإنتاج البصري" : language === "fr" ? "Revue de production visuelle" : "Visual production review"}</h3><div className="grid md:grid-cols-3 gap-3 mt-3 text-sm"><p><strong>{language === "ar" ? "الأدلة:" : language === "fr" ? "Éléments factuels :" : "Evidence:"}</strong> {production.evidenceChecks}</p><p><strong>{language === "ar" ? "الوصول:" : language === "fr" ? "Accessibilité :" : "Accessibility:"}</strong> {production.accessibilityNotes}</p><p><strong>{language === "ar" ? "التسلسل البصري:" : language === "fr" ? "Hiérarchie :" : "Hierarchy:"}</strong> {production.hierarchyNotes}</p></div></div>}{activeArtifact.sections.length > 0 && <div className="not-prose mt-7 pt-5 border-t border-border"><h3 className="font-display font-semibold mb-3">{language === "ar" ? "خطة الأقسام" : language === "fr" ? "Plan des sections" : "Section plan"}</h3><ol className="space-y-2">{activeArtifact.sections.map(section => <li key={section.id} className="rounded-lg bg-card/60 p-3"><p className="font-medium text-sm">{section.sectionOrder}. {section.title}</p><p className="text-xs text-muted-foreground mt-1">{section.content}</p></li>)}</ol></div>}</div> : <div className="h-full flex items-center justify-center text-center text-muted-foreground"><div><Sparkles className="w-8 h-8 mx-auto mb-3 opacity-50" /><p>{artifactsLoading ? "Loading…" : text.noArtifacts}</p></div></div>}
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
