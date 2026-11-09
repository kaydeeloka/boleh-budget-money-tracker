import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Platform, Pressable, useWindowDimensions } from 'react-native';
import { ChevronDown, Check, X } from 'lucide-react-native';
import { useIsWide, T } from '../../theme';

export type DropdownOption = { label: string; value: string };

interface DropdownProps {
  options: DropdownOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  compact?: boolean;
  title?: string;
}

/**
 * Select field. Phones: bottom sheet. Wide screens: a small popup anchored under the field
 * (instead of a full-width sheet across the whole page).
 */
export default function Dropdown({
  options,
  selectedValue,
  onValueChange,
  placeholder = 'Select...',
  compact = false,
  title = 'Select an option',
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const triggerRef = useRef<View>(null);
  const isWide = useIsWide();
  const { height: winH } = useWindowDimensions();
  const selectedLabel = options.find(o => o.value === selectedValue)?.label || placeholder;

  const openMenu = () => {
    if (isWide && triggerRef.current) {
      triggerRef.current.measureInWindow((x, y, w, h) => { setAnchor({ x, y, w, h }); setOpen(true); });
    } else {
      setAnchor(null);
      setOpen(true);
    }
  };
  const pick = (v: string) => { onValueChange(v); setOpen(false); };

  const optionList = (rowPad: number) => options.map((opt, idx) => {
    const isSelected = opt.value === selectedValue;
    return (
      <TouchableOpacity
        key={opt.value}
        activeOpacity={0.7}
        onPress={() => pick(opt.value)}
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: rowPad, paddingVertical: rowPad === 20 ? 14 : 9,
          backgroundColor: isSelected ? T.brandSoft : 'white',
          borderBottomWidth: idx < options.length - 1 ? 1 : 0, borderBottomColor: '#f5f5f4',
        }}
      >
        <Text numberOfLines={1} style={{ fontSize: rowPad === 20 ? 14 : 13, fontWeight: isSelected ? '700' : '400', color: isSelected ? T.brandMid : '#292524', flex: 1 }}>
          {opt.label}
        </Text>
        {isSelected && <Check size={15} color={T.brandMid} />}
      </TouchableOpacity>
    );
  });

  // Popover position: under the field, or above it when there isn't room below
  const popMaxH = 300;
  const below = anchor ? anchor.y + anchor.h + 4 + Math.min(popMaxH, options.length * 38) < winH : true;

  return (
    <>
      <View ref={triggerRef} collapsable={false}>
        <TouchableOpacity
          onPress={openMenu}
          activeOpacity={0.75}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            borderWidth: 1, borderColor: '#e7e5e4', borderRadius: 6, backgroundColor: '#ffffff',
            paddingHorizontal: compact ? 10 : 12, paddingVertical: compact ? 7 : 10, minHeight: compact ? 34 : 44,
          }}
        >
          <Text numberOfLines={1} style={{ flex: 1, fontSize: compact ? 12 : 13, fontWeight: '500', color: selectedValue ? '#1c1917' : '#a8a29e', marginRight: 6 }}>
            {selectedLabel}
          </Text>
          <ChevronDown size={compact ? 14 : 16} color="#a8a29e" />
        </TouchableOpacity>
      </View>

      <Modal visible={open} transparent animationType={anchor ? 'none' : 'fade'} onRequestClose={() => setOpen(false)}>
        {anchor ? (
          // Wide screens: small popup next to the field
          <Pressable onPress={() => setOpen(false)} style={{ flex: 1 }}>
            <Pressable
              onPress={() => {}}
              style={{
                position: 'absolute', left: anchor.x, width: Math.max(anchor.w, 220),
                ...(below ? { top: anchor.y + anchor.h + 4 } : { bottom: winH - anchor.y + 4 }),
                maxHeight: popMaxH, backgroundColor: 'white', borderRadius: 8, borderWidth: 1, borderColor: '#e7e5e4',
                shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8, overflow: 'hidden',
              }}
            >
              <ScrollView>{optionList(12)}</ScrollView>
            </Pressable>
          </Pressable>
        ) : (
          // Phones: bottom sheet
          <TouchableOpacity activeOpacity={1} onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' }}>
            <TouchableOpacity activeOpacity={1}>
              <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: 420, paddingBottom: Platform.OS === 'ios' ? 32 : 16 }}>
                <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
                  <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#e7e5e4' }} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f4' }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#1c1917' }}>{title}</Text>
                  <TouchableOpacity onPress={() => setOpen(false)} style={{ padding: 4, backgroundColor: '#f5f5f4', borderRadius: 20 }}>
                    <X size={16} color="#78716c" />
                  </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>{optionList(20)}</ScrollView>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      </Modal>
    </>
  );
}
