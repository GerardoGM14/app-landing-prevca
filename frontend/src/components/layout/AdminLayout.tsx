import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AdminLayout = () => (
  <div className="min-h-screen bg-gray-50">
    <Sidebar />
    <div className="lg:ml-64 flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 p-6 md:p-10">
        <Outlet />
      </main>
    </div>
  </div>
);
