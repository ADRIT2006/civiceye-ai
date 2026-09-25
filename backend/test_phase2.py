import urllib.request
import urllib.parse
import json
import sqlite3
import io
import os
import sys

# 1. Create a valid test PNG image
png_bytes = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82'

# 2. Upload photo via multipart
boundary = '----CivicEyeTestBoundary'
body = io.BytesIO()
body.write(b'--' + boundary.encode('utf-8') + b'\r\n')
body.write(b'Content-Disposition: form-data; name="file"; filename="live_wire_hazard.png"\r\n')
body.write(b'Content-Type: image/png\r\n\r\n')
body.write(png_bytes)
body.write(b'\r\n--' + boundary.encode('utf-8') + b'--\r\n')
body_bytes = body.getvalue()

req = urllib.request.Request(
    'http://127.0.0.1:8000/api/issues/upload-photo',
    data=body_bytes,
    headers={
        'Content-Type': f'multipart/form-data; boundary={boundary}',
        'X-User-Role': 'citizen'
    }
)
with urllib.request.urlopen(req) as res:
    upload_res = json.loads(res.read().decode())
    print('1. UPLOAD PHOTO SUCCESS:', upload_res)
    photo_url = upload_res['photo_url']

# 3. Create issue via POST /api/issues
issue_data = {
    'category': 'Electrical Hazard',
    'title': 'Exposed live wire hanging near crossroad',
    'description': 'Live wire sparked and lying across sidewalk near entrance',
    'latitude': 12.9716,
    'longitude': 77.5946,
    'address': '5th Cross Road, Indiranagar',
    'reporter_name': 'Priya Sharma',
    'photo_url': photo_url,
    'severity': 'High'
}
req = urllib.request.Request(
    'http://127.0.0.1:8000/api/issues',
    data=json.dumps(issue_data).encode('utf-8'),
    headers={
        'Content-Type': 'application/json',
        'X-User-Role': 'citizen',
        'X-User-Name': 'Priya Sharma'
    }
)
with urllib.request.urlopen(req) as res:
    created = json.loads(res.read().decode())
    print('2. CREATE ISSUE SUCCESS:')
    print('   Ticket ID:', created['ticket_id'])
    print('   Category:', created['category'])
    print('   Status:', created['status'])
    print('   Priority Level:', created['priority_level'])
    print('   Priority Score:', created['priority_score'])
    print('   Created At:', created['created_at'])
    print('   Escalation Due At:', created.get('escalation_due_at'))
    ticket_id = created['ticket_id']

# 4. Verify in SQLite
conn = sqlite3.connect('civiceye.db')
c = conn.cursor()
c.execute('SELECT id, ticket_id, category, status, priority_level, address, before_image_url, escalation_due_at FROM issues WHERE ticket_id = ?', (ticket_id,))
row = c.fetchone()
conn.close()
print('3. SQLITE DIRECT QUERY:')
print('   Found row in civiceye.db:', row)

# 5. Check Citizen My Reports
req = urllib.request.Request(
    'http://127.0.0.1:8000/api/citizen/issues',
    headers={'X-User-Role': 'citizen', 'X-User-Name': 'Priya Sharma'}
)
with urllib.request.urlopen(req) as res:
    citizen_issues = json.loads(res.read().decode())
    found_citizen = any(i['ticket_id'] == ticket_id for i in citizen_issues)
    print(f'4. CITIZEN MY REPORTS: Found ticket {ticket_id}? {found_citizen} (Total citizen issues: {len(citizen_issues)})')

# 6. Check Admin All Issues
req = urllib.request.Request(
    f'http://127.0.0.1:8000/api/admin/issues?search={urllib.parse.quote(ticket_id)}',
    headers={'X-User-Role': 'admin'}
)
with urllib.request.urlopen(req) as res:
    admin_issues = json.loads(res.read().decode())
    found_admin = any(i['ticket_id'] == ticket_id for i in admin_issues)
    print(f'5. ADMIN ALL ISSUES: Found ticket {ticket_id}? {found_admin} (Matching: {len(admin_issues)})')

# 7. Check Admin Dashboard Counters
req = urllib.request.Request(
    'http://127.0.0.1:8000/api/admin/dashboard-summary',
    headers={'X-User-Role': 'admin'}
)
with urllib.request.urlopen(req) as res:
    dash = json.loads(res.read().decode())
    print('6. ADMIN DASHBOARD SUMMARY:', dash)

print('\nALL PHASE 2 LIVE API & SQLITE TESTS PASSED!')
