const express = require('express');
const { Pool } = require('pg');
const app = express();
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.get('/api/history', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT period, data, date_saved FROM history ORDER BY period DESC');
    const history = Object.fromEntries(rows.map(r => [r.period, { ...r.data, dateSaved: r.date_saved.toISOString().split('T')[0] }]));
    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

app.post('/api/history', async (req, res) => {
  try {
    const history = req.body;
    for (const [period, data] of Object.entries(history)) {
      await pool.query(
        'INSERT INTO history (period, data) VALUES ($1, $2) ON CONFLICT (period) DO UPDATE SET data = $2, date_saved = NOW()',
        [period, data]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save history' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API running on port ${port}`));
