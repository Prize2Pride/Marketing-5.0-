import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { chapters, levels, modules } from "../drizzle/schema.ts";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to seed the expanded curriculum.");
}

const db = drizzle(process.env.DATABASE_URL);

const curriculum = [
  {
    order: 11, slug: "level-11-ecommerce-optimization", tier: "advanced", icon: "ShoppingBag", color: "emerald",
    titleEn: "E-commerce Launch & Optimization", titleFr: "Lancement et optimisation e-commerce", titleAr: "إطلاق وتحسين التجارة الإلكترونية",
    descriptionEn: "Build a modern, measurable online store with ethical AI-assisted research and conversion practice.",
    descriptionFr: "Construisez une boutique en ligne moderne et mesurable avec recherche assistée par IA et optimisation de conversion.",
    descriptionAr: "ابني متجر إلكتروني عصري وقابل للقياس مع بحث بالذكاء الاصطناعي وتحسين التحويل.",
    modules: [
      ["modern-ecommerce-platforms", "Modern E-commerce Platforms", "Plateformes e-commerce modernes", "منصات التجارة الإلكترونية الحديثة", "Compare Shopify, WooCommerce, marketplaces, and headless options against a real operating model.", "Comparez Shopify, WooCommerce, les marketplaces et le headless selon un modèle opérationnel réel.", "قارن Shopify وWooCommerce والمنصات والـ headless حسب نموذج عمل حقيقي."],
      ["ai-product-research", "Product Research & Niche Selection with AI", "Recherche produit et choix de niche avec l'IA", "بحث المنتجات واختيار النيتش بالذكاء الاصطناعي", "Validate customer problems, supply constraints, demand signals, and positioning before choosing a product.", "Validez les problèmes clients, contraintes d'approvisionnement, signaux de demande et positionnement avant de choisir un produit.", "تحقق من مشاكل الحرفاء والعرض والطلب والتموقع قبل اختيار المنتج."],
      ["ecommerce-cro", "E-commerce Conversion Rate Optimization", "Optimisation du taux de conversion e-commerce", "تحسين معدل التحويل للتجارة الإلكترونية", "Improve product pages and checkout journeys through accountable experiments, not guesswork.", "Améliorez les pages produit et le tunnel de paiement avec des expérimentations mesurables, pas des suppositions.", "حسّن صفحات المنتجات والـ checkout بتجارب قابلة للقياس، موش بالتخمين."],
    ],
  },
  {
    order: 12, slug: "level-12-social-commerce", tier: "advanced", icon: "Radio", color: "pink",
    titleEn: "Social Commerce & Live Selling", titleFr: "Social commerce et vente en direct", titleAr: "التجارة الاجتماعية والبيع المباشر",
    descriptionEn: "Turn social attention into trust and accountable commerce journeys across short-form and live formats.",
    descriptionFr: "Transformez l'attention sociale en confiance et en parcours d'achat mesurables sur les formats courts et live.",
    descriptionAr: "حوّل الانتباه في السوشيال إلى ثقة ومسار شراء قابل للقياس في الفيديو القصير والـ live.",
    modules: [
      ["tiktok-instagram-commerce", "TikTok & Instagram Commerce", "Commerce TikTok et Instagram", "تجارة TikTok وInstagram", "Design content-to-cart journeys that respect platform rules and customer expectations.", "Concevez des parcours contenu-vers-panier qui respectent les règles des plateformes et les attentes clients.", "صمّم مسار من المحتوى للسلة يحترم قوانين المنصات وتوقعات الحريف."],
      ["live-shopping-influencer", "Live Shopping & Influencer Partnerships", "Live shopping et partenariats influenceurs", "البيع المباشر وشراكات المؤثرين", "Plan authentic live-selling sessions and evaluate creator partnerships with transparent metrics.", "Planifiez des lives authentiques et évaluez les partenariats créateurs avec des métriques transparentes.", "خطط للـ live selling بصدق وقيّم شراكات المؤثرين بمؤشرات واضحة."],
      ["social-commerce-automation", "Social Commerce Automation", "Automatisation du social commerce", "أتمتة التجارة الاجتماعية", "Automate routing, response standards, and reporting while keeping meaningful human oversight.", "Automatisez le routage, les réponses et le reporting tout en gardant une supervision humaine utile.", "أتمت الردود والتوجيه والتقارير مع بقاء مراقبة بشرية مفيدة."],
    ],
  },
  {
    order: 13, slug: "level-13-global-commerce-logistics", tier: "advanced", icon: "Globe2", color: "blue",
    titleEn: "Global E-commerce & Logistics", titleFr: "E-commerce mondial et logistique", titleAr: "التجارة الإلكترونية العالمية واللوجستية",
    descriptionEn: "Prepare cross-border expansion with localization, fulfillment, payments, and risk controls.",
    descriptionFr: "Préparez une expansion internationale avec localisation, logistique, paiements et contrôles de risque.",
    descriptionAr: "حضّر للتوسع العالمي مع التوطين واللوجستية والدفع وإدارة المخاطر.",
    modules: [
      ["international-ecommerce", "International E-commerce Strategy", "Stratégie e-commerce internationale", "استراتيجية التجارة الإلكترونية الدولية", "Map markets, localization needs, operating constraints, and cross-border customer promises.", "Cartographiez les marchés, besoins de localisation, contraintes opérationnelles et promesses client internationales.", "حلّل الأسواق والتوطين والقيود التشغيلية ووعود الحريف عبر الحدود."],
      ["fulfillment-automation", "Supply Chain & Fulfillment Automation", "Automatisation de la chaîne logistique", "أتمتة سلسلة التوريد والتنفيذ", "Use demand, inventory, and service-level signals to improve fulfillment without over-automating exceptions.", "Utilisez les signaux de demande, stock et niveau de service pour améliorer l'exécution sans sur-automatiser les exceptions.", "استعمل إشارات الطلب والمخزون والخدمة لتحسين التنفيذ من غير أتمتة عمياء للاستثناءات."],
      ["payments-fraud", "Payments & Fraud Prevention", "Paiements et prévention de la fraude", "الدفع ومنع الاحتيال", "Design secure payment paths, informed consent, and fraud controls for a scalable store.", "Concevez des parcours de paiement sûrs, un consentement éclairé et des contrôles anti-fraude évolutifs.", "صمّم مسارات دفع آمنة وموافقة واضحة وضوابط ضد الاحتيال قابلة للتوسع."],
    ],
  },
  {
    order: 14, slug: "level-14-autonomous-commerce-systems", tier: "expert", icon: "Bot", color: "violet",
    titleEn: "Autonomous E-commerce Systems", titleFr: "Systèmes e-commerce autonomes", titleAr: "أنظمة التجارة الإلكترونية الذاتية",
    descriptionEn: "Design supervised, measurable automation for store operations, pricing, inventory, and customer experience.",
    descriptionFr: "Concevez une automatisation supervisée et mesurable pour les opérations, prix, stock et expérience client.",
    descriptionAr: "صمّم أتمتة مراقبة وقابلة للقياس للعمليات والأسعار والمخزون وتجربة الحريف.",
    modules: [
      ["autonomous-commerce-intro", "Introduction to Autonomous E-commerce", "Introduction à l'e-commerce autonome", "مدخل للتجارة الإلكترونية الذاتية", "Identify what should be automated, what needs review, and how to define safe escalation paths.", "Identifiez ce qui doit être automatisé, ce qui nécessite une revue et les chemins d'escalade sûrs.", "حدّد شنوّة يتأتمت وشنوّة يلزمو مراجعة وكيفاش تعمل مسارات تصعيد آمنة."],
      ["inventory-pricing-ai", "AI Inventory & Pricing Optimization", "Optimisation IA des stocks et prix", "تحسين المخزون والأسعار بالذكاء الاصطناعي", "Use forecasts and guardrails to support inventory and pricing decisions without deceptive tactics.", "Utilisez prévisions et garde-fous pour aider les décisions de stock et prix sans pratiques trompeuses.", "استعمل التوقعات والضوابط لمساعدة قرارات المخزون والسعر من غير ممارسات مضللة."],
      ["autonomous-cx", "Automated Customer Service & Personalization", "Service client automatisé et personnalisation", "خدمة الحرفاء المؤتمتة والتخصيص", "Create helpful service automation with disclosure, handoff rules, and quality monitoring.", "Créez une automatisation utile avec transparence, règles de transfert et suivi de qualité.", "اعمل أتمتة خدمة نافعة مع شفافية وقواعد تحويل ومتابعة جودة."],
    ],
  },
  {
    order: 15, slug: "level-15-marketplaces-scale", tier: "expert", icon: "Store", color: "amber",
    titleEn: "Mega-Scale E-commerce & Marketplaces", titleFr: "E-commerce à grande échelle et marketplaces", titleAr: "التجارة الإلكترونية الضخمة والأسواق الرقمية",
    descriptionEn: "Operate responsibly across marketplaces and multi-vendor ecosystems while planning for global scale.",
    descriptionFr: "Opérez de manière responsable sur les marketplaces et écosystèmes multi-vendeurs en préparant une croissance mondiale.",
    descriptionAr: "شغّل عملك بمسؤولية في المنصات والأسواق متعددة البائعين مع التحضير للتوسع العالمي.",
    modules: [
      ["amazon-alibaba-playbooks", "Amazon & Alibaba Marketplace Playbooks", "Méthodes marketplaces Amazon et Alibaba", "خطط عمل Amazon وAlibaba", "Understand marketplace economics, compliance, discovery, fulfillment, and brand protection.", "Comprenez l'économie des marketplaces, conformité, découverte, logistique et protection de marque.", "افهم اقتصاد المنصات والقوانين والظهور والتنفيذ وحماية البراند."],
      ["multi-vendor-ecosystems", "Multi-vendor Platforms & Ecosystems", "Plateformes et écosystèmes multi-vendeurs", "منصات وأنظمة متعددة البائعين", "Design governance, incentives, quality rules, and data boundaries for multi-vendor commerce.", "Concevez gouvernance, incitations, règles qualité et frontières de données pour le commerce multi-vendeurs.", "صمّم الحوكمة والحوافز وقواعد الجودة وحدود البيانات لمنصة متعددة البائعين."],
      ["ai-commerce-scale", "Scaling E-commerce with AI & Automation", "Faire évoluer l'e-commerce avec IA et automatisation", "توسيع التجارة الإلكترونية بالذكاء الاصطناعي", "Build an operating system for repeatable growth, observability, and human accountability.", "Construisez un système opérationnel pour croissance répétable, observabilité et responsabilité humaine.", "ابنِ نظام تشغيل لنمو متكرر ومراقبة ومسؤولية بشرية."],
    ],
  },
  {
    order: 16, slug: "level-16-ai-marketing-foundations", tier: "expert", icon: "Brain", color: "cyan",
    titleEn: "AI Foundations for Marketers", titleFr: "Fondements de l'IA pour les marketeurs", titleAr: "أساسيات الذكاء الاصطناعي للمسوقين",
    descriptionEn: "Understand AI concepts, responsible use, and data literacy before applying models to marketing decisions.",
    descriptionFr: "Comprenez les concepts d'IA, l'usage responsable et la culture data avant d'appliquer des modèles au marketing.",
    descriptionAr: "افهم مفاهيم الذكاء الاصطناعي والاستعمال المسؤول وثقافة البيانات قبل تطبيق النماذج في التسويق.",
    modules: [
      ["ai-ml-deep-learning", "AI, ML & Deep Learning Explained", "IA, ML et deep learning expliqués", "شرح الذكاء الاصطناعي والتعلّم الآلي والعميق", "Build a practical vocabulary for evaluating AI capabilities, limitations, and marketing fit.", "Construisez un vocabulaire pratique pour évaluer capacités, limites et pertinence marketing de l'IA.", "ابنِ مفردات عملية لتقييم قدرات وحدود وملاءمة الذكاء الاصطناعي للتسويق."],
      ["ethical-ai-marketing", "Ethical AI in Marketing", "IA éthique en marketing", "الذكاء الاصطناعي الأخلاقي في التسويق", "Address privacy, bias, transparency, consent, and accountable oversight in marketing systems.", "Traitez confidentialité, biais, transparence, consentement et supervision responsable dans les systèmes marketing.", "عالج الخصوصية والتحيّز والشفافية والموافقة والمراقبة المسؤولة في أنظمة التسويق."],
      ["marketing-data-science", "Data Science for Marketing Decisions", "Data science pour les décisions marketing", "علم البيانات لقرارات التسويق", "Interpret data and model outputs as decision support rather than false certainty.", "Interprétez les données et sorties de modèles comme aide à la décision, pas comme certitude absolue.", "فسّر البيانات ومخرجات النماذج كمساعدة للقرار، موش كيقين مطلق."],
    ],
  },
  {
    order: 17, slug: "level-17-agi-marketing-intelligence", tier: "master", icon: "CircuitBoard", color: "indigo",
    titleEn: "AGI Principles & Marketing Intelligence", titleFr: "Principes d'AGI et intelligence marketing", titleAr: "مبادئ AGI وذكاء التسويق",
    descriptionEn: "Explore advanced AI scenarios critically, separating present capabilities from speculative claims.",
    descriptionFr: "Explorez les scénarios d'IA avancée avec esprit critique en séparant capacités actuelles et hypothèses spéculatives.",
    descriptionAr: "استكشف سيناريوهات الذكاء المتقدم بنقد وفصل بين القدرات الحالية والادعاءات المستقبلية.",
    modules: [
      ["agi-introduction", "Introduction to Artificial General Intelligence", "Introduction à l'intelligence artificielle générale", "مقدمة للذكاء الاصطناعي العام", "Examine AGI concepts, uncertainty, safety questions, and their potential business implications.", "Examinez les concepts d'AGI, l'incertitude, la sécurité et les implications business possibles.", "افحص مفاهيم AGI وعدم اليقين والسلامة والتأثيرات المحتملة على الأعمال."],
      ["agi-market-foresight", "AGI-Powered Market Research & Foresight", "Recherche marché et prospective assistées par AGI", "بحث السوق والاستشراف بمساعدة AGI", "Use structured scenario planning and source evaluation instead of treating forecasts as facts.", "Utilisez une planification par scénarios et l'évaluation des sources au lieu de traiter les prévisions comme des faits.", "استعمل تخطيط السيناريوهات وتقييم المصادر بدل اعتبار التوقعات حقائق."],
      ["autonomous-strategy", "Autonomous Marketing Strategy Generation", "Génération autonome de stratégie marketing", "توليد استراتيجية تسويق ذاتية", "Design AI-assisted strategy loops with objectives, constraints, review gates, and measurable outcomes.", "Concevez des boucles stratégiques assistées par IA avec objectifs, contraintes, revues et résultats mesurables.", "صمّم دورات استراتيجية بمساعدة الذكاء الاصطناعي فيها أهداف وقيود ومراجعات ونتائج قابلة للقياس."],
    ],
  },
  {
    order: 18, slug: "level-18-asi-quantum-commerce", tier: "master", icon: "Atom", color: "fuchsia",
    titleEn: "ASI Preparation & Quantum Commerce", titleFr: "Préparation à l'ASI et commerce quantique", titleAr: "التحضير لـ ASI والتجارة الكمية",
    descriptionEn: "Assess long-horizon technology narratives with ethical and strategic discipline.",
    descriptionFr: "Évaluez les récits technologiques de long terme avec discipline éthique et stratégique.",
    descriptionAr: "قيّم سرديات التكنولوجيا بعيدة المدى بانضباط أخلاقي واستراتيجي.",
    modules: [
      ["asi-introduction", "Introduction to Artificial Superintelligence", "Introduction à la superintelligence artificielle", "مقدمة للذكاء الاصطناعي الفائق", "Understand ASI as a theoretical topic, including uncertainty, governance, and long-term planning limits.", "Comprenez l'ASI comme sujet théorique avec incertitude, gouvernance et limites de planification.", "افهم ASI كموضوع نظري فيه عدم يقين وحوكمة وحدود للتخطيط الطويل."],
      ["quantum-marketing", "Quantum Computing & Marketing", "Informatique quantique et marketing", "الحوسبة الكمية والتسويق", "Evaluate possible quantum applications without confusing emerging research with deployed marketing practice.", "Évaluez les applications quantiques possibles sans confondre recherche émergente et pratique marketing déployée.", "قيّم التطبيقات الكمية الممكنة من غير خلط البحث الجديد بالممارسة التسويقية المطبقة."],
      ["asi-ethics-strategy", "Preparing for the ASI Era", "Se préparer à l'ère de l'ASI", "التحضير لعصر ASI", "Build resilient strategy principles around human rights, oversight, and organizational adaptability.", "Construisez des principes résilients autour des droits humains, de la supervision et de l'adaptabilité.", "ابنِ مبادئ استراتيجية مرنة حول حقوق الإنسان والمراقبة وقابلية التكيّف."],
    ],
  },
  {
    order: 19, slug: "level-19-hybrid-intelligence", tier: "master", icon: "UsersRound", color: "orange",
    titleEn: "Human-AI Collaboration & Hybrid Intelligence", titleFr: "Collaboration humain-IA et intelligence hybride", titleAr: "تعاون الإنسان والذكاء الاصطناعي",
    descriptionEn: "Build teams where AI amplifies human judgment, creativity, and accountability.",
    descriptionFr: "Construisez des équipes où l'IA amplifie jugement humain, créativité et responsabilité.",
    descriptionAr: "ابنِ فرق يكون فيها الذكاء الاصطناعي معزّز للحكم والإبداع والمسؤولية البشرية.",
    modules: [
      ["human-ai-teams", "Optimizing Human-AI Teams", "Optimiser les équipes humain-IA", "تحسين فرق الإنسان والذكاء الاصطناعي", "Assign roles, verification practices, and escalation rights for high-performing hybrid teams.", "Attribuez rôles, pratiques de vérification et droits d'escalade pour des équipes hybrides performantes.", "وزّع الأدوار وممارسات التحقق وحقوق التصعيد لفرق هجينة عالية الأداء."],
      ["augmented-creativity", "Augmented Creativity & Innovation", "Créativité augmentée et innovation", "الإبداع والابتكار المعزّز", "Use AI to broaden options while preserving authorship, originality, and informed editing.", "Utilisez l'IA pour élargir les options tout en préservant paternité, originalité et édition éclairée.", "استعمل الذكاء الاصطناعي لتوسيع الخيارات مع الحفاظ على التأليف والأصالة والتحرير الواعي."],
      ["future-marketing-work", "The Future of Marketing Work", "Le futur du travail marketing", "مستقبل عمل التسويق", "Plan skills, governance, and career resilience for changing marketing roles.", "Planifiez compétences, gouvernance et résilience professionnelle pour l'évolution des rôles marketing.", "خطط للمهارات والحوكمة والمرونة المهنية مع تغيّر أدوار التسويق."],
    ],
  },
  {
    order: 20, slug: "level-20-autonomous-commerce-giant", tier: "autonomous", icon: "Crown", color: "gold",
    titleEn: "The Autonomous Commerce Giant", titleFr: "Le géant du commerce autonome", titleAr: "عملاق التجارة الذاتية",
    descriptionEn: "Integrate strategy, systems, governance, and human accountability for resilient autonomous commerce.",
    descriptionFr: "Intégrez stratégie, systèmes, gouvernance et responsabilité humaine pour un commerce autonome résilient.",
    descriptionAr: "ادمج الاستراتيجية والأنظمة والحوكمة والمسؤولية البشرية لتجارة ذاتية مرنة.",
    modules: [
      ["autonomous-business-ecosystems", "Autonomous Business Ecosystems", "Écosystèmes business autonomes", "أنظمة أعمال ذاتية", "Architect a responsible operating model across data, agents, processes, controls, and people.", "Architecturez un modèle opérationnel responsable entre données, agents, processus, contrôles et équipes.", "صمّم نموذج تشغيل مسؤول بين البيانات والوكلاء والعمليات والضوابط والناس."],
      ["global-market-leadership", "AI-Powered Global Market Leadership", "Leadership mondial assisté par IA", "الريادة العالمية بالذكاء الاصطناعي", "Develop market leadership through differentiated value, learning loops, and responsible expansion.", "Développez un leadership marché via valeur différenciée, boucles d'apprentissage et expansion responsable.", "طوّر ريادة السوق بالقيمة المميزة ودورات التعلم والتوسع المسؤول."],
      ["marketing-ai-capstone", "Marketing AI Capstone", "Projet final Marketing IA", "مشروع تخرج تسويق بالذكاء الاصطناعي", "Synthesize an autonomous-commerce blueprint with measurable goals, risks, safeguards, and next actions.", "Synthétisez un plan de commerce autonome avec objectifs mesurables, risques, garde-fous et prochaines actions.", "لخّص مخطط تجارة ذاتية بأهداف قابلة للقياس ومخاطر وضوابط وخطوات قادمة."],
    ],
  },
];

