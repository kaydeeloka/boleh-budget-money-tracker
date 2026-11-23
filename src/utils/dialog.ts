import { Alert, Platform, AlertButton } from 'react-native';

/**
 * Same call shape as Alert.alert, but also works on web (where Alert.alert silently does nothing):
 * one button -> window.alert, two or more -> window.confirm (OK runs the non-cancel button).
 */
export function dialog(title: string, message?: string, buttons?: AlertButton[]) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }
  const text = [title, message].filter(Boolean).join('\n\n');
  if (!buttons || buttons.length <= 1) {
    window.alert(text);
    buttons?.[0]?.onPress?.();
    return;
  }
  const action = buttons.find(b => b.style !== 'cancel');
  const cancel = buttons.find(b => b.style === 'cancel');
  if (window.confirm(text)) action?.onPress?.();
  else cancel?.onPress?.();
}
