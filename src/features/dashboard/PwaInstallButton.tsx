import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Download } from 'lucide-react-native';
import { BarButton } from '@/src/components/ui/Ledger';
import { T } from '@/src/theme';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export default function PwaInstallButton() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  if (Platform.OS !== 'web' || !installPrompt) return null;

  const install = async () => {
    const prompt = installPrompt;
    setInstallPrompt(null);
    await prompt.prompt();
    await prompt.userChoice;
  };

  return (
    <BarButton
      label="Install"
      icon={<Download size={15} color={T.white} />}
      onPress={install}
    />
  );
}
