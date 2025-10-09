const express = require('express');
const { chromium } = require("playwright");
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Scraping function
async function scrapeWebsite(url) {
    let browser;
    try {
        console.log("Connecting to the browser...");
        browser = await chromium.connectOverCDP(
            "wss://vashishthakkapoor_gmail_com-country-any-sid-f865a3ca2aa24-pid-1e6c5be9c2684:7z0kq0vvis@browser.nodemaven.com"
        );
        console.log("Connected to the browser! Opening a new page...");

        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        
        // Extract data
        const data = await page.evaluate(() => {
            // Title
            const title = document.title;
            
            // Meta Title
            const metaTitle = document.querySelector('meta[property="og:title"]')?.content || 
                            document.querySelector('meta[name="twitter:title"]')?.content || 
                            title;
            
            // Meta Description
            const metaDescription = document.querySelector('meta[name="description"]')?.content || 
                                  document.querySelector('meta[property="og:description"]')?.content || 
                                  document.querySelector('meta[name="twitter:description"]')?.content || 
                                  '';
            
            // Schema data
            const schemaScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
            let schemaData = [];
            schemaScripts.forEach(script => {
                try {
                    const parsed = JSON.parse(script.textContent);
                    schemaData.push(parsed);
                } catch (e) {
                    console.error('Error parsing schema:', e);
                }
            });
            
            // Favicon URL
            let faviconUrl = '';
            const faviconLink = document.querySelector('link[rel="icon"]') || 
                              document.querySelector('link[rel="shortcut icon"]') || 
                              document.querySelector('link[rel="apple-touch-icon"]');
            
            if (faviconLink) {
                faviconUrl = faviconLink.href;
            } else {
                // Default favicon location
                const baseUrl = new URL(window.location.href);
                faviconUrl = `${baseUrl.origin}/favicon.ico`;
            }
            
            return {
                title,
                metaTitle,
                metaDescription,
                schemaData,
                faviconUrl
            };
        });
        
        await browser.close();
        return { success: true, data };
        
    } catch (error) {
        if (browser) {
            await browser.close();
        }
        console.error('Error scraping website:', error);
        return { success: false, error: error.message };
    }
}

// SEO Analysis function
function analyzeSEO(data, keyword) {
    if (!keyword) {
        return null;
    }

    const keywordLower = keyword.toLowerCase();
    const titleLower = (data.title || '').toLowerCase();
    const metaTitleLower = (data.metaTitle || '').toLowerCase();
    const descriptionLower = (data.metaDescription || '').toLowerCase();
    
    // Get first 5 words of title
    const titleWords = data.title ? data.title.trim().split(/\s+/).slice(0, 5) : [];
    const first5Words = titleWords.join(' ').toLowerCase();
    
    // Check if keyword exists in schema
    const schemaString = JSON.stringify(data.schemaData || []).toLowerCase();
    const keywordInSchema = schemaString.includes(keywordLower);
    
    // Perform checks
    const analysis = {
        keyword: keyword,
        checks: {
            keywordInTitle: {
                status: titleLower.includes(keywordLower),
                message: titleLower.includes(keywordLower) 
                    ? '✓ Keyword found in title' 
                    : '✗ Keyword not found in title'
            },
            keywordInMetaTitle: {
                status: metaTitleLower.includes(keywordLower),
                message: metaTitleLower.includes(keywordLower) 
                    ? '✓ Keyword found in meta title' 
                    : '✗ Keyword not found in meta title'
            },
            keywordInDescription: {
                status: descriptionLower.includes(keywordLower),
                message: descriptionLower.includes(keywordLower) 
                    ? '✓ Keyword found in meta description' 
                    : '✗ Keyword not found in meta description'
            },
            keywordInSchema: {
                status: keywordInSchema,
                message: keywordInSchema 
                    ? '✓ Keyword found in schema markup' 
                    : '✗ Keyword not found in schema markup'
            },
            keywordInFirst5Words: {
                status: first5Words.includes(keywordLower),
                message: first5Words.includes(keywordLower) 
                    ? '✓ Keyword appears in first 5 words of title' 
                    : '✗ Keyword not in first 5 words of title'
            },
            titleLength: {
                status: data.title && data.title.length <= 60,
                length: data.title ? data.title.length : 0,
                message: !data.title 
                    ? '✗ No title found' 
                    : data.title.length <= 60 
                        ? `✓ Title length is optimal (${data.title.length} characters)` 
                        : `✗ Title is too long (${data.title.length} characters, recommended: 60 or less)`
            },
            descriptionLength: {
                status: data.metaDescription && data.metaDescription.length > 0 && data.metaDescription.length <= 160,
                length: data.metaDescription ? data.metaDescription.length : 0,
                message: !data.metaDescription 
                    ? '✗ No meta description found' 
                    : data.metaDescription.length === 0
                        ? '✗ Meta description is empty'
                        : data.metaDescription.length <= 160 
                            ? `✓ Description length is optimal (${data.metaDescription.length} characters)` 
                            : `✗ Description is too long (${data.metaDescription.length} characters, recommended: 160 or less)`
            }
        }
    };

    // Calculate overall score
    const checksArray = Object.values(analysis.checks);
    const passedChecks = checksArray.filter(check => check.status).length;
    const totalChecks = checksArray.length;
    analysis.score = {
        passed: passedChecks,
        total: totalChecks,
        percentage: Math.round((passedChecks / totalChecks) * 100)
    };

    return analysis;
}

