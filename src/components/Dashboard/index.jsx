import React, { useState } from 'react';
import Navbar from '../Layout/Navbar';
import Sidebar from '../Layout/Sidebar';
import DashboardContent from './DashboardContent';

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-red-900 to-red-800">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-black/10">
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-red-400/20 rounded-full blur-xl" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-red-500/20 rounded-full blur-2xl" />
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent opacity-[0.03]" />
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} />

      {/* Main Content */}
      <div className={`
        relative min-h-screen transition-all duration-300
        ${isSidebarOpen ? 'lg:ml-64' : ''}
      `}>
        <Navbar onMenuToggle={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        <main>
          <DashboardContent />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;