# Prize2Pride Scheduled Operations

## Lesson Recording Retention

| Property | Value |
| --- | --- |
| Job name | `prize2pride-recording-retention` |
| Task UID | `e7TgwcxV7t5RQ6uQ8zpmYt` |
| Schedule | `0 15 3 * * *` (03:15 UTC, daily) |
| Callback | `POST /api/scheduled/recording-retention` |
| Purpose | Marks lesson recordings inaccessible after their immutable one-year `expiresAt` timestamp. |

The callback authenticates the scheduled caller and performs an idempotent `active → expired` status update while clearing the stored S3 key and application source URL. The built-in storage integration does not expose object deletion; removing those references makes the object unreachable through Prize2Pride while retaining a minimal auditable expiration record.

Use `manus-heartbeat list`, `logs --task-uid e7TgwcxV7t5RQ6uQ8zpmYt`, `update`, or `delete` to operate this job. The project management interface also exposes execution history, pause/resume, and investigation controls.
