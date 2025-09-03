import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MainBanners from './components/MainBanners';
import FeaturedProducts from './components/FeaturedProducts';
import TodaysOffers from './components/TodaysOffers';
import ProductManagement from './components/ProductManagement';
import OrderManagement from './components/OrderManagement';
import LoginPage from './pages/LoginPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  let isAdmin = false;

  if (token) {
    try {
      const decoded = jwtDecode(token);
      isAdmin = decoded.isAdmin === true;
    } catch (error) {
      console.error('Invalid token:', error);
      localStorage.removeItem('token');
    }
  }

  return isAdmin ? children : <Navigate to="/login" replace />;
};

const App = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  // Check token and isAdmin for conditional rendering
  const token = localStorage.getItem('token');
  let isAdmin = false;
  if (token) {
    try {
      const decoded = jwtDecode(token);
      isAdmin = decoded.isAdmin === true;
    } catch (error) {
      console.error('Invalid token:', error);
      localStorage.removeItem('token');
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Render Mobile Menu Button and Sidebar only if not on login page and user is admin */}
      {!isLoginPage && isAdmin && (
        <>
          {!isMobileMenuOpen && (
            <div className="lg:hidden fixed top-4 left-4 z-50">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="bg-gray-800 p-2 rounded-lg border border-gray-700"
              >
                <Menu className="h-6 w-6 text-white" />
              </button>
            </div>
          )}
          
          {/* Sidebar */}
          <Sidebar
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
          />

          {/* Mobile Overlay */}
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}
        </>
      )}

      {/* Main Content */}
      <div className={isLoginPage ? '' : isAdmin ? 'lg:ml-64 min-h-screen' : ''}>
        <div className={isLoginPage ? 'p-4' : isAdmin ? '' : 'p-4'}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/homepage-management/main-banners"
              element={
                <ProtectedRoute>
                  <MainBanners />
                </ProtectedRoute>
              }
            />
            <Route
              path="/homepage-management/featured-products"
              element={
                <ProtectedRoute>
                  <FeaturedProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/homepage-management/today-offers"
              element={
                <ProtectedRoute>
                  <TodaysOffers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/product-management"
              element={
                <ProtectedRoute>
                  <ProductManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/order-management"
              element={
                <ProtectedRoute>
                  <OrderManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/homepage-management"
              element={
                <ProtectedRoute>
                  <Navigate to="/homepage-management/main-banners" replace />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </div>

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

const AppWrapper = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;