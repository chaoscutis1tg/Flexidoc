import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './app/AuthContext';
import { ConfirmProvider } from './app/ConfirmContext';
import { DashboardLayout } from './layouts/DashboardLayout';

import { LandingPage } from './features/landing/LandingPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { OrganizationsPage } from './features/orgs/OrganizationsPage';
import { UsersPage } from './features/users/UsersPage';
import { TemplatesPage } from './features/templates/TemplatesPage';
import { ContractsPage } from './features/contracts/ContractsPage';
import { MasterDataPage } from './features/masterdata/MasterDataPage';
import { AuditLogsPage } from './features/audit/AuditLogsPage';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a' }}>Đang tải ứng dụng...</div>;
  }

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export const App = () => {
  return (
    <AuthProvider>
      <ConfirmProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Landing Page & Commercial Gateway */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LandingPage />} />

            {/* Protected Application Workspace Routes */}
            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/organizations" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ORGANIZATION_ADMIN']}><OrganizationsPage /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ORGANIZATION_ADMIN']}><UsersPage /></ProtectedRoute>} />
              <Route path="/master-data" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ORGANIZATION_ADMIN', 'STAFF']}><MasterDataPage /></ProtectedRoute>} />
              <Route path="/templates" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ORGANIZATION_ADMIN', 'STAFF']}><TemplatesPage /></ProtectedRoute>} />
              <Route path="/contracts" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ORGANIZATION_ADMIN', 'STAFF']}><ContractsPage /></ProtectedRoute>} />
              <Route path="/audit-logs" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ORGANIZATION_ADMIN']}><AuditLogsPage /></ProtectedRoute>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ConfirmProvider>
    </AuthProvider>
  );
};
