/**
 * TrackIQ Backend Server
 * Exposes /api/scan (JSON report) and /api/report/pdf (PDF report)
 */

const express = require('express');
const cors = require('cors');
const { runAudit } = require('./modules/auditRunner');
const { createPDFReport } = require('./modules/pdfGenerator');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Health check route - useful to confirm the server is running
app.get('/', (req, res) => {
  res.send('TrackIQ backend is running.');
});

// TEST FIXTURE: a page with all 4 trackers' real official snippets
// embedded directly in the HTML. Scan THIS with /api/scan to confirm
// the detector logic works correctly, independent of any live site's
// consent banners, GTM-managed tags, or JS rendering.
app.get('/test-page', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>TrackIQ Test Page</title>
  <meta name="description" content="Test page for verifying TrackIQ's SEO Analyzer.">
  <link rel="stylesheet" href="/style.css">

  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-TESTID123"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-TESTID123');
  </script>

  <!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-TESTID');</script>

  <!-- Meta Pixel -->
  <script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '1234567890');
  fbq('track', 'PageView');
  </script>

  <!-- Microsoft Clarity -->
  <script type="text/javascript">
      (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "testclarityid");
  </script>
</head>
<body>
  <h1>TrackIQ Test Page</h1>
  <p>This page embeds all 4 tracker snippets so detection can be verified locally.</p>
  <img src="/img1.jpg" alt="test image 1">
  <img src="/img2.jpg" alt="test image 2">
  <img src="/img3.jpg" alt="test image 3">
</body>
</html>`);
});

// TEST FIXTURES for Module 3 (SEO Analyzer): a minimal robots.txt
// and sitemap.xml, so /test-page has real files to find at the root.
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send('User-agent: *\nAllow: /');
});

app.get('/sitemap.xml', (req, res) => {
  res
    .type('application/xml')
    .send(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>http://localhost:5000/test-page</loc></url></urlset>'
    );
});

// Modules 1-6: JSON report endpoint (logic lives in modules/auditRunner.js)
app.post('/api/scan', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, error: 'URL is required.' });
  }

  const audit = await runAudit(url);

  if (!audit.success) {
    return res.status(400).json({ success: false, error: audit.error });
  }

  res.json({
    success: true,
    ...audit.data,
    message: 'Website scanned and analyzed successfully.'
  });
});

// Module 7: PDF Report Generator endpoint
app.post('/api/report/pdf', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, error: 'URL is required.' });
  }

  const audit = await runAudit(url);

  if (!audit.success) {
    return res.status(400).json({ success: false, error: audit.error });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="trackiq-report.pdf"');

  const doc = createPDFReport(audit.data);
  doc.pipe(res);
});

app.listen(PORT, () => {
  console.log(`TrackIQ backend running at http://localhost:${PORT}`);
});
