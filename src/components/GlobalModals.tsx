// ─────────────────────────────────────────────────────────────────────────────
// GlobalModals.tsx
// Modales que pueden ser invocados desde cualquier punto de la app vía UIContext.
// Se monta una única vez en App.tsx (dentro de AppProvider) para evitar
// duplicación de estado y permitir que las alertas, el dashboard, accounts,
// etc. abran el mismo modal sin pasar props.
// ─────────────────────────────────────────────────────────────────────────────

import { useApp } from '../AppContext';
import { CreditCardPaymentModal } from './CreditCardPaymentModal';

export function GlobalModals() {
  const { accounts, paymentModalAccountId, closePaymentModal } = useApp();

  // ── Modal de pago de tarjeta de crédito ──────────────────────────────────
  if (paymentModalAccountId) {
    const card = accounts.find((a) => a.id === paymentModalAccountId);
    if (card) {
      return <CreditCardPaymentModal card={card} onClose={closePaymentModal} />;
    }
  }

  return null;
}
