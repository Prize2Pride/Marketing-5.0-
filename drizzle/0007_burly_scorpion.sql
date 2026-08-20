CREATE TABLE `learner_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`experienceLevel` enum('beginner','intermediate','advanced') NOT NULL DEFAULT 'beginner',
	`learningStyle` enum('visual','practical','reading','mixed') NOT NULL DEFAULT 'mixed',
	`primaryGoal` enum('marketing','ecommerce','automation','career','business') NOT NULL DEFAULT 'marketing',
	`weeklyHours` int NOT NULL DEFAULT 3,
	`adaptiveDifficulty` enum('guided','standard','challenge') NOT NULL DEFAULT 'guided',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learner_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `learner_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `learner_profiles` ADD CONSTRAINT `learner_profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;