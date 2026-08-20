CREATE TABLE `class_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` int NOT NULL,
	`senderId` int NOT NULL,
	`recipientId` int NOT NULL,
	`body` text NOT NULL,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `class_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `educator_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bio` text,
	`expertise` text,
	`onboardingStatus` enum('draft','submitted','approved','rejected') NOT NULL DEFAULT 'draft',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`reviewNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `educator_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `educator_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `class_messages` ADD CONSTRAINT `class_messages_classId_school_classes_id_fk` FOREIGN KEY (`classId`) REFERENCES `school_classes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `class_messages` ADD CONSTRAINT `class_messages_senderId_users_id_fk` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `class_messages` ADD CONSTRAINT `class_messages_recipientId_users_id_fk` FOREIGN KEY (`recipientId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `educator_profiles` ADD CONSTRAINT `educator_profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `educator_profiles` ADD CONSTRAINT `educator_profiles_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;