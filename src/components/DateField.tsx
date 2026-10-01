import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput } from 'react-native';

import { Radii, Spacing, Typography, type Palette } from '@/constants/theme';
import { formatFecha, fromIso, isValidIso, parseFechaLegacy, toIso } from '@/lib/dates';

interface DateFieldProps {
  /** Fecha en ISO `YYYY-MM-DD`. */
  value: string;
  onChange: (isoDate: string) => void;
  palette: Palette;
  label: string;
}

function resolveIso(value: string): string {
  return isValidIso(value) ? value : toIso(new Date());
}

/**
 * Selector de fecha. En iOS/Android usa el picker nativo; en web, que
 * `@react-native-community/datetimepicker` no soporta, cae a un campo de texto.
 */
export function DateField({ value, onChange, palette, label }: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const isoValue = resolveIso(value);

  if (Platform.OS === 'web') {
    return <WebDateInput value={isoValue} onChange={onChange} palette={palette} label={label} />;
  }

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    setOpen(false);

    if (event.type === 'dismissed' || !selected) {
      return;
    }

    onChange(toIso(selected));
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setOpen((prev) => !prev)}
        style={({ pressed }) => [
          styles.trigger,
          { backgroundColor: palette.inputBg, borderColor: palette.border },
          pressed && styles.pressed,
        ]}>
        <Text style={[Typography.bodyRegular, { color: palette.text }]}>
          {formatFecha(isoValue)}
        </Text>
        <Text style={[styles.caret, { color: palette.textSecondary }]}>▾</Text>
      </Pressable>
      {open && (
        <DateTimePicker
          value={fromIso(isoValue)}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={handleChange}
        />
      )}
    </>
  );
}

function WebDateInput({
  value,
  onChange,
  palette,
  label,
}: {
  value: string;
  onChange: (isoDate: string) => void;
  palette: Palette;
  label: string;
}) {
  const [text, setText] = useState(formatFecha(value));

  const handleChangeText = (next: string) => {
    setText(next);

    const parsed = parseFechaLegacy(next) ?? (isValidIso(next.trim()) ? next.trim() : null);

    if (parsed !== null) {
      onChange(parsed);
    }
  };

  return (
    <TextInput
      value={text}
      onChangeText={handleChangeText}
      placeholder="DD/MM/AAAA"
      placeholderTextColor={palette.textSecondary}
      autoCapitalize="none"
      accessibilityLabel={label}
      style={[
        styles.input,
        { backgroundColor: palette.inputBg, borderColor: palette.border, color: palette.text },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radii.control,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: Spacing.two,
  },
  input: {
    borderRadius: Radii.control,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  caret: {
    fontSize: 12,
  },
  pressed: {
    opacity: 0.7,
  },
});