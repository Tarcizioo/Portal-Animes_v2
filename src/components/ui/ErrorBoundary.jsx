import React from 'react';

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
                    <div className="text-6xl mb-6">😿</div>
                    <h1 className="text-4xl font-bold mb-4">Ops! Algo deu errado.</h1>
                    <p className="text-text-secondary mb-8 max-w-md">
                        Pode ser instabilidade na API ou um erro inesperado da nossa parte.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105"
                    >
                        Tentar Novamente
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
