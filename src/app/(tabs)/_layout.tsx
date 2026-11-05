import { Image } from 'expo-image';
import { Tabs } from 'expo-router';

import { Brand } from '@/constants/theme';
import { useAppTheme } from '@/context/theme';
import { useBillsStore } from '@/store/bills';

const HOME_ICON = require('../../../assets/images/tabIcons/home.png');
const SUMMARY_ICON = require('../../../assets/images/tabIcons/explore.png');
const SETTINGS_ICON = require('../../../assets/images/icon.png');

export default function TabsLayout() {
  const { palette } = useAppTheme();
  const pendientes = useBillsStore((state) =>
    state.bills.reduce((total, bill) => total + (bill.pagado ? 0 : 1), 0),
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Brand.primary,
        tabBarInactiveTintColor: palette.textSecondary,
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: palette.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Image
              source={HOME_ICON}
              style={{ width: size, height: size, tintColor: color }}
              contentFit="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="resumen"
        options={{
          title: 'Resumen',
          tabBarBadge: pendientes > 0 ? pendientes : undefined,
          tabBarBadgeStyle: {
            backgroundColor: Brand.primary,
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: '700',
          },
          tabBarIcon: ({ color, size }) => (
            <Image
              source={SUMMARY_ICON}
              style={{ width: size, height: size, tintColor: color }}
              contentFit="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ size }) => (
            <Image
              source={SETTINGS_ICON}
              style={{ width: size, height: size, borderRadius: 5 }}
              contentFit="cover"
            />
          ),
        }}
      />
    </Tabs>
  );
}
