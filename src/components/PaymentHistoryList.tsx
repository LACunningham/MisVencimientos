import { StyleSheet, Text, View } from 'react-native';

import { Radii, Spacing, Typography } from '@/constants/theme';
import { useAppTheme } from '@/context/theme';
import { formatFecha } from '@/lib/dates';
import { formatARS, sumarMontos } from '@/lib/money';
import type { Payment } from '@/types';

interface PaymentHistoryListProps {
  payments: Payment[];
}

/** Historial de pagos de una carga, del más reciente al más antiguo. */
export function PaymentHistoryList({ payments }: PaymentHistoryListProps) {
  const { palette } = useAppTheme();

  if (payments.length === 0) {
    return (
      <View style={[styles.vacio, { borderColor: palette.border }]}>
        <Text style={styles.vacioEmoji}>🧾</Text>
        <Text style={[Typography.label, { color: palette.textSecondary }]}>
          Todavía no registraste pagos.
        </Text>
        <Text style={[Typography.caption, { color: palette.textSecondary }]}>
          Cuando pagues, usá «Registrar pago» para guardar el historial.
        </Text>
      </View>
    );
  }

  const total = sumarMontos(payments.map((payment) => payment.monto));

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: palette.surface, borderColor: palette.border },
      ]}>
      <View style={styles.header}>
        <Text style={[Typography.sectionTitle, { color: palette.text }]}>Historial de pagos</Text>
        <Text style={[Typography.amount, { color: palette.text }]}>{formatARS(total)}</Text>
      </View>
      <Text style={[Typography.caption, { color: palette.textSecondary }]}>
        {payments.length === 1 ? '1 pago registrado' : `${payments.length} pagos registrados`}
      </Text>

      <View style={styles.lista}>
        {payments.map((payment) => (
          <View
            key={payment.id}
            style={[styles.item, { borderBottomColor: palette.border }]}>
            <View style={styles.itemInfo}>
              <Text style={[Typography.bodyRegular, { color: palette.text }]}>
                {formatFecha(payment.fecha)}
              </Text>
              <Text style={[Typography.caption, { color: palette.textSecondary }]}>
                Pago registrado
              </Text>
            </View>
            <Text style={[Typography.body, { color: palette.text }]}>
              {formatARS(payment.monto)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radii.card,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  lista: {
    marginTop: Spacing.two,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    gap: Spacing.two,
  },
  itemInfo: {
    gap: 2,
  },
  vacio: {
    borderRadius: Radii.card,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.one,
  },
  vacioEmoji: {
    fontSize: 32,
    marginBottom: Spacing.one,
  },
});