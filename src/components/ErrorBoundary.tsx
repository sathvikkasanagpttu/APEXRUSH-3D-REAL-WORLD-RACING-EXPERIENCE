import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('APEXRUSH ErrorBoundary caught error:', error, errorInfo);
  }

  private handleRestart = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-zinc-950 text-white font-chakra select-none">
          <div className="max-w-md w-full bg-zinc-900 border border-red-500/30 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(225,6,0,0.4)] text-center flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-2xl font-black italic font-orbitron text-white">APEXRUSH ERROR</h2>
              <p className="text-xs text-zinc-400 mt-1 uppercase tracking-wider font-bold">
                APEXRUSH encountered an unexpected error.
              </p>
            </div>

            {this.state.error && (
              <div className="w-full bg-black/60 rounded-xl p-3 text-left border border-white/5 overflow-hidden">
                <p className="text-[11px] text-red-400 font-mono break-words line-clamp-3">
                  {this.state.error.message || 'Unknown error occurred'}
                </p>
              </div>
            )}

            <button
              onClick={this.handleRestart}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-black italic py-3 rounded-xl shadow-lg border border-red-400/40 flex items-center justify-center gap-2 cursor-pointer font-orbitron tracking-wider transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>RESTART GAME</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
