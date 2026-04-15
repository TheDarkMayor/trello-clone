const router = require('express').Router();
const db = require('../db');

// Create card
router.post('/', async (req, res) => {
  const { list_id, title } = req.body;
  const [[{ maxPos }]] = await db.query(
    'SELECT COALESCE(MAX(position), 0) as maxPos FROM cards WHERE list_id = ?',
    [list_id]
  );
  const [result] = await db.query(
    'INSERT INTO cards (list_id, title, position) VALUES (?, ?, ?)',
    [list_id, title, maxPos + 1]
  );
  const [[card]] = await db.query('SELECT * FROM cards WHERE id = ?', [result.insertId]);
  res.status(201).json({ ...card, label_ids: [], member_ids: [] });
});

// Get card details
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const [[card]] = await db.query('SELECT * FROM cards WHERE id = ?', [id]);
  if (!card) return res.status(404).json({ error: 'Card not found' });

  const [labels] = await db.query(
    `SELECT l.* FROM labels l JOIN card_labels cl ON l.id = cl.label_id WHERE cl.card_id = ?`,
    [id]
  );
  const [members] = await db.query(
    `SELECT m.* FROM members m JOIN card_members cm ON m.id = cm.member_id WHERE cm.card_id = ?`,
    [id]
  );
  const [checklists] = await db.query('SELECT * FROM checklists WHERE card_id = ?', [id]);
  for (const cl of checklists) {
    const [items] = await db.query(
      'SELECT * FROM checklist_items WHERE checklist_id = ? ORDER BY position',
      [cl.id]
    );
    cl.items = items;
  }
  const [comments] = await db.query(
    `SELECT c.*, m.name as member_name, m.initials, m.avatar_color 
     FROM comments c JOIN members m ON c.member_id = m.id 
     WHERE c.card_id = ? ORDER BY c.created_at DESC`,
    [id]
  );

  res.json({ ...card, labels, members, checklists, comments });
});

// Update card
router.put('/:id', async (req, res) => {
  const { title, description, due_date, cover_color, archived } = req.body;
  await db.query(
    'UPDATE cards SET title = ?, description = ?, due_date = ?, cover_color = ?, archived = ? WHERE id = ?',
    [title, description, due_date || null, cover_color || null, archived ?? 0, req.params.id]
  );
  const [[card]] = await db.query('SELECT * FROM cards WHERE id = ?', [req.params.id]);
  res.json(card);
});

