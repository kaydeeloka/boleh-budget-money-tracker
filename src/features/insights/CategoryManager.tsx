import React, { useState } from 'react';
import { Modal, Pressable, View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { X, Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react-native';
import { useAppContext } from '@/src/context/AppContext';
import { BudgetCategory } from '@/src/types';
import { T, useIsWide } from '@/src/theme';
import { CATEGORY_ICONS, CATEGORY_COLORS, categoryStyle } from '@/src/categories';

type Kind = 'expense' | 'income';

const input = { borderWidth: 1, borderColor: T.line, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: T.ink, backgroundColor: T.white } as const;
const label = (t: string) => <Text style={{ fontSize: 10, fontWeight: '800', color: T.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>{t}</Text>;

/** Edit one category: name, icon, colour, subcategories (add / rename / remove). */
function CategoryEditor({ cat, onDone }: { cat: BudgetCategory; onDone: () => void }) {
  const { categories, handleUpdateCategory, handleDeleteCategory } = useAppContext();
  const [name, setName] = useState(cat.name);
  const [icon, setIcon] = useState(cat.icon);
  const [color, setColor] = useState(cat.color);
  // Subcategories with their original name, so renames can be applied to past entries
  const [subs, setSubs] = useState(() => (cat.subcategories ?? []).map(s => ({ orig: s as string | null, name: s })));
  const [newSub, setNewSub] = useState('');
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isFallback = cat.name === 'Others' || cat.name === 'Other Income';

  const addSub = () => {
    const v = newSub.trim();
    if (!v || subs.some(s => s.name.toLowerCase() === v.toLowerCase())) return setNewSub('');
    setSubs(prev => [...prev, { orig: null, name: v }]);
    setNewSub('');
  };

  const save = () => {
    const n = name.trim();
    if (!n) return setError('Name cannot be empty.');
    if (categories.some(c => c.id !== cat.id && c.name.toLowerCase() === n.toLowerCase())) return setError('Another category already has this name.');
    const cleaned = subs.map(s => ({ ...s, name: s.name.trim() })).filter(s => s.name);
    const renames: Record<string, string> = {};
    for (const s of cleaned) if (s.orig && s.orig !== s.name) renames[s.orig] = s.name;
    for (const o of cat.subcategories ?? []) if (!cleaned.some(s => s.orig === o)) renames[o] = ''; // removed → clears it on entries
    handleUpdateCategory(cat.id, { name: n, icon, color, subcategories: [...new Set(cleaned.map(s => s.name))] }, renames);
    onDone();
  };

  return (
    <View style={{ padding: 14, gap: 14, backgroundColor: T.green50, borderBottomWidth: 1, borderBottomColor: T.line }}>
      <View>
        {label('Name')}
        <TextInput style={input} value={name} onChangeText={setName} placeholder="Category name" placeholderTextColor={T.faint} />
      </View>

      <View>
        {label('Icon')}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {Object.entries(CATEGORY_ICONS).map(([key, Icon]) => (
            <TouchableOpacity key={key} onPress={() => setIcon(key)} accessibilityLabel={key} style={{ width: 36, height: 36, borderRadius: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: icon === key ? T.brand : T.line, backgroundColor: T.white }}>
              <Icon size={17} color={icon === key ? T.brand : T.ink2} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View>
        {label('Colour')}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {Object.entries(CATEGORY_COLORS).map(([key, hex]) => (
            <TouchableOpacity key={key} onPress={() => setColor(key)} accessibilityLabel={key} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: hex, borderWidth: color === key ? 3 : 0, borderColor: T.ink }} />
          ))}
        </View>
      </View>

      <View>
        {label('Subcategories')}
        <View style={{ gap: 6 }}>
          {subs.map((s, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TextInput style={[input, { flex: 1, paddingVertical: 6 }]} value={s.name} onChangeText={v => setSubs(prev => prev.map((x, j) => (j === i ? { ...x, name: v } : x)))} />
              <TouchableOpacity onPress={() => setSubs(prev => prev.filter((_, j) => j !== i))} accessibilityLabel={`Remove ${s.name}`} style={{ padding: 6 }}>
                <X size={16} color={T.out} />
              </TouchableOpacity>
            </View>
          ))}
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TextInput style={[input, { flex: 1, paddingVertical: 6 }]} value={newSub} onChangeText={setNewSub} onSubmitEditing={addSub} placeholder="Add subcategory…" placeholderTextColor={T.faint} />
            <TouchableOpacity onPress={addSub} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, borderRadius: 6, backgroundColor: T.brand }}>
              <Plus size={14} color={T.white} />
              <Text style={{ color: T.white, fontWeight: '700', fontSize: 13 }}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={{ fontSize: 11, color: T.faint, marginTop: 6 }}>Renaming updates past entries too. Removing a subcategory keeps the entries in this category.</Text>
      </View>

      {!!error && <Text style={{ color: T.out, fontSize: 12, fontWeight: '600' }}>{error}</Text>}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {!isFallback && (
          <TouchableOpacity
            onPress={() => { if (!confirmDelete) return setConfirmDelete(true); handleDeleteCategory(cat.id); onDone(); }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 6, backgroundColor: confirmDelete ? T.out : T.outSoft }}
          >
            <Trash2 size={14} color={confirmDelete ? T.white : T.out} />
            <Text style={{ fontWeight: '700', fontSize: 13, color: confirmDelete ? T.white : T.out }}>{confirmDelete ? `Move entries to ${(cat.type ?? 'expense') === 'income' ? 'Other Income' : 'Others'} & delete` : 'Delete'}</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={onDone} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 6, backgroundColor: T.line2 }}>
          <Text style={{ fontWeight: '700', fontSize: 13, color: T.ink2 }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={save} style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 6, backgroundColor: T.brand }}>
          <Text style={{ fontWeight: '800', fontSize: 13, color: T.white }}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** Popup listing all categories (Expense / Income) with inline editing and "add category". */
export default function CategoryManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { categories, expenses, handleAddCategory } = useAppContext();
  const isWide = useIsWide();
  const [kind, setKind] = useState<Kind>('expense');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const list = categories.filter(c => (c.type ?? 'expense') === kind);
  const counts = expenses.reduce<Record<string, number>>((m, e) => { m[e.category] = (m[e.category] || 0) + 1; return m; }, {});

  const add = () => {
    const n = newName.trim();
    if (!n || categories.some(c => c.name.toLowerCase() === n.toLowerCase())) return;
    const id = `cat-${Date.now()}`;
    handleAddCategory({ id, name: n, icon: kind === 'income' ? 'Coins' : 'Tag', color: kind === 'income' ? 'Emerald' : 'Slate', isCustom: true, type: kind, subcategories: [] });
    setNewName('');
    setEditingId(id); // open it so icon / colour / subcategories can be set right away
  };

  return (
    <Modal visible={open} transparent animationType={isWide ? 'fade' : 'slide'} onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(28,25,23,0.45)', justifyContent: isWide ? 'center' : 'flex-end', alignItems: 'center', padding: isWide ? 24 : 0 }}>
        <Pressable onPress={() => {}} style={{ width: '100%', maxWidth: isWide ? 560 : undefined, height: isWide ? '85%' : '88%', backgroundColor: T.white, borderRadius: isWide ? 14 : 0, borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' }}>
          {/* Header */}
          <View style={{ backgroundColor: T.brand, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ flex: 1, color: T.white, fontSize: 18, fontWeight: '800' }}>Categories</Text>
              <TouchableOpacity onPress={onClose} accessibilityLabel="Close" style={{ padding: 4 }}>
                <X size={20} color={T.white} />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(['expense', 'income'] as Kind[]).map(k => (
                <TouchableOpacity key={k} onPress={() => { setKind(k); setEditingId(null); }} style={{ flex: 1, paddingVertical: 7, borderRadius: 999, alignItems: 'center', borderWidth: 1.5, borderColor: T.white, backgroundColor: kind === k ? 'transparent' : T.white }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: kind === k ? T.white : T.ink }}>{k === 'expense' ? 'Expense' : 'Income'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
            {list.map((c, i) => {
              const { Icon, color } = categoryStyle(categories, c.name);
              const open_ = editingId === c.id;
              return (
                <View key={c.id}>
                  <TouchableOpacity
                    onPress={() => setEditingId(open_ ? null : c.id)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: open_ ? T.green50 : i % 2 ? '#fcfcfb' : T.white, borderBottomWidth: 1, borderBottomColor: T.line2 }}
                  >
                    <View style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: T.line2, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={18} color={color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: T.ink }}>{c.name}</Text>
                      <Text style={{ fontSize: 11, color: T.faint, marginTop: 1 }} numberOfLines={1}>
                        {(c.subcategories ?? []).length ? c.subcategories!.join(' · ') : 'No subcategories'}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, color: T.muted }}>{counts[c.name] ?? 0} entries</Text>
                    {open_ ? <ChevronUp size={18} color={T.faint} /> : <ChevronDown size={18} color={T.faint} />}
                  </TouchableOpacity>
                  {open_ && <CategoryEditor key={c.id} cat={c} onDone={() => setEditingId(null)} />}
                </View>
              );
            })}
          </ScrollView>

          {/* Add category */}
          <View style={{ flexDirection: 'row', gap: 8, padding: 12, paddingBottom: isWide ? 12 : 28, borderTopWidth: 1, borderTopColor: T.line }}>
            <TextInput style={[input, { flex: 1 }]} value={newName} onChangeText={setNewName} onSubmitEditing={add} placeholder={`New ${kind} category…`} placeholderTextColor={T.faint} />
            <TouchableOpacity onPress={add} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, borderRadius: 6, backgroundColor: T.brand }}>
              <Plus size={15} color={T.white} />
              <Text style={{ color: T.white, fontWeight: '800', fontSize: 13 }}>Add</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
