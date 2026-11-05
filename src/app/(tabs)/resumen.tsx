import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { BillCard } from '@/components/BillCard';
import { SummaryHeader } from '@/components/SummaryHeader';
import { Brand, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppTheme } from '@/context/theme';
import { formatFecha } from '@/lib/dates';
import { formatARS, sumarMontos } from '@/lib/money';
import { useBillsStore } from '@/store/bills';

const ULTIMOS_PAGOS = 5;

export default function ResumenScreen() {
  const { palette } = useAppTheme();
  const bills = useBillsStore((state) => state.bills);
  const getAllPayments = useBillsStore((state) => state.getAllPayments);

  const pendientes = bills
    .filter((bill) => !bill.pagado)
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.createdAt - b.createdAt);

  // Se relee en cada render: el componente ya está suscripto a `bills`, que
  // cambia al registrar un pago, y así el historial siempre sale de la base.
  const pagos = getAllPayments();
  const totalPagado = sumarMontos(pagos.map((payment) => payment.monto));
  const ultimosPagos = pagos.slice(0, ULTIMOS_PAGOS);
  const nombres = useMemo(
    () => new Map(bills.map((bill) => [bill.id, bill.nombre] as const)),
    [bills],
  );

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: palette.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <AppHeader title="Resumen" subtitle="Totales, pagos y próximos vencimientos" />

      <SummaryHeader bills={bills} />

      <View
        style={[
          styles.pagos,
          { backgroundColor: palette.surface, borderColor: palette.border },
        ]}>
        <View style={styles.pagosHeader}>
          <View style={styles.pagosTitulo}>
            <Text style={[Typography.sectionTitle, { color: palette.text }]}>
              Historial de pagos
            </Text>
            <Text style={[Typography.caption, { color: palette.textSecondary }]}>
              {pagos.length === 1 ? '1 pago registrado' : `${pagos.length} pagos registrados`}
            </Text>
          </View>
          <View style={styles.pagosTotal}>
            <Text style={[Typography.overline, { color: palette.textSecondary }]}>
              TOTAL PAGADO
            </Text>
            <Text style={[Typography.amount, { color: Brand.primary }]}>
              {formatARS(totalPagado)}
            </Text>
          </View>
        </View>

        {ultimosPagos.length === 0 ? (
          <Text style={[Typography.caption, styles.pagosVacio, { color: palette.textSecondary }]}>
            Todavía no registraste pagos. Se guardan acá al usar «Registrar pago» en una carga.
          </Text>
        ) : (
          <View>
            {ultimosPagos.map((payment) => {
              const nombre = nombres.get(payment.billId);
              const fila = (
                <>
                  <View style={styles.pagoInfo}>
                    <Text
                      numberOfLines={1}
                      style={[Typography.bodyRegular, { color: palette.text }]}>
                      {nombre ?? 'Carga eliminada'}
                    </Text>
                    <Text style={[Typography.caption, { color: palette.textSecondary }]}>
                      {formatFecha(payment.fecha)}
                    </Text>
                  </View>
                  <Text style={[Typography.body, { color: palette.text }]}>
                    {formatARS(payment.monto)}
                  </Text>
                </>
              );

              return nombre ? (
                <Pressable
                  key={payment.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${nombre}, pago del ${formatFecha(payment.fecha)}`}
                  onPress={() => router.push(`/bill/${payment.billId}`)}
                  style={({ pressed }) => [
                    styles.pago,
                    { borderTopColor: palette.border },
                    pressed && styles.pressed,
                  ]}>
                  {fila}
                </Pressable>
              ) : (
                <View
                  key={payment.id}
                  style={[styles.pago, { borderTopColor: palette.border }]}>
                  {fila}
                </View>
              );
            })}

            {pagos.length > ULTIMOS_PAGOS ? (
              <Text
                style={[Typography.caption, styles.pagosVacio, { color: palette.textSecondary }]}>
                Mostrando los últimos {ULTIMOS_PAGOS} de {pagos.length} pagos.
              </Text>
            ) : null}
          </View>
        )}
      </View>

      <View style={styles.seccion}>
        <Text style={[Typography.sectionTitle, { color: palette.text }]}>
          Pendientes ({pendientes.length})
        </Text>
        <Text style={[Typography.caption, { color: palette.textSecondary }]}>
          Ordenados por fecha, del más próximo al más lejano.
        </Text>
      </View>

      {pendientes.length === 0 ? (
        <View style={styles.vacio}>
          <Text style={styles.vacioEmoji}>🎉</Text>
          <Text style={[Typography.body, { color: palette.textSecondary }]}>
            No tenés cargas pendientes.
          </Text>
        </View>
      ) : (
        pendientes.map((bill) => (
          <BillCard key={bill.id} bill={bill} onPress={() => router.push(`/bill/${bill.id}`)} />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six + Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  seccion: {
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  pagos: {
    borderRadius: Radii.card,
    borderWidth: 1,
    padding: Spacing.three,
  },
  pagosHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  pagosTitulo: {
    flex: 1,
    gap: 2,
  },
  pagosTotal: {
    alignItems: 'flex-end',
    gap: 2,
  },
  pago: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderTopWidth: 1,
    marginTop: Spacing.two,
  },
  pagoInfo: {
    flex: 1,
    gap: 2,
  },
  pagosVacio: {
    marginTop: Spacing.two,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.7,
  },
  vacio: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.five,
  },
  vacioEmoji: {
    fontSize: 40,
  },
});
