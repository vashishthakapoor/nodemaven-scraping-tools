const express = require('express');
const router = express.Router();
const { scrapeWebsite, analyzeSEO } = require('../services/scraper.service');

// Website scraper endpoint
router.post('/scrape', async (req, res) => {
    const { url, keyword } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }
    
    const result = await scrapeWebsite(url);
    
    if (result.success) {
        // Add SEO analysis if keyword is provided
        if (keyword) {
            result.data.seoAnalysis = analyzeSEO(result.data, keyword);
        }
    }
    
    // Send the entire result object which includes success field
    res.json(result);
});

module.exports = router;
