import sqlite3

conn = sqlite3.connect('pyaaz_pro.db')
cursor = conn.cursor()

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = cursor.fetchall()

print('=== DATABASE TABLES ===')
for t in tables:
    print(f'  {t[0]}')

# Show schema for each table
print('\n=== TABLE SCHEMAS ===')
for t in tables:
    table_name = t[0]
    cursor.execute(f'PRAGMA table_info({table_name})')
    columns = cursor.fetchall()
    print(f'\n--- {table_name} ---')
    for c in columns:
        print(f'  {c[1]} ({c[2]})')

    # Show row count estimate
    cursor.execute(f'SELECT COUNT(*) FROM {table_name}')
    count = cursor.fetchone()[0]
    print(f'  Rows: {count}')

conn.close()
print('\n=== DONE ===')