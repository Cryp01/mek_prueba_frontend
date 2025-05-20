import React, { useEffect, type JSX } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAtom, useAtomValue } from "jotai";
import {
  isAuthenticatedAtom,
  loadingAtom,
  initAuthAtom,
} from "../state/authStore";

interface RouteProps {
  children: JSX.Element;
}

export const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [, initAuth] = useAtom(initAuthAtom);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return <>{children}</>;
};

export const ProtectedRoute: React.FC<RouteProps> = ({ children }) => {
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const loading = useAtomValue(loadingAtom);
  const location = useLocation();

  if (loading) return <div>Loading...</div>;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const PublicRoute: React.FC<RouteProps> = ({ children }) => {
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const loading = useAtomValue(loadingAtom);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/notes";

  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, from]);

  if (loading) return <div>Loading...</div>;

  if (isAuthenticated) return null;

  return <>{children}</>;
};
