import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  AuthInitializer,
  ProtectedRoute,
  PublicRoute,
} from "./components/AuthRoutes";

import LoginPage from "./pages/login";
import RegisterPage from "./pages/register";
import NotesPage from "./pages/notes";
import NoteDetailPage from "./pages/notedetails";

const NotFoundPage = () => <div>404 - Page Not Found</div>;

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthInitializer>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />
          <Route
            path="/notes"
            element={
              <ProtectedRoute>
                <NotesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notes/:id"
            element={
              <ProtectedRoute>
                <NoteDetailPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthInitializer>
    </BrowserRouter>
  );
};

export default AppRouter;
