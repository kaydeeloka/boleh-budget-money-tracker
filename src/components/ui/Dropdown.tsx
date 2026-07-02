import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Platform } from 'react-native';
import { ChevronDown, Check, X } from 'lucide-react-native';

export type DropdownOption = { label: string; value: string };

interface DropdownProps {
  options: DropdownOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  compact?: boolean;
  title?: string;
}

export default function Dropdown({
  options,
  selectedValue,
  onValueChange,
  placeholder = 'Select...',
  compact = false,
  title = 'Select an option',
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find(o => o.value === selectedValue)?.label || placeholder;

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.75}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 1,
          borderColor: '#e7e5e4',
          borderRadius: compact ? 10 : 12,
          backgroundColor: '#fafaf9',
          paddingHorizontal: compact ? 10 : 12,
          paddingVertical: compact ? 7 : 10,
          minHeight: compact ? 34 : 44,
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            fontSize: compact ? 12 : 13,
            fontWeight: '500',
            color: selectedValue ? '#1c1917' : '#a8a29e',
            marginRight: 6,
          }}
        >
          {selectedLabel}
        </Text>
        <ChevronDown size={compact ? 14 : 16} color="#a8a29e" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setOpen(false)}
          style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' }}
        >
          <TouchableOpacity activeOpacity={1}>
            <View style={{
              backgroundColor: 'white',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: 420,
              paddingBottom: Platform.OS === 'ios' ? 32 : 16,
            }}>
              {/* Handle bar */}
              <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#e7e5e4' }} />
              </View>

              {/* Header */}
              <View style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                paddingHorizontal: 20, paddingVertical: 12,
                borderBottomWidth: 1, borderBottomColor: '#f5f5f4',
              }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#1c1917' }}>{title}</Text>
                <TouchableOpacity
                  onPress={() => setOpen(false)}
                  style={{ padding: 4, backgroundColor: '#f5f5f4', borderRadius: 20 }}
                >
                  <X size={16} color="#78716c" />
                </TouchableOpacity>
              </View>

              {/* Options list */}
              <ScrollView showsVerticalScrollIndicator={false}>
                {options.map((opt, idx) => {
                  const isSelected = opt.value === selectedValue;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      activeOpacity={0.7}
                      onPress={() => { onValueChange(opt.value); setOpen(false); }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 20,
                        paddingVertical: 14,
                        backgroundColor: isSelected ? '#f0fdf4' : 'white',
                        borderBottomWidth: idx < options.length - 1 ? 1 : 0,
                        borderBottomColor: '#fafaf9',
                      }}
                    >
                      <Text style={{
                        fontSize: 14,
                        fontWeight: isSelected ? '700' : '400',
                        color: isSelected ? '#16a34a' : '#292524',
                        flex: 1,
                      }}>
                        {opt.label}
                      </Text>
                      {isSelected && <Check size={16} color="#16a34a" />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
