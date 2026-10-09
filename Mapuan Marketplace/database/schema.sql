CREATE DATABASE IF NOT EXISTS mapuan_marketplace
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mapuan_marketplace;

DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS listings;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  campus ENUM('Intramuros Campus', 'Makati Campus') NOT NULL DEFAULT 'Intramuros Campus',
  course VARCHAR(120) DEFAULT '',
  role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
  avatar_color VARCHAR(20) NOT NULL DEFAULT '#D71920',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  slug VARCHAR(80) NOT NULL UNIQUE,
  icon VARCHAR(20) DEFAULT '📦',
  sort_order INT NOT NULL DEFAULT 100
);

CREATE TABLE listings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  seller_id INT UNSIGNED NOT NULL,
  category_id INT UNSIGNED NOT NULL,
  title VARCHAR(160) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  item_condition ENUM('New', 'Like New', 'Good', 'Fair', 'Worn') NOT NULL DEFAULT 'Good',
  meetup_location ENUM('Intramuros Campus', 'Makati Campus', 'Either Campus') NOT NULL DEFAULT 'Either Campus',
  image_url VARCHAR(255),
  status ENUM('Available', 'Reserved', 'Sold', 'Removed') NOT NULL DEFAULT 'Available',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_listing_seller FOREIGN KEY (seller_id) REFERENCES users(id),
  CONSTRAINT fk_listing_category FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  listing_id INT UNSIGNED NULL,
  sender_id INT UNSIGNED NOT NULL,
  receiver_id INT UNSIGNED NOT NULL,
  body VARCHAR(2000) NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_message_listing FOREIGN KEY (listing_id) REFERENCES listings(id),
  CONSTRAINT fk_message_sender FOREIGN KEY (sender_id) REFERENCES users(id),
  CONSTRAINT fk_message_receiver FOREIGN KEY (receiver_id) REFERENCES users(id),
  INDEX idx_message_users (sender_id, receiver_id),
  INDEX idx_message_listing (listing_id)
);

INSERT INTO categories (name, slug, icon, sort_order) VALUES
('Textbooks', 'textbooks', '📚', 1),
('Engineering Tools', 'engineering-tools', '🧰', 2),
('Uniforms', 'uniforms', '👕', 3),
('Drafting Materials', 'drafting-materials', '📐', 4),
('Electronics', 'electronics', '💻', 5),
('School Essentials', 'school-essentials', '🎒', 6),
('Other', 'other', '📦', 99);
