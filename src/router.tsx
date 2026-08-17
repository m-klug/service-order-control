import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/app-layout';
import { OrdersPage } from '@/pages/orders-page';
import { ClientsPage } from '@/pages/clients-page';
import { FinancePage } from '@/pages/finance-page';
import { NotFoundPage } from '@/pages/not-found-page';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/ordens" replace /> },
      { path: 'ordens', element: <OrdersPage /> },
      { path: 'clientes', element: <ClientsPage /> },
      { path: 'financeiro', element: <FinancePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
