export type ToastKind = 'success' | 'error' | 'info';
export type ToastMsg = { id: number; text: string; kind: ToastKind };

type Listener = (t: ToastMsg) => void;
const listeners = new Set<Listener>();
let nextId = 1;

/** Show a short, non-blocking message at the bottom of the screen (see ToastHost). */
export function toast(text: string, kind: ToastKind = 'success') {
  const msg = { id: nextId++, text, kind };
  listeners.forEach(l => l(msg));
}

export function onToast(l: Listener) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}
