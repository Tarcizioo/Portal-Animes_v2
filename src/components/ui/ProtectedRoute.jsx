import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useEffect, useRef } from 'react';

export function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    const { toast } = useToast();
    const location = useLocation();
    const hasShownToast = useRef(false);

    useEffect(() => {
        if (!loading && !user && !hasShownToast.current) {
            hasShownToast.current = true;
            toast.warning("Entre para continuar.", "Acesso restrito");
        }
    }, [loading, user, toast]);

    if (loading) return null;

    if (!user) {
        const returnTo = location.pathname + location.search + location.hash;
        return <Navigate to="/login" replace state={{ returnTo }} />;
    }

    return children;
}
