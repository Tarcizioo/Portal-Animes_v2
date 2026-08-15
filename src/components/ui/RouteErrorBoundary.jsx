import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class RouteErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Erro na rota:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                    <span aria-hidden="true" className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-red-500/10 text-red-500">
                        <AlertTriangle className="h-8 w-8" />
                    </span>
                    <h2 className="text-2xl font-bold text-text-primary mb-2">
                        Ops! Esta página teve um problema.
                    </h2>
                    <p className="text-text-secondary mb-6 max-w-md text-sm">
                        Pode ser instabilidade na API ou um erro inesperado. O resto do site continua funcionando normalmente.
                    </p>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => this.setState({ hasError: false, error: null })}
                            className="flex min-h-11 items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105"
                        >
                            <RefreshCw aria-hidden="true" className="w-4 h-4" />
                            Tentar Novamente
                        </button>
                        <Link
                            to="/"
                            className="flex min-h-11 items-center gap-2 px-5 py-2.5 bg-bg-secondary hover:bg-bg-tertiary text-text-primary border border-border-color rounded-xl font-bold transition-all hover:scale-105"
                        >
                            <Home aria-hidden="true" className="w-4 h-4" />
                            Voltar ao Início
                        </Link>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
