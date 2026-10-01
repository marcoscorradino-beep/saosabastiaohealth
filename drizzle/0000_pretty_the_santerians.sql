CREATE TABLE `health_dataset_rows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`panelId` varchar(64) NOT NULL,
	`competence` varchar(32) NOT NULL,
	`rowKey` varchar(160) NOT NULL,
	`ine` varchar(64) NOT NULL,
	`cnes` varchar(64) NOT NULL,
	`establishment` text NOT NULL,
	`name` text NOT NULL,
	`teamType` varchar(255) NOT NULL,
	`value` double,
	`classification` text NOT NULL,
	`practicesJson` longtext NOT NULL,
	`metricsJson` longtext,
	`dimension` text,
	`indicator` text,
	`finalValue` double,
	`finalClassification` text,
	`rowJson` longtext NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `health_dataset_rows_id` PRIMARY KEY(`id`),
	CONSTRAINT `health_dataset_rows_panel_competence_row` UNIQUE(`panelId`,`competence`,`rowKey`)
);
--> statement-breakpoint
CREATE TABLE `import_history` (
	`id` varchar(36) NOT NULL,
	`filename` text NOT NULL,
	`adminUser` varchar(255) NOT NULL,
	`importedAt` timestamp NOT NULL,
	`panelId` varchar(64) NOT NULL,
	`datasetType` text NOT NULL,
	`competence` varchar(32) NOT NULL,
	`rows` int NOT NULL,
	`replaced` boolean NOT NULL DEFAULT false,
	CONSTRAINT `import_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE INDEX `health_dataset_rows_panel_competence` ON `health_dataset_rows` (`panelId`,`competence`);--> statement-breakpoint
CREATE INDEX `import_history_imported_at` ON `import_history` (`importedAt`);--> statement-breakpoint
CREATE INDEX `import_history_panel_competence` ON `import_history` (`panelId`,`competence`);