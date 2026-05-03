// Minimal CSV parser supporting both ';' and ',' separators, quoted fields,
// escaped quotes ("") and CRLF / LF line endings.
export function parseCSV(input: string): string[][] {
  // Strip BOM if present
  const text = input.replace(/^\uFEFF/, '');

  // Auto-detect separator from the first non-empty line (prefer ';' for FR)
  const firstLine = text.split(/\r?\n/).find((l) => l.trim().length > 0) ?? '';
  const sep = (firstLine.match(/;/g)?.length ?? 0) >= (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';

  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let i = 0;
  let inQuotes = false;

  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }

    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === sep) {
      row.push(field);
      field = '';
      i++;
      continue;
    }
    if (c === '\r') {
      // handle \r\n together
      if (text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.some((f) => f.length > 0)) rows.push(row);
      row = [];
      i++;
      continue;
    }
    if (c === '\n') {
      row.push(field);
      field = '';
      if (row.some((f) => f.length > 0)) rows.push(row);
      row = [];
      i++;
      continue;
    }
    field += c;
    i++;
  }

  // flush last field
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((f) => f.length > 0)) rows.push(row);
  }

  return rows;
}

/**
 * Heuristically map a header name to a known column key.
 * Returns the canonical key or null.
 */
export function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]/g, '');
}
