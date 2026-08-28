CREATE TABLE `tts_daily_usage` (
	`id` text PRIMARY KEY NOT NULL,
	`request_count` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