function moduleOrientation(module) {
  return {
    titleEn: `${module.titleEn}: Orientation`,
    titleFr: `${module.titleFr} : orientation`,
    titleAr: `${module.titleAr}: توجيه`,
    contentEn: `# ${module.titleEn}\n\n## Why this matters\n${module.descriptionEn}\n\n## Practice\nChoose one business context, write a measurable objective, and identify one decision that must remain under human review.\n\n## Evidence of learning\nCreate a one-page operating note that states the audience, action, metric, risk, and next experiment.`,
    contentFr: `# ${module.titleFr}\n\n## Pourquoi c'est important\n${module.descriptionFr}\n\n## Mise en pratique\nChoisissez un contexte business, formulez un objectif mesurable et identifiez une décision qui doit rester sous revue humaine.\n\n## Preuve d'apprentissage\nCréez une note opérationnelle d'une page avec audience, action, métrique, risque et prochaine expérimentation.`,
    contentAr: `# ${module.titleAr}\n\n## علاش مهم\n${module.descriptionAr}\n\n## تطبيق\nاختار سياق عمل، اكتب هدف قابل للقياس، وحدد قرار لازم يبقى تحت مراجعة بشرية.\n\n## دليل التعلّم\nاعمل ورقة تشغيل فيها الجمهور، الإجراء، المؤشر، المخاطرة، والتجربة الجاية.`,
  };
}

