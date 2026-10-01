import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radii, ToneColors, Typography } from '@/constants/theme';
import { useAppTheme } from '@/context/theme';
import { etiquetaVencimiento, formatFecha } from '@/lib/dates';
import { formatARS } from '@/lib/money';
import type { Bill } from '@/types';

interface BillCardProps {
  bill: Bill;
  /** Abre el detalle para editar, pagar o eliminar. */
  onPress: () => void;
}

export function BillCard({ bill, onPress }: BillCardProps) {
  const { palette } = useAppTheme();
  const etiqueta = etiquetaVencimiento(bill.fecha, undefined, bill.pagado);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${bill.nombre}, ${formatARS(bill.monto)}, ${etiqueta.texto}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
          shadowColor: palette.shadow,
        },
        bill.pagado && styles.cardPagada,
        pressed && styles.pressed,
      ]}>
      <View style={[styles.iconContainer, { backgroundColor: `${bill.color}22` }]}>
        <Text style={styles.icon}>{bill.icono}</Text>
      </View>

      <View style={styles.info}>
        <Text style={[Typography.body, { color: palette.text }]} numberOfLines={1}>
          {bill.nombre}
        </Text>
        <Text style={[Typography.overline, { color: palette.textSecondary }]}>
          {bill.categoria}
          {bill.esSuscripcion ? ' · suscripción' : ''}
        </Text>
        <Text style={[Typography.caption, { color: palette.textSecondary }]}>
          {bill.esSuscripcion ? 'Próximo pago' : 'Vence'} el {formatFecha(bill.fecha)}
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={[Typography.amount, { color: palette.text }]}>{formatARS(bill.monto)}</Text>
        <Text style={[Typography.label, { color: ToneColors[etiqueta.tone] }]}>
          {etiqueta.texto}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: Radii.card,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardPagada: {
    opacity: 0.65,
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 5,
  },
  pressed: {
    opacity: 0.7,
  },
});