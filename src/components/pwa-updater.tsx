import { useEffect, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Sem UI própria. `registerType: 'autoUpdate'` (vite.config.ts) já recarrega
 * a página sozinho assim que a versão nova do service worker ativa — só
 * faltava algo de fato registrar o SW (antes era o script auto-injetado,
 * que não escuta esse evento). O intervalo força a checagem por uma versão
 * nova mesmo com o app aberto e parado, comum no uso de campo em um único
 * aparelho por um bom tempo.
 */
export function PwaUpdater() {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useRegisterSW({
    onRegisteredSW(_url, registration) {
      registrationRef.current = registration ?? null;
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      void registrationRef.current?.update();
    }, UPDATE_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return null;
}
