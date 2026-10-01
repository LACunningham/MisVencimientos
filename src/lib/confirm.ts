import { Alert, Platform } from 'react-native';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText: string;
  cancelText?: string;
  destructive?: boolean;
}

/**
 * `Alert.alert` es un no-op en react-native-web (la clase exportada tiene los
 * métodos vacíos), así que en web los botones nunca se disparan. Para que
 * confirmar funcione en las tres plataformas caemos a `window.confirm`.
 */
export function confirm({
  title,
  message,
  confirmText,
  cancelText = 'Cancelar',
  destructive = false,
}: ConfirmOptions): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || typeof window.confirm !== 'function') {
      return Promise.resolve(false);
    }

    const texto = message ? `${title}\n\n${message}` : title;
    return Promise.resolve(window.confirm(texto));
  }

  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
        {
          text: confirmText,
          style: destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
