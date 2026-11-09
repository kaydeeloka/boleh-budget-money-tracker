import * as XLSX from 'xlsx';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import type { BudgetCategory } from '../types';

/** One row from a bank's 거래내역 export, before it becomes an Expense. */
export interface ParsedTxn {
  date: string;          // YYYY-MM-DD (matches the rest of the app)
  time: string;          // HH:mm:ss or '' — only used for dedupe
  amount: number;        // always positive
  type: 'income' | 'expense';
  note: string;
  balance?: number;      // 잔액 after this transaction, if the file has it
  importRef: string;     // stable key so re-importing the same file is a no-op
  category?: string;     // from a Category column (Saku exports), if present
  subcategory?: string;
}

export interface ParseResult {
  fileName: string;
  txns: ParsedTxn[];
}

type Cell = string | number | boolean | Date | null | undefined;

const clean = (v: Cell) => String(v ?? '').replace(/\s+/g, '');

const toNum = (v: Cell): number => {
  if (typeof v === 'number') return v;
  const n = Number(String(v ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

const pad = (n: number | string) => String(n).padStart(2, '0');

/** Returns [YYYY-MM-DD, HH:mm:ss] from an Excel serial number or a Korean bank date string. */
function parseDateTime(v: Cell): [string, string] {
  if (typeof v === 'number' && v > 20000) {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return [`${d.y}-${pad(d.m)}-${pad(d.d)}`, d.H || d.M || d.S ? `${pad(d.H)}:${pad(d.M)}:${pad(Math.floor(d.S))}` : ''];
  }
  if (v instanceof Date) {
    return [`${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`, `${pad(v.getHours())}:${pad(v.getMinutes())}:${pad(v.getSeconds())}`];
  }
  const s = String(v ?? '');
  // "2026.11.03 14:22:10" · "2026-11-03 14:22" · "2026/11/03" · "20261103"
  const m = s.match(/(\d{4})[.\-/년\s]*(\d{1,2})[.\-/월\s]*(\d{1,2})일?(?:\D+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (!m) return ['', ''];
  const [, y, mo, d, h, mi, sec] = m;
  if (+mo < 1 || +mo > 12 || +d < 1 || +d > 31) return ['', ''];
  return [`${y}-${pad(mo)}-${pad(d)}`, h ? `${pad(h)}:${mi}:${sec ?? '00'}` : ''];
}

function parseTime(v: Cell): string {
  if (typeof v === 'number' && v < 1) { // Excel time fraction
    const secs = Math.round(v * 86400);
    return `${pad(Math.floor(secs / 3600))}:${pad(Math.floor((secs % 3600) / 60))}:${pad(secs % 60)}`;
  }
  const m = String(v ?? '').match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  return m ? `${pad(m[1])}:${m[2]}:${m[3] ?? '00'}` : '';
}

/** Find the header row: the first row with a date column and both 입금 and 출금 in separate cells. */
function findHeaderRow(rows: Cell[][]): number {
  return rows.findIndex(r => {
    const cells = r.map(clean).filter(Boolean);
    if (cells.length < 4) return false;
    const hasDate = cells.some(c => /거래일|일시|일자|날짜|^date$/i.test(c));
    // Korean bank exports (입금/출금) or Saku's own export (Cash In / Cash Out)
    const hasInOut = cells.some(c => c.startsWith('입금') || c.includes('맡기신') || /^cashin$/i.test(c)) &&
                     cells.some(c => c.startsWith('출금') || c.includes('찾으신') || /^cashout$/i.test(c));
    const hasAmountAndKind = cells.some(c => c.includes('거래금액')) && cells.some(c => c === '구분' || c.includes('입출구분'));
    return hasDate && (hasInOut || hasAmountAndKind);
  });
}

export function parseBankRows(rows: Cell[][]): ParsedTxn[] {
  const headerIdx = findHeaderRow(rows);
  if (headerIdx < 0) {
    throw new Error('Could not find the 거래내역 header row. Is this a Hana/KB transaction history export?');
  }

  const header = rows[headerIdx].map(clean);
  const col = (...patterns: RegExp[]) => header.findIndex(h => patterns.some(p => p.test(h)));

  const c = {
    date:   col(/^거래일시/, /^거래일자/, /^거래일/, /일시/, /일자/, /날짜/, /^date$/i),
    time:   col(/^거래시간/, /^시간/),
    inAmt:  col(/^입금/, /맡기신/, /^cashin$/i),
    outAmt: col(/^출금/, /찾으신/, /^cashout$/i),
    amount: col(/거래금액/),
    kind:   col(/^구분$/, /입출구분/),
    bal:    col(/잔액/, /^balance$/i),
    desc:   col(/적요/, /거래내용/, /^내용/, /^remark$/i, /^note$/i),
    who:    col(/의뢰인/, /수취인/, /보낸분/, /받는분/, /거래처/, /기재내용/),
    memo:   col(/메모/),
    cat:    col(/^category$/i, /^카테고리$/),
    sub:    col(/^subcategory$/i),
  };

  const out: ParsedTxn[] = [];
  const seen = new Map<string, number>();

  for (const r of rows.slice(headerIdx + 1)) {
    const [date, dtTime] = parseDateTime(r[c.date]);
    if (!date) continue; // footer / summary / blank rows

    let inAmt = c.inAmt >= 0 ? toNum(r[c.inAmt]) : 0;
    let outAmt = c.outAmt >= 0 ? toNum(r[c.outAmt]) : 0;
    if (c.inAmt < 0 && c.amount >= 0) {
      const kind = clean(r[c.kind]);
      const amt = Math.abs(toNum(r[c.amount]));
      if (kind.includes('입금')) inAmt = amt; else outAmt = amt;
    }
    if (!inAmt && !outAmt) continue;

    const time = dtTime || (c.time >= 0 ? parseTime(r[c.time]) : '');
    const type: ParsedTxn['type'] = inAmt > 0 ? 'income' : 'expense';
    const amount = Math.abs(inAmt || outAmt);
    const balance = c.bal >= 0 && String(r[c.bal] ?? '').trim() !== '' ? toNum(r[c.bal]) : undefined;

    const parts = [c.who, c.desc, c.memo]
      .filter(i => i >= 0)
      .map(i => String(r[i] ?? '').trim())
      .filter(Boolean);
    const note = [...new Set(parts)].join(' · ') || (type === 'income' ? '입금' : '출금');

    // Same date/time/amount/balance twice in one file is a genuine repeat — number them.
    const base = `${date}|${time}|${type}|${amount}|${balance ?? ''}`;
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);

    const category = c.cat >= 0 ? String(r[c.cat] ?? '').trim() || undefined : undefined;
    const subcategory = c.sub >= 0 ? String(r[c.sub] ?? '').trim() || undefined : undefined;
    out.push({ date, time, amount, type, note, balance, importRef: n ? `${base}#${n}` : base, category, subcategory });
  }

  if (out.length === 0) throw new Error('Found the header row but no transactions under it.');
  return out;
}

/** Opens the file picker and parses the chosen .xls/.xlsx/.csv. Returns null if cancelled. */
export async function pickAndParseBankFile(): Promise<ParseResult | null> {
  // '*/*' because bank .xls files often arrive with odd MIME types (text/html, octet-stream).
  const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, type: '*/*' });
  if (res.canceled || !res.assets?.length) return null;
  const asset = res.assets[0];

  let wb: XLSX.WorkBook;
  try {
    if (Platform.OS === 'web' && asset.file) {
      wb = XLSX.read(await asset.file.arrayBuffer(), { cellDates: false });
    } else {
      const b64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
      wb = XLSX.read(b64, { type: 'base64', cellDates: false });
    }
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    if (/password|encrypt/i.test(msg)) {
      throw new Error('This file is password-protected. Open it in Excel, then save a copy as .xlsx without a password.');
    }
    throw new Error(`Could not read the file: ${msg}`);
  }

  // Use the first sheet that contains a recognisable header.
  let lastErr: unknown;
  for (const name of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<Cell[]>(wb.Sheets[name], { header: 1, defval: '', raw: true });
    try {
      return { fileName: asset.name, txns: parseBankRows(rows) };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error('The file has no sheets.');
}

/** Simple keyword → category rules. Only returns names that exist in the user's categories. */
const RULES: [RegExp, string][] = [
  [/스타벅스|커피|카페|메가|컴포즈|빽다방|이디야|투썸|폴바셋|cafe|coffee/i, 'Food & Dining'],
  [/배달의민족|배민|요기요|쿠팡이츠|맥도날드|버거|치킨|김밥|식당|분식|편의점|GS25|CU|세븐일레븐|이마트24/i, 'Food & Dining'],
  [/쿠팡|네이버페이|11번가|G마켓|옥션|무신사|다이소|올리브영|이마트|홈플러스|롯데마트/i, 'Shopping'],
  [/교보|영풍|알라딘|예스24|yes24|서점|등록금|대학교|학원/i, 'Study'],
  [/대한항공|아시아나|에어|항공|코레일|KTX|SRT|티머니|교통|카카오T|택시|버스|지하철|호텔|숙박/i, 'Transport'],
  [/CGV|메가박스|롯데시네마|넷플릭스|netflix|유튜브|youtube|스포티파이|spotify|멜론|노래방|PC방/i, 'Entertainment'],
];

export function guessCategory(txn: Pick<ParsedTxn, 'note' | 'type'>, categories: BudgetCategory[]): string {
  if (txn.type === 'income') return 'Other Income';
  const names = new Set(categories.map(c => c.name));
  for (const [re, cat] of RULES) {
    if (re.test(txn.note) && names.has(cat)) return cat;
  }
  return 'Others';
}
