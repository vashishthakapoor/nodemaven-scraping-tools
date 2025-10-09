const express = require('express');
const router = express.Router();
const { fetchYouTubeTranscript } = require('../services/youtube.service');
const { summarizeTranscript } = require('../services/openai.service');

// Validate YouTube URL helper
function isValidYouTubeUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be');
    } catch (e) {
        return false;
    }
}

// YouTube Transcript Fetcher endpoint
router.post('/transcript', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ success: false, error: 'URL is required' });
    }
    
    if (!isValidYouTubeUrl(url)) {
        return res.status(400).json({ success: false, error: 'Please provide a valid YouTube URL' });
    }
    
    const result = await fetchYouTubeTranscript(url);
    res.json(result);
});

// YouTube Transcript Summarizer endpoint (from URL)
router.post('/summarize', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ success: false, error: 'URL is required' });
    }
    
    if (!isValidYouTubeUrl(url)) {
        return res.status(400).json({ success: false, error: 'Please provide a valid YouTube URL' });
    }
    
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ 
            success: false, 
            error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.' 
        });
    }
    
    try {
        // Set headers for Server-Sent Events
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        // Step 1: Fetch transcript
        console.log("Step 1: Fetching transcript from URL...");
        const transcriptResult = await fetchYouTubeTranscript(url);
        
        if (!transcriptResult.success) {
            res.write(`data: ${JSON.stringify({ type: 'error', message: transcriptResult.error })}\n\n`);
            res.end();
            return;
        }
        
        // Send video info and transcript
        res.write(`data: ${JSON.stringify({ 
            type: 'info', 
            data: {
                title: transcriptResult.data.title,
                channel: transcriptResult.data.channel,
                duration: transcriptResult.data.duration,
                transcript: transcriptResult.data.transcript,
                wordCount: transcriptResult.data.transcript.split(/\s+/).length
            }
        })}\n\n`);
        
        // Step 2: Stream summary
        console.log("Step 2: Streaming AI summary...");
        await summarizeTranscript(transcriptResult.data.transcript, res);
        
        res.write('data: [DONE]\n\n');
        res.end();
        
    } catch (error) {
        console.error('Error in summarize endpoint:', error);
        res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
        res.end();
    }
});

// YouTube Transcript Summarizer endpoint (from pasted text)
router.post('/summarize-text', async (req, res) => {
    const { transcript } = req.body;
    
    if (!transcript) {
        return res.status(400).json({ success: false, error: 'Transcript is required' });
    }
    
    if (transcript.length < 50) {
        return res.status(400).json({ success: false, error: 'Transcript is too short' });
    }
    
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ 
            success: false, 
            error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.' 
        });
    }
    
    try {
        // Set headers for Server-Sent Events
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        // Send transcript info
        res.write(`data: ${JSON.stringify({ 
            type: 'transcript', 
            content: transcript
        })}\n\n`);
        
        // Stream summary
        console.log("Streaming AI summary for pasted transcript...");
        await summarizeTranscript(transcript, res);
        
        res.write('data: [DONE]\n\n');
        res.end();
        
    } catch (error) {
        console.error('Error in summarize-text endpoint:', error);
        res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
        res.end();
    }
});

module.exports = router;
