CREATE TABLE `playlist_extractions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`playlistUrl` text NOT NULL,
	`quality` varchar(32) NOT NULL,
	`videoCount` int NOT NULL,
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `playlist_extractions_id` PRIMARY KEY(`id`)
);
