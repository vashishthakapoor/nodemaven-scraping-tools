require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Import routes
const scraperRoutes = require('./routes/scraper.routes');
const amazonRoutes = require('./routes/amazon.routes');
const youtubeRoutes = require('./routes/youtube.routes');

// Use routes
app.use('/', scraperRoutes);
app.use('/', amazonRoutes);
app.use('/youtube', youtubeRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
