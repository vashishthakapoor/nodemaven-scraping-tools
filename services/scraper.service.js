const { chromium } = require("playwright");

// Website scraper function
async function scrapeWebsite(url) {
    let browser;
    try {
        console.log("Connecting to the browser...");
        browser = await chromium.connectOverCDP(
            "wss://vashishthakkapoor_gmail_com-country-any-sid-f865a3ca2aa24-pid-1e6c5be9c2684:7z0kq0vvis@browser.nodemaven.com"
        );
        console.log("Connected to the browser! Opening a new page...");

        const page = await browser.newPage();
        
        // Set user agent
        await page.setExtraHTTPHeaders({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
        
        console.log(`Navigating to: ${url}`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // Wait a bit for dynamic content
        await page.waitForTimeout(1500);
        
        console.log("Page loaded, extracting data...");
        
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

module.exports = {
    scrapeWebsite,
    analyzeSEO
};
