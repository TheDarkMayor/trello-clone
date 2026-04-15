const router = require('express').Router();
const db = require('../db');

// Get all boards
router.get('/', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM boards ORDER BY created_at DESC');
  res.json(rows);
});

// Get single board with lists, cards, labels, members
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const [[board]] = await db.query('SELECT * FROM boards WHERE id = ?', [id]);
  if (!board) return res.status(404).json({ error: 'Board not found' });

  const [lists] = await db.query(
    'SELECT * FROM lists WHERE board_id = ? AND archived = 0 ORDER BY position',
    [id]
  );

  const [cards] = await db.query(
    `SELECT c.*, 
      GROUP_CONCAT(DISTINCT cl.label_id) as label_ids,
      GROUP_CONCAT(DISTINCT cm.member_id) as member_ids
     FROM cards c
     JOIN lists l ON c.list_id = l.id
     LEFT JOIN card_labels cl ON c.id = cl.card_id
     LEFT JOIN card_members cm ON c.id = cm.card_id
     WHERE l.board_id = ? AND c.archived = 0
     GROUP BY c.id
     ORDER BY c.position`,
    [id]
  );

  const [labels] = await db.query('SELECT * FROM labels WHERE board_id = ?', [id]);
  const [members] = await db.query('SELECT * FROM members');

  const cardMap = cards.map(c => ({
    ...c,
    label_ids: c.label_ids ? c.label_ids.split(',').map(Number) : [],
    member_ids: c.member_ids ? c.member_ids.split(',').map(Number) : [],
  }));

  res.json({ ...board, lists, cards: cardMap, labels, members });
});

// Create board
router.post('/', async (req, res) => {
  const { title, background } = req.body;
  const [result] = await db.query(
    'INSERT INTO boards (title, background) VALUES (?, ?)',
    [title, background || '#0079BF']
  );
  const [[board]] = await db.query('SELECT * FROM boards WHERE id = ?', [result.insertId]);
  res.status(201).json(board);
});

// Update board
router.put('/:id', async (req, res) => {
  const { title, background } = req.body;
  await db.query('UPDATE boards SET title = ?, background = ? WHERE id = ?', [
    title, background, req.params.id,
  ]);
  const [[board]] = await db.query('SELECT * FROM boards WHERE id = ?', [req.params.id]);
  res.json(board);
});

module.exports = router;