for (const level of curriculum) {
  await db.insert(levels).values({
    slug: level.slug, order: level.order, titleEn: level.titleEn, titleFr: level.titleFr, titleAr: level.titleAr,
    descriptionEn: level.descriptionEn, descriptionFr: level.descriptionFr, descriptionAr: level.descriptionAr,
    tier: level.tier, icon: level.icon, color: level.color, isPublished: true,
  }).onDuplicateKeyUpdate({
    set: { order: level.order, titleEn: level.titleEn, titleFr: level.titleFr, titleAr: level.titleAr, descriptionEn: level.descriptionEn, descriptionFr: level.descriptionFr, descriptionAr: level.descriptionAr, tier: level.tier, icon: level.icon, color: level.color, isPublished: true },
  });
  const [storedLevel] = await db.select({ id: levels.id }).from(levels).where(eq(levels.slug, level.slug)).limit(1);
  if (!storedLevel) throw new Error(`Level ${level.slug} was not created.`);

  for (const [slug, titleEn, titleFr, titleAr, descriptionEn, descriptionFr, descriptionAr] of level.modules) {
    const module = { slug, titleEn, titleFr, titleAr, descriptionEn, descriptionFr, descriptionAr };
    const order = level.modules.findIndex(([candidate]) => candidate === slug) + 1;
    await db.insert(modules).values({ levelId: storedLevel.id, slug, order, titleEn, titleFr, titleAr, descriptionEn, descriptionFr, descriptionAr, isPublished: true })
      .onDuplicateKeyUpdate({ set: { levelId: storedLevel.id, order, titleEn, titleFr, titleAr, descriptionEn, descriptionFr, descriptionAr, isPublished: true } });
    const [storedModule] = await db.select({ id: modules.id }).from(modules).where(eq(modules.slug, slug)).limit(1);
    if (!storedModule) throw new Error(`Module ${slug} was not created.`);

    const orientation = moduleOrientation(module);
    const chapterSlug = `${slug}-orientation`;
    await db.insert(chapters).values({
      moduleId: storedModule.id, slug: chapterSlug, order: 1,
      titleEn: orientation.titleEn, titleFr: orientation.titleFr, titleAr: orientation.titleAr,
      contentEn: orientation.contentEn, contentFr: orientation.contentFr, contentAr: orientation.contentAr,
      type: "text", estimatedMinutes: 15, isPublished: true,
    }).onDuplicateKeyUpdate({
      set: { moduleId: storedModule.id, order: 1, titleEn: orientation.titleEn, titleFr: orientation.titleFr, titleAr: orientation.titleAr, contentEn: orientation.contentEn, contentFr: orientation.contentFr, contentAr: orientation.contentAr, type: "text", estimatedMinutes: 15, isPublished: true },
    });
  }
}

console.log(`Seeded ${curriculum.length} levels, ${curriculum.reduce((total, level) => total + level.modules.length, 0)} modules, and initial trilingual orientation chapters.`);
