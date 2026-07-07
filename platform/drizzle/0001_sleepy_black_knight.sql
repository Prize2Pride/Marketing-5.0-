CREATE TABLE `chapter_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`chapterId` int NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chapter_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chapters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`moduleId` int NOT NULL,
	`slug` varchar(192) NOT NULL,
	`order` int NOT NULL,
	`titleEn` varchar(255) NOT NULL,
	`titleFr` varchar(255) NOT NULL,
	`titleAr` varchar(255) NOT NULL,
	`contentEn` text,
	`contentFr` text,
	`contentAr` text,
	`estimatedMinutes` int DEFAULT 15,
	`isPublished` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chapters_id` PRIMARY KEY(`id`),
	CONSTRAINT `chapters_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`language` varchar(8) DEFAULT 'en',
	`chapterId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`levelId` int NOT NULL,
	`enrolledAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `enrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `levels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(64) NOT NULL,
	`order` int NOT NULL,
	`titleEn` varchar(255) NOT NULL,
	`titleFr` varchar(255) NOT NULL,
	`titleAr` varchar(255) NOT NULL,
	`descriptionEn` text,
	`descriptionFr` text,
	`descriptionAr` text,
	`tier` enum('beginner','intermediate','advanced','expert','master','autonomous') NOT NULL,
	`icon` varchar(64) DEFAULT 'BookOpen',
	`color` varchar(32) DEFAULT 'gold',
	`isPublished` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `levels_id` PRIMARY KEY(`id`),
	CONSTRAINT `levels_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `modules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`levelId` int NOT NULL,
	`slug` varchar(128) NOT NULL,
	`order` int NOT NULL,
	`titleEn` varchar(255) NOT NULL,
	`titleFr` varchar(255) NOT NULL,
	`titleAr` varchar(255) NOT NULL,
	`descriptionEn` text,
	`descriptionFr` text,
	`descriptionAr` text,
	`isPublished` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `modules_id` PRIMARY KEY(`id`),
	CONSTRAINT `modules_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `preferredLanguage` varchar(8) DEFAULT 'en';--> statement-breakpoint
ALTER TABLE `chapter_progress` ADD CONSTRAINT `chapter_progress_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chapter_progress` ADD CONSTRAINT `chapter_progress_chapterId_chapters_id_fk` FOREIGN KEY (`chapterId`) REFERENCES `chapters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chapters` ADD CONSTRAINT `chapters_moduleId_modules_id_fk` FOREIGN KEY (`moduleId`) REFERENCES `modules`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_chapterId_chapters_id_fk` FOREIGN KEY (`chapterId`) REFERENCES `chapters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_levelId_levels_id_fk` FOREIGN KEY (`levelId`) REFERENCES `levels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `modules` ADD CONSTRAINT `modules_levelId_levels_id_fk` FOREIGN KEY (`levelId`) REFERENCES `levels`(`id`) ON DELETE no action ON UPDATE no action;