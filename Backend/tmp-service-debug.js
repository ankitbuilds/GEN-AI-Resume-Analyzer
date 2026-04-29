const { generateResumePdf } = require('./src/services/ai.service');
(async () => {
  try {
    const buffer = await generateResumePdf({
      resume: 'Software Developer with 5 years experience',
      selfDescription: 'I am a developer',
      jobDescription: 'Looking for developer'
    });
    console.log('Buffer length:', buffer.length);
    console.log('Header ascii:', buffer.toString('ascii', 0, 10));
    console.log('Header hex:', buffer.slice(0, 10).toString('hex'));
  } catch (err) {
    console.error('SERVICE ERROR', err);
    process.exit(1);
  }
})();
