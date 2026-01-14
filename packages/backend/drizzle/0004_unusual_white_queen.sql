CREATE TABLE `room_invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`roomId` text NOT NULL,
	`inviterId` text NOT NULL,
	`inviteeId` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`inviterId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`inviteeId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `room_invitations_roomId_inviteeId_unique` ON `room_invitations` (`roomId`,`inviteeId`);