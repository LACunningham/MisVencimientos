import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { BillCard } from '@/components/BillCard';
import { BillForm, type BillFormValues } from '@/components/BillForm';
import { SummaryHeader } from '@/components/SummaryHeader';
import { Brand, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppTheme } from '@/context/theme';
import { CATEGORIAS } from '@/data/catalog';
import {
  FILTROS_INICIALES,
  filtrarBills,
  type CampoOrden,
  type EstadoFiltro,
  type FiltrosBills,
} from '@/lib/bill-filters';
import { createId } from '@/lib/bills';
import { hoyIso } from '@/lib/dates';
import { paginar } from '@/lib/pagination';
import { useBillsStore } from '@/store/bills';
import type { Bill } from '@/types';

const FILTROS = ['Todas', ...CATEGORIAS] as const;

const ESTADOS: EstadoFiltro[] = ['Todas', 'Pendientes', 'Pagadas'];

const CAMPOS_ORDEN: { campo: CampoOrden; label: string }[] = [
  { campo: 'fecha', label: 'Fecha' },
  { campo: 'monto', label: 'Monto' },
  { campo: 'nombre', label: 'Nombre' },
];

const PAGE_SIZE = 4;

export default function HomeScreen() {
  const { palette } = useAppTheme();
  const bills = useBillsStore((state) => state.bills);
  const addBill = useBillsStore((state) => state.addBill);
  const loading = useBillsStore((state) => state.loading);
  const error = useBillsStore((state) => state.error);
  const load = useBillsStore((state) => state.load);

  const [filtros, setFiltros] = useState<FiltrosBills>(FILTROS_INICIALES);
  const [mostrandoForm, setMostrandoForm] = useState(false);
  const [pagina, setPagina] = useState(0);

  const listaFiltrada = useMemo(() => filtrarBills(bills, filtros), [bills, filtros]);

  const paginado = useMemo(
    () => paginar(listaFiltrada, pagina, PAGE_SIZE),
    [listaFiltrada, pagina],
  );

  const hayFiltrosActivos =
    filtros.texto.trim() !== '' ||
    filtros.categoria !== 'Todas' ||
    filtros.estado !== 'Todas' ||
    filtros.soloEsteMes;

  const actualizarFiltros = (cambios: Partial<FiltrosBills>) => {
    setFiltros((prev) => ({ ...prev, ...cambios }));
    setPagina(0);
  };

  const limpiarFiltros = () => {
    setFiltros(FILTROS_INICIALES);
    setPagina(0);
  };

  const alternarOrden = (campo: CampoOrden) => {
    // Tocar el campo activo invierte la dirección; tocar otro empieza ascendente.
    actualizarFiltros(
      filtros.orden === campo
        ? { direccion: filtros.direccion === 'asc' ? 'desc' : 'asc' }
        : { orden: campo, direccion: 'asc' },
    );
  };

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
    // La carga nueva tiene que quedar visible aunque hubiera filtros activos.
    setFiltros({ ...FILTROS_INICIALES, categoria: values.categoria });
    setPagina(0);
    setMostrandoForm(false);
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: palette.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      <AppHeader
        title="Mis Vencimientos"
        subtitle={`${bills.length} cargas registradas · vencimientos y suscripciones`}
      />

      <Pressable
        accessibilityRole="button"
        onPress={() => setMostrandoForm((prev) => !prev)}
        style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
        <Text style={styles.addButtonText}>
          {mostrandoForm ? '✕ Cerrar formulario' : '+ Agregar servicio'}
        </Text>
      </Pressable>

      {loading && bills.length === 0 ? (
        <View style={styles.cargando}>
          <ActivityIndicator color={Brand.primary} />
          <Text style={[Typography.caption, { color: palette.textSecondary }]}>
            Cargando datos de ejemplo…
          </Text>
        </View>
      ) : (
        <>
          {error ? (
            <View
              style={[
                styles.error,
                { backgroundColor: palette.dangerBg, borderColor: `${Brand.danger}55` },
              ]}>
              <Text style={[Typography.caption, { color: palette.text }]}>{error}</Text>
              <Pressable onPress={() => void load()} hitSlop={8}>
                <Text style={[Typography.label, { color: Brand.primary }]}>Reintentar</Text>
              </Pressable>
            </View>
          ) : null}

          <SummaryHeader bills={bills} />

          <View style={styles.filtros}>
            <TextInput
              value={filtros.texto}
              onChangeText={(texto) => actualizarFiltros({ texto })}
              placeholder="Buscar por nombre…"
              placeholderTextColor={palette.textSecondary}
              accessibilityLabel="Buscar cargas por nombre"
              returnKeyType="search"
              autoCorrect={false}
              style={[
                styles.buscador,
                {
                  backgroundColor: palette.inputBg,
                  borderColor: palette.border,
                  color: palette.text,
                },
              ]}
            />

            <View style={styles.grupo}>
              <Text style={[Typography.overline, { color: palette.textSecondary }]}>
                CATEGORÍA
              </Text>
              <View style={styles.chipsRow}>
                {FILTROS.map((item) => {
                  const activa = item === filtros.categoria;
                  const count =
                    item === 'Todas'
                      ? bills.length
                      : bills.filter((bill) => bill.categoria === item).length;

                  return (
                    <Pressable
                      key={item}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: activa }}
                      onPress={() => actualizarFiltros({ categoria: item })}
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
                        {item}
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
            </View>

            <View style={styles.grupo}>
              <Text style={[Typography.overline, { color: palette.textSecondary }]}>ESTADO</Text>
              <View style={styles.chipsRow}>
                {ESTADOS.map((item) => {
                  const activo = item === filtros.estado;

                  return (
                    <Pressable
                      key={item}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: activo }}
                      onPress={() => actualizarFiltros({ estado: item })}
                      style={({ pressed }) => [
                        styles.chip,
                        activo
                          ? styles.chipActiva
                          : { backgroundColor: palette.chipInactiva, borderColor: palette.border },
                        pressed && styles.pressed,
                      ]}>
                      <Text
                        style={[
                          Typography.label,
                          activo ? styles.chipTextActiva : { color: palette.textSecondary },
                        ]}>
                        {item}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.grupo}>
              <Text style={[Typography.overline, { color: palette.textSecondary }]}>ORDEN</Text>
              <View style={styles.chipsRow}>
                {CAMPOS_ORDEN.map(({ campo, label }) => {
                  const activo = campo === filtros.orden;

                  return (
                    <Pressable
                      key={campo}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: activo }}
                      accessibilityHint="Tocá de nuevo para invertir el orden"
                      onPress={() => alternarOrden(campo)}
                      style={({ pressed }) => [
                        styles.chip,
                        activo
                          ? styles.chipActiva
                          : { backgroundColor: palette.chipInactiva, borderColor: palette.border },
                        pressed && styles.pressed,
                      ]}>
                      <Text
                        style={[
                          Typography.label,
                          activo ? styles.chipTextActiva : { color: palette.textSecondary },
                        ]}>
                        {label}
                      </Text>
                      {activo ? (
                        <Text style={[styles.direccion, styles.chipTextActiva]}>
                          {filtros.direccion === 'asc' ? '↑' : '↓'}
                        </Text>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.chipsRow}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: filtros.soloEsteMes }}
                onPress={() => actualizarFiltros({ soloEsteMes: !filtros.soloEsteMes })}
                style={({ pressed }) => [
                  styles.chip,
                  filtros.soloEsteMes
                    ? styles.chipActiva
                    : { backgroundColor: palette.chipInactiva, borderColor: palette.border },
                  pressed && styles.pressed,
                ]}>
                <Text
                  style={[
                    Typography.label,
                    filtros.soloEsteMes
                      ? styles.chipTextActiva
                      : { color: palette.textSecondary },
                  ]}>
                  {filtros.soloEsteMes
                    ? `✓ Sólo ${nombreMes(hoyIso())}`
                    : `Sólo vencimientos de ${nombreMes(hoyIso())}`}
                </Text>
              </Pressable>

              {hayFiltrosActivos ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={limpiarFiltros}
                  style={({ pressed }) => [
                    styles.chip,
                    { backgroundColor: palette.chipInactiva, borderColor: palette.border },
                    pressed && styles.pressed,
                  ]}>
                  <Text style={[Typography.label, { color: Brand.primary }]}>Limpiar filtros</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          {mostrandoForm && (
            <BillForm
              mode="crear"
              onSubmit={handleGuardar}
              onCancel={() => setMostrandoForm(false)}
            />
          )}

          {paginado.totalItems === 0 ? (
            <View style={styles.vacio}>
              <Text style={styles.vacioEmoji}>{hayFiltrosActivos ? '🔎' : '🌌'}</Text>
              <Text style={[Typography.body, { color: palette.textSecondary }]}>
                {hayFiltrosActivos
                  ? 'No encontramos cargas con esos filtros.'
                  : 'Todavía no hay cargas registradas.'}
              </Text>
              {hayFiltrosActivos ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={limpiarFiltros}
                  style={({ pressed }) => [styles.limpiarBoton, pressed && styles.pressed]}>
                  <Text style={[Typography.label, { color: Brand.primary }]}>
                    Limpiar filtros
                  </Text>
                </Pressable>
              ) : (
                <Text style={[Typography.caption, { color: palette.textSecondary }]}>
                  Usá «+ Agregar servicio» para crear la primera.
                </Text>
              )}
            </View>
          ) : (
            <>
              {paginado.items.map((bill) => (
                <BillCard
                  key={bill.id}
                  bill={bill}
                  onPress={() => router.push(`/bill/${bill.id}`)}
                />
              ))}

              {paginado.totalPages > 1 && (
                <View
                  style={[
                    styles.paginador,
                    { backgroundColor: palette.surface, borderColor: palette.border },
                  ]}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !paginado.hasPrev }}
                    disabled={!paginado.hasPrev}
                    onPress={() => setPagina(paginado.page - 1)}
                    style={({ pressed }) => [
                      styles.paginaBoton,
                      pressed && styles.pressed,
                      !paginado.hasPrev && styles.paginaBotonInactivo,
                    ]}>
                    <Text style={[Typography.label, { color: palette.text }]}>‹ Anterior</Text>
                  </Pressable>

                  <Text style={[Typography.label, { color: palette.textSecondary }]}>
                    Página {paginado.page + 1} de {paginado.totalPages}
                  </Text>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !paginado.hasNext }}
                    disabled={!paginado.hasNext}
                    onPress={() => setPagina(paginado.page + 1)}
                    style={({ pressed }) => [
                      styles.paginaBoton,
                      pressed && styles.pressed,
                      !paginado.hasNext && styles.paginaBotonInactivo,
                    ]}>
                    <Text style={[Typography.label, { color: palette.text }]}>Siguiente ›</Text>
                  </Pressable>
                </View>
              )}

              <Text style={[Typography.caption, styles.contador, { color: palette.textSecondary }]}>
                Mostrando {paginado.items.length} de {paginado.totalItems} cargas
              </Text>
            </>
          )}
        </>
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
  cargando: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.five,
  },
  error: {
    borderRadius: Radii.control,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  filtros: {
    gap: Spacing.three,
  },
  buscador: {
    borderRadius: Radii.control,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    fontSize: 15,
  },
  grupo: {
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
  direccion: {
    fontSize: 12,
    fontWeight: '700',
  },
  limpiarBoton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
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
  paginador: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    borderRadius: Radii.card,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  paginaBoton: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  paginaBotonInactivo: {
    opacity: 0.35,
  },
  contador: {
    textAlign: 'center',
  },
  footer: {
    textAlign: 'center',
    marginTop: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
