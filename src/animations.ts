// src/animations.ts
// ─── Animaciones globales de FinanzasHogar ────────────────────────────────────
// Inyectadas una sola vez en el root — disponibles en todos los componentes

export const GLOBAL_ANIMATIONS = `
  @keyframes twFadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes twSlideL {
    from { opacity: 0; transform: translateX(56px); }
    to   { opacity: 1; transform: translateX(0);    }
  }
  @keyframes twSlideR {
    from { opacity: 0; transform: translateX(-56px); }
    to   { opacity: 1; transform: translateX(0);     }
  }
  @keyframes twFloat {
    0%, 100% { transform: translateY(0px);   }
    50%       { transform: translateY(-10px); }
  }
  @keyframes twGlow {
    0%, 100% { opacity: 0.6; }
    50%       { opacity: 1;   }
  }
  @keyframes twPop {
    0%   { transform: scale(0.8); opacity: 0; }
    60%  { transform: scale(1.08);            }
    100% { transform: scale(1);   opacity: 1; }
  }
  @keyframes twPulse {
    0%, 100% { transform: scale(1);    }
    50%       { transform: scale(1.04); }
  }
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes fadeSlideDown {
    from { opacity: 0; transform: translateY(-12px); }
    to   { opacity: 1; transform: translateY(0);     }
  }
`;

export function injectGlobalAnimations(): void {
  if (document.getElementById('fh-global-animations')) return; // ya inyectado
  const el = document.createElement('style');
  el.id = 'fh-global-animations';
  el.textContent = GLOBAL_ANIMATIONS;
  document.head.appendChild(el);
}
