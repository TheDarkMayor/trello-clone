const router = require('express').Router();
const db = require('../db');

// Create list
router.post('/', async (req, res) => {
  const { board_id, title } = req.body;
  const [[{ maxPos }]] = await db.query(
    'SELECT COALESCE(MAX(position), 0) as maxPos FROM lists WHERE board_id = ?',
    [board_id]
  );
  const [result] = await db.query(
    'INSERT INTO lists (board_id, title, position) VALUES (?, ?, ?)',
    [board_id, title, maxPos + 1]
  );
  const [[list]] = await db.query('SELECT * FROM lists WHERE id = ?', [result.insertId]);
  res.status(201).json(list);
});

// Update list title
router.put('/:id', async (req, res) => {
  const { title } = req.body;
  await db.query('UPDATE lists SET title = ? WHERE id = ?', [title, req.params.id]);
  const [[list]] = await db.query('SELECT * FROM lists WHERE id = ?', [req.params.id]);
  res.json(list);
});

// Archive list
router.delete('/:id', async (req, res) => {
  await db.query('UPDATE lists SET archived = 1 WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// Reorder lists (drag & drop)
router.put('/reorder/batch', async (req, res) => {
  const { lists } = req.body; // [{ id, position }]
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    for (const { id, position } of lists) {
      await conn.query('UPDATE lists SET position = ? WHERE id = ?', [position, id]);
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

module.exports = router;
