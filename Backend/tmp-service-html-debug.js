const { generateFallbackResumeHtml } = require('./src/services/ai.service');
const puppeteer = require('puppeteer');
(async () => {
  const html = generateFallbackResumeHtml({
    resume: 'Software Developer with 5 years experience',
    selfDescription: 'I am a developer',
    jobDescription: 'Looking for developer'
  });
  console.log('HTML length:', html.length);
  console.log('HTML start:', html.substring(0, 200));
  try {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 1000));
    const pdfBuffer = await page.pdf({ format:'A4', printBackground:true, margin:{top:'1cm', bottom:'1cm', left:'1cm', right:'1cm'}});
    console.log('PDF header:', pdfBuffer.slice(0, 5).toString('ascii'));
    console.log('Header hex:', pdfBuffer.slice(0, 5).toString('hex'));
    console.log('PDF length:', pdfBuffer.length);
    await browser.close();
  } catch (err) {
    console.error('DIRECT PUPPETEER ERROR', err);
  }
})();
