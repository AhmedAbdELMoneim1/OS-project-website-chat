create database OS_Project_Chat_Website;

use OS_Project_Chat_Website;

create table users_inf (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    last_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    date_created DATE
);

create table users_login_inf (
    user_id INT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,

    FOREIGN KEY (user_id) REFERENCES users_inf(user_id)
);

create table users_status(
    user_id INT PRIMARY KEY,
    state VARCHAR(255), -- online or offline
    FOREIGN KEY (user_id) REFERENCES users_inf(user_id)
);

create table chats (
    chat_id INT PRIMARY KEY AUTO_INCREMENT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

create table chat_participants (
    chat_id INT,
    user_id INT,

    PRIMARY KEY (chat_id, user_id),
    FOREIGN KEY (chat_id) REFERENCES chats(chat_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users_inf(user_id) ON DELETE CASCADE
);

create table chats_messages(
    message_id INT AUTO_INCREMENT PRIMARY KEY ,
    chat_id INT,
    from_user_id INT,
    message_text VARCHAR(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (from_user_id) REFERENCES users_inf(user_id),
    FOREIGN KEY (chat_id) REFERENCES chats(chat_id)
);
