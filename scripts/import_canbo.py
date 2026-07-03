import xlrd, psycopg2, re, uuid, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from datetime import datetime, timedelta

conn = psycopg2.connect(host="localhost", port=5432, dbname="hrm", user="hrm", password="hrm_dev_pass")
conn.autocommit = False
cur = conn.cursor()

# ── Load existing departments ─────────────────────────────────────────────────
cur.execute("SELECT name, id, code FROM personnel.departments")
dept_map_norm = {}
existing_codes = set()
for row in cur.fetchall():
    key = re.sub(r'\s+', ' ', row[0].strip())
    dept_map_norm[key] = str(row[1])
    existing_codes.add(row[2])

def norm(s):
    return re.sub(r'\s+', ' ', str(s).strip())

# ── Read XLS ──────────────────────────────────────────────────────────────────
wb = xlrd.open_workbook(r'C:\Users\NHAT MINH\Downloads\CanBo.xls')
ws = wb.sheet_by_index(0)

# ── Find & insert missing departments ────────────────────────────────────────
xls_depts = []
seen = set()
for r in range(10, ws.nrows):
    d = norm(ws.cell_value(r, 4))
    if d and d not in seen:
        seen.add(d)
        xls_depts.append(d)

missing_depts = [d for d in xls_depts if d not in dept_map_norm]
print(f"Missing depts ({len(missing_depts)}): {missing_depts}")

# Generate unique codes: DV-001, DV-002, ...
counter = 1
for dept_name in missing_depts:
    while f'DV-{counter:03d}' in existing_codes:
        counter += 1
    code = f'DV-{counter:03d}'
    existing_codes.add(code)
    new_id = str(uuid.uuid4())
    cur.execute(
        "INSERT INTO personnel.departments (id, code, name) VALUES (%s, %s, %s)",
        (new_id, code, dept_name)
    )
    dept_map_norm[dept_name] = new_id
    print(f"  Added: [{code}] {dept_name}")
    counter += 1

conn.commit()
print()

# ── Parse date ────────────────────────────────────────────────────────────────
def parse_date(val):
    s = str(val).strip()
    if not s or s in ('', 'None', '0.0', '0'):
        return None
    for fmt in ('%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y'):
        try:
            return datetime.strptime(s, fmt).date()
        except:
            pass
    try:
        n = int(float(s))
        if n > 1000:
            return (datetime(1899, 12, 30) + timedelta(days=n)).date()
    except:
        pass
    return None

# ── Import employees ──────────────────────────────────────────────────────────
gender_map = {'Nam': 'MALE', 'Nữ': 'FEMALE'}
status_map = {'Đang làm': 'ACTIVE', 'Đã nghỉ': 'TERMINATED'}

inserted = 0
skipped  = 0
errors   = []

for r in range(10, ws.nrows):
    full_name = norm(ws.cell_value(r, 2))
    if not full_name:
        continue

    emp_code   = norm(ws.cell_value(r, 1)) or None
    dept_name  = norm(ws.cell_value(r, 4))
    position   = norm(ws.cell_value(r, 8)) or None
    gender     = gender_map.get(norm(ws.cell_value(r, 9)), 'OTHER')
    dob        = parse_date(ws.cell_value(r, 10))
    phone      = norm(ws.cell_value(r, 22)) or norm(ws.cell_value(r, 21)) or None
    email_raw  = norm(ws.cell_value(r, 23))
    join_date  = parse_date(ws.cell_value(r, 20))
    status     = status_map.get(norm(ws.cell_value(r, 24)), 'ACTIVE')
    national_id= norm(ws.cell_value(r, 14)) or None
    dept_id    = dept_map_norm.get(dept_name)

    if '@' in email_raw:
        email = email_raw.lower()
    elif emp_code:
        email = f"{emp_code}@bvnghean.vn"
    else:
        email = None

    if phone and len(phone) > 20:
        phone = phone[:20]

    try:
        cur.execute("SAVEPOINT sp")
        cur.execute("""
            INSERT INTO personnel.employees
                (employee_code, full_name, email, phone, gender, date_of_birth,
                 national_id, join_date, status, contract_type, department_id,
                 position, created_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'INDEFINITE', %s, %s, 'import')
            ON CONFLICT (employee_code) DO NOTHING
        """, (emp_code, full_name, email, phone, gender, dob,
              national_id, join_date, status, dept_id, position))
        if cur.rowcount > 0:
            inserted += 1
        else:
            skipped += 1
        cur.execute("RELEASE SAVEPOINT sp")
    except Exception as e:
        cur.execute("ROLLBACK TO SAVEPOINT sp")
        errors.append(f"Row {r+1} ({full_name}): {e}")

conn.commit()
conn.close()

print(f"✓ Inserted : {inserted}")
print(f"  Skipped  : {skipped} (duplicate)")
if errors:
    print(f"  Errors ({len(errors)}):")
    for err in errors:
        print("   ", err)
else:
    print("  Errors   : 0")
