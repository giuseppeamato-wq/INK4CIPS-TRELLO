CREATE TABLE `attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`uploaded_by` text NOT NULL,
	`storage_path` text NOT NULL,
	`file_name` text NOT NULL,
	`content_type` text,
	`size_bytes` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploaded_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `attachments_card_id_idx` ON `attachments` (`card_id`);