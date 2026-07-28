CREATE TABLE `cards` (
	`id` text PRIMARY KEY NOT NULL,
	`list_id` text NOT NULL,
	`board_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`due_date` integer,
	`sort_key` text NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`list_id`) REFERENCES `lists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`board_id`) REFERENCES `boards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `cards_list_id_sort_key_idx` ON `cards` (`list_id`,`sort_key`);--> statement-breakpoint
CREATE INDEX `cards_board_id_idx` ON `cards` (`board_id`);--> statement-breakpoint
CREATE TABLE `lists` (
	`id` text PRIMARY KEY NOT NULL,
	`board_id` text NOT NULL,
	`name` text NOT NULL,
	`sort_key` text NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`board_id`) REFERENCES `boards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `lists_board_id_sort_key_idx` ON `lists` (`board_id`,`sort_key`);