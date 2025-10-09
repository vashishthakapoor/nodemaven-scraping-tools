const express = require('express');
const router = express.Router();
const { scrapeAmazon, scrapeAmazonReviews } = require('../services/amazon.service');

// Amazon product checker endpoint
router.post('/amazon/check', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }
    
    const result = await scrapeAmazon(url);
    
    // Send the entire result object which includes success field
    res.json(result);
});

// Amazon reviews scraper endpoint
router.post('/amazon/reviews', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }
    
    const result = await scrapeAmazonReviews(url);
    
    // Send the entire result object which includes success field
    res.json(result);
});

module.exports = router;
