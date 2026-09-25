import sqlite3

conn = sqlite3.connect('civiceye.db')
c = conn.cursor()
c.execute("UPDATE issues SET assigned_worker_id = NULL, status = 'Escalated' WHERE ticket_id = 'CIV-2026-0008'")
conn.commit()
conn.close()
print("Ticket CIV-2026-0008 reset to Escalated / unassigned successfully.")
