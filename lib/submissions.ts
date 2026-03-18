import fs from 'fs';
import path from 'path';

const SUBMISSIONS_DIR = path.join(process.cwd(), 'data', 'submissions');

function ensureDir() {
  if (!fs.existsSync(SUBMISSIONS_DIR)) {
    fs.mkdirSync(SUBMISSIONS_DIR, { recursive: true });
  }
}

export async function saveSubmission(type: 'contact' | 'registration', data: Record<string, unknown>): Promise<string> {
  ensureDir();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const id = `${type}-${timestamp}-${Math.random().toString(36).slice(2, 8)}`;
  const filePath = path.join(SUBMISSIONS_DIR, `${id}.json`);

  const record = {
    id,
    type,
    submittedAt: new Date().toISOString(),
    ...data,
  };

  fs.writeFileSync(filePath, JSON.stringify(record, null, 2), 'utf-8');
  return id;
}
