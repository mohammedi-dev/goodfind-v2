CREATE TABLE `showcase_settings` (
	`bookmark_id` integer PRIMARY KEY NOT NULL,
	`position` integer,
	`accent` text,
	`background` text,
	`pattern` text,
	`logo_id` text,
	`logo` blob,
	`artwork_id` text,
	`artwork` blob,
	FOREIGN KEY (`bookmark_id`) REFERENCES `bookmarks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `showcase_settings_logo_id_unique` ON `showcase_settings` (`logo_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `showcase_settings_artwork_id_unique` ON `showcase_settings` (`artwork_id`);
