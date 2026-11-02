// Tiny JSON-file database. Keeps everything in memory and writes the whole
// file on each change. Good enough for a small team; swap for a real
// database (PostgreSQL, MongoDB, ...) when the app grows.
import fs from 'node:fs';
import path from 'node:path';

const EMPTY = () => ({ nextEmployeeId: 1, nextTaskId: 1, employees: [], tasks: [] });

export class Store {
  /** @param {string|null} file  path to JSON file, or null for in-memory only */
  constructor(file = null) {
    this.file = file;
    this.data = EMPTY();
    if (file && fs.existsSync(file)) {
      this.data = JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  }

  save() {
    if (!this.file) return;
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2));
    fs.renameSync(tmp, this.file);
  }
}
