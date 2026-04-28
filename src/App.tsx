/**
 * Main application component with routing configuration.
 * Sets up React Router with protected routes and authentication flow.
 *
 * @author StockOps Team
 * @since 1.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { InventoryPage } from '@/pages/InventoryPage'
import { InboundPage } from '@/pages/InboundPage'
import { OutboundPage } from '@/pages/OutboundPage'
import { ExpiryPage } from '@/pages/ExpiryPage'
import { LocationsPage } from '@/pages/LocationsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { CentersPage } from '@/pages/CentersPage'
import { WarehousesPage } from '@/pages/WarehousesPage'
import { PurchaseOrderPage } from '@/pages/PurchaseOrderPage'
import { ProductsPage } from '@/pages/ProductsPage'
import { EnvironmentPage } from '@/pages/EnvironmentPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { AIFeaturesPage } from '@/pages/AIFeaturesPage'
import { StockAdjustmentPage } from '@/pages/StockAdjustmentPage'
import { AdminPage } from '@/pages/admin/AdminPage'
import { NoticeManagement } from '@/pages/admin/NoticeManagement'
import { AuditLogViewer } from '@/pages/admin/AuditLogViewer'
import { EscalationPolicyPage } from '@/pages/settings/EscalationPolicyPage'
import { DemandForecastPage } from '@/pages/DemandForecastPage'
import { CycleCountPage } from '@/pages/CycleCountPage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { InventoryTransferPage } from '@/pages/InventoryTransferPage'
import { MainLayout } from '@/components/MainLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'

/**
 * Main App component with route configuration.
 * - /login: Public login page
 * - /: Protected routes (requires authentication)
 * - /dashboard: Dashboard page
 * - /inventory: Inventory page
 * - /inbound: Inbound page
 * - /outbound: Outbound page
 * - /locations: Locations page
 * - /expiry: Expiry management page
 * - /settings: Settings page
 * - /environment: Environment monitoring page
 *
 * @returns App JSX element with router configuration
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="centers" element={<CentersPage />} />
          <Route path="warehouses" element={<WarehousesPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="purchase-orders" element={<PurchaseOrderPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="inbound" element={<InboundPage />} />
          <Route path="outbound" element={<OutboundPage />} />
          <Route path="stock-adjustments" element={<StockAdjustmentPage />} />
          <Route path="locations" element={<LocationsPage />} />
          <Route path="expiry" element={<ExpiryPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="settings/escalation" element={<EscalationPolicyPage />} />
          <Route path="environment" element={<EnvironmentPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="ai" element={<AIFeaturesPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="admin/notices" element={<NoticeManagement />} />
          <Route path="admin/audit-logs" element={<AuditLogViewer />} />
          <Route path="demand-forecast" element={<DemandForecastPage />} />
          <Route path="inventory-transfers" element={<InventoryTransferPage />} />
          <Route path="cycle-counts" element={<CycleCountPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