// API endpoint
app.post('/scrape', async (req, res) => {
    const { url, keyword } = req.body;
    
    if (!url) {
        return res.status(400).json({ success: false, error: 'URL is required' });
    }
    
    // Validate URL
    try {
        new URL(url);
    } catch (e) {
        return res.status(400).json({ success: false, error: 'Invalid URL format' });
    }
    
    const result = await scrapeWebsite(url);
    
    // Add SEO analysis if keyword provided
    if (result.success && keyword && keyword.trim()) {
        result.seoAnalysis = analyzeSEO(result.data, keyword.trim());
    }
    
    res.json(result);
});

// Amazon scraping function
async function scrapeAmazon(url) {
    let browser;
    try {
        console.log("Connecting to the browser for Amazon...");
        browser = await chromium.connectOverCDP(
            "wss://vashishthakkapoor_gmail_com-country-any-sid-f865a3ca2aa24-pid-1e6c5be9c2684:7z0kq0vvis@browser.nodemaven.com"
        );
        console.log("Connected! Opening Amazon page...");

        const page = await browser.newPage();
        
        // Set user agent to avoid bot detection
        await page.setExtraHTTPHeaders({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9'
        });
        
        // Use 'domcontentloaded' instead of 'networkidle' and increase timeout
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        
        // Wait for key elements to load
        try {
            await Promise.race([
                page.waitForSelector('#productTitle', { timeout: 10000 }),
                page.waitForSelector('.a-price', { timeout: 10000 }),
                page.waitForTimeout(5000) // Fallback wait
            ]);
        } catch (e) {
            console.log('Some elements may not have loaded, continuing anyway...');
        }
        
        // Additional wait for dynamic content
        await page.waitForTimeout(2000);
        
        // Extract Amazon product data
        const data = await page.evaluate((productUrl) => {
            // Helper function to clean text
            const cleanText = (text) => text ? text.trim().replace(/\s+/g, ' ') : '';
            
            // Title
            const title = document.querySelector('#productTitle')?.textContent ||
                         document.querySelector('h1.product-title')?.textContent ||
                         document.querySelector('h1')?.textContent || '';
            
            // Price - multiple selectors for different Amazon layouts
            let price = '';
            const priceWhole = document.querySelector('.a-price-whole')?.textContent;
            const priceFraction = document.querySelector('.a-price-fraction')?.textContent;
            const priceSymbol = document.querySelector('.a-price-symbol')?.textContent;
            
            if (priceWhole) {
                price = `${priceSymbol || '$'}${priceWhole}${priceFraction || ''}`;
            } else {
                price = document.querySelector('#priceblock_ourprice')?.textContent ||
                       document.querySelector('#priceblock_dealprice')?.textContent ||
                       document.querySelector('.a-price .a-offscreen')?.textContent ||
                       document.querySelector('#price_inside_buybox')?.textContent ||
                       'Price not available';
            }
            
            // Original price (if on sale)
            let originalPrice = '';
            const listPrice = document.querySelector('.a-text-price .a-offscreen')?.textContent ||
                            document.querySelector('#priceblock_saleprice')?.textContent;
            if (listPrice && listPrice !== price) {
                originalPrice = listPrice;
            }
            
            // Rating
            const rating = document.querySelector('[data-hook="rating-out-of-text"]')?.textContent?.split(' ')[0] ||
                          document.querySelector('.a-icon-star .a-icon-alt')?.textContent?.split(' ')[0] ||
                          '';
            
            // Review count
            const reviewCount = document.querySelector('#acrCustomerReviewText')?.textContent?.split(' ')[0] ||
                               document.querySelector('[data-hook="total-review-count"]')?.textContent ||
                               '';
            
            // Availability
            const availability = document.querySelector('#availability span')?.textContent ||
                               document.querySelector('.a-color-success')?.textContent ||
                               document.querySelector('.a-color-state')?.textContent ||
                               'Availability unknown';
            
            // Image
            const image = document.querySelector('#landingImage')?.src ||
                         document.querySelector('#imgBlkFront')?.src ||
                         document.querySelector('.a-dynamic-image')?.src ||
                         '';
            
            // Brand
            const brand = document.querySelector('#bylineInfo')?.textContent?.replace('Visit the', '').replace('Store', '').trim() ||
                         document.querySelector('.a-row.a-spacing-small a')?.textContent ||
                         '';
            
            // ASIN
            let asin = '';
            const asinMatch = productUrl.match(/\/dp\/([A-Z0-9]{10})/);
            if (asinMatch) {
                asin = asinMatch[1];
            } else {
                // Try to find in page
                const detailBullets = document.querySelector('#detailBullets_feature_div');
                if (detailBullets) {
                    const asinText = detailBullets.textContent;
                    const match = asinText.match(/ASIN[:\s]+([A-Z0-9]{10})/);
                    if (match) asin = match[1];
                }
            }
            
            // Category
            const category = document.querySelector('#wayfinding-breadcrumbs_feature_div a')?.textContent ||
                           document.querySelector('.a-breadcrumb a')?.textContent ||
                           '';
            
            return {
                title: cleanText(title),
                price: cleanText(price),
                originalPrice: cleanText(originalPrice),
                rating: rating,
                reviewCount: reviewCount,
                availability: cleanText(availability),
                image: image,
                brand: cleanText(brand),
                asin: asin,
                category: cleanText(category),
                url: productUrl,
                priceNote: originalPrice ? 'Sale price shown' : ''
            };
        }, url);
        
        await browser.close();
        return { success: true, data };
        
    } catch (error) {
        if (browser) {
            await browser.close();
        }
        console.error('Error scraping Amazon:', error);
        return { success: false, error: error.message };
    }
}

