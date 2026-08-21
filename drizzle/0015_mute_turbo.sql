CREATE TABLE `course_certificates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`levelId` int NOT NULL,
	`verificationCode` varchar(40) NOT NULL,
	`language` varchar(8) NOT NULL DEFAULT 'en',
	`criteria` json NOT NULL,
	`status` enum('issued','revoked') NOT NULL DEFAULT 'issued',
	`issuedBy` int,
	`issuedAt` timestamp NOT NULL DEFAULT (now()),
	`revokedAt` timestamp,
	`revokeReason` text,
	CONSTRAINT `course_certificates_id` PRIMARY KEY(`id`),
	CONSTRAINT `course_certificates_verificationCode_unique` UNIQUE(`verificationCode`)
);
--> statement-breakpoint
ALTER TABLE `course_certificates` ADD CONSTRAINT `course_certificates_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `course_certificates` ADD CONSTRAINT `course_certificates_levelId_levels_id_fk` FOREIGN KEY (`levelId`) REFERENCES `levels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `course_certificates` ADD CONSTRAINT `course_certificates_issuedBy_users_id_fk` FOREIGN KEY (`issuedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `course_certificates_user_level_idx` ON `course_certificates` (`userId`,`levelId`);