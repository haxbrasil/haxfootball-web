CREATE TABLE `web_impersonation_events` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`actor_account_uuid` text NOT NULL,
	`actor_account_external_id` text NOT NULL,
	`actor_account_name` text NOT NULL,
	`target_account_uuid` text NOT NULL,
	`target_account_external_id` text NOT NULL,
	`target_account_name` text NOT NULL,
	`request_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `web_sessions` ADD `impersonated_by_account_uuid` text;--> statement-breakpoint
ALTER TABLE `web_sessions` ADD `impersonated_by_account_external_id` text;--> statement-breakpoint
ALTER TABLE `web_sessions` ADD `impersonated_by_account_name` text;--> statement-breakpoint
ALTER TABLE `web_sessions` ADD `impersonation_started_at` integer;