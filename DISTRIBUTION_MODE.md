# Prize2Pride Production Distribution Mode

Prize2Pride runs as a **production-distributed learning platform** rather than a one-time static course release. Every saved checkpoint publishes the production application, and its source is mirrored to the selected GitHub repository. The live deployment is designed for ongoing content expansion without bypassing learner safety, teacher ownership, or editorial review.

| Layer | Distribution behavior | Safeguard |
| --- | --- | --- |
| Application releases | Checkpoint-driven production publication | TypeScript, test-suite, build, and visual verification are completed before a feature release. |
| Source distribution | GitHub mirror on `Prize2Pride/Marketing-5.0-` | Repository receives clean source changes; runtime credentials are never committed. |
| Lesson intake | Creator Studio artifacts and Course Builder lesson drafts become reviewable records | New material remains `ready` or `approved` until an administrator reviews and ingests it. |
| Course publication | Approved artifacts are added to a selected module as a draft or published chapter | Artifact and chapter statuses remain distinct; no unreviewed artifact is automatically published. |
| Teaching-resource reuse | Teachers may transform only their owned, published resources | Creator Studio validates resource ownership and published status server-side. |
| Recording retention | Nightly production Heartbeat job evaluates recording expiry | Expired entries lose application storage references and remain auditable. |

## Continuous Content-Feeding Path

1. An educator or administrator creates a lesson, course blueprint, or Creator Studio artifact in English, French, or Arabic.
2. The item enters the review queue with source, ownership, language, and status metadata.
3. An administrator approves or rejects it with review notes.
4. An approved lesson is ingested into a selected module as a **draft** by default; publication is a separate decision.
5. Learner progress and usage signals guide the next artifact brief, while the original source remains reviewable.

> Distribution mode favors a governed pipeline over unattended automatic publication. It supports continuous high-volume authoring while preserving an explicit quality gate, ownership boundaries, and recovery through checkpoint history.
