import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import type { BankAccount, Currency, Expense } from '../types';

export interface ExportSummary {
  periodLabel: string;
  totalIn: number;
  totalOut: number;
  opening: number;
  closing: number;
}

/**
 * Writes the cash book rows to an .xlsx and downloads it (web) or opens the share sheet (phone).
 * Column names match what the importer understands, so an exported file can be imported back.
 */
export async function exportCashBook(
  rows: Expense[], accounts: BankAccount[], currency: Currency, summary: ExportSummary, fileBase: string,
) {
  const accName = (id: string) => accounts.find(a => a.id === id)?.name ?? '';
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date)); // oldest first, like a bank statement
  const aoa: (string | number)[][] = [
    [`Saku Cash Book — ${summary.periodLabel} (${currency})`],
    [],
    ['Date', 'Remark', 'Category', 'Subcategory', 'Account', 'Cash In', 'Cash Out'],
    ...sorted.map(e => [
      e.date, e.note, e.category, e.subcategory ?? '', accName(e.accountId),
      e.type === 'income' ? e.amount : '', e.type === 'income' ? '' : e.amount,
    ]),
    [],
    ['', '', '', '', 'Total', summary.totalIn, summary.totalOut],
    ['', '', '', '', 'Opening Balance', summary.opening, ''],
    ['', '', '', '', 'Closing Balance', summary.closing, ''],
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [{ wch: 12 }, { wch: 36 }, { wch: 20 }, { wch: 16 }, { wch: 26 }, { wch: 14 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Cash Book');
  const fileName = `${fileBase.replace(/[^\w\-]+/g, '_')}.xlsx`;

  if (Platform.OS === 'web') {
    XLSX.writeFile(wb, fileName);
    return;
  }
  const b64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  const uri = `${FileSystem.cacheDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(uri, b64, { encoding: FileSystem.EncodingType.Base64 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Export cash book',
      UTI: 'org.openxmlformats.spreadsheetml.sheet',
    });
  } else {
    throw new Error(`Saved to ${uri}`);
  }
}
