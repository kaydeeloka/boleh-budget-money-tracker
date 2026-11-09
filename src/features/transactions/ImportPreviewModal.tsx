import React, { useMemo, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { X, FileSpreadsheet } from 'lucide-react-native';
import { useAppContext } from '@/src/context/AppContext';
import { BankAccount } from '@/src/types';
import { ParseResult, guessCategory } from '@/src/utils/bankImport';
import { money, T } from '@/src/theme';

interface Props {
  account: BankAccount;
  result: ParseResult;
  onClose: (added?: number) => void;
}


export default function ImportPreviewModal({ account, result, onClose }: Props) {
  const fmt = (n: number) => money(n, account.currency);
  const { expenses, categories, handleImportTransactions } = useAppContext();
  const { txns, fileName } = result;

  const existingRefs = useMemo(
    () => new Set(expenses.filter(e => e.accountId === account.id && e.importRef).map(e => e.importRef!)),
    [expenses, account.id],
  );
  // Manually-entered rows on the same day with the same amount & direction — probably the same transaction.
  const manualKeys = useMemo(
    () => new Set(expenses
      .filter(e => e.accountId === account.id && !e.importRef)
      .map(e => `${e.date}|${e.amount}|${e.type ?? 'expense'}`)),
    [expenses, account.id],
  );

  const [skipManualMatches, setSkipManualMatches] = useState(true);

  const sorted = useMemo(
    () => [...txns].sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)),
    [txns],
  );
  const latestWithBalance = sorted.find(t => t.balance !== undefined);
  const [updateBalance, setUpdateBalance] = useState(latestWithBalance !== undefined);

  const rows = sorted.map(t => {
    const already = existingRefs.has(t.importRef);
    const manual = !already && manualKeys.has(`${t.date}|${t.amount}|${t.type}`);
    // Use the file's Category column when it names a known category, else guess from the remark
    const known = t.category && categories.some(cat => cat.name === t.category);
    return { t, already, manual, category: known ? t.category! : guessCategory(t, categories), subcategory: known ? t.subcategory : undefined };
  });
  const toImport = rows.filter(r => !r.already && !(skipManualMatches && r.manual));
  const alreadyCount = rows.filter(r => r.already).length;
  const manualCount = rows.filter(r => r.manual).length;
  const totalIn = toImport.filter(r => r.t.type === 'income').reduce((s, r) => s + r.t.amount, 0);
  const totalOut = toImport.filter(r => r.t.type === 'expense').reduce((s, r) => s + r.t.amount, 0);
  const dateRange = sorted.length ? `${sorted[sorted.length - 1].date} → ${sorted[0].date}` : '';

  const confirm = () => {
    const added = handleImportTransactions(
      account.id,
      toImport.map(({ t, category, subcategory }) => ({
        date: t.date,
        amount: t.amount,
        currency: account.currency,
        category,
        subcategory,
        note: t.note,
        type: t.type,
        importRef: t.importRef,
      })),
      updateBalance ? latestWithBalance?.balance : undefined,
    );
    onClose(added);
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={() => onClose()}>
      <View style={{ flex: 1, backgroundColor: '#faf8f5' }}>
        {/* Header */}
        <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e7e5e4', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: T.brandSoft, alignItems: 'center', justifyContent: 'center' }}>
            <FileSpreadsheet size={18} color={T.brandDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1c1917' }}>Import to {account.name}</Text>
            <Text style={{ fontSize: 11, color: '#a8a29e', marginTop: 1 }} numberOfLines={1}>{fileName} · {dateRange}</Text>
          </View>
          <TouchableOpacity onPress={() => onClose()} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#f5f5f4', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} color="#44403c" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          {/* Summary */}
          <View style={{ backgroundColor: T.brandDark, borderRadius: 20, padding: 16, gap: 10 }}>
            <Text style={{ color: 'white', fontSize: 22, fontWeight: '800' }}>{toImport.length} new transaction{toImport.length !== 1 ? 's' : ''}</Text>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <Text style={{ color: '#bbf7d0', fontSize: 13, fontWeight: '700' }}>입금 +{fmt(totalIn)}</Text>
              <Text style={{ color: '#fecaca', fontSize: 13, fontWeight: '700' }}>출금 −{fmt(totalOut)}</Text>
            </View>
            {alreadyCount > 0 && (
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{alreadyCount} already imported earlier — skipped</Text>
            )}
          </View>

          {/* Options */}
          <View style={{ backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#e7e5e4', padding: 14, gap: 12 }}>
            {latestWithBalance && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#1c1917' }}>Set balance to {fmt(latestWithBalance.balance!)}</Text>
                  <Text style={{ fontSize: 11, color: '#a8a29e', marginTop: 1 }}>
                    잔액 from the latest row ({latestWithBalance.date}). Currently {fmt(account.balance)}. Turn off if this file is older.
                  </Text>
                </View>
                <Switch value={updateBalance} onValueChange={setUpdateBalance} trackColor={{ true: T.brand }} />
              </View>
            )}
            {manualCount > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#1c1917' }}>Skip {manualCount} likely duplicate{manualCount !== 1 ? 's' : ''}</Text>
                  <Text style={{ fontSize: 11, color: '#a8a29e', marginTop: 1 }}>Same date & amount as something you entered by hand.</Text>
                </View>
                <Switch value={skipManualMatches} onValueChange={setSkipManualMatches} trackColor={{ true: T.brand }} />
              </View>
            )}
          </View>

          {/* Rows */}
          <View style={{ backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#e7e5e4', overflow: 'hidden' }}>
            {rows.map(({ t, already, manual, category, subcategory }, i) => {
              const skipped = already || (skipManualMatches && manual);
              return (
                <View key={t.importRef} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderTopColor: '#f5f5f4', opacity: skipped ? 0.4 : 1 }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={{ fontSize: 13, color: '#1c1917', fontWeight: '600' }} numberOfLines={1}>{t.note}</Text>
                    <Text style={{ fontSize: 10, color: '#a8a29e', marginTop: 2 }}>
                      {t.date}{t.time ? ` ${t.time.slice(0, 5)}` : ''} · {category}{subcategory ? ` · ${subcategory}` : ''}{already ? ' · imported' : manual ? ' · possible duplicate' : ''}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: t.type === 'income' ? '#15803d' : '#1c1917' }}>
                    {t.type === 'income' ? '+' : '−'}{fmt(t.amount)}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={{ backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#e7e5e4', padding: 16, paddingBottom: 28 }}>
          <TouchableOpacity
            onPress={confirm}
            disabled={toImport.length === 0 && !updateBalance}
            style={{ backgroundColor: toImport.length === 0 && !updateBalance ? '#d6d3d1' : T.brand, borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}
          >
            <Text style={{ color: 'white', fontWeight: '800', fontSize: 14 }}>
              {toImport.length ? `Import ${toImport.length} transaction${toImport.length !== 1 ? 's' : ''}` : updateBalance ? 'Update balance only' : 'Nothing to import'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
