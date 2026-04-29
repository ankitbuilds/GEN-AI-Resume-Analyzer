const puppeteer = require('puppeteer');
(async () => {
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Resume</title>
<style>
body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
h2 { color: #666; margin-top: 30px; }
.section { margin-bottom: 20px; }
</style>
</head>
<body>
<h1>Professional Resume</h1>
<div class="section"><h2>Professional Summary</h2><p>Experienced professional with strong technical skills.</p></div>
<div class="section"><h2>Target Position</h2><p><strong>Job Description:</strong> Seeking new opportunities.</p></div>
<div class="section"><h2>Experience & Skills</h2><p>Professional experience and technical skills.</p></div>
<div class="section"><h2>Education</h2><p>Bachelor's Degree in relevant field</p></div>
</body>
</html>`;
  try {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '1cm', bottom: '1cm', left: '1cm', right: '1cm' } });
    console.log('PDF created length', pdfBuffer.length);
    await browser.close();
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  }
})();
