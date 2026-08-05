CREATE TABLE `workspace_whiteboards` (
	`workspace_id` text PRIMARY KEY NOT NULL,
	`data` text DEFAULT '{"nodes":[],"edges":[]}' NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
