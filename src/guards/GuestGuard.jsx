import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const GuestGuard = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (isAuthenticated) {
        return <Navigate to="/forums" replace />;
    }

    return <Outlet />;
};
