require('dotenv').config();
const express = require('express');
const { resolve } = require('path');
const fs = require('fs');

const offerRoutes = require('./routes/offerRoutes');
const leadRoutes = require('./routes/leadRoutes');
const scoringRoutes = require('./routes/scoringRoutes');

const app = express();
const port = process.env.PORT || 3010;

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('static'));

app.use('/api', offerRoutes);
app.use('/api', leadRoutes);
app.use('/api', scoringRoutes);

app.get('/', (req, res) => {
  res.sendFile(resolve(__dirname, 'pages/index.html'));
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: err.message
  });
});

app.listen(port, () => {
  console.log(`Lead Qualification API listening at http://localhost:${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
});
