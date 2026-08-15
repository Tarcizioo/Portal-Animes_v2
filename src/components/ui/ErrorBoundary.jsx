import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(_error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="h-screen flex flex-col items-center justify-center bg-bg-primary text-text-primary text-center p-4">
                    <span aria-hidden="true" className="mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-red-500/10 text-red-500">
                        <AlertTriangle className="h-10 w-10" />
                    </span>
                    <h1 className="text-4xl font-bold mb-4">Ops! Algo deu errado.</h1>
                    <p className="text-text-secondary mb-8 max-w-md">
                        Pode ser instabilidade na API ou um erro inesperado da nossa parte.
                    </p>
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="flex min-h-11 items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105"
                    >
                        <RefreshCw aria-hidden="true" className="h-4 w-4" />
                        Tentar Novamente
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
