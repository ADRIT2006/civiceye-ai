import os
import shutil
import sqlite3

def run_safe_db_migrations(db_path: str):
    """
    Safely migrates SQLite schema if outdated foreign key constraints exist on
    assigned_worker_id or worker_id referencing users.id instead of allowing
    worker IDs from the municipal workers table.
    Preserves database with a timestamped/safe backup.
    """
    if not os.path.exists(db_path):
        return

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        row = cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='issues'").fetchone()
        needs_issue_migration = row and "FOREIGN KEY(assigned_worker_id) REFERENCES users" in row[0]
        
        row_rep = cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='repair_submissions'").fetchone()
        needs_rep_migration = row_rep and "FOREIGN KEY(worker_id) REFERENCES users" in row_rep[0]

        if needs_issue_migration or needs_rep_migration:
            backup_path = f"{db_path}.bak"
            shutil.copy2(db_path, backup_path)
            print(f"[CivicEye DB] Created backup before migration: {backup_path}")

            cursor.execute("PRAGMA foreign_keys=OFF;")
            cursor.execute("BEGIN TRANSACTION;")

            if needs_issue_migration:
                cursor.execute("""
                    CREATE TABLE issues_migrated (
                        id INTEGER NOT NULL, 
                        ticket_id VARCHAR NOT NULL, 
                        category VARCHAR NOT NULL, 
                        title VARCHAR NOT NULL, 
                        description TEXT NOT NULL, 
                        latitude FLOAT NOT NULL, 
                        longitude FLOAT NOT NULL, 
                        address VARCHAR NOT NULL, 
                        ward VARCHAR NOT NULL, 
                        status VARCHAR, 
                        is_emergency BOOLEAN, 
                        hazard_type VARCHAR, 
                        priority_score FLOAT, 
                        priority_level VARCHAR, 
                        report_count INTEGER, 
                        upvotes INTEGER, 
                        reporter_name VARCHAR, 
                        reporter_id INTEGER, 
                        assigned_worker_id INTEGER, 
                        before_image_url VARCHAR NOT NULL, 
                        after_image_url VARCHAR, 
                        escalation_deadline DATETIME NOT NULL, 
                        escalation_level INTEGER, 
                        created_at DATETIME, 
                        updated_at DATETIME, 
                        PRIMARY KEY (id), 
                        FOREIGN KEY(reporter_id) REFERENCES users (id)
                    );
                """)
                cursor.execute("INSERT INTO issues_migrated SELECT * FROM issues;")
                cursor.execute("DROP TABLE issues;")
                cursor.execute("ALTER TABLE issues_migrated RENAME TO issues;")
                cursor.execute("CREATE INDEX IF NOT EXISTS ix_issues_ticket_id ON issues (ticket_id);")
                cursor.execute("CREATE INDEX IF NOT EXISTS ix_issues_category ON issues (category);")
                cursor.execute("CREATE INDEX IF NOT EXISTS ix_issues_ward ON issues (ward);")
                cursor.execute("CREATE INDEX IF NOT EXISTS ix_issues_status ON issues (status);")

            if needs_rep_migration:
                cursor.execute("""
                    CREATE TABLE repair_submissions_migrated (
                        id INTEGER NOT NULL, 
                        issue_id INTEGER NOT NULL, 
                        worker_id INTEGER, 
                        worker_name VARCHAR, 
                        repair_notes TEXT NOT NULL, 
                        materials_used VARCHAR, 
                        after_image_url VARCHAR NOT NULL, 
                        status VARCHAR, 
                        submitted_at DATETIME, 
                        PRIMARY KEY (id), 
                        FOREIGN KEY(issue_id) REFERENCES issues (id)
                    );
                """)
                cursor.execute("INSERT INTO repair_submissions_migrated SELECT * FROM repair_submissions;")
                cursor.execute("DROP TABLE repair_submissions;")
                cursor.execute("ALTER TABLE repair_submissions_migrated RENAME TO repair_submissions;")
                cursor.execute("CREATE INDEX IF NOT EXISTS ix_repair_submissions_id ON repair_submissions (id);")

            conn.commit()
            cursor.execute("PRAGMA foreign_keys=ON;")
            print("[CivicEye DB] Foreign key migration completed successfully.")

        # Check and ensure new Phase 2 columns exist on issues table
        existing_cols = [c[1] for c in cursor.execute("PRAGMA table_info(issues)").fetchall()]
        if existing_cols:
            if "ward_id" not in existing_cols:
                cursor.execute("ALTER TABLE issues ADD COLUMN ward_id VARCHAR;")
                cursor.execute("CREATE INDEX IF NOT EXISTS ix_issues_ward_id ON issues (ward_id);")
                print("[CivicEye DB] Added ward_id column to issues.")
            if "support_count" not in existing_cols:
                cursor.execute("ALTER TABLE issues ADD COLUMN support_count INTEGER DEFAULT 0;")
                cursor.execute("UPDATE issues SET support_count = upvotes WHERE upvotes IS NOT NULL;")
                print("[CivicEye DB] Added support_count column to issues.")
            if "escalation_due_at" not in existing_cols:
                cursor.execute("ALTER TABLE issues ADD COLUMN escalation_due_at DATETIME;")
                cursor.execute("UPDATE issues SET escalation_due_at = escalation_deadline WHERE escalation_deadline IS NOT NULL;")
                print("[CivicEye DB] Added escalation_due_at column to issues.")
            if "assigned_at" not in existing_cols:
                cursor.execute("ALTER TABLE issues ADD COLUMN assigned_at DATETIME;")
                print("[CivicEye DB] Added assigned_at column to issues.")
            if "work_started_at" not in existing_cols:
                cursor.execute("ALTER TABLE issues ADD COLUMN work_started_at DATETIME;")
                print("[CivicEye DB] Added work_started_at column to issues.")
            if "work_completed_at" not in existing_cols:
                cursor.execute("ALTER TABLE issues ADD COLUMN work_completed_at DATETIME;")
                print("[CivicEye DB] Added work_completed_at column to issues.")
            if "worker_completion_note" not in existing_cols:
                cursor.execute("ALTER TABLE issues ADD COLUMN worker_completion_note TEXT;")
                print("[CivicEye DB] Added worker_completion_note column to issues.")
            if "citizen_verified" not in existing_cols:
                cursor.execute("ALTER TABLE issues ADD COLUMN citizen_verified BOOLEAN DEFAULT 0;")
                print("[CivicEye DB] Added citizen_verified column to issues.")
            if "citizen_verified_at" not in existing_cols:
                cursor.execute("ALTER TABLE issues ADD COLUMN citizen_verified_at DATETIME;")
                print("[CivicEye DB] Added citizen_verified_at column to issues.")
            if "citizen_rejection_reason" not in existing_cols:
                cursor.execute("ALTER TABLE issues ADD COLUMN citizen_rejection_reason TEXT;")
                print("[CivicEye DB] Added citizen_rejection_reason column to issues.")
            conn.commit()

        conn.close()
    except Exception as e:
        print(f"[CivicEye DB Migration Warning] {e}")
