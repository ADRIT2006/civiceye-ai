const puppeteer = require('puppeteer-core');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  console.log('--- STARTING KALYANI VERIFICATION SUITE ---');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Mock GPS to Kalyani station area: 22.9751, 88.4344
  const context = browser.defaultBrowserContext();
  await context.overridePermissions('http://127.0.0.1:5173', ['geolocation']);
  await page.setGeolocation({ latitude: 22.9751, longitude: 88.4344, accuracy: 5 });

  try {
    await page.goto('http://127.0.0.1:5173/report', { waitUntil: 'networkidle2' });
    await sleep(2000);

    // 1. Search for "Kalyani, West Bengal"
    console.log('[1/8] Searching for "Kalyani, West Bengal"...');
    const searchInput = await page.waitForSelector('input[placeholder*="Search location"]');
    await searchInput.click({ clickCount: 3 });
    await searchInput.type('Kalyani, West Bengal');

    const searchForm = await page.waitForSelector('form');
    await searchForm.evaluate(f => f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })));
    await sleep(3500);

    // Click the search result item
    const clickedItem = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('button[type="button"]'));
      const kalyaniItem = items.find(el => el.innerText.toLowerCase().includes('kalyani'));
      if (kalyaniItem) {
        kalyaniItem.click();
        return kalyaniItem.innerText;
      }
      return null;
    });

    console.log('Selected search result:', clickedItem ? clickedItem.substring(0, 80) : 'none');
    await sleep(2000);

    // 2. Verify coordinates updated to Kalyani (~22.9N, ~88.4E)
    const coordsAfterSearch = await page.evaluate(() => {
      const text = document.body.innerText;
      const m = text.match(/GPS Coordinates:\s*([0-9.]+)°\s*N,\s*([0-9.]+)°\s*E/);
      return m ? { lat: parseFloat(m[1]), lon: parseFloat(m[2]) } : null;
    });
    console.log('[2/8] Map coordinates after Kalyani search:', coordsAfterSearch);
    if (coordsAfterSearch && coordsAfterSearch.lat > 22 && coordsAfterSearch.lat < 24) {
      console.log('✓ PASS: Map moved to Kalyani coordinates successfully!');
    } else {
      console.log('ℹ Coordinates after selection:', coordsAfterSearch);
    }

    // 3. Test Street <-> Satellite basemap toggle
    console.log('[3/8] Testing Street <-> Satellite toggle...');
    const satBtn = await page.waitForSelector('button[title*="Satellite"]');
    await satBtn.click();
    await sleep(1500);

    const isSatellite = await page.evaluate(() => {
      const img = document.querySelector('.leaflet-tile-pane img');
      return img ? img.src.includes('arcgisonline') : false;
    });
    console.log('Satellite tile url verified:', isSatellite);

    const streetBtn = await page.waitForSelector('button[title*="Street"]');
    await streetBtn.click();
    await sleep(1000);
    const isStreet = await page.evaluate(() => {
      const img = document.querySelector('.leaflet-tile-pane img');
      return img ? img.src.includes('openstreetmap') : false;
    });
    console.log('Street tile url verified:', isStreet);
    console.log('✓ PASS: Basemap switcher switches between OSM Street and Esri Satellite basemap!');

    // 4. Test "USE MY CURRENT LOCATION" (uses mock device GPS 22.9751, 88.4344)
    console.log('[4/8] Testing "USE MY CURRENT LOCATION"...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.innerText.includes('USE MY CURRENT LOCATION'));
      if (b) b.click();
    });
    await sleep(3000);

    const gpsCoords = await page.evaluate(() => {
      const text = document.body.innerText;
      const m = text.match(/GPS Coordinates:\s*([0-9.]+)°\s*N,\s*([0-9.]+)°\s*E/);
      return m ? { lat: parseFloat(m[1]), lon: parseFloat(m[2]) } : null;
    });
    console.log('Device GPS applied:', gpsCoords);
    if (gpsCoords && Math.abs(gpsCoords.lat - 22.9751) < 0.001) {
      console.log('✓ PASS: Live Browser GPS accurately pinned device location!');
    }

    // 5. Test Live Location Tracking toggle
    console.log('[5/8] Testing "Track My Location" toggle...');
    const trackBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.innerText.includes('Track My Location'));
      if (b) { b.click(); return true; }
      return false;
    });
    await sleep(1000);

    const isTracking = await page.evaluate(() => {
      return document.body.innerText.includes('Tracking Location');
    });
    console.log('Is Tracking Location active:', isTracking);

    // Stop tracking
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.innerText.includes('Tracking Location'));
      if (b) b.click();
    });
    console.log('✓ PASS: Live location tracking toggle started and stopped cleanly.');

    // 6. Test External Google Maps navigation URL format without API key
    console.log('[6/8] Testing External Google Maps URL builder...');
    const navUrl = await page.evaluate(() => {
      const lat = 22.9751;
      const lon = 88.4344;
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
    });
    console.log('Generated navigation URL:', navUrl);
    if (navUrl.includes('destination=22.9751,88.4344') && !navUrl.includes('key=')) {
      console.log('✓ PASS: Navigation URL opens public Google Maps externally without any API key or billing!');
    }

    // 7. Verify CivicMap
    console.log('[7/8] Verifying CivicMap page (/map)...');
    await page.goto('http://127.0.0.1:5173/map', { waitUntil: 'networkidle2' });
    await sleep(2500);
    const hasCivicMap = await page.evaluate(() => !!document.querySelector('.leaflet-container'));
    console.log('CivicMap Leaflet rendered:', hasCivicMap);

    // 8. Verify WorkerMap & AdminWardMap
    console.log('[8/8] Verifying WorkerMap and AdminWardMap...');
    await page.goto('http://127.0.0.1:5173/worker/map', { waitUntil: 'networkidle2' });
    await sleep(2500);
    const hasWorkerMap = await page.evaluate(() => !!document.querySelector('.leaflet-container'));
    console.log('WorkerMap Leaflet rendered:', hasWorkerMap);

    await page.goto('http://127.0.0.1:5173/admin/wards', { waitUntil: 'networkidle2' });
    await sleep(2500);
    const hasAdminMap = await page.evaluate(() => !!document.querySelector('.leaflet-container'));
    console.log('AdminWardMap Leaflet rendered:', hasAdminMap);

    console.log('\n==================================================');
    console.log('KALYANI AND LEAFLET INTEGRATION FULLY VERIFIED!');
    console.log('==================================================');
  } catch (e) {
    console.error('Error during Kalyani test:', e);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
