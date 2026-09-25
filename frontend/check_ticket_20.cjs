const puppeteer = require('puppeteer-core');

async function checkTicket20() {
  const ticketId = 'CIV-2026-000020';
  console.log('Testing Admin visibility for ticket:', ticketId);

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Set role to admin
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    localStorage.setItem('civiceye_role', 'admin');
    localStorage.setItem('civiceye_user_name', 'Dr. Arvind Verma');
  });

  // 1. Check Admin API
  console.log('\n1. Checking Admin API for ' + ticketId);
  const apiRes = await fetch('http://127.0.0.1:8000/api/admin/issues', {
    headers: { 'X-User-Role': 'admin', 'X-User-Name': 'Dr. Arvind Verma' }
  });
  const issues = await apiRes.json();
  const foundApi = issues.find(i => i.ticket_id === ticketId);
  console.log('Found in /api/admin/issues?:', !!foundApi);
  if (foundApi) {
    console.log('API Status:', foundApi.status, '| Category:', foundApi.category, '| Title:', foundApi.title);
  }

  // 2. Check Admin Dashboard UI
  console.log('\n2. Opening Admin Dashboard at http://127.0.0.1:5173/admin/dashboard ...');
  await page.goto('http://127.0.0.1:5173/admin/dashboard', { waitUntil: 'networkidle0' });

  const dashboardText = await page.evaluate(() => document.body.innerText);
  const foundOnDashboard = dashboardText.includes(ticketId);
  console.log('Found on Admin Dashboard immediately (default tab)?:', foundOnDashboard);

  // Check card contents:
  if (foundOnDashboard) {
    const cardSnippet = await page.evaluate((tid) => {
      const el = [...document.querySelectorAll('div')].find(d => d.innerText.includes(tid) && d.innerText.includes('REPORTED'));
      return el ? el.innerText.slice(0, 250) : 'Not found in specific card';
    }, ticketId);
    console.log('Admin Dashboard Card Snippet:\n', cardSnippet);
  }

  // 3. Test Refresh
  console.log('\n3. Testing browser refresh on Admin Dashboard...');
  await page.reload({ waitUntil: 'networkidle0' });
  const afterReloadText = await page.evaluate(() => document.body.innerText);
  const foundAfterReload = afterReloadText.includes(ticketId);
  console.log('Still visible on Admin Dashboard after reload?:', foundAfterReload);

  // 4. Check All Issues (Complaints) Page
  console.log('\n4. Opening All Issues at http://127.0.0.1:5173/admin/complaints ...');
  await page.goto('http://127.0.0.1:5173/admin/complaints', { waitUntil: 'networkidle0' });
  const complaintsText = await page.evaluate(() => document.body.innerText);
  const foundOnComplaints = complaintsText.includes(ticketId);
  console.log('Found in All Issues table?:', foundOnComplaints);

  // 5. Open the issue
  console.log(`\n5. Opening issue details at http://127.0.0.1:5173/issues/${ticketId} ...`);
  await page.goto(`http://127.0.0.1:5173/issues/${ticketId}`, { waitUntil: 'networkidle0' });
  const issuePageText = await page.evaluate(() => document.body.innerText);
  const foundOnIssuePage = issuePageText.includes(ticketId) && issuePageText.includes('REPORTED');
  console.log('Issue details page loaded with REPORTED status?:', foundOnIssuePage);

  await browser.close();

  console.log('\n=============================================');
  console.log('ADMIN DATA FLOW TEST:');
  console.log('Returned by Admin API: ' + (foundApi ? 'PASS' : 'FAIL'));
  console.log('Visible in Admin Panel: ' + (foundOnDashboard ? 'PASS' : 'FAIL'));
  console.log('Still Visible After Refresh: ' + (foundAfterReload ? 'PASS' : 'FAIL'));
  console.log('Visible in All Issues (/admin/complaints): ' + (foundOnComplaints ? 'PASS' : 'FAIL'));
  console.log('Admin Opens Issue: ' + (foundOnIssuePage ? 'PASS' : 'FAIL'));
  console.log('=============================================');
}

checkTicket20().catch(console.error);
