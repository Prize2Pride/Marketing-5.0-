CREATE TABLE `course_blueprints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`brief` text NOT NULL,
	`audience` varchar(255) NOT NULL,
	`language` varchar(8) NOT NULL DEFAULT 'en',
	`status` enum('generating','ready','failed','approved') NOT NULL DEFAULT 'generating',
	`outline` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `course_blueprints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `course_blueprints` ADD CONSTRAINT `course_blueprints_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;