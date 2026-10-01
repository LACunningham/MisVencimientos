import { StyleSheet, Text, View } from 'react-native';

import { Brand, Radii, Spacing, ToneColors, Typography } from '@/constants/theme';
import { CATEGORIAS } from '@/data/catalog';
import { useAppTheme } from '@/context/theme';
import { esMismoMes, hoyIso } from '@/lib/dates';
import { formatARS, sumarMontos } from '@/lib/money';
import type { Bill } from '@/types';

interface SummaryHeaderProps {
  bills: Bill[];
}

/** Resumen de totales: pendiente, vence este mes y reparto por categoría. */
export function SummaryHeader({ bills }: SummaryHeaderProps) {
  const { palette } = useAppTheme();

  const pendientes = bills.filter((bill) => !bill.pagado);
  const totalPendiente = sumarMontos(pendientes.map((bill) => bill.monto));
  const totalMes = sumarMontos(
    pendientes
      .filter((bill) => esMismoMes(bill.fecha))
      .map((bill) => bill.monto),
  );
  const vencidas = pendientes.filter((bill) => bill.fecha < hoyIso()).length;

  const porCategoria = CATEGORIAS.map((categoria) => ({
    categoria,
    monto: sumarMontos(
      pendientes.filter((bill) => bill.categoria === categoria).map((bill) => bill.monto),
    ),
  })).filter((item) => item.monto > 0);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: palette.surface, borderColor: palette.border },
      ]}>
      <View style={styles.totales}>
        <View style={styles.totalPrincipal}>
          <Text style={[Typography.caption, { color: palette.textSecondary }]}>
            Total pendiente
          </Text>
          <Text style={[styles.totalMonto, { color: palette.text }]}>
            {formatARS(totalPendiente)}
          </Text>
        </View>

        <View style={styles.totalSecundario}>
          <Text style={[Typography.caption, { color: palette.textSecondary }]}>
            Vence este mes
          </Text>
          <Text style={[Typography.amount, { color: palette.text }]}>
            {formatARS(totalMes)}
          </Text>
        </View>
      </View>

      {vencidas > 0 && (
        <View style={[styles.alerta, { backgroundColor: `${ToneColors.urgente}1A` }]}>
          <Text style={[Typography.label, { color: ToneColors.urgente }]}>
            {vencidas === 1
              ? '1 carga vencida sin pagar'
              : `${vencidas} cargas vencidas sin pagar`}
          </Text>
        </View>
      )}

      {porCategoria.length > 0 && (
        <View style={styles.categorias}>
          {porCategoria.map(({ categoria, monto }) => {
            const ratio = totalPendiente > 0 ? monto / totalPendiente : 0;

            return (
              <View key={categoria} style={styles.categoriaRow}>
                <View style={styles.categoriaHeader}>
                  <Text style={[Typography.label, { color: palette.textSecondary }]}>
                    {categoria}
                  </Text>
                  <Text style={[Typography.label, { color: palette.text }]}>
                    {formatARS(monto)}
                  </Text>
                </View>
                <View style={[styles.barraTrack, { backgroundColor: palette.inputBg }]}>
                  <View
                    style={[
                      styles.barraFill,
                      { backgroundColor: Brand.primary, width: `${ratio * 100}%` },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radii.card,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  totales: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  totalPrincipal: {
    flex: 1,
    gap: 2,
  },
  totalMonto: {
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
  },
  totalSecundario: {
    alignItems: 'flex-end',
    gap: 2,
  },
  alerta: {
    borderRadius: Radii.control,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  categorias: {
    gap: Spacing.three,
  },
  categoriaRow: {
    gap: 6,
  },
  categoriaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  barraTrack: {
    height: 6,
    borderRadius: Radii.circle,
    overflow: 'hidden',
  },
  barraFill: {
    height: 6,
    borderRadius: Radii.circle,
  },
});