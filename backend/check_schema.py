import sqlite3

conn = sqlite3.connect('civiceye.db')
cursor = conn.cursor()
row = cursor.execute("SELECT sql FROM sqlite_master WHERE name='issues'").fetchone()
if row:
    print("ISSUES SCHEMA:")
    print(row[0])
row2 = cursor.execute("SELECT sql FROM sqlite_master WHERE name='repair_submissions'").fetchone()
if row2:
    print("REPAIR_SUBMISSIONS SCHEMA:")
    print(row2[0])
conn.close()
