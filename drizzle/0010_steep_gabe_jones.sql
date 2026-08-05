ALTER TABLE `workspace_invites` ADD `token` text;--> statement-breakpoint
CREATE UNIQUE INDEX `workspace_invites_token_unique` ON `workspace_invites` (`token`);