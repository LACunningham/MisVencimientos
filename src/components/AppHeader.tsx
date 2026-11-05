import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Radii, Spacing, Typography } from '@/constants/theme';
import { useAppTheme } from '@/context/theme';

const LOGO = require('../../assets/images/icon.png');

interface AppHeaderProps {
  title: string;
  subtitle?: string;
}

/** Encabezado con el logo local de la app (Clase 1: componente Image). */
export function AppHeader({ title, subtitle }: AppHeaderProps) {
  const { palette } = useAppTheme();

  return (
    <View style={styles.row}>
      <Image
        source={LOGO}
        style={[styles.logo, { borderColor: palette.border }]}
        contentFit="cover"
        accessibilityLabel="Mis Vencimientos"
      />

      <View style={styles.text}>
        <Text style={[Typography.title, { color: palette.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[Typography.subtitle, { color: palette.textSecondary }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: Radii.control,
    borderWidth: 1,
  },
  text: {
    flex: 1,
    gap: Spacing.one,
  },
});
