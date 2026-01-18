ALTER TABLE `rooms` ADD `is_dm` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `rooms` ADD `dm_type` text;--> statement-breakpoint
ALTER TABLE `rooms` ADD `ably_room_id` text;