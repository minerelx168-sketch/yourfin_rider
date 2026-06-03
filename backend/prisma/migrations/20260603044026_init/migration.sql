-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `team` VARCHAR(191) NULL,
    `region` VARCHAR(191) NULL,
    `role` ENUM('SALES', 'MANAGER', 'ADMIN') NOT NULL DEFAULT 'SALES',
    `active` BOOLEAN NOT NULL DEFAULT true,
    `targetDailyClose` INTEGER NOT NULL DEFAULT 3,
    `photoUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stores` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `brand` ENUM('SAMSUNG', 'VIVO', 'OPPO', 'XIAOMI', 'REALME', 'APPLE', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `province` VARCHAR(191) NULL,
    `district` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `lat` DOUBLE NULL,
    `lng` DOUBLE NULL,
    `partnerStatus` ENUM('PROSPECT', 'ACTIVE', 'CLOSED') NOT NULL DEFAULT 'PROSPECT',
    `ownerName` VARCHAR(191) NULL,
    `ownerContact` VARCHAR(191) NULL,
    `firstVisitDate` DATETIME(3) NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `stores_brand_idx`(`brand`),
    INDEX `stores_partnerStatus_idx`(`partnerStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activities` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `eventType` ENUM('CLOCK_IN', 'CHECK_IN', 'CLOCK_OUT') NOT NULL,
    `eventTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `workDate` DATE NOT NULL,
    `lat` DOUBLE NOT NULL,
    `lng` DOUBLE NOT NULL,
    `storeId` VARCHAR(191) NULL,
    `storeName` VARCHAR(191) NULL,
    `brand` ENUM('SAMSUNG', 'VIVO', 'OPPO', 'XIAOMI', 'REALME', 'APPLE', 'OTHER') NULL,
    `visitStatus` ENUM('SUCCESS', 'PENDING', 'REJECTED') NULL,
    `photoUrl` VARCHAR(191) NULL,
    `note` TEXT NULL,
    `prevLat` DOUBLE NULL,
    `prevLng` DOUBLE NULL,
    `legDistanceKm` DOUBLE NULL DEFAULT 0,
    `legDurationMin` DOUBLE NULL DEFAULT 0,
    `calcStatus` ENUM('PENDING', 'DONE', 'SKIP', 'ERROR') NOT NULL DEFAULT 'PENDING',
    `processedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `activities_userId_workDate_idx`(`userId`, `workDate`),
    INDEX `activities_workDate_idx`(`workDate`),
    INDEX `activities_eventType_idx`(`eventType`),
    INDEX `activities_visitStatus_idx`(`visitStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `stores` ADD CONSTRAINT `stores_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activities` ADD CONSTRAINT `activities_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activities` ADD CONSTRAINT `activities_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `stores`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