// Delete card
router.delete('/:id', async (req, res) => {
  await db.query('DELETE FROM cards WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// Move/reorder cards (drag & drop)
router.put('/reorder/batch', async (req, res) => {
  const { cards } = req.body; // [{ id, list_id, position }]
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    for (const { id, list_id, position } of cards) {
      await conn.query('UPDATE cards SET list_id = ?, position = ? WHERE id = ?', [list_id, position, id]);
    }
    await conn.commit();
    res.json({ success: true });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

// Add label to card
router.post('/:id/labels', async (req, res) => {
  const { label_id } = req.body;
  await db.query('INSERT IGNORE INTO card_labels (card_id, label_id) VALUES (?, ?)', [req.params.id, label_id]);
  res.json({ success: true });
});

// Remove label from card
router.delete('/:id/labels/:label_id', async (req, res) => {
  await db.query('DELETE FROM card_labels WHERE card_id = ? AND label_id = ?', [req.params.id, req.params.label_id]);
  res.json({ success: true });
});

// Add member to card
router.post('/:id/members', async (req, res) => {
  const { member_id } = req.body;
  await db.query('INSERT IGNORE INTO card_members (card_id, member_id) VALUES (?, ?)', [req.params.id, member_id]);
  res.json({ success: true });
});

// Remove member from card
router.delete('/:id/members/:member_id', async (req, res) => {
  await db.query('DELETE FROM card_members WHERE card_id = ? AND member_id = ?', [req.params.id, req.params.member_id]);
  res.json({ success: true });
});

// Add checklist
router.post('/:id/checklists', async (req, res) => {
  const { title } = req.body;
  const [result] = await db.query(
    'INSERT INTO checklists (card_id, title) VALUES (?, ?)',
    [req.params.id, title || 'Checklist']
  );
  const [[cl]] = await db.query('SELECT * FROM checklists WHERE id = ?', [result.insertId]);
  res.status(201).json({ ...cl, items: [] });
});

// Delete checklist
router.delete('/:id/checklists/:cl_id', async (req, res) => {
  await db.query('DELETE FROM checklists WHERE id = ? AND card_id = ?', [req.params.cl_id, req.params.id]);
  res.json({ success: true });
});

// Add checklist item
router.post('/:id/checklists/:cl_id/items', async (req, res) => {
  const { text } = req.body;
  const [[{ maxPos }]] = await db.query(
    'SELECT COALESCE(MAX(position), 0) as maxPos FROM checklist_items WHERE checklist_id = ?',
    [req.params.cl_id]
  );
  const [result] = await db.query(
    'INSERT INTO checklist_items (checklist_id, text, position) VALUES (?, ?, ?)',
    [req.params.cl_id, text, maxPos + 1]
  );
  const [[item]] = await db.query('SELECT * FROM checklist_items WHERE id = ?', [result.insertId]);
  res.status(201).json(item);
});

// Update checklist item
router.put('/:id/checklists/:cl_id/items/:item_id', async (req, res) => {
  const { text, completed } = req.body;
  await db.query(
    'UPDATE checklist_items SET text = ?, completed = ? WHERE id = ?',
    [text, completed, req.params.item_id]
  );
  const [[item]] = await db.query('SELECT * FROM checklist_items WHERE id = ?', [req.params.item_id]);
  res.json(item);
});

// Delete checklist item
router.delete('/:id/checklists/:cl_id/items/:item_id', async (req, res) => {
  await db.query('DELETE FROM checklist_items WHERE id = ?', [req.params.item_id]);
  res.json({ success: true });
});

// Add comment
router.post('/:id/comments', async (req, res) => {
  const { member_id, text } = req.body;
  const [result] = await db.query(
    'INSERT INTO comments (card_id, member_id, text) VALUES (?, ?, ?)',
    [req.params.id, member_id, text]
  );
  const [[comment]] = await db.query(
    `SELECT c.*, m.name as member_name, m.initials, m.avatar_color 
     FROM comments c JOIN members m ON c.member_id = m.id WHERE c.id = ?`,
    [result.insertId]
  );
  res.status(201).json(comment);
});

// Search cards
router.get('/search/query', async (req, res) => {
  const { q, board_id, label_id, member_id, due } = req.query;
  let sql = `
    SELECT c.*, l.title as list_title, l.board_id,
      GROUP_CONCAT(DISTINCT cl.label_id) as label_ids,
      GROUP_CONCAT(DISTINCT cm.member_id) as member_ids
    FROM cards c
    JOIN lists l ON c.list_id = l.id
    LEFT JOIN card_labels cl ON c.id = cl.card_id
    LEFT JOIN card_members cm ON c.id = cm.member_id
    WHERE c.archived = 0
  `;
  const params = [];

  if (board_id) { sql += ' AND l.board_id = ?'; params.push(board_id); }
  if (q) { sql += ' AND c.title LIKE ?'; params.push(`%${q}%`); }
  if (label_id) { sql += ' AND cl.label_id = ?'; params.push(label_id); }
  if (member_id) { sql += ' AND cm.member_id = ?'; params.push(member_id); }
  if (due === 'overdue') { sql += ' AND c.due_date < CURDATE()'; }
  if (due === 'today') { sql += ' AND c.due_date = CURDATE()'; }
  if (due === 'week') { sql += ' AND c.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)'; }

  sql += ' GROUP BY c.id ORDER BY c.position';

  const [cards] = await db.query(sql, params);
  res.json(cards.map(c => ({
    ...c,
    label_ids: c.label_ids ? c.label_ids.split(',').map(Number) : [],
    member_ids: c.member_ids ? c.member_ids.split(',').map(Number) : [],
  })));
});

module.exports = router;
