const express = require('express');
const cors = require('cors');
const { chromium } = require('playwright');

const app = express();
app.use(cors({
  origin: "https://wp-diagnostic-frontend.vercel.app"
}));
app.use(express.json());

app.post('/api/analyze', async (req, res) => {
  const { url } = req.body;
  console.log('Analyzing:', url);
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
  const context = await browser.newContext();
  const page = await context.newPage();
  const resources = [];

  await page.route('**/*', (route) => {
    const request = route.request();
    resources.push({
      url: request.url(),
      method: request.method(),
      type: request.resourceType(),
    });
    route.continue();
  });

  try {
    await page.goto(url, { waitUntil: 'load' });

    const perfData = await page.evaluate(() => ({
      ttfb: performance.timing.responseStart - performance.timing.requestStart,
      domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
      loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
      resourceEntries: performance.getEntriesByType('resource')
    }));

    const thirdParty = perfData.resourceEntries.filter(r => {
      try {
        return new URL(r.name).hostname !== location.hostname;
      } catch { return false; }
    });

    const bottlenecks = [];
    if (perfData.ttfb > 600) {
      bottlenecks.push({ category: 'server', message: 'High TTFB - check server response time or caching.' });
    }

    const largeAssets = perfData.resourceEntries.filter(r => r.transferSize > 300000);
    if (largeAssets.length) {
      bottlenecks.push({ category: 'front-end', message: 'Large assets detected - optimize images or compress files.' });
    }

    res.json({
      summary: {
        url,
        ttfb: perfData.ttfb,
        domContentLoaded: perfData.domContentLoaded,
        loadTime: perfData.loadTime,
        requestCount: resources.length,
        thirdPartyCount: thirdParty.length,
      },
      bottlenecks,
      resources: perfData.resourceEntries
    });
  } catch (error) {
  console.error("Analysis failed:", error);
  res.status(500).json({
    error: 'Failed to analyze the site',
    details: error.message,
    stack: error.stack
  });
}


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
