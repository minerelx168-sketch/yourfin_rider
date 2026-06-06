-- AlterTable
ALTER TABLE `users` ADD COLUMN `bankAccountName` VARCHAR(191) NULL,
    ADD COLUMN `bankAccountNumber` VARCHAR(191) NULL,
    ADD COLUMN `bankName` VARCHAR(191) NULL,
    ADD COLUMN `commissionPerDeal` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `referralPercent` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `referredById` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `commission_entries` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('DEAL', 'REFERRAL', 'ADJUSTMENT') NOT NULL,
    `amount` DOUBLE NOT NULL,
    `level` INTEGER NOT NULL DEFAULT 0,
    `sourceActivityId` VARCHAR(191) NULL,
    `sourceUserId` VARCHAR(191) NULL,
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `commission_entries_userId_idx`(`userId`),
    INDEX `commission_entries_type_idx`(`type`),
    INDEX `commission_entries_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `withdrawals` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'PAID') NOT NULL DEFAULT 'PENDING',
    `bankName` VARCHAR(191) NULL,
    `bankAccountNumber` VARCHAR(191) NULL,
    `bankAccountName` VARCHAR(191) NULL,
    `note` VARCHAR(191) NULL,
    `slipUrl` VARCHAR(191) NULL,
    `adminNote` VARCHAR(191) NULL,
    `processedById` VARCHAR(191) NULL,
    `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processedAt` DATETIME(3) NULL,

    INDEX `withdrawals_userId_idx`(`userId`),
    INDEX `withdrawals_status_idx`(`status`),
    INDEX `withdrawals_requestedAt_idx`(`requestedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `users_referredById_idx` ON `users`(`referredById`);

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_referredById_fkey` FOREIGN KEY (`referredById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commission_entries` ADD CONSTRAINT `commission_entries_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `withdrawals` ADD CONSTRAINT `withdrawals_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
