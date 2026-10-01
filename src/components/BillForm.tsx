import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Radii, Spacing, ToneColors, Typography } from '@/constants/theme';
import { CATEGORIAS, SERVICE_CATALOG } from '@/data/catalog';
import { useAppTheme } from '@/context/theme';
import { formatFecha, hoyIso } from '@/lib/dates';
import { parseMonto } from '@/lib/money';
import type { Bill, Categoria } from '@/types';

import { DateField } from './DateField';

export interface BillFormValues {
  catalogId: string | null;
  nombre: string;
  categoria: Categoria;
  monto: number;
  fecha: string;
  color: string;
  icono: string;
  esSuscripcion: boolean;
}

interface BillFormProps {
  mode: 'crear' | 'editar';
  /** Valores iniciales; en modo `editar` se precargan. */
  initial?: Bill;
  onSubmit: (values: BillFormValues) => void;
  onCancel: () => void;
}

export function billToFormValues(bill: Bill): BillFormValues {
  return {
    catalogId: bill.catalogId,
    nombre: bill.nombre,
    categoria: bill.categoria,
    monto: bill.monto,
    fecha: bill.fecha,
    color: bill.color,
    icono: bill.icono,
    esSuscripcion: bill.esSuscripcion,
  };
}

const DEFAULT_COLOR = '#64748B';
const DEFAULT_ICON = '📄';

