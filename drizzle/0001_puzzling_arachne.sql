CREATE TABLE `activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`eventType` enum('CLOCK_IN','CHECK_IN','CLOCK_OUT') NOT NULL,
	`eventTime` timestamp NOT NULL DEFAULT (now()),
	`workDate` date NOT NULL,
	`lat` float NOT NULL,
	`lng` float NOT NULL,
	`storeId` int,
	`storeName` varchar(255),
	`brand` enum('SAMSUNG','VIVO','OPPO','XIAOMI','REALME','APPLE','OTHER'),
	`visitStatus` enum('SUCCESS','PENDING','REJECTED'),
	`photoUrl` text,
	`note` text,
	`prevLat` float,
	`prevLng` float,
	`legDistanceKm` float DEFAULT 0,
	`legDurationMin` float DEFAULT 0,
	`calcStatus` enum('PENDING','DONE','SKIP','ERROR') NOT NULL DEFAULT 'PENDING',
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`brand` enum('SAMSUNG','VIVO','OPPO','XIAOMI','REALME','APPLE','OTHER') NOT NULL DEFAULT 'OTHER',
	`province` varchar(100),
	`district` varchar(100),
	`address` text,
	`lat` float,
	`lng` float,
	`partnerStatus` enum('PROSPECT','ACTIVE','CLOSED') NOT NULL DEFAULT 'PROSPECT',
	`ownerName` varchar(255),
	`ownerContact` varchar(100),
	`createdById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','sales','manager') NOT NULL DEFAULT 'sales';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `team` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `region` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `targetDailyClose` int DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `photoUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `active` boolean DEFAULT true NOT NULL;