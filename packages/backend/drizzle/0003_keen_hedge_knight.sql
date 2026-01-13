CREATE TABLE `uploaded_images` (
	`id` text PRIMARY KEY NOT NULL,
	`roomId` text NOT NULL,
	`uploaderId` text NOT NULL,
	`originalName` text NOT NULL,
	`mimeType` text NOT NULL,
	`sizeBytes` integer NOT NULL,
	`width` integer,
	`height` integer,
	`uploadedAt` integer NOT NULL,
	FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploaderId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
