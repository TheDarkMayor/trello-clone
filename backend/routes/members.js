const router = require('express').Router();
const db = require('../db');

router.get('/', async (req, res) => {
  const [members] = await db.query('SELECT * FROM members');
  res.json(members);
});

module.exports = router;
