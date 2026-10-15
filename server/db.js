import { DatabaseSync } from "node:sqlite";
import { mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";

function numeric(value) {
  if (typeof value !== "bigint") return value;
  const number = Number(value);
  if (!Number.isSafeInteger(number)) throw new RangeError("SQLite integer exceeds JavaScript safe range");
  return number;
}

function normalizeRow(row) {
  if (!row) return row;
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, numeric(value)]));
}

class D1Statement {
  constructor(database, sql, values = []) {
    this.database = database;
    this.sql = sql;
    this.values = values;
  }

  bind(...values) {
    return new D1Statement(this.database, this.sql, values);
  }

  execute(mode) {
    const statement = this.database.prepare(this.sql);
    if (mode === "first") return normalizeRow(statement.get(...this.values)) || null;
    if (mode === "all") {
      const results = statement.all(...this.values).map(normalizeRow);
      return { success: true, results, meta: { changes: 0 } };
    }

    const result = statement.run(...this.values);
    return {
      success: true,
      meta: {
        changes: Number(result.changes || 0),
        last_row_id: numeric(result.lastInsertRowid)
      }
    };
  }

  async first() {
    return this.execute("first");
  }

  async all() {
    return this.execute("all");
  }

  async run() {
    return this.execute("run");
  }
}

export class D1SqliteDatabase {
  constructor(filename) {
    this.filename = filename;
    this.database = new DatabaseSync(filename);
    this.database.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
  }

  prepare(sql) {
    return new D1Statement(this.database, sql);
  }

  async batch(statements) {
    this.database.exec("BEGIN IMMEDIATE");
    try {
      const results = statements.map((statement) => statement.execute("run"));
      this.database.exec("COMMIT");
      return results;
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  async exec(sql) {
    this.database.exec(sql);
    return { count: 0, duration: 0 };
  }

  close() {
    this.database.close();
  }
}

export async function openDatabase({ filename, migrationsDirectory }) {
  await mkdir(path.dirname(filename), { recursive: true });
  const db = new D1SqliteDatabase(filename);
  db.database.exec(`CREATE TABLE IF NOT EXISTS local_schema_migrations (
    name TEXT PRIMARY KEY,
    applied_at INTEGER NOT NULL
  )`);

  const applied = new Set(
    db.database.prepare("SELECT name FROM local_schema_migrations").all().map((row) => row.name)
  );
  const migrations = (await readdir(migrationsDirectory))
    .filter((name) => /^\d+.*\.sql$/.test(name))
    .sort();

  for (const name of migrations) {
    if (applied.has(name)) continue;
    const sql = await readFile(path.join(migrationsDirectory, name), "utf8");
    db.database.exec("BEGIN IMMEDIATE");
    try {
      db.database.exec(sql);
      db.database.prepare("INSERT INTO local_schema_migrations (name, applied_at) VALUES (?, ?)")
        .run(name, Date.now());
      db.database.exec("COMMIT");
    } catch (error) {
      db.database.exec("ROLLBACK");
      db.close();
      throw new Error(`Migration ${name} failed: ${error.message}`, { cause: error });
    }
  }

  return db;
}
