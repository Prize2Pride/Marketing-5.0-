ALTER TABLE `chapters` ADD `type` enum('text','code','excel','infographic','video_script','quiz') DEFAULT 'text' NOT NULL;--> statement-breakpoint
ALTER TABLE `modules` ADD `parentModuleId` int;--> statement-breakpoint
ALTER TABLE `modules` ADD CONSTRAINT `modules_parentModuleId_modules_id_fk` FOREIGN KEY (`parentModuleId`) REFERENCES `modules`(`id`) ON DELETE no action ON UPDATE no action;