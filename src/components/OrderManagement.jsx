import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, ShoppingCart, Package, Truck, CheckCircle, XCircle, Search } from 'lucide-react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// Error Boundary Component
class OrderManagementErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error in OrderManagement:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h2>
            <p className="text-gray-400 mb-4">{this.state.error?.message || 'An unexpected error occurred'}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [activeTab, setActiveTab] = useState('processing');
  const [tempStatus, setTempStatus] = useState('');
  const [showScrollIndicators, setShowScrollIndicators] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null); // Initialize as null
  const [searchQuery, setSearchQuery] = useState(''); // State for search input
  const [searchError, setSearchError] = useState(''); // State for search feedback
  const tabScrollRef = React.useRef(null);

  // Add custom styles for scrollbar
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: #4B5563 #1F2937;
      }
      
      .custom-scrollbar::-webkit-scrollbar {
        height: 6px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #1F2937;
        border-radius: 3px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #4B5563;
        border-radius: 3px;
        transition: background 0.2s ease;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #6B7280;
      }
      
      .scroll-fade-right {
        background: linear-gradient(to left, #1F2937 0%, transparent 100%);
      }
      
      .scroll-fade-left {
        background: linear-gradient(to right, #1F2937 0%, transparent 100%);
      }
      
      @media (max-width: 640px) {
        .tab-scroll-container {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Decode JWT to check if user is admin
  useEffect(() => {
    const initializeAdminStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const decoded = jwtDecode(token);
          setIsAdmin(decoded.isAdmin || false);
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('Error decoding JWT:', err);
        setIsAdmin(false);
      }
    };

    initializeAdminStatus();
  }, []);

  // Fetch orders from backend
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const endpoint = isAdmin ? 'https://abinexis-backend.onrender.com/api/orders/admin' : 'https://abinexis-backend.onrender.com/api/orders';
        const response = await axios.get(endpoint, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setOrders(Array.isArray(response.data) ? response.data : []);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch orders');
        setOrders([]);
        setLoading(false);
      }
    };

    if (isAdmin !== null) { // Wait for isAdmin to be set
      fetchOrders();
    }
  }, [isAdmin]);

  // Check if scroll indicators should be shown
  useEffect(() => {
    const checkScrollIndicators = () => {
      if (tabScrollRef.current) {
        const { scrollWidth, clientWidth } = tabScrollRef.current;
        setShowScrollIndicators(scrollWidth > clientWidth);
      }
    };

    checkScrollIndicators();
    window.addEventListener('resize', checkScrollIndicators);
    
    return () => {
      window.removeEventListener('resize', checkScrollIndicators);
    };
  }, [orders]);

  const orderStatuses = [
    'processing',
    'shipped',
    'out of delivery',
    'delivered',
    'cancelled',
    'return accepted',
    'returned',
    'refund accepted',
    'refunded'
  ];

  const statusConfig = {
    processing: { 
      icon: Package, 
      color: 'text-yellow-400', 
      bgColor: 'bg-yellow-900',
      label: 'Processing'
    },
    shipped: { 
      icon: Truck, 
      color: 'text-blue-400', 
      bgColor: 'bg-blue-900',
      label: 'Shipped'
    },
    'out of delivery': { 
      icon: Truck, 
      color: 'text-purple-400', 
      bgColor: 'bg-purple-900',
      label: 'Out for Delivery'
    },
    delivered: { 
      icon: CheckCircle, 
      color: 'text-green-400', 
      bgColor: 'bg-green-900',
      label: 'Delivered'
    },
    cancelled: { 
      icon: XCircle, 
      color: 'text-red-400', 
      bgColor: 'bg-red-900',
      label: 'Cancelled'
    },
    'return accepted': {
      icon: Package,
      color: 'text-orange-400',
      bgColor: 'bg-orange-900',
      label: 'Return Accepted'
    },
    returned: {
      icon: Package,
      color: 'text-orange-600',
      bgColor: 'bg-orange-800',
      label: 'Returned'
    },
    'refund accepted': {
      icon: Package,
      color: 'text-amber-400',
      bgColor: 'bg-amber-900',
      label: 'Refund Accepted'
    },
    refunded: {
      icon: CheckCircle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-800',
      label: 'Refunded'
    }
  };

  // Memoized order filtering with search
  const ordersByStatus = useMemo(() => {
    // Filter orders based on search query
    const filteredOrders = Array.isArray(orders)
      ? orders.filter(order =>
          order._id.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : [];

    return orderStatuses.reduce((acc, status) => {
      acc[status] = filteredOrders.filter(order => order.orderStatus === status);
      return acc;
    }, {});
  }, [orders, searchQuery]);

  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    try {
      const response = await axios.put(`https://abinexis-backend.onrender.com/api/orders/${orderId}`, 
        { 
          orderStatus: newStatus,
          isPaid: newStatus === 'delivered' ? true : undefined 
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setOrders(prev =>
        Array.isArray(prev) ? prev.map(order =>
          order._id === orderId
            ? {
                ...order,
                orderStatus: newStatus,
                isDelivered: newStatus === 'delivered',
                statusTimestamps: {
                  ...order.statusTimestamps,
                  [newStatus === 'delivered' ? 'deliveredAt' : 
                   newStatus === 'return accepted' ? 'returnAcceptedAt' :
                   newStatus === 'returned' ? 'returnedAt' :
                   newStatus === 'refund accepted' ? 'refundAcceptedAt' :
                   newStatus === 'refunded' ? 'refundedAt' :
                   newStatus + 'At']: new Date()
                },
                isPaid: newStatus === 'delivered' ? true : order.isPaid,
                paymentInfo: {
                  ...order.paymentInfo,
                  status: newStatus === 'delivered' && order.paymentInfo.method === 'cod' ? 'completed' : order.paymentInfo.status,
                  paidAt: newStatus === 'delivered' && order.paymentInfo.method === 'cod' ? new Date() : order.paymentInfo.paidAt
                }
              }
            : order
        ) : []
      );

      setActiveTab(newStatus);
      setShowOrderModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status');
    }
  }, []);

  const openOrderModal = useCallback(async (orderId) => {
    try {
      const response = await axios.get(`https://abinexis-backend.onrender.com/api/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setSelectedOrder(response.data);
      setTempStatus(response.data.orderStatus);
      setShowOrderModal(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch order details');
    }
  }, []);

  const handleStatusUpdate = () => {
    if (tempStatus && tempStatus !== selectedOrder.orderStatus) {
      updateOrderStatus(selectedOrder._id, tempStatus);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setSearchError(''); // Clear search error on input change
  };

  const handleSearchClick = () => {
    if (!searchQuery.trim()) {
      setSearchError('Please enter an order ID');
      return;
    }

    const matchedOrders = orders.filter(order =>
      order._id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (matchedOrders.length === 0) {
      setSearchError('No orders found with this ID');
    } else if (matchedOrders.length === 1) {
      setSearchError('');
      setActiveTab(matchedOrders[0].orderStatus); // Switch to the order's status tab
    } else {
      setSearchError('Multiple orders found. Please refine your search.');
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchError('');
  };

  const currentOrders = ordersByStatus[activeTab] || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-white text-lg">Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-red-400 text-lg">{error}</p>
      </div>
    );
  }

  return (
    <OrderManagementErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 pt-9">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              {isAdmin ? 'All Orders (Admin)' : 'Order Management'}
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center mt-4 sm:mt-0 space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search by Order ID..."
                  className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleSearchClick}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Search
                </button>
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
          {searchError && (
            <p className="text-red-400 text-sm mb-4">{searchError}</p>
          )}

          {/* Status Tabs */}
          <div className="bg-white/2 backdrop-blur-sm rounded-xl border border-white/10 p-6">
            <div className="border-b border-gray-700">
              <div className="relative">
                <nav 
                  ref={tabScrollRef}
                  className="flex overflow-x-auto custom-scrollbar tab-scroll-container pb-2"
                >
                  <div className="flex min-w-max px-2 sm:px-0">
                    {orderStatuses.map((status) => {
                      const config = statusConfig[status];
                      const Icon = config.icon;
                      const count = ordersByStatus[status]?.length || 0;
                      const isActive = activeTab === status;
                      
                      return (
                        <button
                          key={status}
                          onClick={() => setActiveTab(status)}
                          className={`flex items-center space-x-2 py-3 px-3 sm:px-6 border-b-2 font-medium text-sm whitespace-nowrap transition-colors flex-shrink-0 mx-1 first:ml-0 last:mr-0 ${
                            isActive
                              ? `border-blue-500 ${config.color} bg-gray-700 rounded-t-lg`
                              : 'border-transparent text-gray-300 hover:text-white hover:border-blue-500 hover:bg-gray-750 rounded-t-lg'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="hidden sm:inline">{config.label}</span>
                          <span className="sm:hidden text-xs">{config.label.split(' ')[0]}</span>
                          <span className={`ml-1 ${config.color} font-semibold text-xs`}>({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </nav>
                
                {showScrollIndicators && (
                  <>
                    <div className="absolute right-0 top-0 bottom-2 w-8 scroll-fade-right pointer-events-none sm:hidden opacity-80"></div>
                    <div className="absolute left-0 top-0 bottom-2 w-8 scroll-fade-left pointer-events-none sm:hidden opacity-80"></div>
                  </>
                )}
                
                {showScrollIndicators && (
                  <div className="absolute bottom-0 right-2 text-xs text-gray-500 sm:hidden">
                    Scroll →
                  </div>
                )}
              </div>
            </div>

            {/* Orders List */}
            <div className="p-4 sm:p-6">
              {currentOrders.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">
                    {searchQuery
                      ? 'No orders match your search'
                      : `No ${statusConfig[activeTab]?.label.toLowerCase()} orders`}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentOrders.map((order) => (
                    <OrderCard 
                      key={order._id} 
                      order={order} 
                      onViewDetails={() => openOrderModal(order._id)}
                      statusConfig={statusConfig[order.orderStatus]}
                      isAdmin={isAdmin}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Order Detail Modal */}
          {showOrderModal && selectedOrder && (
            <OrderModal 
              order={selectedOrder}
              tempStatus={tempStatus}
              setTempStatus={setTempStatus}
              onClose={() => setShowOrderModal(false)}
              onStatusUpdate={handleStatusUpdate}
              orderStatuses={orderStatuses}
              statusConfig={statusConfig}
              isAdmin={isAdmin}
            />
          )}
        </div>
      </div>
    </OrderManagementErrorBoundary>
  );
};

// Memoized Order Card Component
const OrderCard = React.memo(({ order, onViewDetails, statusConfig, isAdmin }) => {
  const Icon = statusConfig.icon;
  
  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
        <div>
          <h3 className="text-white font-semibold text-lg">Order #{order._id}</h3>
          <p className="text-gray-400 text-sm">
            {isAdmin ? order.user?.name || `${order.personalInfo.firstName} ${order.personalInfo.lastName}` : `${order.personalInfo.firstName} ${order.personalInfo.lastName}`} • {' '}
            {new Date(order.createdAt).toLocaleDateString()}
          </p>
          {order.orderStatus === 'cancelled' && (
            <div className="mt-2">
              <p className="text-gray-400 text-sm">
                <span className="text-gray-300">Cancel Reason:</span> {order.cancelReason || 'Not specified'}
              </p>
              <p className="text-gray-400 text-sm">
                <span className="text-gray-300">Cancelled At:</span>{' '}
                {order.statusTimestamps?.cancelledAt
                  ? new Date(order.statusTimestamps.cancelledAt).toLocaleString()
                  : 'N/A'}
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between sm:justify-end space-x-4">
          <span className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
            <Icon className="h-3 w-3" />
            <span>{statusConfig.label}</span>
          </span>
          <button
            onClick={onViewDetails}
            className="text-blue-400 hover:text-blue-300 font-medium text-sm px-3 py-1 rounded border border-blue-400 hover:border-blue-300 transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <p className="text-gray-400 text-xs mb-2 font-medium">ITEMS</p>
          <div className="space-y-2">
            {order.orderItems.slice(0, 2).map((item, index) => (
              <div key={index} className="flex items-center space-x-3">
                <img 
                  src={item.image || 'https://via.placeholder.com/100x100'} 
                  alt={item.name} 
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0" 
                />
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-medium truncate">{item.name}</p>
                  <p className="text-gray-400 text-xs">Qty: {item.quantity}</p>
                </div>
              </div>
            ))}
            {order.orderItems.length > 2 && (
              <p className="text-gray-400 text-xs">+{order.orderItems.length - 2} more items</p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-400 text-xs mb-1 font-medium">PAYMENT</p>
            <p className="text-white text-lg font-semibold">₹{order.priceSummary.total.toLocaleString()}</p>
            <p className={`text-xs font-medium ${order.isPaid ? 'text-green-400' : 'text-red-400'}`}>
              {order.isPaid ? '✓ Paid' : '⏳ Pending'}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1 font-medium">LOCATION</p>
            <p className="text-white text-sm font-medium">{order.shippingInfo.city}</p>
            <p className="text-gray-400 text-xs">{order.shippingInfo.state}</p>
          </div>
        </div>
      </div>
    </div>
  );
});

// Order Modal Component
const OrderModal = ({ order, tempStatus, setTempStatus, onClose, onStatusUpdate, orderStatuses, statusConfig, isAdmin }) => {
  const hasStatusChanged = tempStatus !== order.orderStatus;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Order #{order._id}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-900 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-3">Customer Information</h3>
              <div className="space-y-2">
                <p className="text-gray-300">
                  <span className="text-gray-400">Name:</span> {isAdmin ? order.user?.name || `${order.personalInfo.firstName} ${order.personalInfo.lastName}` : `${order.personalInfo.firstName} ${order.personalInfo.lastName}`}
                </p>
                <p className="text-gray-300">
                  <span className="text-gray-400">Email:</span> {isAdmin ? order.user?.email || order.personalInfo.email : order.personalInfo.email}
                </p>
                <p className="text-gray-300">
                  <span className="text-gray-400">Phone:</span> {order.shippingInfo.phone}
                </p>
              </div>
            </div>
            
            <div className="bg-gray-900 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-3">Shipping Address</h3>
              <div className="space-y-1">
                <p className="text-gray-300">{order.shippingInfo.address}</p>
                <p className="text-gray-300">{order.shippingInfo.city}, {order.shippingInfo.state}</p>
                <p className="text-gray-300">{order.shippingInfo.postalCode}</p>
                <p className="text-gray-300">
                  <span className="text-gray-400">Type:</span> {order.shippingInfo.type}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Order Items</h3>
            <div className="space-y-3">
              {order.orderItems.map((item, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-gray-800 rounded-lg">
                  <img 
                    src={item.image || 'https://via.placeholder.com/100x100'} 
                    alt={item.name} 
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0" 
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium truncate">{item.name}</h4>
                    <p className="text-gray-400 text-sm">{item.category}</p>
                    <p className="text-gray-400 text-sm">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-white font-semibold">₹{item.price.toLocaleString()}</p>
                    <p className="text-gray-400 text-sm line-through">₹{item.originalPrice.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-gray-900 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Order Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-300">
                <span>Status:</span>
                <span className={statusConfig[order.orderStatus].color}>
                  {statusConfig[order.orderStatus].label}
                </span>
              </div>
              {order.orderStatus === 'cancelled' && (
                <>
                  <div className="flex justify-between text-gray-300">
                    <span>Cancel Reason:</span>
                    <span>{order.cancelReason || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Cancelled At:</span>
                    <span>
                      {order.statusTimestamps?.cancelledAt
                        ? new Date(order.statusTimestamps.cancelledAt).toLocaleString()
                        : 'N/A'}
                    </span>
                  </div>
                </>
              )}
              {(order.orderStatus === 'return accepted' || order.orderStatus === 'returned') && (
                <>
                  <div className="flex justify-between text-gray-300">
                    <span>Return Accepted At:</span>
                    <span>
                      {order.statusTimestamps?.returnAcceptedAt
                        ? new Date(order.statusTimestamps.returnAcceptedAt).toLocaleString()
                        : 'N/A'}
                    </span>
                  </div>
                  {order.orderStatus === 'returned' && (
                    <div className="flex justify-between text-gray-300">
                      <span>Returned At:</span>
                      <span>
                        {order.statusTimestamps?.returnedAt
                          ? new Date(order.statusTimestamps.returnedAt).toLocaleString()
                          : 'N/A'}
                      </span>
                    </div>
                  )}
                </>
              )}
              {(order.orderStatus === 'refund accepted' || order.orderStatus === 'refunded') && (
                <>
                  <div className="flex justify-between text-gray-300">
                    <span>Refund Accepted At:</span>
                    <span>
                      {order.statusTimestamps?.refundAcceptedAt
                        ? new Date(order.statusTimestamps.refundAcceptedAt).toLocaleString()
                        : 'N/A'}
                    </span>
                  </div>
                  {order.orderStatus === 'refunded' && (
                    <div className="flex justify-between text-gray-300">
                      <span>Refunded At:</span>
                      <span>
                        {order.statusTimestamps?.refundedAt
                          ? new Date(order.statusTimestamps.refundedAt).toLocaleString()
                          : 'N/A'}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="bg-gray-900 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Payment Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-300">
                <span>Subtotal:</span>
                <span>₹{order.priceSummary.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-green-400">
                <span>Savings:</span>
                <span>-₹{order.priceSummary.savings.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Shipping:</span>
                <span>₹{order.priceSummary.shippingCost.toLocaleString()}</span>
              </div>
              <div className="border-t border-gray-700 pt-2">
                <div className="flex justify-between text-white font-semibold text-lg">
                  <span>Total:</span>
                  <span>₹{order.priceSummary.total.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex justify-between text-gray-300 pt-2">
                <span>Payment Method:</span>
                <span>{order.paymentInfo.method.toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Payment Status:</span>
                <span className={order.isPaid ? 'text-green-400' : 'text-red-400'}>
                  {order.isPaid ? 'Paid' : 'Pending'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            {isAdmin && (
              <div className="w-full sm:w-auto">
                <label className="block text-gray-300 text-sm font-medium mb-2">Update Order Status</label>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <select
                    value={tempStatus}
                    onChange={(e) => setTempStatus(e.target.value)}
                    className="p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0 flex-1"
                  >
                    {orderStatuses.map((status) => (
                      <option key={status} value={status}>
                        {statusConfig[status]?.label || status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={onStatusUpdate}
                    disabled={!hasStatusChanged}
                    className={`px-6 py-3 rounded-lg font-medium text-sm transition-colors ${
                      hasStatusChanged
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Update Status
                  </button>
                </div>
              </div>
            )}
            
            <div className="text-left sm:text-right">
              <p className="text-gray-400 text-sm">Order Date</p>
              <p className="text-white font-medium">
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;