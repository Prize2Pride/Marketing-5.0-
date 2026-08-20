# Validation Notes

## 2026-08-20 — Creator Hub and Tutor Controls

The authenticated `/studio` view renders the Creator & Practice Hub with a clear artifact-mode selector, brief form, artifact library, and practice-project panel. The authenticated dashboard and tutor routes render successfully after restoring the missing `levels.updatedAt` database column.

The existing tutor contains a long persisted conversation, so its full-page capture is intentionally tall. The new mode controls are implemented directly below the tutor header and require a standard viewport verification in the next QA pass.
