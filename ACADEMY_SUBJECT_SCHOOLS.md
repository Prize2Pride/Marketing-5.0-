# Prize2Pride Academy Subject Schools

## Academic Model

Prize2Pride will operate as a multilingual academy in which each subject is an **independent school**. A learner may move between schools without losing their language, learning-profile, or progress context. Every school uses English, French, and Arabic/Darja titles and learning materials, with language switching available at any point in the learner journey.

| School | Core progression | Applied outcome |
| --- | --- | --- |
| Digital Marketing | Foundations → attention → conversion → loyalty → scale | A measurable, ethical marketing operating plan |
| Artificial Intelligence | AI literacy → prompting → models → agents → governance | A supervised AI workflow or assistant specification |
| Data Science | data literacy → analysis → statistics → modeling → communication | A reproducible analysis and decision memo |
| Robotics | electronics → sensing → control → embedded systems → project integration | A documented prototype and safety checklist |
| 3D Printing | design basics → CAD → slicing → materials → production quality | A print-ready, tested design workflow |
| Mathematics | foundations → algebra → functions → calculus → applied reasoning | A problem-solving portfolio with worked methods |
| Physics | mechanics → energy → waves → electricity → modern physics | An experiment or model with evidence-based conclusions |
| Quantum Computing | quantum foundations → circuits → algorithms → error concepts → applications | A simulator-based quantum-circuit notebook |
| Quantum Physics | mathematical foundations → states → measurement → entanglement → interpretation | A concept map and evidence-based research brief |
| Research Literacy | question design → sources → methods → ethics → communication | A cited research proposal or literature review |

## Common Academic Standards

Each school begins with foundations, then develops conceptual understanding, deliberate practice, project work, and assessment. The Academy will distinguish **established knowledge**, **emerging research**, and **speculative claims**. Quantum and advanced-AI content must use this distinction visibly so learners do not mistake long-term scenarios for present capability.

Every learning unit carries a clear objective, an accessible explanation, a practical task, a knowledge check, and a portfolio artifact. Teacher-authored content is subject to the same review and publication controls as platform-generated material.

## Teacher Subplatform Contract

An authorized educator may create a branded school space within Prize2Pride. A school owns its title, visual identity, subjects, classes, roster, resources, announcements, and teacher-authored lessons. Platform administrators retain safety, moderation, privacy, and quality-review authority.

| Capability | First implementation boundary |
| --- | --- |
| School profile | Branded name, description, language defaults, and public/private visibility |
| Classes and rosters | Teacher-managed class spaces and explicit learner enrollment |
| Learning resources | Structured lessons, external video links, PDFs, and other S3-backed assets |
| Announcements | Teacher-to-class notices with time stamps and visibility controls |
| Virtual lessons | Meeting-link integration boundary; no implied native video-conferencing service |
| Lesson recordings | Recording metadata and S3 object references only; automatic expiry at one year |
| AI assistance | Optional, reviewable drafts; never automatic publication to learners |

## Educator Creation Studio

The Educator Creation Studio starts from a teacher's plain-language lesson brief and creates **editable, reviewable teaching artifacts** connected to the school, class, and lesson context. It complements, rather than replaces, the teacher's subject expertise and authorship.

| Output | Teaching use | Governance requirement |
| --- | --- | --- |
| Structured lesson or course page | Clear teaching sequence, objectives, practice, and assessment | Teacher reviews before learners can see it |
| Document handout | DOCX/PDF-ready worksheet, notes, or study guide | Export includes source metadata and ownership |
| Chart specification | Data story, axes, labels, and accessibility guidance | Values must be teacher-provided or traceable to a cited source |
| Infographic or poster | Visual explanation, classroom display, or campaign asset | Alt text, readable contrast, and factual review required |
| Video lesson brief | Script, storyboard, shot list, voiceover, and caption plan | No claim that a video was recorded or verified unless supplied |
| Music or audio brief | Intro, mnemonic, rhythm, or audio-lesson concept | Rights, consent, and age-appropriate use must be verified before release |
| Quiz and assessment | Formative questions with explanations and teacher answer key | Teacher validates academic accuracy and grading policy |
| Code and spreadsheet activity | Guided exercises, templates, validation rules, and comments | Secure examples only; no secrets or unsafe execution instructions |

All creation-studio assets retain teacher ownership and version history. An asset can remain private, be shared with a class, or be proposed to a school administrator for publication. Generated media remains a draft until the teacher explicitly approves it.

## One-Year Lesson Recording Rule

Lesson recordings must store an immutable `expiresAt` date that is exactly one year after the recording becomes available. Before expiration, teachers can be notified and may create a fresh recording if they still hold the necessary rights. Expired recordings become inaccessible to learners and are queued for storage deletion through an idempotent background lifecycle task. The platform must not claim that it hosts or records a video stream until a compliant recording integration is configured.

## Commercial Integrity

Subscription pages will state features, limits, recording retention, and any verified pricing. They must not advertise an unverified competitor-price guarantee, a free-for-life offer, or any payment claim before the billing rules and legal terms are explicitly configured.
