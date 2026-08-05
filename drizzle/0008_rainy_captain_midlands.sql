CREATE TABLE `board_whiteboards` (
	`board_id` text PRIMARY KEY NOT NULL,
	`data` text DEFAULT '{"nodes":[],"edges":[]}' NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`board_id`) REFERENCES `boards`(`id`) ON UPDATE no action ON DELETE cascade
);
