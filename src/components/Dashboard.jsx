import React, { useState, useEffect } from 'react';
import { Users, Package2, ShoppingBag, Star, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    recentProducts: [],
    recentOrders: [],
  });
const [currentTime, setCurrentTime] = useState(new Date());

useEffect(() => {
  const timer = setInterval(() => {
    setCurrentTime(new Date());
  }, 1000);
  return () => clearInterval(timer);
}, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found, please log in as admin');
          return;
        }

        const config = {
          headers: { Authorization: `Bearer ${token}` },
        };

        const [userResponse, productCountResponse, productsResponse, orderCountResponse, recentOrdersResponse] = await Promise.all([
          axios.get('https://abinexis-backend.onrender.com/api/auth/user-count', config),
          axios.get('https://abinexis-backend.onrender.com/api/products/product-count', config),
          axios.get('https://abinexis-backend.onrender.com/api/products?sort=-createdAt&limit=4', config),
          axios.get('https://abinexis-backend.onrender.com/api/orders/order-count', config),
          axios.get('https://abinexis-backend.onrender.com/api/orders/recent-orders', config),
        ]);

        // Fetch ratings for recent products
        const productsWithRatings = await Promise.all(
          productsResponse.data.map(async (product) => {
            try {
              const reviewResponse = await axios.get(`https://abinexis-backend.onrender.com/api/reviews/${product._id}`, config);
              const reviews = reviewResponse.data.filter(review => review.product.toString() === product._id);
              const numReviews = reviews.length;
              const rating = numReviews > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / numReviews).toFixed(1) : 0;
              return { ...product, rating, numReviews };
            } catch (err) {
              console.error(`Error fetching reviews for product ${product._id}:`, err);
              return { ...product, rating: 0, numReviews: 0 };
            }
          })
        );

        setStats({
          totalUsers: userResponse.data.totalUsers || 0,
          totalProducts: productCountResponse.data.totalProducts || 0,
          totalOrders: orderCountResponse.data.totalOrders || 0,
          recentProducts: productsWithRatings,
          recentOrders: recentOrdersResponse.data || [],
        });
      } catch (error) {
        console.error('Error fetching data:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          config: error.config?.url,
        });
        setStats({
          totalUsers: 0,
          totalProducts: 0,
          totalOrders: 0,
          recentProducts: [],
          recentOrders: [],
        });
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-7">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/20 rounded-xl p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    Abinexis Admin
                  </h1>
                  <p className="text-gray-400 text-sm">Dashboard Overview</p>
                </div>
              </div>
              <div>
      <h2 className="text-2xl font-semibold text-white">Welcome back, Abinash</h2>
      <p className="text-green-400">
        {currentTime.toLocaleString('en-IN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit', // Added seconds for live timer effect
          timeZone: 'Asia/Kolkata',
        })}
      </p>
    </div>
            </div>
            <button
              onClick={() => navigate('/product-management')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg"
            >
              <Plus className="h-5 w-5" />
              Add New Product
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Users</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.totalUsers}</p>
              </div>
              <div className="bg-green-500/10 p-3 rounded-lg">
                <Users className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Products</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.totalProducts}</p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-lg">
                <Package2 className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Orders</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.totalOrders}</p>
              </div>
              <div className="bg-purple-500/10 p-3 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Products */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Recent Products</h3>
              <button
                onClick={() => navigate('/product-management')}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                View All
              </button>
            </div>
            <div className="space-y-4">
              {stats.recentProducts.length > 0 ? (
                stats.recentProducts.map((product) => (
                  <div key={product._id} className="flex items-center gap-4 p-4 bg-gray-900 rounded-lg">
                    <img
                      src={product.images[0] || 'https://via.placeholder.com/100x100/cccccc/ffffff?text=No+Image'}
                      alt={product.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium truncate">{product.name}</h4>
                      <p className="text-gray-400 text-sm">
                        {product.category} • {product.brand || 'No Brand'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-medium text-sm">Stock: {product.countInStock}</p>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-gray-400 text-sm">{product.rating} ({product.numReviews})</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">No recent products found.</p>
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Recent Orders</h3>
              <button
                onClick={() => navigate('/order-management')}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                View All
              </button>
            </div>
            <div className="space-y-4">
              {stats.recentOrders.length > 0 ? (
                stats.recentOrders.map((order) => (
                  <div
                    key={order._id}
                    className="p-3 bg-gray-900 rounded-lg sm:p-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2 sm:gap-4">
                      <div>
                        <h4 className="text-white font-medium text-sm sm:text-base">
                          {order.personalInfo.firstName} {order.personalInfo.lastName}
                        </h4>
                        <p className="text-gray-400 text-xs sm:text-sm">Order #{order._id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium text-sm sm:text-base">
                          ₹{order.priceSummary.total.toLocaleString()}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            order.orderStatus === 'processing'
                              ? 'bg-yellow-500/10 text-yellow-400'
                              : 'bg-green-500/10 text-green-400'
                          }`}
                        >
                          {order.orderStatus}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm">
                      <span className="text-gray-400 mb-1 sm:mb-0">
                        {order.orderItems.length} item(s)
                      </span>
                      <span className="text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">No recent orders found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;