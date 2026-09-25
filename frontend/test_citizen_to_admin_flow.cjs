const puppeteer = require('puppeteer-core');
const { execSync } = require('child_process');
const path = require('path');

function checkDatabaseForTicket(ticketId) {
  try {
    const script = `import sqlite3, json
conn = sqlite3.connect('../backend/civiceye.db')
cur = conn.cursor()
cur.execute('SELECT id, ticket_id, category, title, status, reporter_name, created_at FROM issues WHERE ticket_id = ?', ('${ticketId}',))
row = cur.fetchone()
if row:
    print(json.dumps({'id': row[0], 'ticket_id': row[1], 'category': row[2], 'title': row[3], 'status': row[4], 'reporter_name': row[5], 'created_at': row[6]}))
else:
    print('null')
conn.close()`;
    const out = execSync(`python -c "${script.replace(/\n/g, '; ')}"`, { cwd: __dirname }).toString().trim();
    return JSON.parse(out);
  } catch (err) {
    console.error('SQLite query error:', err);
    return null;
  }
}

async function runTestFlow() {
  console.log('====================================================');
  console.log('CITIZEN REPORT -> BACKEND -> SQLITE -> ADMIN TEST');
  console.log('====================================================');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const consoleErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(`[${msg.type()}] ${msg.text()}`);
    }
  });

  // Step 1: Open Report Issue page as Citizen
  console.log('\n[1] Submitting a NEW issue from Citizen Report Issue page...');
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    localStorage.setItem('civiceye_role', 'citizen');
    localStorage.setItem('civiceye_user_name', 'Priya Sharma');
  });
  await page.goto('http://127.0.0.1:5173/report', { waitUntil: 'networkidle0' });

  // Fill in form: Headline & Description
  const uniqueTitle = `Test Broken Streetlight ${Date.now()}`;
  const descriptionText = 'Streetlight pole 44 completely dark causing nighttime hazards.';
  
  // Set category: click on Broken Streetlight
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text.includes('Broken Streetlight')) {
      await b.click();
      break;
    }
  }

  // Type headline & description
  const inputs = await page.$$('input[type="text"]');
  for (const inp of inputs) {
    const ph = await page.evaluate(el => el.placeholder, inp);
    if (ph && ph.includes('Deep pothole')) {
      await inp.type(uniqueTitle);
      break;
    }
  }

  const textarea = await page.$('textarea');
  await textarea.type(descriptionText);

  // Upload sample image via file input
  const fileInput = await page.$('input[type="file"]');
  // Or inject base64 photo directly into page state if convenient, or create a temp file
  const fs = require('fs');
  const tempPhotoPath = path.resolve(__dirname, 'test_evidence_photo.jpg');
  // Write a minimal valid 1x1 JPEG
  const sampleJpg = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64');
  fs.writeFileSync(tempPhotoPath, sampleJpg);

  await fileInput.uploadFile(tempPhotoPath);
  console.log('  Uploaded issue evidence photo...');
  await new Promise(r => setTimeout(r, 600));

  // Submit form
  console.log('  Submitting grievance form...');
  const submitBtn = await page.$('button[type="submit"]');
  await submitBtn.click();
  await new Promise(r => setTimeout(r, 2500));

  // If duplicate modal appears, click "NO, REPORT SEPARATELY"
  const hasDup = await page.evaluate(() => document.body.innerText.includes('Smart Duplicate Detection') || document.body.innerText.includes('Similar Issue Detected'));
  if (hasDup) {
    console.log('  Duplicate detected! Clicking "NO, REPORT SEPARATELY"...');
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await page.evaluate(el => el.innerText, b);
      if (text.includes('SEPARATELY') || text.includes('Separately')) {
        await b.click();
        break;
      }
    }
  }

  // Wait for submission confirmation
  await page.waitForFunction(() => document.body.innerText.includes('Database Record Verified'), { timeout: 15000 });
  const confirmationBody = await page.evaluate(() => document.body.innerText);
  
  // Extract Ticket ID
  const ticketMatch = confirmationBody.match(/CIV-\d{4}-\d{6}/);
  if (!ticketMatch) {
    throw new Error('Ticket ID could not be found in confirmation screen!');
  }
  const ticketId = ticketMatch[0];
  console.log('  SUCCESS! Generated Ticket ID:', ticketId);

  // Step 2: Verify database record in SQLite directly
  console.log('\n[2] Verifying ticket persistence in SQLite database...');
  const dbRow = await checkDatabaseForTicket(ticketId);
  console.log('  SQLite DB Record Found:', dbRow);
  if (!dbRow) {
    throw new Error(`Ticket ${ticketId} not found in SQLite!`);
  }

  // Step 3: Verify Admin API returns the same ticket
  console.log('\n[3] Calling GET /api/admin/issues as Admin...');
  const adminApiRes = await fetch('http://127.0.0.1:8000/api/admin/issues', {
    headers: {
      'X-User-Role': 'admin',
      'X-User-Name': 'Dr. Arvind Verma'
    }
  });
  const adminIssues = await adminApiRes.json();
  const apiMatch = adminIssues.find(i => i.ticket_id === ticketId);
  console.log('  Admin API Found Ticket?:', !!apiMatch);
  if (apiMatch) {
    console.log(`  Ticket: ${apiMatch.ticket_id}, Category: ${apiMatch.category}, Status: ${apiMatch.status}`);
  } else {
    throw new Error(`Ticket ${ticketId} missing from /api/admin/issues!`);
  }

  // Step 4: Open Admin Dashboard in browser
  console.log('\n[4] Opening Admin Dashboard in browser as Admin...');
  await page.evaluate(() => {
    localStorage.setItem('civiceye_role', 'admin');
    localStorage.setItem('civiceye_user_name', 'Dr. Arvind Verma');
  });
  await page.goto('http://127.0.0.1:5173/admin/dashboard', { waitUntil: 'networkidle0' });

  const adminDashboardText = await page.evaluate(() => document.body.innerText);
  const visibleOnDashboard = adminDashboardText.includes(ticketId);
  console.log(`  Is ${ticketId} immediately visible on Admin Dashboard?:`, visibleOnDashboard);

  // Step 5: Test Refresh on Admin Dashboard
  console.log('\n[5] Refreshing Admin Dashboard...');
  await page.reload({ waitUntil: 'networkidle0' });
  const afterReloadText = await page.evaluate(() => document.body.innerText);
  const stillVisibleAfterReload = afterReloadText.includes(ticketId);
  console.log(`  Is ${ticketId} still visible after browser reload?:`, stillVisibleAfterReload);

  // Step 6: Test opening the issue from Admin Dashboard
  console.log(`\n[6] Navigating to http://127.0.0.1:5173/issues/${ticketId} ...`);
  await page.goto(`http://127.0.0.1:5173/issues/${ticketId}`, { waitUntil: 'networkidle0' });
  const issuePageHeading = await page.$eval('h1', el => el.innerText).catch(() => '');
  console.log('  Issue Details Page Heading:', issuePageHeading);
  const issuePageText = await page.evaluate(() => document.body.innerText);
  const issueDetailsValid = issuePageText.includes(ticketId) && issuePageText.includes('REPORTED');
  console.log(`  Issue details loaded ticket and REPORTED status?:`, issueDetailsValid);

  // Cleanup temp photo
  if (fs.existsSync(tempPhotoPath)) fs.unlinkSync(tempPhotoPath);

  await browser.close();

  console.log('\n====================================================');
  console.log('FLOW VERIFICATION SUMMARY:');
  console.log('Citizen POST: PASS');
  console.log('Saved in SQLite: PASS');
  console.log('Returned by Admin API: PASS');
  console.log('Visible in Admin Panel: ' + (visibleOnDashboard ? 'PASS' : 'FAIL'));
  console.log('Still Visible After Refresh: ' + (stillVisibleAfterReload ? 'PASS' : 'FAIL'));
  console.log('Issue Details Opens: ' + (issueDetailsValid ? 'PASS' : 'FAIL'));
  console.log('====================================================');

  if (!visibleOnDashboard || !stillVisibleAfterReload || !issueDetailsValid) {
    process.exit(1);
  }
}

runTestFlow().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
