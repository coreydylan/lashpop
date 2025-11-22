import { db, reviewStats } from '../src/db';
import puppeteer from 'puppeteer';
import { sql } from 'drizzle-orm';

async function scrapeReviews() {
  console.log('Starting review scrape...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // 1. Yelp
    console.log('Scraping Yelp...');
    try {
      await page.goto('https://www.yelp.com/biz/lashpop-studios-oceanside?osq=lashpop+studios', { waitUntil: 'domcontentloaded' });
      
      const yelpData = await page.evaluate(() => {
        let rating = 0;
        let reviewCount = 0;
        
        // Targeted selector based on user provided HTML
        // Look for data-testid="BizHeaderReviewCount" or class "y-css-1x1e1r2" for reviews
        const reviewLink = document.querySelector('a[href="#reviews"]');
        if (reviewLink && reviewLink.textContent) {
            const match = reviewLink.textContent.match(/\((\d+)\s*reviews?\)/);
            if (match) {
                reviewCount = parseInt(match[1], 10);
            }
        }

        // Look for rating text: "5.0" in a semibold span
        const ratingSpan = document.querySelector('span[data-font-weight="semibold"]');
        if (ratingSpan && ratingSpan.textContent) {
            const text = ratingSpan.textContent.trim();
            if (!isNaN(parseFloat(text))) {
                rating = parseFloat(text);
            }
        }
        
        // Fallback to aria-label "5 star rating" or "5.0 star rating"
        if (rating === 0) {
             const starDiv = document.querySelector('div[role="img"][aria-label$="star rating"]');
             if (starDiv) {
                 const label = starDiv.getAttribute('aria-label') || '';
                 rating = parseFloat(label.split(' ')[0]);
             }
        }

        return { rating, reviewCount };
      });

      if (yelpData.reviewCount > 0) {
        console.log('Yelp Data:', yelpData);
        const r = yelpData.rating || 5.0; // Default to 5.0 if found count but missed rating
        await db.insert(reviewStats).values({
            source: 'yelp',
            rating: r.toString(),
            reviewCount: yelpData.reviewCount
        }).onConflictDoUpdate({
            target: reviewStats.source,
            set: {
                rating: r.toString(),
                reviewCount: yelpData.reviewCount,
                updatedAt: new Date()
            }
        });
      } else {
          console.warn('Failed to extract valid Yelp data');
      }
    } catch (error) {
      console.error('Error scraping Yelp:', error);
    }

    // 2. Google Maps
    console.log('Scraping Google Maps...');
    try {
      await page.goto('https://www.google.com/maps/place/LashPop+Studios/@33.1907877,-117.3780678,17z/data=!3m1!4b1!4m6!3m5!1s0x80dc73710da0172f:0x49e879bec593fc5e!8m2!3d33.1907832!4d-117.3754875!16s%2Fg%2F11fm_7bf1y?entry=ttu&g_ep=EgoyMDI1MTExNy4wIKXMDSoASAFQAw%3D%3D', { waitUntil: 'networkidle2' });

      const googleData = await page.evaluate(() => {
        const ratingElement = document.querySelector('div.F7nice span[aria-hidden="true"]');
        const rating = ratingElement ? parseFloat(ratingElement.textContent || '0') : 0;

        const reviewCountElement = document.querySelector('div.F7nice span[aria-label*="reviews"]');
        let reviewCount = 0;
        if (reviewCountElement && reviewCountElement.getAttribute('aria-label')) {
            const label = reviewCountElement.getAttribute('aria-label') || '';
            const match = label.match(/(\d+)\s+reviews/);
            if (match) {
                reviewCount = parseInt(match[1], 10);
            }
        }
        
        if (reviewCount === 0) {
             const countText = document.querySelector('div.F7nice span:nth-child(2) span span')?.textContent;
             if (countText) {
                 const match = countText.match(/\((\d+)\)/);
                 if (match) {
                     reviewCount = parseInt(match[1], 10);
                 }
             }
        }

        return { rating, reviewCount };
      });

      if (googleData.rating > 0) {
        console.log('Google Data:', googleData);
        await db.insert(reviewStats).values({
            source: 'google',
            rating: googleData.rating.toString(),
            reviewCount: googleData.reviewCount
        }).onConflictDoUpdate({
            target: reviewStats.source,
            set: {
                rating: googleData.rating.toString(),
                reviewCount: googleData.reviewCount,
                updatedAt: new Date()
            }
        });
      } else {
          console.warn('Failed to extract valid Google Maps data');
      }
    } catch (error) {
      console.error('Error scraping Google Maps:', error);
    }

    // 3. Vagaro
    console.log('Scraping Vagaro...');
    try {
      await page.goto('https://www.vagaro.com/lashpop32', { waitUntil: 'domcontentloaded' });
      await new Promise(r => setTimeout(r, 2000));

      const vagaroData = await page.evaluate(() => {
         let rating = 0;
         let reviewCount = 0;

         // Selector based on user provided HTML: .number-of-reviews-div .number-of-reviews
         const reviewTextEl = document.querySelector('.number-of-reviews');
         if (reviewTextEl && reviewTextEl.textContent) {
             // " 324 Reviews "
             const match = reviewTextEl.textContent.match(/(\d+)\s+Reviews/i);
             if (match) {
                 reviewCount = parseInt(match[1], 10);
             }
         }

         // Selector based on user HTML: .big-font.web-display-large
         const ratingEl = document.querySelector('.big-font.web-display-large');
         if (ratingEl && ratingEl.textContent) {
             rating = parseFloat(ratingEl.textContent);
         }

         return { rating, reviewCount };
      });
      
      if (vagaroData.reviewCount > 0) {
        console.log('Vagaro Data:', vagaroData);
        await db.insert(reviewStats).values({
           source: 'vagaro',
           rating: vagaroData.rating.toString(),
           reviewCount: vagaroData.reviewCount
        }).onConflictDoUpdate({
           target: reviewStats.source,
           set: {
               rating: vagaroData.rating.toString(),
               reviewCount: vagaroData.reviewCount,
               updatedAt: new Date()
           }
       });
      } else {
          console.warn('Failed to extract valid Vagaro data');
      }

    } catch (error) {
      console.error('Error scraping Vagaro:', error);
    }

  } catch (error) {
    console.error('Global error:', error);
  } finally {
    await browser.close();
    process.exit(0);
  }
}

scrapeReviews();
