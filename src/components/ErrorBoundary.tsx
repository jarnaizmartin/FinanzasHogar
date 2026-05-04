import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// ✅ FIX 14 — ErrorBoundary: evita que un error en un componente
// tire abajo toda la app. React solo soporta esto con class components.
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      '[ErrorBoundary] Error capturado:',
      error,
      info.componentStack
    );
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background:
              'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)',
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '28rem',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '2rem',
              padding: '2.5rem 2rem',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💥</div>
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#ffffff',
                marginBottom: '0.5rem',
              }}
            >
              Algo ha ido mal
            </h2>
            <p
              style={{
                fontSize: '0.875rem',
                color: '#93c5fd',
                marginBottom: '1.5rem',
                lineHeight: 1.5,
              }}
            >
              La aplicación ha encontrado un error inesperado. Tus datos están a
              salvo en el almacenamiento local.
            </p>

            {this.state.error && (
              <pre
                style={{
                  background: 'rgba(220,38,38,0.1)',
                  border: '1px solid rgba(220,38,38,0.3)',
                  borderRadius: '0.75rem',
                  padding: '0.75rem',
                  fontSize: '0.7rem',
                  color: '#fca5a5',
                  textAlign: 'left',
                  overflowX: 'auto',
                  marginBottom: '1.5rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {this.state.error.message}
              </pre>
            )}

            <button
              onClick={this.handleReset}
              style={{
                width: '100%',
                padding: '0.875rem',
                borderRadius: '0.875rem',
                border: 'none',
                background: '#2563eb',
                color: '#ffffff',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
                marginBottom: '0.75rem',
              }}
            >
              🔄 Intentar de nuevo
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.875rem',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'transparent',
                color: '#93c5fd',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ↺ Recargar la página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
