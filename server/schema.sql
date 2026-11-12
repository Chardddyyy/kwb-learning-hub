CREATE DATABASE IF NOT EXISTS `kwb_learning_hub`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `kwb_learning_hub`;

CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(60) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(120) NOT NULL DEFAULT 'Staff Admin',
  `role` VARCHAR(40) NOT NULL DEFAULT 'admin',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `branches` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `status` ENUM('open', 'soon') NOT NULL DEFAULT 'open',
  `address` VARCHAR(255) NOT NULL,
  `hours` VARCHAR(150) NOT NULL,
  `description` TEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `programs` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `age_range` VARCHAR(50) NOT NULL,
  `color` VARCHAR(30) NOT NULL DEFAULT 'gold',
  `blurb` TEXT NOT NULL,
  `skills` JSON NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `enrollments` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `reference_code` VARCHAR(24) NULL UNIQUE,
  `child_name` VARCHAR(150) NOT NULL,
  `birthdate` DATE NOT NULL,
  `program` VARCHAR(100) NOT NULL,
  `branch` VARCHAR(150) NOT NULL,
  `parent_name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(40) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `message` TEXT,
  `status` ENUM('Pending', 'Approved', 'Contacted', 'Enrolled', 'Declined') NOT NULL DEFAULT 'Pending',
  `reviewed_by` VARCHAR(60) NULL,
  `reviewed_at` TIMESTAMP NULL,
  `admin_notes` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_enrollments_program` (`program`),
  INDEX `idx_enrollments_branch` (`branch`),
  INDEX `idx_enrollments_status` (`status`),
  INDEX `idx_enrollments_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `email_logs` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `enrollment_id` CHAR(36) NOT NULL,
  `recipient_email` VARCHAR(150) NOT NULL,
  `event_type` VARCHAR(40) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `body_text` TEXT NOT NULL,
  `delivery_status` ENUM('sent', 'logged_only', 'failed') NOT NULL DEFAULT 'logged_only',
  `error_message` TEXT,
  `sent_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_email_logs_enrollment` (`enrollment_id`),
  INDEX `idx_email_logs_sent_at` (`sent_at`),
  CONSTRAINT `fk_email_logs_enrollment`
    FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