export function BillForm({ mode, initial, onSubmit, onCancel }: BillFormProps) {
  const { palette } = useAppTheme();

  const [busqueda, setBusqueda] = useState('');
  const [catalogId, setCatalogId] = useState<string | null>(initial?.catalogId ?? null);
  const [nombre, setNombre] = useState(initial?.nombre ?? '');
  const [categoria, setCategoria] = useState<Categoria>(initial?.categoria ?? 'Servicios');
  const [montoTexto, setMontoTexto] = useState(
    initial ? String(Math.round(initial.monto)) : '',
  );
  const [fecha, setFecha] = useState(initial?.fecha ?? hoyIso());

  // `color`, `icono` y `esSuscripcion` viven en estado y no se derivan del
  // catálogo: si se derivaran, al tocar "Cambiar del catálogo" una suscripción
  // se guardaría como servicio puntual y al pagarla no avanzaría la fecha.
  const [color, setColor] = useState(initial?.color ?? DEFAULT_COLOR);
  const [icono, setIcono] = useState(initial?.icono ?? DEFAULT_ICON);
  const [esSuscripcion, setEsSuscripcion] = useState(initial?.esSuscripcion ?? false);

  const resultados = useMemo(() => {
    const query = busqueda.trim().toLowerCase();

    if (query === '') {
      return [];
    }

    return SERVICE_CATALOG.filter((item) => item.nombre.toLowerCase().includes(query));
  }, [busqueda]);

  const monto = parseMonto(montoTexto);
  const puedeGuardar = nombre.trim() !== '' && monto !== null && monto > 0;

  const handleGuardar = () => {
    if (!puedeGuardar || monto === null) {
      return;
    }

    onSubmit({
      catalogId,
      nombre: nombre.trim(),
      categoria,
      // El monto es un número entero de pesos: `formatARS` ya redondea, así que
      // guardarlo con decimales hacía que el campo del formulario de edición
      // mostrara `1.5`, que `parseMonto` no acepta y dejaba Guardar bloqueado.
      monto: Math.round(monto),
      fecha,
      color,
      icono,
      esSuscripcion,
    });
  };

  return (
    <View
      style={[
        styles.form,
        { backgroundColor: palette.surface, borderColor: palette.border },
      ]}>
      <Text style={[Typography.sectionTitle, { color: palette.text }]}>
        {mode === 'editar' ? 'Editar servicio' : 'Agregar servicio'}
      </Text>

      <View style={styles.campo}>
        <Text style={[Typography.label, { color: palette.textSecondary }]}>Nombre</Text>
        <TextInput
          value={nombre}
          onChangeText={setNombre}
          placeholder="EPEC, Netflix, alquiler…"
          placeholderTextColor={palette.textSecondary}
          style={[styles.input, { backgroundColor: palette.inputBg, color: palette.text }]}
        />
      </View>

      {catalogId === null && (
        <View style={styles.campo}>
          <Text style={[Typography.label, { color: palette.textSecondary }]}>
            Buscar en el catálogo (opcional)
          </Text>
          <TextInput
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar (Luz, Netflix, Alquiler…)"
            placeholderTextColor={palette.textSecondary}
            autoCapitalize="none"
            style={[styles.input, { backgroundColor: palette.inputBg, color: palette.text }]}
          />
          {resultados.length > 0 && (
            <View style={styles.resultados}>
              {resultados.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    setCatalogId(item.id);
                    setNombre(item.nombre);
                    setCategoria(item.categoria);
                    setColor(item.color);
                    setIcono(item.icono);
                    setEsSuscripcion(item.esSuscripcion);
                    setBusqueda('');
                  }}
                  style={({ pressed }) => [
                    styles.resultado,
                    { borderBottomColor: palette.border },
                    pressed && styles.pressed,
                  ]}>
                  <View style={[styles.resultadoIcono, { backgroundColor: `${item.color}22` }]}>
                    <Text style={styles.resultadoEmoji}>{item.icono}</Text>
                  </View>
                  <View style={styles.resultadoInfo}>
                    <Text style={[Typography.body, { color: palette.text }]}>{item.nombre}</Text>
                    <Text style={[Typography.caption, { color: palette.textSecondary }]}>
                      {item.categoria} · {item.esSuscripcion ? 'Suscripción' : 'Servicio'}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
          {busqueda.trim() !== '' && resultados.length === 0 && (
            <Text style={[Typography.caption, { color: palette.textSecondary }]}>
              No se encontró ningún servicio. Cargalo con un nombre propio.
            </Text>
          )}
        </View>
      )}

      {catalogId !== null && (
        <Pressable
          onPress={() => {
            setCatalogId(null);
            setBusqueda('');
          }}
          style={styles.cambiarRow}>
          <Text style={[Typography.label, { color: ToneColors.aviso }]}>Cambiar del catálogo</Text>
        </Pressable>
      )}

      <View style={styles.campo}>
        <Text style={[Typography.label, { color: palette.textSecondary }]}>Categoría</Text>
        <View style={styles.categoriaRow}>
          {CATEGORIAS.map((item) => {
            const activa = item === categoria;

            return (
              <Pressable
                key={item}
                onPress={() => setCategoria(item)}
                style={({ pressed }) => [
                  styles.categoriaChip,
                  activa
                    ? styles.categoriaChipActiva
                    : { backgroundColor: palette.chipInactiva, borderColor: palette.border },
                  pressed && styles.pressed,
                ]}>
                <Text
                  style={[
                    Typography.label,
                    activa ? { color: '#FFFFFF' } : { color: palette.textSecondary },
                  ]}>
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.campo}>
        <Text style={[Typography.label, { color: palette.textSecondary }]}>Monto</Text>
        <TextInput
          value={montoTexto}
          onChangeText={setMontoTexto}
          placeholder="$25.000"
          placeholderTextColor={palette.textSecondary}
          keyboardType="decimal-pad"
          style={[styles.input, { backgroundColor: palette.inputBg, color: palette.text }]}
        />
        {montoTexto.trim() !== '' && (monto === null || monto <= 0) && (
          <Text style={[Typography.caption, { color: ToneColors.urgente }]}>
            Ingresá un monto válido.
          </Text>
        )}
      </View>

      <View style={styles.campo}>
        <Text style={[Typography.label, { color: palette.textSecondary }]}>
          {esSuscripcion ? 'Próxima fecha de pago' : 'Fecha de vencimiento'}
        </Text>
        <DateField value={fecha} onChange={setFecha} palette={palette} label="Fecha" />
        <Text style={[Typography.caption, { color: palette.textSecondary }]}>
          {formatFecha(fecha)}
        </Text>
      </View>

      <View style={styles.botones}>
        <Pressable
          onPress={handleGuardar}
          disabled={!puedeGuardar}
          style={({ pressed }) => [
            styles.botonPrimario,
            puedeGuardar ? styles.botonActivo : styles.botonInactivo,
            pressed && styles.pressed,
          ]}>
          <Text style={styles.botonPrimarioTexto}>Guardar</Text>
        </Pressable>
        <Pressable
          onPress={onCancel}
          style={({ pressed }) => [
            styles.botonSecundario,
            { borderColor: palette.border },
            pressed && styles.pressed,
          ]}>
          <Text style={[Typography.body, { color: palette.textSecondary }]}>Cancelar</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Lista desplazable reutilizable por las pantallas modales. */
export function FormScroll({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  form: {
    borderRadius: Radii.card,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  campo: {
    gap: 6,
  },
  input: {
    borderRadius: Radii.control,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  resultados: {
    gap: Spacing.one,
  },
  resultado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  resultadoIcono: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultadoEmoji: {
    fontSize: 18,
  },
  resultadoInfo: {
    flex: 1,
    gap: 2,
  },
  cambiarRow: {
    alignSelf: 'flex-start',
  },
  categoriaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  categoriaChip: {
    borderRadius: Radii.chip,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  categoriaChipActiva: {
    backgroundColor: '#3B5BDB',
    borderColor: '#3B5BDB',
  },
  botones: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  botonPrimario: {
    flex: 1,
    borderRadius: Radii.control,
    paddingVertical: 12,
    alignItems: 'center',
  },
  botonActivo: {
    backgroundColor: '#3B5BDB',
  },
  botonInactivo: {
    backgroundColor: '#B9C2E0',
  },
  botonPrimarioTexto: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  botonSecundario: {
    flex: 1,
    borderRadius: Radii.control,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});