const { chromium } = require("playwright");

// Amazon product scraper function
async function scrapeAmazon(url) {
    let browser;
    try {
        console.log("Connecting to the browser...");
        browser = await chromium.connectOverCDP(
            "wss://vashishthakkapoor_gmail_com-country-us-pid-53c16f748fe14:d1e518a153184@browser.nodemaven.com"
        );
        console.log("Connected to the browser! Opening a new page...");

        const page = await browser.newPage();
        
        // Set user agent to avoid bot detection
        await page.setExtraHTTPHeaders({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
        
        console.log(`Navigating to: ${url}`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        
        // Wait a bit for dynamic content to load
        await page.waitForTimeout(2000);
        
        console.log("Page loaded, extracting data...");
        
        // Extract product data
        const data = await page.evaluate((productUrl) => {
            // Helper function to clean text
            const cleanText = (text) => text ? text.trim().replace(/\s+/g, ' ') : '';
            
            // Product Title
            const title = document.querySelector('#productTitle')?.textContent ||
                         document.querySelector('h1.product-title')?.textContent ||
                         document.querySelector('h1')?.textContent || '';
            
            // Price - multiple selectors for different layouts
            let price = '';
            const priceWhole = document.querySelector('.a-price-whole')?.textContent;
            const priceFraction = document.querySelector('.a-price-fraction')?.textContent;
            const priceSymbol = document.querySelector('.a-price-symbol')?.textContent;
            
            if (priceWhole) {
                price = `${priceSymbol || '₹'}${priceWhole}${priceFraction || ''}`;
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
            
            // Rating - extract just the number
            const rating = document.querySelector('[data-hook="rating-out-of-text"]')?.textContent?.split(' ')[0] ||
                          document.querySelector('.a-icon-star .a-icon-alt')?.textContent?.split(' ')[0] ||
                          '';
            
            // Review count - extract just the number
            const reviewCount = document.querySelector('#acrCustomerReviewText')?.textContent?.split(' ')[0] ||
                               document.querySelector('[data-hook="total-review-count"]')?.textContent ||
                               '';
            
            // Availability
            const availability = document.querySelector('#availability span')?.textContent ||
                               document.querySelector('.a-color-success')?.textContent ||
                               document.querySelector('.a-color-state')?.textContent ||
                               'Availability unknown';
            
            // Product Image - high quality
            const image = document.querySelector('#landingImage')?.src ||
                         document.querySelector('#imgBlkFront')?.src ||
                         document.querySelector('.a-dynamic-image')?.src ||
                         document.querySelector('#altImages img')?.src ||
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
            
            // Product Features
            const featureElements = document.querySelectorAll('#feature-bullets ul li span.a-list-item');
            const features = Array.from(featureElements).map(el => el.textContent.trim()).filter(f => f);
            
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
                features: features,
                url: productUrl,
                priceNote: originalPrice ? 'Sale price shown' : ''
            };
        }, url);
        
        console.log("Data extracted successfully:", {
            hasTitle: !!data.title,
            hasPrice: data.price !== 'Price not available',
            hasImage: !!data.image,
            hasBrand: !!data.brand,
            hasAsin: !!data.asin,
            hasCategory: !!data.category,
            rating: data.rating,
            reviewCount: data.reviewCount,
            featuresCount: data.features.length
        });
        
        await browser.close();
        return { success: true, data };
        
    } catch (error) {
        if (browser) {
            await browser.close();
        }
        console.error('Error scraping Amazon product:', error);
        return { success: false, error: error.message };
    }
}

// Amazon reviews scraper function
async function scrapeAmazonReviews(url) {
    let browser;
    try {
        console.log("Connecting to the browser for reviews...");
        browser = await chromium.connectOverCDP(
            "wss://vashishthakkapoor_gmail_com-country-us-pid-53c16f748fe14:d1e518a153184@browser.nodemaven.com"
        );
        console.log("Connected to the browser! Opening reviews page...");

        const page = await browser.newPage();
        
        // Set user agent to avoid bot detection
        await page.setExtraHTTPHeaders({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9'
        });
        
        // First, go to the product page (reviews are often shown there)
        console.log(`Navigating to product page: ${url}`);
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
                    
                    // Review text - be more specific to avoid scripts
                    const textEl = reviewEl.querySelector('[data-hook="review-body"] span') || 
                                  reviewEl.querySelector('[data-hook="review-body"]') || 
                                  reviewEl.querySelector('.review-text-content span:not(.cr-original-review-text)');
                    let text = textEl ? textEl.textContent?.trim() : '';
                    
                    // Clean up the text - remove any script content
                    text = text.replace(/\(function\(\)\s*\{[\s\S]*?\}\);/g, '')  // Remove inline scripts
                               .replace(/\.review-text-read-more-expander[\s\S]*?Read (more|less)/g, '')  // Remove CSS and read more text
                               .trim();
                    
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

        // Otherwise, navigate to dedicated reviews page
        let reviewsUrl = url;
        
        // Check if we can find the "See all reviews" link
        const seeAllReviewsLink = await page.$('[data-hook="see-all-reviews-link-foot"]') || 
                                  await page.$('a[data-hook="see-all-reviews-link"]');
        
        if (seeAllReviewsLink) {
            reviewsUrl = await page.evaluate(el => el.href, seeAllReviewsLink);
            console.log("Found 'See all reviews' link:", reviewsUrl);
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

        console.log("Reviews page loaded, extracting reviews...");
        
        // Wait for reviews to load - try multiple selectors
        try {
            await page.waitForSelector('[data-hook="review"]', { timeout: 5000 });
            console.log('Found reviews with [data-hook="review"]');
        } catch (e) {
            try {
                await page.waitForSelector('.review', { timeout: 5000 });
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
        
        // Log page info for debugging
        console.log('Page title:', await page.title());
        console.log('Page URL:', page.url());
        
        // Extract top 5 reviews
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
                    
                    // Review text - be more specific to avoid scripts
                    const textEl = reviewEl.querySelector('[data-hook="review-body"] span') || 
                                  reviewEl.querySelector('[data-hook="review-body"]') || 
                                  reviewEl.querySelector('.review-text-content span:not(.cr-original-review-text)') ||
                                  reviewEl.querySelector('.review-text');
                    let text = textEl ? textEl.textContent?.trim() : '';
                    
                    // Clean up the text - remove any script content
                    text = text.replace(/\(function\(\)\s*\{[\s\S]*?\}\);/g, '')  // Remove inline scripts
                               .replace(/\.review-text-read-more-expander[\s\S]*?Read (more|less)/g, '')  // Remove CSS and read more text
                               .trim();
                    
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
        if (reviews.length > 0) {
            console.log('Sample review:', reviews[0]);
        }
        
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

module.exports = {
    scrapeAmazon,
    scrapeAmazonReviews
};
