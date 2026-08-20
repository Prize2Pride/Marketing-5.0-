ALTER TABLE `creator_artifacts` ADD `exportUrl` text;--> statement-breakpoint
ALTER TABLE `creator_artifacts` ADD `exportedAt` timestamp;--> statement-breakpoint
ALTER TABLE `creator_artifacts` ADD `reviewedBy` int;--> statement-breakpoint
ALTER TABLE `creator_artifacts` ADD `reviewedAt` timestamp;--> statement-breakpoint
ALTER TABLE `creator_artifacts` ADD `reviewNotes` text;--> statement-breakpoint
ALTER TABLE `creator_artifacts` ADD CONSTRAINT `creator_artifacts_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;