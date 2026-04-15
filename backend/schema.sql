-- Create database
CREATE DATABASE IF NOT EXISTS trello_clone;
USE trello_clone;

-- Members (sample users, no auth required)
CREATE TABLE members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  avatar_color VARCHAR(7) DEFAULT '#0079BF',
  initials VARCHAR(3) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Boards
CREATE TABLE boards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  background VARCHAR(100) DEFAULT '#0079BF',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lists
CREATE TABLE lists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  board_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  position DECIMAL(10,5) NOT NULL DEFAULT 0,
  archived TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

-- Cards
CREATE TABLE cards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  list_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  position DECIMAL(10,5) NOT NULL DEFAULT 0,
  due_date DATE,
  archived TINYINT(1) DEFAULT 0,
  cover_color VARCHAR(7),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
);

-- Labels
CREATE TABLE labels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  board_id INT NOT NULL,
  name VARCHAR(100),
  color VARCHAR(7) NOT NULL,
  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

-- Card Labels (many-to-many)
CREATE TABLE card_labels (
  card_id INT NOT NULL,
  label_id INT NOT NULL,
  PRIMARY KEY (card_id, label_id),
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
  FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
);

-- Card Members (many-to-many)
CREATE TABLE card_members (
  card_id INT NOT NULL,
  member_id INT NOT NULL,
  PRIMARY KEY (card_id, member_id),
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- Checklists
CREATE TABLE checklists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  card_id INT NOT NULL,
  title VARCHAR(255) NOT NULL DEFAULT 'Checklist',
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

-- Checklist Items
CREATE TABLE checklist_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  checklist_id INT NOT NULL,
  text VARCHAR(500) NOT NULL,
  completed TINYINT(1) DEFAULT 0,
  position INT DEFAULT 0,
  FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE
);

-- Comments
CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  card_id INT NOT NULL,
  member_id INT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- =====================
-- SEED DATA
-- =====================

INSERT INTO members (name, initials, avatar_color) VALUES
  ('Alice Johnson', 'AJ', '#0079BF'),
  ('Bob Smith', 'BS', '#D29034'),
  ('Carol White', 'CW', '#519839'),
  ('David Lee', 'DL', '#B04632');

INSERT INTO boards (title, background) VALUES
  ('Product Roadmap', '#0079BF');

-- Labels for board 1
INSERT INTO labels (board_id, name, color) VALUES
  (1, 'Bug', '#EB5A46'),
  (1, 'Feature', '#61BD4F'),
  (1, 'Design', '#C377E0'),
  (1, 'Backend', '#0079BF'),
  (1, 'Frontend', '#FF9F1A'),
  (1, 'Urgent', '#EB5A46');

-- Lists
INSERT INTO lists (board_id, title, position) VALUES
  (1, 'Backlog', 1),
  (1, 'In Progress', 2),
  (1, 'Review', 3),
  (1, 'Done', 4);

-- Cards for Backlog (list 1)
INSERT INTO cards (list_id, title, description, position, due_date) VALUES
  (1, 'Design new landing page', 'Create wireframes and mockups for the new landing page redesign.', 1, '2025-08-15'),
  (1, 'Set up CI/CD pipeline', 'Configure GitHub Actions for automated testing and deployment.', 2, '2025-08-20'),
  (1, 'Write API documentation', 'Document all REST endpoints using Swagger/OpenAPI.', 3, NULL),
  (1, 'Database performance audit', 'Review slow queries and add missing indexes.', 4, '2025-08-25');

-- Cards for In Progress (list 2)
INSERT INTO cards (list_id, title, description, position, due_date) VALUES
  (2, 'User authentication flow', 'Implement JWT-based login, register, and refresh token logic.', 1, '2025-08-10'),
  (2, 'Dashboard analytics widget', 'Build charts for user activity and revenue metrics.', 2, '2025-08-12'),
  (2, 'Mobile responsive fixes', 'Fix layout issues on screens smaller than 768px.', 3, NULL);

-- Cards for Review (list 3)
INSERT INTO cards (list_id, title, description, position, due_date) VALUES
  (3, 'Payment integration', 'Stripe checkout integration with webhook handling.', 1, '2025-08-08'),
  (3, 'Email notification system', 'Transactional emails for signup, password reset, and alerts.', 2, '2025-08-09');

-- Cards for Done (list 4)
INSERT INTO cards (list_id, title, description, position, due_date) VALUES
  (4, 'Project setup & scaffolding', 'Initialize repo, configure ESLint, Prettier, and folder structure.', 1, NULL),
  (4, 'Database schema design', 'Design and implement the initial MySQL schema.', 2, NULL);

-- Card Labels
INSERT INTO card_labels (card_id, label_id) VALUES
  (1, 3), (1, 5),   -- Design new landing page: Design, Frontend
  (2, 4),           -- CI/CD: Backend
  (3, 4),           -- API docs: Backend
  (4, 4), (4, 1),   -- DB audit: Backend, Bug
  (5, 4), (5, 2),   -- Auth flow: Backend, Feature
  (6, 5), (6, 2),   -- Dashboard: Frontend, Feature
  (7, 5), (7, 1),   -- Mobile fixes: Frontend, Bug
  (8, 4), (8, 2),   -- Payment: Backend, Feature
  (9, 4), (9, 2),   -- Email: Backend, Feature
  (10, 4),          -- Setup: Backend
  (11, 4);          -- Schema: Backend

-- Card Members
INSERT INTO card_members (card_id, member_id) VALUES
  (1, 3), (1, 1),
  (2, 2),
  (3, 4),
  (4, 2), (4, 4),
  (5, 1), (5, 2),
  (6, 3),
  (7, 3), (7, 1),
  (8, 2),
  (9, 4),
  (10, 1),
  (11, 2);

-- Checklists
INSERT INTO checklists (card_id, title) VALUES
  (5, 'Auth Tasks'),
  (8, 'Payment Steps');

INSERT INTO checklist_items (checklist_id, text, completed, position) VALUES
  (1, 'Design login/register UI', 1, 1),
  (1, 'Implement JWT generation', 1, 2),
  (1, 'Add refresh token endpoint', 0, 3),
  (1, 'Write unit tests', 0, 4),
  (2, 'Create Stripe account & keys', 1, 1),
  (2, 'Build checkout session endpoint', 1, 2),
  (2, 'Handle webhook events', 0, 3),
  (2, 'Test with Stripe test cards', 0, 4);

-- Comments
INSERT INTO comments (card_id, member_id, text) VALUES
  (5, 1, 'Started working on the JWT implementation. Should be done by EOD.'),
  (5, 2, 'Make sure to handle token expiry edge cases.'),
  (8, 2, 'Webhook endpoint is tricky - need to verify Stripe signatures.'),
  (1, 3, 'Wireframes are ready for review in Figma.');
