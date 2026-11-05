import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { Brand, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppTheme } from '@/context/theme';
import { isPersistenceEnabled } from '@/db/repository';
import { useBillsStore } from '@/store/bills';

const LOGO = require('../../../assets/images/icon.png');

export default function AjustesScreen() {
  const { palette, isDark, toggleTheme } = useAppTheme();
  const bills = useBillsStore((state) => state.bills);
  const getPayments = useBillsStore((state) => state.getPayments);

  const totalPagos = bills.reduce(
    (total, bill) => total + getPayments(bill.id).length,
    0,
  );

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: palette.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <AppHeader title="Ajustes" subtitle="Tema y datos de la app" />

      <View
        style={[
          styles.tarjeta,
          { backgroundColor: palette.surface, borderColor: palette.border },
        ]}>
        <Text style={[Typography.sectionTitle, { color: palette.text }]}>Apariencia</Text>
        <Text style={[Typography.caption, { color: palette.textSecondary }]}>
          La preferencia se guarda y se mantiene al reabrir la app.
        </Text>

        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: isDark }}
          onPress={toggleTheme}
          style={({ pressed }) => [
            styles.temaBoton,
            { backgroundColor: palette.chipInactiva, borderColor: palette.border },
            pressed && styles.pressed,
          ]}>
          <Text style={styles.temaIcono}>{isDark ? '🌙' : '☀️'}</Text>
          <View style={styles.temaTexto}>
            <Text style={[Typography.body, { color: palette.text }]}>
              Tema {isDark ? 'oscuro' : 'claro'}
            </Text>
            <Text style={[Typography.caption, { color: palette.textSecondary }]}>
              Tocá para cambiar a {isDark ? 'claro' : 'oscuro'}
            </Text>
          </View>
          <Text style={[Typography.label, { color: Brand.primary }]}>Cambiar</Text>
        </Pressable>
      </View>

      <View
        style={[
          styles.tarjeta,
          { backgroundColor: palette.surface, borderColor: palette.border },
        ]}>
        <Text style={[Typography.sectionTitle, { color: palette.text }]}>Datos</Text>

        <View style={[styles.fila, { borderBottomColor: palette.border }]}>
          <Text style={[Typography.bodyRegular, { color: palette.textSecondary }]}>Cargas</Text>
          <Text style={[Typography.body, { color: palette.text }]}>{bills.length}</Text>
        </View>

        <View style={[styles.fila, { borderBottomColor: palette.border }]}>
          <Text style={[Typography.bodyRegular, { color: palette.textSecondary }]}>
            Pagos registrados
          </Text>
          <Text style={[Typography.body, { color: palette.text }]}>{totalPagos}</Text>
        </View>

        <View style={[styles.fila, { borderBottomColor: palette.border }]}>
          <Text style={[Typography.bodyRegular, { color: palette.textSecondary }]}>
            Persistencia
          </Text>
          <Text style={[Typography.body, { color: palette.text }]}>
            {isPersistenceEnabled ? 'SQLite' : 'Memoria (web)'}
          </Text>
        </View>

        <View style={styles.fila}>
          <Text style={[Typography.bodyRegular, { color: palette.textSecondary }]}>Versión</Text>
          <Text style={[Typography.body, { color: palette.text }]}>
            {Constants.expoConfig?.version ?? '1.0.0'}
          </Text>
        </View>
      </View>

      <View style={styles.marca}>
        <Image
          source={LOGO}
          style={styles.logo}
          contentFit="cover"
          accessibilityLabel="Mis Vencimientos"
        />
        <Text style={[Typography.body, { color: palette.text }]}>Mis Vencimientos</Text>
        <Text style={[Typography.caption, { color: palette.textSecondary }]}>
          Vencimientos y suscripciones, con historial de pagos.
        </Text>
      </View>
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
  tarjeta: {
    borderRadius: Radii.card,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  temaBoton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radii.control,
    borderWidth: 1,
    padding: Spacing.three,
    marginTop: Spacing.one,
  },
  temaIcono: {
    fontSize: 24,
  },
  temaTexto: {
    flex: 1,
    gap: 2,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    gap: Spacing.three,
  },
  marca: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.four,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 18,
    marginBottom: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
