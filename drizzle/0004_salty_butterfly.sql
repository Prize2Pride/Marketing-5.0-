CREATE TABLE `artifact_sections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artifactId` int NOT NULL,
	`sectionOrder` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text,
	`status` enum('planned','draft','ready') NOT NULL DEFAULT 'planned',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `artifact_sections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creator_artifacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`kind` enum('lesson','book','document','code','spreadsheet','infographic','poster','video_brief','quiz') NOT NULL,
	`title` varchar(255) NOT NULL,
	`prompt` text NOT NULL,
	`language` varchar(8) NOT NULL DEFAULT 'en',
	`status` enum('draft','generating','ready','failed','approved','published') NOT NULL DEFAULT 'draft',
	`content` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `creator_artifacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`brief` text NOT NULL,
	`language` varchar(8) NOT NULL DEFAULT 'en',
	`status` enum('active','completed','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `artifact_sections` ADD CONSTRAINT `artifact_sections_artifactId_creator_artifacts_id_fk` FOREIGN KEY (`artifactId`) REFERENCES `creator_artifacts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `creator_artifacts` ADD CONSTRAINT `creator_artifacts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learning_projects` ADD CONSTRAINT `learning_projects_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;