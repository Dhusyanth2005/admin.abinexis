import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Search, 
  Trash2, 
  Edit, 
  Plus, 
  Save, 
  X, 
  Eye,
  ImageIcon,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Star,
  StarOff
} from 'lucide-react';

const API_BASE_URL = 'https://abinexis-backend.onrender.com/api';

const BannerDashboard = () => {
  const [banners, setBanners] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  
  // Form states
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: null,
    imagePreview: ''
  });
  
  // Product search states
  const [productSearch, setProductSearch] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Operation states
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const loadInitialData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [bannersRes, productsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/homepage`),
        fetch(`${API_BASE_URL}/products`)
      ]);

      if (!bannersRes.ok || !productsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const bannersData = await bannersRes.json();
      const productsData = await productsRes.json();

      // Ensure banners have proper structure
      const processedBanners = (bannersData.banners || []).map(banner => ({
        ...banner,
        searchProduct: banner.searchProduct || null,
        image: banner.image || null,
        title: banner.title || '',
        description: banner.description || ''
      }));

      setBanners(processedBanners);
      setProducts(productsData || []);
      
      if (!silent) setError('');
    } catch (err) {
      if (!silent) {
        setError('Failed to load data. Please try again.');
        console.error('Load error:', err);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
    setSuccess('Data refreshed successfully');
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image: null,
      imagePreview: ''
    });
    setSelectedProduct(null);
    setProductSearch('');
    setFilteredProducts([]);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be smaller than 5MB');
        return;
      }

      setFormData(prev => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file)
      }));
    }
  };

  const searchProducts = (query) => {
    setProductSearch(query);
    if (query.trim()) {
      const results = products.filter(product =>
        product.name?.toLowerCase().includes(query.toLowerCase()) ||
        product.category?.toLowerCase().includes(query.toLowerCase()) ||
        product.brand?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredProducts(results);
    } else {
      setFilteredProducts([]);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (banner) => {
    setSelectedBanner(banner);
    setFormData({
      title: banner.title || '',
      description: banner.description || '',
      image: null,
      imagePreview: banner.image || ''
    });
    setSelectedProduct(banner.searchProduct || null);
    setShowEditModal(true);
  };

  const openProductModal = (banner) => {
    // Create a deep copy of the banner to avoid reference issues
    setSelectedBanner({
      ...banner,
      searchProduct: banner.searchProduct || null
    });
    setSelectedProduct(banner.searchProduct || null);
    setProductSearch('');
    setFilteredProducts([]);
    setShowProductModal(true);
  };

  const createBanner = async () => {
    if (!formData.title.trim()) {
      setError('Banner title is required');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in as admin');
      return;
    }

    setSubmitting(true);
    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description || '');
      
      if (formData.image) {
        submitData.append('image', formData.image);
      }
      
      if (selectedProduct) {
        submitData.append('searchProduct', selectedProduct._id);
      }

      const response = await fetch(`${API_BASE_URL}/homepage/banners`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: submitData
      });

      if (!response.ok) {
        throw new Error('Failed to create banner');
      }

      const newBanner = await response.json();
      
      // Ensure the new banner has all necessary data
      const completeNewBanner = {
        ...newBanner,
        searchProduct: selectedProduct || newBanner.searchProduct || null,
        image: newBanner.image || formData.imagePreview || null
      };
      
      // Force refresh data from server to ensure consistency
      await loadInitialData();
      
      setShowCreateModal(false);
      setSuccess('Banner created successfully');
      resetForm();
    } catch (err) {
      setError('Failed to create banner');
      console.error('Create error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const updateBanner = async () => {
    if (!formData.title.trim()) {
      setError('Banner title is required');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in as admin');
      return;
    }

    setSubmitting(true);
    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description || '');
      
      if (formData.image) {
        submitData.append('image', formData.image);
      } else if (selectedBanner?.image) {
        submitData.append('imageUrl', selectedBanner.image);
      }
      
      if (selectedProduct) {
        submitData.append('searchProduct', selectedProduct._id);
      }

      const response = await fetch(`${API_BASE_URL}/homepage/banners/${selectedBanner._id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: submitData
      });

      if (!response.ok) {
        throw new Error('Failed to update banner');
      }

      // Force refresh data from server to ensure consistency
      await loadInitialData();
      
      setShowEditModal(false);
      setSuccess('Banner updated successfully');
      resetForm();
    } catch (err) {
      setError('Failed to update banner');
      console.error('Update error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const updateBannerProduct = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in as admin');
      return;
    }

    setSubmitting(true);
    
    // Store original banner state for rollback if needed
    const originalBanner = { ...selectedBanner };
    
    try {
      const submitData = new FormData();
      submitData.append('title', selectedBanner.title);
      submitData.append('description', selectedBanner.description || '');
      
      if (selectedBanner.image) {
        if (selectedBanner.image.startsWith('data:image/')) {
          const response = await fetch(selectedBanner.image);
          const blob = await response.blob();
          submitData.append('image', blob);
        } else {
          submitData.append('imageUrl', selectedBanner.image);
        }
      }
      
      if (selectedProduct) {
        submitData.append('searchProduct', selectedProduct._id);
      }

      const response = await fetch(`${API_BASE_URL}/homepage/banners/${selectedBanner._id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: submitData
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to update banner product: ${errorData}`);
      }

      const updatedBanner = await response.json();
      
      // First try to update state with proper data structure
      setBanners(prev => {
        const updatedBanners = prev.map(banner => 
          banner._id === selectedBanner._id 
            ? { 
                ...originalBanner,  // Keep original data
                ...updatedBanner,  // Apply server updates
                searchProduct: selectedProduct || null,  // Ensure product is set correctly
                _id: selectedBanner._id,  // Ensure ID is preserved
                title: updatedBanner.title || originalBanner.title,
                description: updatedBanner.description || originalBanner.description,
                image: updatedBanner.image || originalBanner.image
              }
            : banner
        );
        return updatedBanners;
      });
      
      setShowProductModal(false);
      setSuccess(selectedProduct ? 'Featured product added successfully' : 'Featured product removed successfully');
      
      // Reset product modal state
      setSelectedProduct(null);
      setProductSearch('');
      setFilteredProducts([]);
      
      // As a backup, refresh data after a short delay to ensure consistency
      setTimeout(() => {
        loadInitialData(true);
      }, 1000);
      
    } catch (err) {
      // On error, refresh data to ensure consistency
      await loadInitialData(true);
      setError(`Failed to update banner product: ${err.message}`);
      console.error('Product update error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteBanner = async (bannerId) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in as admin');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/homepage/banners/${bannerId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete banner');
      }

      // Force refresh data from server to ensure consistency
      await loadInitialData();
      setSuccess('Banner deleted successfully');
    } catch (err) {
      setError('Failed to delete banner');
      console.error('Delete error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading banner dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Banner Management</h1>
            <p className="text-blue-200">Manage your website banners and featured products</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={openCreateModal}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              <span>New Banner</span>
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <span className="text-red-200">{error}</span>
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-300">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center space-x-3">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <span className="text-green-200">{success}</span>
            <button onClick={() => setSuccess('')} className="ml-auto text-green-400 hover:text-green-300">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Banner Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {banners.map((banner, index) => (
            <div key={banner._id} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:border-white/20 transition-all">
              <div className="relative">
                <img
                  src={banner.image || '/api/placeholder/400/200'}
                  alt={banner.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-3 left-3 bg-blue-600 text-white px-2 py-1 rounded-md text-sm font-medium">
                  Banner #{index + 1}
                </div>
                {banner.searchProduct && (
                  <div className="absolute top-3 right-3 bg-green-600 text-white px-2 py-1 rounded-md text-sm font-medium flex items-center space-x-1">
                    <Star className="h-3 w-3" />
                    <span>Featured</span>
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold text-white mb-2">{banner.title}</h3>
                {banner.description && (
                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">{banner.description}</p>
                )}
                
                {banner.searchProduct && (
                  <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center space-x-3">
                      <img
                        src={banner.searchProduct.images?.[0] || '/api/placeholder/40/40'}
                        alt={banner.searchProduct.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div>
                        <p className="text-white font-medium text-sm">{banner.searchProduct.name}</p>
                        <p className="text-gray-400 text-xs">{banner.searchProduct.category}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditModal(banner)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openProductModal(banner)}
                      className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => deleteBanner(banner._id)}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {banners.length === 0 && (
          <div className="text-center py-12">
            <ImageIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No banners yet</h3>
            <p className="text-gray-400 mb-6">Create your first banner to get started</p>
            <button
              onClick={openCreateModal}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-medium transition-all"
            >
              Create First Banner
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Create New Banner</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Banner Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter banner title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Enter banner description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Banner Image</label>
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-slate-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="create-image-upload"
                  />
                  <label htmlFor="create-image-upload" className="cursor-pointer">
                    {formData.imagePreview ? (
                      <img src={formData.imagePreview} alt="Preview" className="mx-auto mb-4 max-h-32 rounded-lg" />
                    ) : (
                      <Upload className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    )}
                    <p className="text-gray-400">Click to upload image</p>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Featured Product (Optional)</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => searchProducts(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Search for a product to feature"
                  />
                </div>

                {filteredProducts.length > 0 && (
                  <div className="mt-2 bg-slate-700 rounded-lg border border-slate-600 max-h-40 overflow-y-auto">
                    {filteredProducts.map(product => (
                      <button
                        key={product._id}
                        onClick={() => {
                          setSelectedProduct(product);
                          setProductSearch('');
                          setFilteredProducts([]);
                        }}
                        className="w-full p-3 text-left hover:bg-slate-600 transition-colors flex items-center space-x-3"
                      >
                        <img src={product.images?.[0] || '/api/placeholder/40/40'} alt={product.name} className="w-8 h-8 rounded object-cover" />
                        <div>
                          <p className="text-white text-sm">{product.name}</p>
                          <p className="text-gray-400 text-xs">{product.category}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {selectedProduct && (
                  <div className="mt-3 p-3 bg-slate-700 rounded-lg border border-slate-600 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img src={selectedProduct.images?.[0] || '/api/placeholder/40/40'} alt={selectedProduct.name} className="w-10 h-10 rounded object-cover" />
                      <div>
                        <p className="text-white font-medium">{selectedProduct.name}</p>
                        <p className="text-gray-400 text-sm">{selectedProduct.category}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-700 flex justify-end space-x-4">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createBanner}
                disabled={submitting || !formData.title.trim()}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                {submitting && <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>}
                <span>Create Banner</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedBanner && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Edit Banner</h2>
                <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-white">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Banner Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter banner title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Enter banner description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Banner Image</label>
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-slate-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="edit-image-upload"
                  />
                  <label htmlFor="edit-image-upload" className="cursor-pointer">
                    {formData.imagePreview ? (
                      <img src={formData.imagePreview} alt="Preview" className="mx-auto mb-4 max-h-32 rounded-lg" />
                    ) : (
                      <Upload className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    )}
                    <p className="text-gray-400">Click to change image</p>
                  </label>
                </div>
              </div>

              {selectedProduct && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Current Featured Product</label>
                  <div className="p-3 bg-slate-700 rounded-lg border border-slate-600 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img src={selectedProduct.images?.[0] || '/api/placeholder/40/40'} alt={selectedProduct.name} className="w-10 h-10 rounded object-cover" />
                      <div>
                        <p className="text-white font-medium">{selectedProduct.name}</p>
                        <p className="text-gray-400 text-sm">{selectedProduct.category}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-700 flex justify-end space-x-4">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={updateBanner}
                disabled={submitting || !formData.title.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                {submitting && <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>}
                <span>Update Banner</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && selectedBanner && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Manage Featured Product</h2>
                <button onClick={() => setShowProductModal(false)} className="text-gray-400 hover:text-white">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-white mb-2">Banner: {selectedBanner.title}</h3>
                <p className="text-gray-400">Search and select a product to feature on this banner</p>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => searchProducts(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search for a product to feature"
                />
              </div>

              {filteredProducts.length > 0 && (
                <div className="bg-slate-700 rounded-lg border border-slate-600 max-h-60 overflow-y-auto">
                  {filteredProducts.map(product => (
                    <button
                      key={product._id}
                      onClick={() => {
                        setSelectedProduct(product);
                        setProductSearch('');
                        setFilteredProducts([]);
                      }}
                      className="w-full p-4 text-left hover:bg-slate-600 transition-colors flex items-center space-x-4 border-b border-slate-600 last:border-b-0"
                    >
                      <img 
                        src={product.images?.[0] || '/api/placeholder/50/50'} 
                        alt={product.name} 
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <p className="text-white font-medium">{product.name}</p>
                        <p className="text-gray-400 text-sm">{product.category}</p>
                        {product.brand && (
                          <p className="text-gray-500 text-xs">{product.brand}</p>
                        )}
                      </div>
                      <div className="text-blue-400">
                        <Plus className="h-5 w-5" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedProduct && (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-white">Selected Product</h4>
                  <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
                    <div className="flex items-center space-x-4">
                      <img 
                        src={selectedProduct.images?.[0] || '/api/placeholder/60/60'} 
                        alt={selectedProduct.name} 
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h5 className="text-white font-semibold">{selectedProduct.name}</h5>
                        <p className="text-gray-400">{selectedProduct.category}</p>
                        {selectedProduct.brand && (
                          <p className="text-gray-500 text-sm">{selectedProduct.brand}</p>
                        )}
                        {selectedProduct.price && (
                          <p className="text-green-400 font-medium">${selectedProduct.price}</p>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedProduct(null)}
                        className="text-red-400 hover:text-red-300 p-2"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {selectedBanner.searchProduct && !selectedProduct && (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-white">Current Featured Product</h4>
                  <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
                    <div className="flex items-center space-x-4">
                      <img 
                        src={selectedBanner.searchProduct.images?.[0] || '/api/placeholder/60/60'} 
                        alt={selectedBanner.searchProduct.name} 
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h5 className="text-white font-semibold">{selectedBanner.searchProduct.name}</h5>
                        <p className="text-gray-400">{selectedBanner.searchProduct.category}</p>
                        {selectedBanner.searchProduct.brand && (
                          <p className="text-gray-500 text-sm">{selectedBanner.searchProduct.brand}</p>
                        )}
                        {selectedBanner.searchProduct.price && (
                          <p className="text-green-400 font-medium">${selectedBanner.searchProduct.price}</p>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedProduct(null)}
                        className="text-yellow-400 hover:text-yellow-300 p-2 bg-yellow-400/10 rounded-lg"
                        title="Remove featured product"
                      >
                        <StarOff className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-700 flex justify-end space-x-4">
              <button
                onClick={() => setShowProductModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={updateBannerProduct}
                disabled={submitting}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                {submitting && <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>}
                <span>{selectedProduct ? 'Update Product' : 'Remove Product'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerDashboard;