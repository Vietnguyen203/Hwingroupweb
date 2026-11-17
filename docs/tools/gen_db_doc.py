"""
Sinh docs/06-database.md từ database đang chạy (đọc catalog của PostgreSQL + COMMENT của bảng/cột).

Chạy ở thư mục gốc dự án (Postgres phải đang chạy qua Docker):
    python docs/tools/gen_db_doc.py
"""
import json
import os
import subprocess
import sys
from pathlib import Path

CONTAINER = "hwin-postgres-1"
SCHEMAS = ["identity", "catalog", "ordering", "customer", "affiliate", "audit", "public"]
OUT = Path(__file__).resolve().parents[1] / "06-database.md"

SQL = r"""
select json_build_object(
  'schemas', (select json_agg(json_build_object('name', n.nspname, 'comment', obj_description(n.oid, 'pg_namespace')))
              from pg_namespace n where n.nspname = any(%(schemas)s)),
  'tables', (select json_agg(t order by t.schema_order, t.name) from (
      select c.oid, n.nspname as schema, c.relname as name, array_position(%(schemas)s, n.nspname::text) as schema_order,
             obj_description(c.oid, 'pg_class') as comment,
             (select json_agg(json_build_object(
                     'name', a.attname,
                     'type', format_type(a.atttypid, a.atttypmod),
                     'notnull', a.attnotnull,
                     'default', pg_get_expr(d.adbin, d.adrelid),
                     'generated', a.attgenerated <> '',
                     'identity', a.attidentity <> '',
                     'comment', col_description(c.oid, a.attnum)) order by a.attnum)
                from pg_attribute a left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
               where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped) as columns,
             (select json_agg(json_build_object('name', co.conname, 'type', co.contype,
                     'def', pg_get_constraintdef(co.oid)) order by co.contype, co.conname)
                from pg_constraint co where co.conrelid = c.oid) as constraints,
             (select json_agg(json_build_object('name', i.indexname, 'def', i.indexdef) order by i.indexname)
                from pg_indexes i where i.schemaname = n.nspname and i.tablename = c.relname
                 and i.indexname not in (select conname from pg_constraint where conrelid = c.oid)) as indexes,
             (select reltuples::bigint from pg_class where oid = c.oid) as approx_rows
        from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where c.relkind = 'r' and n.nspname = any(%(schemas)s)
         and c.relname not like 'flyway_schema_history') t)
)
"""


def query():
    arr = "array[" + ",".join(f"'{s}'" for s in SCHEMAS) + "]::text[]"
    sql = SQL.replace("%(schemas)s", arr)
    out = subprocess.run(["docker", "exec", "-i", CONTAINER, "psql", "-U", "hwin", "-d", os.environ.get("HWIN_DOC_DB", "hwin"), "-At", "-c", sql],
                         capture_output=True, text=True, encoding="utf-8", check=True).stdout
    return json.loads(out)


def esc(s):
    return (s or "").replace("|", "\\|").replace("\n", " ")


KIND = {"p": "PRIMARY KEY", "u": "UNIQUE", "f": "FOREIGN KEY", "c": "CHECK", "t": "TRIGGER", "x": "EXCLUDE"}


def main():
    data = query()
    tables = data["tables"] or []
    schema_comment = {s["name"]: s["comment"] for s in data["schemas"] or []}
    lines = [
        "# 06 – Database (sinh tự động)",
        "",
        "> **Không sửa tay file này.** Sinh từ database đang chạy bằng `python docs/tools/gen_db_doc.py`.",
        "> Mô tả bảng/cột lấy từ `COMMENT` trong DB (migration `V2_9_0__table_comments.sql`) – xem được trong DBeaver.",
        "",
        "## Quy ước",
        "",
        "- Mỗi bounded context một **schema**; **không có foreign key xuyên schema** – cột tham chiếu module khác chỉ lưu ID.",
        "- Tiền: `bigint` VND. Thời gian: `timestamptz` (UTC). Aggregate root có `version` (optimistic locking), `created_at`, `updated_at`.",
        "- Migration Flyway đặt theo module: `backend/src/main/resources/db/migration/<module>/V<chặng>_<thứ tự>_<lần sửa>__<mô tả>.sql`.",
        "  Không sửa migration đã chạy – muốn đổi cấu trúc thì thêm file mới với version lớn hơn.",
        "",
        "## Tổng quan",
        "",
        "| Schema | Bảng | Mô tả |",
        "|---|---|---|",
    ]
    for t in tables:
        lines.append(f"| `{t['schema']}` | [`{t['name']}`](#{t['schema']}{t['name']}) | {esc(t['comment'])} |")
    for s in SCHEMAS:
        if not any(t["schema"] == s for t in tables):
            lines.append(f"| `{s}` | – | {esc(schema_comment.get(s))} – chưa có bảng |")

    current = None
    for t in tables:
        if t["schema"] != current:
            current = t["schema"]
            lines += ["", f"## Schema `{current}`", "", esc(schema_comment.get(current)) or ""]
        lines += ["", f"### {t['schema']}.{t['name']}", "", esc(t["comment"]) or "_(chưa có mô tả)_", "",
                  "| Cột | Kiểu | Null | Mặc định | Mô tả |", "|---|---|:-:|---|---|"]
        pk_cols = set()
        for c in t["constraints"] or []:
            if c["type"] == "p":
                pk_cols |= {x.strip() for x in c["def"][c["def"].index("(") + 1:c["def"].index(")")].split(",")}
        for col in t["columns"]:
            name = f"**{col['name']}** 🔑" if col["name"] in pk_cols else col["name"]
            default = "identity" if col["identity"] else ("_generated_" if col["generated"] else esc(col["default"]))
            lines.append(f"| {name} | `{col['type']}` | {'' if col['notnull'] else '✓'} | {default} | {esc(col['comment'])} |")
        cons = [c for c in (t["constraints"] or []) if c["type"] != "p"]
        if cons:
            lines += ["", "Ràng buộc:", ""]
            lines += [f"- `{c['name']}` – {KIND.get(c['type'], c['type'])} `{esc(c['def'])}`" for c in cons]
        if t["indexes"]:
            lines += ["", "Index:", ""]
            lines += [f"- `{i['name']}` – `{esc(i['def'].split(' USING ')[-1])}`" for i in t["indexes"]]
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Đã ghi {OUT} ({len(tables)} bảng)")


if __name__ == "__main__":
    sys.exit(main())
