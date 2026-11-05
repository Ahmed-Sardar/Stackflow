const assert = require('node:assert/strict');

async function main() {
  if (!process.argv[2]) throw new Error('Usage: npm run check:deployment -- https://your-app-domain');
  const origin = new URL(process.argv[2]).origin;
  for (const check of [
    { path: '/api/health', status: 200, verify: body => body.data?.status === 'ok' },
    { path: '/api/auth/me', status: 401, verify: body => typeof body.error === 'string' },
    { path: '/api/auth/login', method: 'POST', status: 400, verify: body => typeof body.error === 'string' },
    { path: '/login', status: 200, html: true },
  ]) {
    const response = await fetch(origin + check.path, {
      method: check.method || 'GET',
      redirect: 'manual',
      signal: AbortSignal.timeout(60000),
      ...(check.method ? { headers: { 'Content-Type': 'application/json' }, body: '{}' } : {}),
    });
    if (response.status >= 300 && response.status < 400) {
      throw new Error(`${check.path} redirected (HTTP ${response.status}). Use the latest public Production domain; check Vercel Deployment Protection if it redirects to sign-in.`);
    }
    assert.equal(response.status, check.status, `${check.path}: unexpected HTTP status; check the deployed commit and Vercel Root Directory.`);
    const type = response.headers.get('content-type') || '';
    if (check.html) {
      assert.ok(type.includes('text/html'), '/login must serve the frontend HTML.');
      assert.ok((await response.text()).includes('id="root"'), '/login did not serve the StockFlow app.');
    } else {
      assert.ok(type.includes('application/json'), `${check.path} returned HTML instead of API JSON; check the API rewrite and deployment protection.`);
      assert.ok(check.verify(await response.json()), `${check.path}: unexpected API response.`);
    }
    console.log(`PASS ${check.method || 'GET'} ${check.path} (${response.status})`);
  }
  console.log('Routing checks passed. Finish by signing in and refreshing the page to check the session cookie.');
}

main().catch(error => {
  console.error(`Deployment check failed: ${error.message}`);
  process.exitCode = 1;
});
