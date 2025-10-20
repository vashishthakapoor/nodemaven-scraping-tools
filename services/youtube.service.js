const { chromium } = require("playwright");

// YouTube transcript scraping function
async function fetchYouTubeTranscript(url) {
    let browser;
    try {
        console.log("Connecting to browser for YouTube transcript...");
        browser = await chromium.connectOverCDP(
            "wss://vashishthakkapoor_gmail_com-country-us-pid-53c16f748fe14:d1e518a153184@browser.nodemaven.com"
        );
        
        const page = await browser.newPage();
        
        // Set a realistic user agent
        await page.setExtraHTTPHeaders({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9'
        });
        
        console.log(`Navigating to: ${url}`);
        
        // Use domcontentloaded instead of networkidle for YouTube (faster and more reliable)
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
        
        // Wait for page to be fully loaded
        console.log("Waiting for page to load...");
        await page.waitForTimeout(5000);
        
        // Scroll down to ensure description area is loaded
        await page.evaluate(() => {
            window.scrollBy(0, 400);
        });
        await page.waitForTimeout(2000);
        
        // Step 1: Click the "...more" button in description to expand it
        console.log("Looking for '...more' button in description...");
        try {
            const moreButton = await page.$('tp-yt-paper-button#expand');
            if (moreButton) {
                const buttonText = await moreButton.textContent();
                console.log(`Found button with text: ${buttonText}`);
                if (buttonText && buttonText.includes('more')) {
                    await moreButton.click();
                    console.log("Clicked '...more' button to expand description");
                    await page.waitForTimeout(1500);
                }
            }
        } catch (e) {
            console.log("Could not find or click '...more' button:", e.message);
        }
        
        // Step 2: Find and click "Show transcript" button
        console.log("Looking for 'Show transcript' button...");
        let transcriptOpened = false;
        
        try {
            // Look for the specific button with aria-label="Show transcript"
            const transcriptButton = await page.$('button[aria-label="Show transcript"]');
            if (transcriptButton) {
                console.log("Found 'Show transcript' button, clicking...");
                await transcriptButton.click();
                transcriptOpened = true;
                await page.waitForTimeout(3000);
            }
        } catch (e) {
            console.log("Direct selector failed:", e.message);
        }
        
        // Fallback: Search through all buttons
        if (!transcriptOpened) {
            try {
                const buttons = await page.$$('button');
                for (const button of buttons) {
                    const ariaLabel = await button.getAttribute('aria-label');
                    if (ariaLabel && ariaLabel.toLowerCase().includes('show transcript')) {
                        console.log("Found transcript button via fallback search");
                        await button.click();
                        transcriptOpened = true;
                        await page.waitForTimeout(3000);
                        break;
                    }
                }
            } catch (e) {
                console.log("Fallback search failed:", e.message);
            }
        }
        
        if (!transcriptOpened) {
            console.error("Could not find or click 'Show transcript' button");
            return {
                success: false,
                error: "Could not find the 'Show transcript' button. Please ensure the video has captions/subtitles enabled."
            };
        }
        
        console.log("Transcript panel should be open, extracting data...");
        
        // Step 3: Extract transcript from #segments-container
        const transcriptData = await page.evaluate(() => {
            // Get video title
            const title = document.querySelector('h1.ytd-watch-metadata yt-formatted-string')?.textContent?.trim() ||
                         document.querySelector('h1 yt-formatted-string')?.textContent?.trim() ||
                         document.querySelector('h1')?.textContent?.trim() ||
                         document.title.replace(' - YouTube', '') ||
                         'Unknown Title';
            
            // Get video duration
            const duration = document.querySelector('.ytp-time-duration')?.textContent?.trim() || 
                           document.querySelector('.ytp-time-display')?.textContent?.split('/')[1]?.trim() || '';
            
            // Get channel name
            const channel = document.querySelector('ytd-channel-name a')?.textContent?.trim() ||
                           document.querySelector('#channel-name a')?.textContent?.trim() ||
                           'Unknown Channel';
            
            // Extract transcript from #segments-container
            const transcriptSegments = [];
            const segmentsContainer = document.querySelector('#segments-container');
            
            if (!segmentsContainer) {
                console.error("Could not find #segments-container");
                return {
                    title,
                    channel,
                    duration,
                    transcript: '',
                    segmentCount: 0,
                    error: 'segments-container not found'
                };
            }
            
            // Get all transcript segment renderers
            const segmentElements = segmentsContainer.querySelectorAll('ytd-transcript-segment-renderer');
            console.log(`Found ${segmentElements.length} transcript segments`);
            
            segmentElements.forEach(segment => {
                // Extract text from each segment
                const textElement = segment.querySelector('yt-formatted-string.segment-text');
                if (textElement) {
                    const text = textElement.textContent?.trim();
                    if (text && text.length > 0) {
                        transcriptSegments.push(text);
                    }
                }
            });
            
            // Combine all segments into one text
            const fullTranscript = transcriptSegments.join(' ');
            
            return {
                title,
                channel,
                duration,
                transcript: fullTranscript,
                segmentCount: transcriptSegments.length
            };
        });
        
        console.log(`Extracted ${transcriptData.segmentCount} transcript segments`);
        console.log(`Transcript length: ${transcriptData.transcript.length} characters`);
        
        if (!transcriptData.transcript || transcriptData.transcript.length === 0) {
            console.error("Transcript extraction failed:", transcriptData.error || "Unknown reason");
            return {
                success: false,
                error: "Could not extract transcript text. The transcript may not have loaded properly."
            };
        }
        
        console.log(`Successfully extracted transcript!`);
        
        return {
            success: true,
            data: transcriptData
        };
        
    } catch (error) {
        console.error("Error fetching YouTube transcript:", error.message);
        console.error("Stack trace:", error.stack);
        return {
            success: false,
            error: `Failed to fetch transcript: ${error.message}`
        };
    } finally {
        if (browser) {
            console.log("Closing browser connection...");
            await browser.close();
            console.log("Browser connection closed successfully");
        }
    }
}

module.exports = {
    fetchYouTubeTranscript
};
