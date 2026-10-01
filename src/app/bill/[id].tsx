import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  BillForm,
  FormScroll,
  billToFormValues,
  type BillFormValues,
} from '@/components/BillForm';
import { PaymentHistoryList } from '@/components/PaymentHistoryList';
import { Brand, Radii, Spacing, ToneColors, Typography } from '@/constants/theme';
import { useBills } from '@/context/bills';
import { useAppTheme } from '@/context/theme';
import { confirm } from '@/lib/confirm';
import { etiquetaVencimiento, formatFecha } from '@/lib/dates';
import { formatARS } from '@/lib/money';
import type { Bill } from '@/types';

type Modo = 'detalle' | 'editar';

export default function BillDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bills } = useBills();
  const bill = bills.find((item) => item.id === id);

  if (!bill) {
    return <BillNotFound />;
  }

  return <BillDetail bill={bill} />;
}

function BillNotFound() {
  const { palette } = useAppTheme();

  return (
    <View style={[styles.screen, styles.centro, { backgroundColor: palette.bg }]}>
      <Text style={styles.notFoundEmoji}>🤷</Text>
      <Text style={[Typography.body, { color: palette.text }]}>La carga no existe.</Text>
      <Pressable onPress={() => router.back()} hitSlop={10}>
        <Text style={[Typography.label, { color: Brand.primary }]}>‹ Volver</Text>
      </Pressable>
    </View>
  );
}

function BillDetail({ bill }: { bill: Bill }) {
  const { palette } = useAppTheme();
  const { updateBill, payBill, deleteBill, getPayments } = useBills();

  const [modo, setModo] = useState<Modo>('detalle');

  const etiqueta = etiquetaVencimiento(bill.fecha, undefined, bill.pagado);
  const pagos = getPayments(bill.id);

  const handleGuardar = (values: BillFormValues) => {
    const now = Date.now();

    updateBill({
      ...bill,
      catalogId: values.catalogId,
      nombre: values.nombre,
      categoria: values.categoria,
      monto: values.monto,
      fecha: values.fecha,
      color: values.color,
      icono: values.icono,
      esSuscripcion: values.esSuscripcion,
      updatedAt: now,
    });
    setModo('detalle');
  };

  const handlePagar = () => {
    void confirm({
      title: 'Registrar pago',
      message: bill.esSuscripcion
        ? `Se registra el pago de ${formatARS(bill.monto)} y la próxima fecha pasa a un mes después.`
        : `Se registra el pago de ${formatARS(bill.monto)} y la carga queda marcada como pagada.`,
      confirmText: 'Registrar',
    }).then((ok) => {
      if (ok) {
        // `payBill` cambia el estado de las cargas, así que este componente se
        // vuelve a renderizar y `getPayments` vuelve a leer de la base.
        payBill(bill.id);
      }
    });
  };

  const handleEliminar = () => {
    void confirm({
      title: 'Eliminar carga',
      message: `¿Querés eliminar «${bill.nombre}» y su historial?`,
      confirmText: 'Eliminar',
      destructive: true,
    }).then((ok) => {
      if (ok) {
        deleteBill(bill.id);
        router.back();
      }
    });
  };

  if (modo === 'editar') {
    return (
      <FormScroll>
        <NavRow onBack={() => setModo('detalle')} onEdit={undefined} />
        <BillForm
          mode="editar"
          initial={{ ...bill, ...billToFormValues(bill) }}
          onSubmit={handleGuardar}
          onCancel={() => setModo('detalle')}
        />
      </FormScroll>
    );
  }

  return (
    <FormScroll>
      <NavRow onBack={() => router.back()} onEdit={() => setModo('editar')} />

      <View
        style={[
          styles.hero,
          { backgroundColor: palette.surface, borderColor: palette.border },
        ]}>
        <View style={[styles.heroIcono, { backgroundColor: `${bill.color}22` }]}>
          <Text style={styles.heroEmoji}>{bill.icono}</Text>
        </View>
        <Text style={[Typography.title, styles.heroNombre, { color: palette.text }]}>
          {bill.nombre}
        </Text>
        <Text style={[Typography.overline, { color: palette.textSecondary }]}>
          {bill.categoria.toUpperCase()}
          {bill.esSuscripcion ? ' · SUSCRIPCIÓN' : ' · SERVICIO'}
        </Text>

        <Text style={[styles.heroMonto, { color: palette.text }]}>
          {formatARS(bill.monto)}
        </Text>
        <Text style={[Typography.label, { color: ToneColors[etiqueta.tone] }]}>
          {etiqueta.texto}
        </Text>
        <Text style={[Typography.caption, { color: palette.textSecondary }]}>
          {bill.esSuscripcion ? 'Próximo pago' : 'Vencimiento'}: {formatFecha(bill.fecha)}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={handlePagar}
        style={({ pressed }) => [styles.botonPago, pressed && styles.pressed]}>
        <Text style={styles.botonPagoTexto}>Registrar pago</Text>
      </Pressable>

      <PaymentHistoryList payments={pagos} />

      <Pressable
        accessibilityRole="button"
        onPress={handleEliminar}
        style={({ pressed }) => [
          styles.botonEliminar,
          { backgroundColor: palette.dangerBg, borderColor: palette.border },
          pressed && styles.pressed,
        ]}>
        <Text style={[Typography.body, { color: ToneColors.urgente }]}>Eliminar carga</Text>
      </Pressable>
    </FormScroll>
  );
}

function NavRow({ onBack, onEdit }: { onBack: () => void; onEdit?: () => void }) {
  return (
    <View style={styles.navRow}>
      <Pressable onPress={onBack} hitSlop={10}>
        <Text style={[Typography.label, { color: Brand.primary }]}>‹ Volver</Text>
      </Pressable>
      {onEdit && (
        <Pressable onPress={onEdit} hitSlop={10}>
          <Text style={[Typography.label, { color: Brand.primary }]}>Editar</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centro: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  notFoundEmoji: {
    fontSize: 40,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hero: {
    borderRadius: Radii.card,
    borderWidth: 1,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  heroIcono: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  heroEmoji: {
    fontSize: 34,
  },
  heroNombre: {
    textAlign: 'center',
  },
  heroMonto: {
    fontSize: 34,
    fontWeight: '800',
    marginTop: Spacing.two,
  },
  botonPago: {
    backgroundColor: Brand.primary,
    borderRadius: Radii.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  botonPagoTexto: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  botonEliminar: {
    borderRadius: Radii.pill,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});