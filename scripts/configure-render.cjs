const fs = require('node:fs');
const path = require('node:path');

try {
  const input = process.argv[2];
  if (!input || process.argv.length !== 3) {
    throw new Error('Usage: npm run configure:render -- https://YOUR-SERVICE.onrender.com');
  }
  const url = new URL(input);
  if (url.protocol !== 'https:' || url.username || url.password || url.port ||
      url.pathname !== '/' || url.search || url.hash ||
      !/^[a-z0-9-]+\.onrender\.com$/.test(url.hostname) ||
      /your-|example|placeholder/i.test(url.hostname)) {
    throw new Error('Enter the actual public HTTPS onrender.com service URL, without /api, credentials, or an API key.');
  }
  const configPath = path.resolve(__dirname, '../vercel.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const rewrite = config.rewrites.find(rule => rule.source === '/api/:path*');
  if (!rewrite) throw new Error('The /api/:path* rewrite is missing from vercel.json.');
  rewrite.destination = `${url.origin}/api/:path*`;
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
  console.log(`Updated vercel.json to proxy /api to ${url.origin}. Commit and push this file before deploying Vercel.`);
} catch (error) {
  console.error(`Render configuration failed: ${error.message}`);
  process.exitCode = 1;
}
