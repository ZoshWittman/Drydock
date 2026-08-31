import { beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

const TEST_DB_DIR = path.join(process.cwd(), 'data-test');
const TEST_DB_PATH = path.join(TEST_DB_DIR, 'drydock.db');

beforeEach(() => {
  if (fs.existsSync(TEST_DB_DIR)) {
    fs.rmSync(TEST_DB_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEST_DB_DIR, { recursive: true });
  
  process.env.NODE_ENV = 'test';
});

afterEach(() => {
  if (fs.existsSync(TEST_DB_DIR)) {
    fs.rmSync(TEST_DB_DIR, { recursive: true, force: true });
  }
});
