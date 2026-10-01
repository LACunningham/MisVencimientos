import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BillCard } from '@/components/BillCard';
import { BillForm, type BillFormValues } from '@/components/BillForm';
import { SummaryHeader } from '@/components/SummaryHeader';
import { Brand, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppTheme } from '@/context/theme';
import { createId, useBills } from '@/context/bills';
import { CATEGORIAS } from '@/data/catalog';
import { esMismoMes, hoyIso } from '@/lib/dates';
import type { Bill, Categoria } from '@/types';

export default function HomeScreen() {
  const { palette, isDark, toggleTheme } = useAppTheme();
  const { bills, addBill } = useBills();

  const [tabActivo, setTabActivo] = useState<Categoria>('Servicios');
  const [soloEsteMes, setSoloEsteMes] = useState(false);
  const [mostrandoForm, setMostrandoForm] = useState(false);

  const listaFiltrada = useMemo(
    () =>
      bills.filter((bill) => {
        if (bill.categoria !== tabActivo) {
          return false;
        }

        return !soloEsteMes || esMismoMes(bill.fecha);
      }),
    [bills, tabActivo, soloEsteMes],
  );

  const handleGuardar = (values: BillFormValues) => {
    const now = Date.now();
    const nueva: Bill = {
      id: createId('bill'),
      catalogId: values.catalogId,
      nombre: values.nombre,
      categoria: values.categoria,
      monto: values.monto,
      fecha: values.fecha,
      color: values.color,
      icono: values.icono,
      esSuscripcion: values.esSuscripcion,
      pagado: false,
      createdAt: now,
      updatedAt: now,
    };

    addBill(nueva);
    setTabActivo(values.categoria);
    setMostrandoForm(false);
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: palette.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={[Typography.title, { color: palette.text }]}>Mis Vencimientos</Text>
          <Text style={[Typography.subtitle, { color: palette.textSecondary }]}>
            {bills.length} cargas registradas · vencimientos y suscripciones
          </Text>
        </View>

        <Pressable
          accessibilityRole="switch"
          accessibilityLabel="Cambiar tema"
          onPress={toggleTheme}
          style={({ pressed }) => [
            styles.toggle,
            { backgroundColor: palette.surface, borderColor: palette.border },
            pressed && styles.pressed,
          ]}>
          <Text style={styles.toggleIcon}>{isDark ? '☀️' : '🌙'}</Text>
          <Text style={[Typography.label, { color: palette.text }]}>
            {isDark ? 'Claro' : 'Oscuro'}
          </Text>
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => setMostrandoForm((prev) => !prev)}
        style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
        <Text style={styles.addButtonText}>
          {mostrandoForm ? '✕ Cerrar formulario' : '+ Agregar servicio'}
        </Text>
      </Pressable>

      <SummaryHeader bills={bills} />

      <View style={styles.chipsRow}>
        {CATEGORIAS.map((categoria) => {
          const activa = categoria === tabActivo;
          const count = bills.filter((bill) => bill.categoria === categoria).length;

          return (
            <Pressable
              key={categoria}
              accessibilityRole="tab"
              accessibilityState={{ selected: activa }}
              onPress={() => setTabActivo(categoria)}
              style={({ pressed }) => [
                styles.chip,
                activa
                  ? styles.chipActiva
                  : { backgroundColor: palette.chipInactiva, borderColor: palette.border },
                pressed && styles.pressed,
              ]}>
              <Text
                style={[
                  Typography.label,
                  activa ? styles.chipTextActiva : { color: palette.textSecondary },
                ]}>
                {categoria}
              </Text>
              <View
                style={[
                  styles.chipCount,
                  activa ? styles.chipCountActiva : { backgroundColor: palette.border },
                ]}>
                <Text
                  style={[
                    styles.chipCountText,
                    activa ? styles.chipTextActiva : { color: palette.textSecondary },
                  ]}>
                  {count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: soloEsteMes }}
        onPress={() => setSoloEsteMes((prev) => !prev)}
        style={({ pressed }) => [
          styles.filtroMes,
          soloEsteMes
            ? { backgroundColor: Brand.primary, borderColor: Brand.primary }
            : { backgroundColor: palette.chipInactiva, borderColor: palette.border },
          pressed && styles.pressed,
        ]}>
        <Text
          style={[
            Typography.label,
            soloEsteMes ? { color: '#FFFFFF' } : { color: palette.textSecondary },
          ]}>
          {soloEsteMes ? `✓ Sólo ${nombreMes(hoyIso())}` : `Sólo vencimientos de ${nombreMes(hoyIso())}`}
        </Text>
      </Pressable>

      {mostrandoForm && (
        <BillForm mode="crear" onSubmit={handleGuardar} onCancel={() => setMostrandoForm(false)} />
      )}

      {listaFiltrada.length === 0 ? (
        <View style={styles.vacio}>
          <Text style={styles.vacioEmoji}>🌌</Text>
          <Text style={[Typography.body, { color: palette.textSecondary }]}>
            No hay {tabActivo.toLowerCase()} cargados todavía.
          </Text>
          <Text style={[Typography.caption, { color: palette.textSecondary }]}>
            Usá «+ Agregar servicio» para crear el primero.
          </Text>
        </View>
      ) : (
        listaFiltrada.map((bill) => (
          <BillCard key={bill.id} bill={bill} onPress={() => router.push(`/bill/${bill.id}`)} />
        ))
      )}

      <Text style={[Typography.caption, styles.footer, { color: palette.textSecondary }]}>
        Tocá una carga para editarla, registrar un pago o eliminarla. Los vencimientos se
        calculan automáticamente según la fecha cargada.
      </Text>
    </ScrollView>
  );
}

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

function nombreMes(iso: string): string {
  const mes = Number(iso.slice(5, 7)) - 1;
  return MESES[mes] ?? '';
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  headerText: {
    flex: 1,
    gap: Spacing.two,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radii.chip,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  toggleIcon: {
    fontSize: 14,
  },
  addButton: {
    backgroundColor: Brand.primary,
    borderRadius: Radii.pill,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radii.chip,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipActiva: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primary,
  },
  chipTextActiva: {
    color: '#FFFFFF',
  },
  chipCount: {
    minWidth: 20,
    height: 20,
    borderRadius: Radii.circle,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  chipCountActiva: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  chipCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  filtroMes: {
    alignSelf: 'flex-start',
    borderRadius: Radii.chip,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  vacio: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.five,
  },
  vacioEmoji: {
    fontSize: 40,
    marginBottom: Spacing.two,
  },
  footer: {
    textAlign: 'center',
    marginTop: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});