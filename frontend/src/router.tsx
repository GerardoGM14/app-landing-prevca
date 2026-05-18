import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/core/auth/ProtectedRoute';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { ProductsListPage } from '@/features/products/pages/ProductsListPage';
import { ProductCreatePage } from '@/features/products/pages/ProductCreatePage';
import { ProductEditPage } from '@/features/products/pages/ProductEditPage';
import { CategoriesPage } from '@/features/categories/pages/CategoriesPage';
import { OrdersListPage } from '@/features/orders/pages/OrdersListPage';
import { OrderDetailPage } from '@/features/orders/pages/OrderDetailPage';

export const AppRouter = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<AdminLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/products" element={<ProductsListPage />} />
        <Route path="/products/new" element={<ProductCreatePage />} />
        <Route path="/products/:id" element={<ProductEditPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/orders" element={<OrdersListPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