// Amazon API endpoint
app.post('/amazon/check', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ success: false, error: 'URL is required' });
    }
    
    // Validate URL
    try {
        const urlObj = new URL(url);
        if (!urlObj.hostname.includes('amazon')) {
            return res.status(400).json({ success: false, error: 'Please provide a valid Amazon URL' });
        }
    } catch (e) {
        return res.status(400).json({ success: false, error: 'Invalid URL format' });
    }
    
    const result = await scrapeAmazon(url);
    res.json(result);
});

// Amazon reviews scraping function
async function scrapeAmazonReviews(url) {
    let browser;
    try {
        console.log("Connecting to the browser for Amazon Reviews...");
        browser = await chromium.connectOverCDP(
            "wss://vashishthakkapoor_gmail_com-country-any-sid-f865a3ca2aa24-pid-1e6c5be9c2684:7z0kq0vvis@browser.nodemaven.com"
        );
        console.log("Connected! Opening Amazon reviews page...");

        const page = await browser.newPage();
        
        // Set user agent
        await page.setExtraHTTPHeaders({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9'
        });
        
        // First, go to the product page
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        
        // Wait for page elements
        try {
            await Promise.race([
                page.waitForSelector('#productTitle', { timeout: 10000 }),
                page.waitForSelector('[data-hook="review"]', { timeout: 10000 }),
                page.waitForTimeout(5000)
            ]);
        } catch (e) {
            console.log('Initial page elements not loaded, continuing...');
        }

        console.log('Product page loaded, looking for reviews...');
        
        // Try to find reviews on the product page first (usually has top reviews)
        let reviewsFromProductPage = await page.evaluate(() => {
            const reviewElements = document.querySelectorAll('[data-hook="review"]');
            const extractedReviews = [];
            
            console.log('Found reviews on product page:', reviewElements.length);
            
            const reviewsToProcess = Array.from(reviewElements).slice(0, 5);
            
            reviewsToProcess.forEach(reviewEl => {
                try {
                    const ratingEl = reviewEl.querySelector('[data-hook="review-star-rating"]') || 
                                    reviewEl.querySelector('i[data-hook="review-star-rating"]');
                    
                    let rating = 0;
                    if (ratingEl) {
                        const ratingText = ratingEl.textContent || ratingEl.getAttribute('class') || '';
                        const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
                        rating = ratingMatch ? Math.round(parseFloat(ratingMatch[1])) : 0;
                    }
                    
                    const titleEl = reviewEl.querySelector('[data-hook="review-title"]') || 
                                   reviewEl.querySelector('a[data-hook="review-title"]');
                    let title = titleEl ? titleEl.textContent?.trim() : '';
                    title = title.replace(/^\d+\.?\d*\s+out of \d+ stars\s*/i, '').trim();
                    
                    const authorEl = reviewEl.querySelector('.a-profile-name');
                    const author = authorEl ? authorEl.textContent?.trim() : 'Anonymous';
                    
                    const dateEl = reviewEl.querySelector('[data-hook="review-date"]');
                    let date = dateEl ? dateEl.textContent?.trim() : '';
                    date = date.replace(/Reviewed in [^o]* on /i, '').replace(/^on /i, '').trim();
                    
                    const textEl = reviewEl.querySelector('[data-hook="review-body"]') || 
                                  reviewEl.querySelector('.review-text-content span');
                    const text = textEl ? textEl.textContent?.trim() : '';
                    
                    const verifiedEl = reviewEl.querySelector('[data-hook="avp-badge"]');
                    const verified = verifiedEl !== null;
                    
                    const helpfulEl = reviewEl.querySelector('[data-hook="helpful-vote-statement"]');
                    const helpfulText = helpfulEl ? helpfulEl.textContent : '';
                    const helpfulMatch = helpfulText.match(/(\d+)/);
                    const helpful = helpfulMatch ? parseInt(helpfulMatch[1]) : 0;
                    
                    if (rating > 0 || text.length > 0) {
                        extractedReviews.push({
                            rating: rating || 0,
                            title: title || 'No title',
                            author: author,
                            date: date || 'Date not available',
                            text: text || 'No review text',
                            verified: verified,
                            helpful: helpful > 0 ? helpful : null
                        });
                    }
                } catch (e) {
                    console.error('Error parsing review:', e.message);
                }
            });
            
            return extractedReviews;
        });
        
        console.log('Extracted', reviewsFromProductPage.length, 'reviews from product page');
        
        // If we found reviews on product page, return them
        if (reviewsFromProductPage.length > 0) {
            await browser.close();
            return { success: true, reviews: reviewsFromProductPage, total: reviewsFromProductPage.length };
        }
        
        console.log('No reviews on product page, trying dedicated reviews page...');

        // Otherwise, try to navigate to reviews page
        let reviewsUrl = url;
        
        // Check if we can find the "See all reviews" link
        const seeAllReviewsLink = await page.$('[data-hook="see-all-reviews-link-foot"]') || 
                                  await page.$('a[data-hook="see-all-reviews-link"]');
        
        if (seeAllReviewsLink) {
            reviewsUrl = await page.evaluate(el => el.href, seeAllReviewsLink);
            console.log("Found reviews page URL:", reviewsUrl);
            await page.goto(reviewsUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
            await page.waitForTimeout(3000);
        } else {
            // Extract ASIN and construct reviews URL
            const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/);
            if (asinMatch) {
                const asin = asinMatch[1];
                const baseUrl = new URL(url);
                reviewsUrl = `${baseUrl.origin}/product-reviews/${asin}/`;
                console.log("Constructed reviews URL:", reviewsUrl);
                await page.goto(reviewsUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
                await page.waitForTimeout(3000);
            }
        }

        // Wait for reviews to load - try multiple selectors
        let reviewSelector = '[data-hook="review"]';
        try {
            await page.waitForSelector('[data-hook="review"]', { timeout: 5000 });
            console.log('Found reviews with [data-hook="review"]');
        } catch (e) {
            try {
                await page.waitForSelector('.review', { timeout: 5000 });
                reviewSelector = '.review';
                console.log('Found reviews with .review class');
            } catch (e2) {
                try {
                    await page.waitForSelector('#cm_cr-review_list', { timeout: 5000 });
                    console.log('Found review container #cm_cr-review_list');
                } catch (e3) {
                    console.log('Could not find reviews with any selector, will try to extract anyway...');
                }
            }
        }
        
        // Log page content for debugging
        const pageContent = await page.content();
        console.log('Page title:', await page.title());
        console.log('Page URL:', page.url());
        console.log('Page has reviews container:', pageContent.includes('customer review'));
        
        // Extract TOP 5 reviews from the page
        const reviews = await page.evaluate(() => {
            // Try multiple selectors
            let reviewElements = document.querySelectorAll('[data-hook="review"]');
            
            if (reviewElements.length === 0) {
                console.log('Trying alternative selector: .review');
                reviewElements = document.querySelectorAll('.review');
            }
            
            if (reviewElements.length === 0) {
                console.log('Trying alternative selector: [id^="customer_review"]');
                reviewElements = document.querySelectorAll('[id^="customer_review"]');
            }
            
            if (reviewElements.length === 0) {
                console.log('Trying to find reviews in container');
                const container = document.querySelector('#cm_cr-review_list');
                if (container) {
                    reviewElements = container.querySelectorAll('div[data-hook="review"], div.review, div[id*="review"]');
                }
            }
            
            console.log('Found review elements:', reviewElements.length);
            
            const extractedReviews = [];
            
            // Limit to first 5 reviews
            const reviewsToProcess = Array.from(reviewElements).slice(0, 5);
            console.log('Processing reviews:', reviewsToProcess.length);
            
            reviewsToProcess.forEach(reviewEl => {
                try {
                    // Rating
                    const ratingEl = reviewEl.querySelector('[data-hook="review-star-rating"]') || 
                                    reviewEl.querySelector('i[data-hook="review-star-rating"]') ||
                                    reviewEl.querySelector('.review-rating');
                    
                    let rating = 0;
                    if (ratingEl) {
                        const ratingText = ratingEl.textContent || ratingEl.getAttribute('class') || '';
                        const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
                        rating = ratingMatch ? Math.round(parseFloat(ratingMatch[1])) : 0;
                    }
                    
                    // Title - with multiple fallbacks
                    const titleEl = reviewEl.querySelector('[data-hook="review-title"]') || 
                                   reviewEl.querySelector('a[data-hook="review-title"]') ||
                                   reviewEl.querySelector('.review-title');
                    let title = titleEl ? titleEl.textContent?.trim() : '';
                    
                    // Remove "5.0 out of 5 stars" prefix from title if present
                    title = title.replace(/^\d+\.?\d*\s+out of \d+ stars\s*/i, '').trim();
                    
                    // Author
                    const authorEl = reviewEl.querySelector('.a-profile-name') || 
                                    reviewEl.querySelector('[data-hook="review-author"]') ||
                                    reviewEl.querySelector('.a-profile-content .a-profile-name');
                    const author = authorEl ? authorEl.textContent?.trim() : 'Anonymous';
                    
                    // Date
                    const dateEl = reviewEl.querySelector('[data-hook="review-date"]') ||
                                  reviewEl.querySelector('.review-date');
                    let date = dateEl ? dateEl.textContent?.trim() : '';
                    // Clean up date - remove "Reviewed in [country] on" prefix
                    date = date.replace(/Reviewed in [^o]* on /i, '').replace(/^on /i, '').trim();
                    
                    // Review text
                    const textEl = reviewEl.querySelector('[data-hook="review-body"]') || 
                                  reviewEl.querySelector('.review-text-content') ||
                                  reviewEl.querySelector('.review-text');
                    const text = textEl ? textEl.textContent?.trim() : '';
                    
                    // Verified purchase
                    const verifiedEl = reviewEl.querySelector('[data-hook="avp-badge"]') ||
                                      reviewEl.querySelector('.avp-badge');
                    const verified = verifiedEl !== null;
                    
                    // Helpful count
                    const helpfulEl = reviewEl.querySelector('[data-hook="helpful-vote-statement"]') ||
                                     reviewEl.querySelector('.cr-vote-text');
                    const helpfulText = helpfulEl ? helpfulEl.textContent : '';
                    const helpfulMatch = helpfulText.match(/(\d+)/);
                    const helpful = helpfulMatch ? parseInt(helpfulMatch[1]) : 0;
                    
                    // Only add if we have at least a rating and some text
                    if (rating > 0 || text.length > 0) {
                        extractedReviews.push({
                            rating: rating || 0,
                            title: title || 'No title',
                            author: author,
                            date: date || 'Date not available',
                            text: text || 'No review text',
                            verified: verified,
                            helpful: helpful > 0 ? helpful : null
                        });
                    }
                } catch (e) {
                    console.error('Error parsing individual review:', e);
                }
            });
            
            return extractedReviews;
        });
        
        console.log('Extracted reviews count:', reviews.length);
        console.log('Sample review data:', reviews[0]);
        
        await browser.close();
        
        if (reviews.length === 0) {
            return { success: false, error: 'No reviews found. The product may not have reviews yet.' };
        }
        
        return { success: true, reviews, total: reviews.length };
        
    } catch (error) {
        if (browser) {
            await browser.close();
        }
        console.error('Error scraping Amazon reviews:', error);
        return { success: false, error: error.message };
    }
}

// Amazon reviews API endpoint
app.post('/amazon/reviews', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ success: false, error: 'URL is required' });
    }
    
    // Validate URL
    try {
        const urlObj = new URL(url);
        if (!urlObj.hostname.includes('amazon')) {
            return res.status(400).json({ success: false, error: 'Please provide a valid Amazon URL' });
        }
    } catch (e) {
        return res.status(400).json({ success: false, error: 'Invalid URL format' });
    }
    
    const result = await scrapeAmazonReviews(url);
    res.json(result);
});

// YouTube Transcript Fetcher endpoint
app.post('/youtube/transcript', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ success: false, error: 'URL is required' });
    }
    
    // Validate YouTube URL
    try {
        const urlObj = new URL(url);
        if (!urlObj.hostname.includes('youtube.com') && !urlObj.hostname.includes('youtu.be')) {
            return res.status(400).json({ success: false, error: 'Please provide a valid YouTube URL' });
        }
    } catch (e) {
        return res.status(400).json({ success: false, error: 'Invalid URL format' });
    }
    
    const result = await fetchYouTubeTranscript(url);
    res.json(result);
});

// YouTube transcript scraping function
async function fetchYouTubeTranscript(url) {
    let browser;
    try {
        console.log("Connecting to browser for YouTube transcript...");
        browser = await chromium.connectOverCDP(
            "wss://vashishthakkapoor_gmail_com-country-any-sid-f865a3ca2aa24-pid-1e6c5be9c2684:7z0kq0vvis@browser.nodemaven.com"
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

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});