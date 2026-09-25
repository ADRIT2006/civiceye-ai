const puppeteer = require('puppeteer-core');

async function checkAdminDisplay() {
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

  // Check 1: /admin/dashboard
  console.log('\n--- Checking /admin/dashboard ---');
  await page.goto('http://127.0.0.1:5173/admin/dashboard', { waitUntil: 'networkidle0' });
  const dashboardHtml = await page.evaluate(() => document.body.innerText);
  console.log('CIV-2026-000019 in /admin/dashboard?:', dashboardHtml.includes('CIV-2026-000019'));
  
  // What tabs are on /admin/dashboard?
  const tabs = await page.$$eval('button', btns => btns.map(b => b.innerText).filter(t => t.includes('(') || t.includes('Complaints') || t.includes('Evidence')));
  console.log('Tabs on Admin Dashboard:', tabs);

  // Click on "Unassigned Complaints" tab if it exists
  const unassignedBtn = (await page.$$('button')).find(async b => {
    const text = await (await b.getProperty('innerText')).jsonValue();
    return text.includes('Unassigned');
  });
  
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text.includes('Unassigned')) {
      console.log('Clicking tab:', text);
      await b.click();
      await new Promise(r => setTimeout(r, 500));
      break;
    }
  }

  const afterTabClick = await page.evaluate(() => document.body.innerText);
  console.log('CIV-2026-000019 after clicking Unassigned tab?:', afterTabClick.includes('CIV-2026-000019'));

  // Check 2: /admin/complaints (All Issues page)
  console.log('\n--- Checking /admin/complaints ---');
  await page.goto('http://127.0.0.1:5173/admin/complaints', { waitUntil: 'networkidle0' });
  const complaintsHtml = await page.evaluate(() => document.body.innerText);
  console.log('CIV-2026-000019 in /admin/complaints?:', complaintsHtml.includes('CIV-2026-000019'));

  const tableTickets = await page.$$eval('td', tds => tds.map(td => td.innerText).filter(t => t.includes('CIV-')));
  console.log('Tickets found in /admin/complaints table:', tableTickets.slice(0, 10));

  await browser.close();
}

checkAdminDisplay().catch(console.error);
