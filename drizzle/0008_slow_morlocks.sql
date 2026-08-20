CREATE TABLE `class_announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` int NOT NULL,
	`authorId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `class_announcements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `class_enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` int NOT NULL,
	`userId` int NOT NULL,
	`status` enum('invited','active','removed') NOT NULL DEFAULT 'invited',
	`enrolledAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `class_enrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lesson_recordings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` int NOT NULL,
	`ownerId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`sourceUrl` text NOT NULL,
	`availableAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`retentionStatus` enum('active','expired','cleanup_pending','deleted') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lesson_recordings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `school_classes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`schoolId` int NOT NULL,
	`teacherId` int NOT NULL,
	`slug` varchar(128) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`language` varchar(8) NOT NULL DEFAULT 'en',
	`meetingUrl` text,
	`status` enum('draft','active','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `school_classes_id` PRIMARY KEY(`id`),
	CONSTRAINT `school_classes_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `subject_schools` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`subjectKey` enum('digital_marketing','artificial_intelligence','data_science','robotics','three_d_printing','mathematics','physics','quantum_computing','quantum_physics','research') NOT NULL,
	`slug` varchar(128) NOT NULL,
	`nameEn` varchar(255) NOT NULL,
	`nameFr` varchar(255) NOT NULL,
	`nameAr` varchar(255) NOT NULL,
	`descriptionEn` text,
	`descriptionFr` text,
	`descriptionAr` text,
	`brandColor` varchar(32) NOT NULL DEFAULT 'gold',
	`visibility` enum('private','unlisted','public') NOT NULL DEFAULT 'private',
	`status` enum('draft','active','suspended') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subject_schools_id` PRIMARY KEY(`id`),
	CONSTRAINT `subject_schools_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `teaching_resources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`schoolId` int NOT NULL,
	`classId` int,
	`ownerId` int NOT NULL,
	`creatorArtifactId` int,
	`kind` enum('lesson','document','pdf','video_link','image','infographic','poster','chart','audio_brief','video_brief','quiz','code','spreadsheet','link') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`sourceUrl` text,
	`storageKey` varchar(512),
	`visibility` enum('private','class','school') NOT NULL DEFAULT 'private',
	`status` enum('draft','ready','published','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teaching_resources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','educator','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `class_announcements` ADD CONSTRAINT `class_announcements_classId_school_classes_id_fk` FOREIGN KEY (`classId`) REFERENCES `school_classes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `class_announcements` ADD CONSTRAINT `class_announcements_authorId_users_id_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `class_enrollments` ADD CONSTRAINT `class_enrollments_classId_school_classes_id_fk` FOREIGN KEY (`classId`) REFERENCES `school_classes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `class_enrollments` ADD CONSTRAINT `class_enrollments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lesson_recordings` ADD CONSTRAINT `lesson_recordings_classId_school_classes_id_fk` FOREIGN KEY (`classId`) REFERENCES `school_classes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lesson_recordings` ADD CONSTRAINT `lesson_recordings_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `school_classes` ADD CONSTRAINT `school_classes_schoolId_subject_schools_id_fk` FOREIGN KEY (`schoolId`) REFERENCES `subject_schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `school_classes` ADD CONSTRAINT `school_classes_teacherId_users_id_fk` FOREIGN KEY (`teacherId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subject_schools` ADD CONSTRAINT `subject_schools_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teaching_resources` ADD CONSTRAINT `teaching_resources_schoolId_subject_schools_id_fk` FOREIGN KEY (`schoolId`) REFERENCES `subject_schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teaching_resources` ADD CONSTRAINT `teaching_resources_classId_school_classes_id_fk` FOREIGN KEY (`classId`) REFERENCES `school_classes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teaching_resources` ADD CONSTRAINT `teaching_resources_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teaching_resources` ADD CONSTRAINT `teaching_resources_creatorArtifactId_creator_artifacts_id_fk` FOREIGN KEY (`creatorArtifactId`) REFERENCES `creator_artifacts`(`id`) ON DELETE no action ON UPDATE no action;