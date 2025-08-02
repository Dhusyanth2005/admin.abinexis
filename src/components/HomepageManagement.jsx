import React, { useState, useEffect } from 'react';
import { Search, Trash2, Upload, X, Edit2, Plus, Save } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'https://abinexis-backend.onrender.com/api';

const HomepageManagement = () => {
  const [homepage, setHomepage] = useState({
    banners: [],
    featuredProducts: [],
    todayOffers: []
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [offersSearchQuery, setOffersSearchQuery] = useState('');
  const [offersSearchResults, setOffersSearchResults] = useState([]);
  
  // Banner-specific states
  const [bannerSearchQueries, setBannerSearchQueries] = useState({});
  const [bannerSearchResults, setBannerSearchResults] = useState({});
  const [editingBanner, setEditingBanner] = useState(null);
  const [bannerForm, setBannerForm] = useState({ title: '', description: '', image: '' });
  const [showAddBannerModal, setShowAddBannerModal] = useState(false);
  const [newBannerForm, setNewBannerForm] = useState({ title: '', description: '', image: '' });
  const [newBannerSearch, setNewBannerSearch] = useState('');
  const [newBannerSearchResults, setNewBannerSearchResults] = useState([]);
  const [newBannerProduct, setNewBannerProduct] = useState(null);

  // Fetch homepage data and products on mount
  useEffect(() => {
    fetchHomepageData();
  }, []);

  // Helper function to fetch price details for offers
  const fetchOfferPrices = async (offers) => {
    return Promise.all(
      offers.map(async (product) => {
        if (product.displayPrice !== undefined) {
          return product; // Preserve existing price details
        }
        const initialFilters = {};
        product.filters?.forEach(filter => {
          if (filter.values && filter.values.length > 0) {
            initialFilters[filter.name] = filter.values[0];
          }
        });
        try {
          const priceResponse = await axios.get(
            `${API_BASE_URL}/products/${product._id}/price-details`,
            { params: { selectedFilters: JSON.stringify(initialFilters) } }
          );
          const priceDetails = priceResponse.data;
          return {
            ...product,
            displayPrice: priceDetails.effectivePrice || 0,
            originalPrice: priceDetails.normalPrice || 0,
            discount: priceDetails.normalPrice > priceDetails.effectivePrice && priceDetails.effectivePrice > 0
              ? Math.round(((priceDetails.normalPrice - priceDetails.effectivePrice) / priceDetails.normalPrice) * 100)
              : 0
          };
        } catch (err) {
          console.error(`Error fetching price details for product ${product._id}:`, err);
          return { ...product, displayPrice: 0, originalPrice: 0, discount: 0 };
        }
      })
    );
  };

  // Helper function to fetch homepage data
  const fetchHomepageData = async () => {
    try {
      setLoading(true);
      const homepageResponse = await axios.get(`${API_BASE_URL}/homepage`);
      const homepageData = homepageResponse.data;

      // Fetch price details for today's offers
      const offersWithPrice = await fetchOfferPrices(homepageData.todayOffers);

      setHomepage({
        ...homepageData,
        todayOffers: offersWithPrice
      });

      // Fetch all products for search functionality
      const productsResponse = await axios.get(`${API_BASE_URL}/products`);
      setProducts(productsResponse.data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const searchProducts = (query, setter) => {
    if (query.trim()) {
      const results = products.filter(
        (product) =>
          product.name.toLowerCase().includes(query.toLowerCase()) ||
          product.category.toLowerCase().includes(query.toLowerCase()) ||
          product.brand.toLowerCase().includes(query.toLowerCase())
      );
      setter(results);
    } else {
      setter([]);
    }
  };

  const handleImageUpload = (event, setForm) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setForm(prev => ({
          ...prev,
          image: e.target.result // Base64 string for preview
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Banner Management Functions
  const openAddBannerModal = () => {
    setShowAddBannerModal(true);
    setNewBannerForm({ title: '', description: '', image: '' });
    setNewBannerSearch('');
    setNewBannerSearchResults([]);
    setNewBannerProduct(null);
  };

  const closeAddBannerModal = () => {
    setShowAddBannerModal(false);
    setNewBannerForm({ title: '', description: '', image: '' });
    setNewBannerSearch('');
    setNewBannerSearchResults([]);
    setNewBannerProduct(null);
  };

  const addNewBanner = async () => {
    if (!newBannerForm.title.trim()) {
      alert('Please enter a banner title');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in as admin to add a banner');
        return;
      }

      // Optimistic update: Add the new banner to the state
      const tempBanner = {
        _id: `temp-${Date.now()}`,
        title: newBannerForm.title,
        description: newBannerForm.description || '',
        image: newBannerForm.image || '',
        searchProduct: newBannerProduct || null
      };
      setHomepage(prev => ({
        ...prev,
        banners: [...prev.banners, tempBanner]
      }));

      const formData = new FormData();
      formData.append('title', newBannerForm.title);
      formData.append('description', newBannerForm.description || '');
      if (newBannerForm.image && newBannerForm.image.startsWith('data:image/')) {
        const response = await fetch(newBannerForm.image);
        const blob = await response.blob();
        formData.append('image', blob, 'banner-image.jpg');
      }
      if (newBannerProduct) {
        formData.append('searchProduct', newBannerProduct._id);
      }

      const response = await axios.post(`${API_BASE_URL}/homepage/banners`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Update state with server response
      setHomepage(prev => ({
        ...prev,
        banners: prev.banners.map(b => b._id === tempBanner._id ? response.data : b)
      }));
      closeAddBannerModal();
      window.location.reload(); // Reload after successful add
    } catch (err) {
      // Revert optimistic update and reload on error
      setHomepage(prev => ({
        ...prev,
        banners: prev.banners.filter(b => !b._id.startsWith('temp-'))
      }));
      alert(`Error adding banner: ${err.response?.data?.message || err.message}`);
      window.location.reload();
    }
  };

  const handleNewBannerSearch = (query) => {
    setNewBannerSearch(query);
    searchProducts(query, setNewBannerSearchResults);
  };

  const addProductToNewBanner = (product) => {
    setNewBannerProduct(product);
    setNewBannerSearch('');
    setNewBannerSearchResults([]);
  };

  const removeProductFromNewBanner = () => {
    setNewBannerProduct(null);
  };

  const deleteBanner = async (bannerId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in as admin to delete a banner');
        return;
      }

      // Optimistic update: Remove the banner from state
      setHomepage(prev => ({
        ...prev,
        banners: prev.banners.filter(b => b._id !== bannerId)
      }));

      await axios.delete(`${API_BASE_URL}/homepage/banners/${bannerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setBannerSearchQueries(prev => {
        const newQueries = { ...prev };
        delete newQueries[bannerId];
        return newQueries;
      });
      setBannerSearchResults(prev => {
        const newResults = { ...prev };
        delete newResults[bannerId];
        return newResults;
      });
      window.location.reload(); // Reload after successful delete
    } catch (err) {
      // Revert to full homepage data and reload on error
      await fetchHomepageData();
      alert(`Error deleting banner: ${err.response?.data?.message || err.message}`);
      window.location.reload();
    }
  };

  const startEditingBanner = (banner) => {
    setEditingBanner(banner._id);
    setBannerForm({
      title: banner.title,
      description: banner.description || '',
      image: banner.image || '' // Ensure image is set for preview
    });
  };

  const saveEditingBanner = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in as admin to update a banner');
        return;
      }

      // Optimistic update: Update the banner in state
      const currentBanner = homepage.banners.find(b => b._id === editingBanner);
      setHomepage(prev => ({
        ...prev,
        banners: prev.banners.map(b =>
          b._id === editingBanner
            ? { ...b, title: bannerForm.title, description: bannerForm.description, image: bannerForm.image || currentBanner.image }
            : b
        )
      }));

      const formData = new FormData();
      formData.append('title', bannerForm.title);
      formData.append('description', bannerForm.description || '');
      if (bannerForm.image && bannerForm.image.startsWith('data:image/')) {
        const response = await fetch(bannerForm.image);
        const blob = await response.blob();
        formData.append('image', blob, 'banner-image.jpg');
      }
      const banner = homepage.banners.find(b => b._id === editingBanner);
      if (banner.searchProduct) {
        formData.append('searchProduct', banner.searchProduct._id);
      }

      const response = await axios.put(`${API_BASE_URL}/homepage/banners/${editingBanner}`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Update state with server response, fallback to uploaded image if server image is invalid
      const updatedImage = response.data.image || bannerForm.image || currentBanner.image;
      setHomepage(prev => ({
        ...prev,
        banners: prev.banners.map(b =>
          b._id === editingBanner ? { ...response.data, image: updatedImage } : b
        )
      }));
      setEditingBanner(null);
      setBannerForm({ title: '', description: '', image: '' });
      window.location.reload(); // Reload after successful save
    } catch (err) {
      console.error('Save banner error:', err.response?.data || err.message);
      // Reload on error
      alert(`Error updating banner: ${err.response?.data?.message || err.message}`);
      window.location.reload();
    }
  };

  const cancelEditingBanner = () => {
    setEditingBanner(null);
    setBannerForm({ title: '', description: '', image: '' });
  };

  const handleBannerSearch = (bannerId, query) => {
    setBannerSearchQueries(prev => ({ ...prev, [bannerId]: query }));
    searchProducts(query, (results) => {
      setBannerSearchResults(prev => ({ ...prev, [bannerId]: results }));
    });
  };

  const addBannerSearchProduct = async (bannerId, product) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in as admin to update banner product');
        return;
      }

      // Verify banner exists in state
      const banner = homepage.banners.find(b => b._id === bannerId);
      if (!banner) {
        throw new Error('Banner not found in state');
      }

      // Optimistic update: Add product to banner while preserving image
      setHomepage(prev => ({
        ...prev,
        banners: prev.banners.map(b =>
          b._id === bannerId ? { ...b, searchProduct: product, image: b.image } : b
        )
      }));

      const formData = new FormData();
      formData.append('title', banner.title);
      formData.append('description', banner.description || '');
      formData.append('image', banner.image); // Explicitly include current image
      formData.append('searchProduct', product._id);

      const response = await axios.put(`${API_BASE_URL}/homepage/banners/${bannerId}`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Update state with server response, ensuring image is retained
      const updatedImage = response.data.image || banner.image;
      setHomepage(prev => ({
        ...prev,
        banners: prev.banners.map(b => b._id === bannerId ? { ...response.data, image: updatedImage } : b)
      }));
      setBannerSearchQueries(prev => ({ ...prev, [bannerId]: '' }));
      setBannerSearchResults(prev => ({ ...prev, [bannerId]: [] }));
      window.location.reload(); // Reload after successful add/replace
    } catch (err) {
      console.error('Add banner product error:', err.response?.data || err.message);
      // Reload on error
      alert(`Error updating banner product: ${err.response?.data?.message || err.message}`);
      window.location.reload();
    }
  };

  const removeBannerSearchProduct = async (bannerId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in as admin to update banner product');
        return;
      }

      // Verify banner exists in state
      const banner = homepage.banners.find(b => b._id === bannerId);
      if (!banner) {
        throw new Error('Banner not found in state');
      }

      // Optimistic update: Remove product from banner
      setHomepage(prev => ({
        ...prev,
        banners: prev.banners.map(b =>
          b._id === bannerId ? { ...b, searchProduct: null } : b
        )
      }));

      const formData = new FormData();
      formData.append('title', banner.title);
      formData.append('description', banner.description || '');
      formData.append('image', banner.image);

      const response = await axios.put(`${API_BASE_URL}/homepage/banners/${bannerId}`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Update state with server response
      setHomepage(prev => ({
        ...prev,
        banners: prev.banners.map(b => b._id === bannerId ? response.data : b)
      }));
      window.location.reload(); // Reload after successful remove
    } catch (err) {
      console.error('Remove banner product error:', err.response?.data || err.message);
      // Reload on error
      alert(`Error removing banner product: ${err.response?.data?.message || err.message}`);
      window.location.reload();
    }
  };

  // Featured Products Functions
  const addToFeatured = async (product) => {
    if (!homepage.featuredProducts.find((p) => p._id === product._id)) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Please log in as admin to manage featured products');
          return;
        }

        // Optimistic update
        setHomepage(prev => ({
          ...prev,
          featuredProducts: [...prev.featuredProducts, product]
        }));

        const response = await axios.post(`${API_BASE_URL}/homepage/featured`, {
          productId: product._id,
          action: 'add'
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        // Ensure todayOffers prices are preserved
        const updatedOffers = await fetchOfferPrices(response.data.todayOffers);
        setHomepage({
          ...response.data,
          todayOffers: updatedOffers
        });
      } catch (err) {
        // Revert to full homepage data on error
        await fetchHomepageData();
        alert(`Error adding featured product: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  const removeFromFeatured = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in as admin to manage featured products');
        return;
      }

      // Optimistic update
      setHomepage(prev => ({
        ...prev,
        featuredProducts: prev.featuredProducts.filter(p => p._id !== productId)
      }));

      const response = await axios.post(`${API_BASE_URL}/homepage/featured`, {
        productId,
        action: 'remove'
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Ensure todayOffers prices are preserved
      const updatedOffers = await fetchOfferPrices(response.data.todayOffers);
      setHomepage({
        ...response.data,
        todayOffers: updatedOffers
      });
    } catch (err) {
      // Revert to full homepage data on error
      await fetchHomepageData();
      alert(`Error removing featured product: ${err.response?.data?.message || err.message}`);
    }
  };

  // Today's Offers Functions
  const addToOffers = async (product) => {
    if (!homepage.todayOffers.find((p) => p._id === product._id)) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Please log in as admin to manage today offers');
          return;
        }

        // Optimistic update
        const initialFilters = {};
        product.filters?.forEach(filter => {
          if (filter.values && filter.values.length > 0) {
            initialFilters[filter.name] = filter.values[0];
          }
        });
        const priceResponse = await axios.get(
          `${API_BASE_URL}/products/${product._id}/price-details`,
          { params: { selectedFilters: JSON.stringify(initialFilters) } }
        );
        const priceDetails = priceResponse.data;

        setHomepage(prev => ({
          ...prev,
          todayOffers: [
            ...prev.todayOffers,
            {
              ...product,
              displayPrice: priceDetails.effectivePrice || 0,
              originalPrice: priceDetails.normalPrice || 0,
              discount: priceDetails.normalPrice > priceDetails.effectivePrice && priceDetails.effectivePrice > 0
                ? Math.round(((priceDetails.normalPrice - priceDetails.effectivePrice) / priceDetails.normalPrice) * 100)
                : 0
            }
          ]
        }));

        await axios.post(`${API_BASE_URL}/homepage/offers`, {
          productId: product._id,
          action: 'add'
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {
        // Revert to full homepage data on error
        await fetchHomepageData();
        alert(`Error adding today's offer: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  const removeFromOffers = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in as admin to manage today offers');
        return;
      }

      // Optimistic update
      setHomepage(prev => ({
        ...prev,
        todayOffers: prev.todayOffers.filter(p => p._id !== productId)
      }));

      const response = await axios.post(`${API_BASE_URL}/homepage/offers`, {
        productId,
        action: 'remove'
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Fetch price details for remaining offers
      const updatedOffers = await fetchOfferPrices(response.data.todayOffers);
      setHomepage(prev => ({
        ...prev,
        ...response.data,
        todayOffers: updatedOffers
      }));
    } catch (err) {
      // Revert to full homepage data on error
      await fetchHomepageData();
      alert(`Error removing today's offer: ${err.response?.data?.message || err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white pt-32 pb-16">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-lg">Loading homepage data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white pt-32 pb-16">
        <div className="text-center py-10">
          <div className="text-red-500 text-lg mb-4">{error}</div>
          <button
            onClick={fetchHomepageData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Homepage Management</h1>

      {/* Banner Management */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Main Banners</h2>
          <button
            onClick={openAddBannerModal}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Banner</span>
          </button>
        </div>

        <div className="space-y-6">
          {homepage.banners.map((banner, index) => (
            <div key={banner._id} className="bg-gray-900 rounded-lg border border-gray-600 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Banner {index + 1}</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => startEditingBanner(banner)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  {homepage.banners.length > 1 && (
                    <button
                      onClick={() => deleteBanner(banner._id)}
                      className="bg-red-600 hover:bg-red-700 text-white p-2 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {editingBanner === banner._id ? (
                /* Edit Mode */
                <div className="space-y-4 mb-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Banner Title *</label>
                    <input
                      type="text"
                      value={bannerForm.title}
                      onChange={(e) => setBannerForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Banner Description</label>
                    <textarea
                      value={bannerForm.description}
                      onChange={(e) => setBannerForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="4"
                      maxLength="200"
                      placeholder="Enter banner description (max 200 characters)"
                    />
                    <p className="text-gray-400 text-xs mt-1">{bannerForm.description.length}/200 characters</p>
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Banner Image</label>
                    <div className="flex items-center space-x-4">
                      <label className="flex-1 cursor-pointer">
                        <div className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2">
                          <Upload className="h-5 w-5" />
                          <span>Upload Banner Image</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, setBannerForm)}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {bannerForm.image && (
                      <div className="mt-2">
                        <img src={bannerForm.image} alt="Banner preview" className="w-32 h-20 object-cover rounded-lg" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={saveEditingBanner}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                    >
                      <Save className="h-4 w-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={cancelEditingBanner}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="mb-4">
                  <p className="text-white font-medium mb-1">{banner.title}</p>
                  {banner.description && (
                    <p className="text-gray-300 text-sm mb-2">{banner.description}</p>
                  )}
                  <img src={banner.image || '/placeholder-image.jpg'} alt={banner.title} className="w-full h-40 object-cover rounded-lg bg-gray-500" />
                </div>
              )}

              {/* Featured Product on Banner */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Featured Product on Banner</label>
                <div className="flex space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search product to feature on banner..."
                      value={bannerSearchQueries[banner._id] || ''}
                      onChange={(e) => handleBannerSearch(banner._id, e.target.value)}
                      className="w-full pl-10 p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Banner Search Results */}
                {bannerSearchResults[banner._id] && bannerSearchResults[banner._id].length > 0 && (
                  <div className="mt-2 bg-gray-800 rounded-lg border border-gray-600 max-h-40 overflow-y-auto">
                    {bannerSearchResults[banner._id].map((product) => (
                      <div key={product._id} className="flex items-center justify-between p-3 border-b border-gray-700 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <img src={product.images[0]} alt={product.name} className="w-8 h-8 rounded object-cover" />
                          <div>
                            <p className="text-white text-sm font-medium">{product.name}</p>
                            <p className="text-gray-400 text-xs">{product.category}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => addBannerSearchProduct(banner._id, product)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          {banner.searchProduct ? 'Replace' : 'Add'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Current Banner Product */}
                {banner.searchProduct && (
                  <div className="mt-2 bg-gray-800 rounded-lg border border-gray-600 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img src={banner.searchProduct.images[0]} alt={banner.searchProduct.name} className="w-10 h-10 rounded object-cover" />
                        <div>
                          <p className="text-white font-medium">{banner.searchProduct.name}</p>
                          <p className="text-gray-400 text-sm">{banner.searchProduct.category}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeBannerSearchProduct(banner._id)}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Banner Preview */}
              <div className="mt-6">
                <h4 className="text-md font-medium text-white mb-2">Current Settings</h4>
                <div className="bg-gray-800 rounded-lg p-3 border border-gray-600">
                  <p className="text-white"><span className="text-gray-400">Title:</span> {banner.title}</p>
                  {banner.description && (
                    <p className="text-white mt-1"><span className="text-gray-400">Description:</span> {banner.description}</p>
                  )}
                  {banner.searchProduct && (
                    <p className="text-white mt-1">
                      <span className="text-gray-400">Featured Product:</span> {banner.searchProduct.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Banner Modal */}
        {showAddBannerModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Add New Banner</h3>
                <button
                  onClick={closeAddBannerModal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Banner Title *</label>
                  <input
                    type="text"
                    value={newBannerForm.title}
                    onChange={(e) => setNewBannerForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter banner title"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Banner Description</label>
                  <textarea
                    value={newBannerForm.description}
                    onChange={(e) => setNewBannerForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="4"
                    maxLength="200"
                    placeholder="Enter banner description (max 200 characters)"
                  />
                  <p className="text-gray-400 text-xs mt-1">{newBannerForm.description.length}/200 characters</p>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Banner Image</label>
                  <div className="flex items-center space-x-4">
                    <label className="flex-1 cursor-pointer">
                      <div className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2">
                        <Upload className="h-5 w-5" />
                        <span>Upload Banner Image</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, setNewBannerForm)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {newBannerForm.image && (
                    <div className="mt-2">
                      <img src={newBannerForm.image} alt="New banner preview" className="w-32 h-20 object-cover rounded-lg" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Featured Product (Optional)</label>
                  <div className="flex space-x-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search product to feature on banner..."
                        value={newBannerSearch}
                        onChange={(e) => handleNewBannerSearch(e.target.value)}
                        className="w-full pl-10 p-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* New Banner Search Results */}
                  {newBannerSearchResults.length > 0 && (
                    <div className="mt-2 bg-gray-900 rounded-lg border border-gray-600 max-h-40 overflow-y-auto">
                      {newBannerSearchResults.map((product) => (
                        <div key={product._id} className="flex items-center justify-between p-3 border-b border-gray-700 last:border-b-0">
                          <div className="flex items-center space-x-3">
                            <img src={product.images[0]} alt={product.name} className="w-8 h-8 rounded object-cover" />
                            <div>
                              <p className="text-white text-sm font-medium">{product.name}</p>
                              <p className="text-gray-400 text-xs">{product.category}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => addProductToNewBanner(product)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            Select
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Selected Product for New Banner */}
                  {newBannerProduct && (
                    <div className="mt-2 bg-gray-900 rounded-lg border border-gray-600 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <img src={newBannerProduct.images[0]} alt={newBannerProduct.name} className="w-10 h-10 rounded object-cover" />
                          <div>
                            <p className="text-white font-medium">{newBannerProduct.name}</p>
                            <p className="text-gray-400 text-sm">{newBannerProduct.category}</p>
                          </div>
                        </div>
                        <button
                          onClick={removeProductFromNewBanner}
                          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-700">
                  <button
                    onClick={closeAddBannerModal}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addNewBanner}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Add Banner
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Featured Products */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Featured Products</h2>

        {/* Search and Add */}
        <div className="mb-6">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products to add as featured..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchProducts(e.target.value, setSearchResults);
                }}
                className="w-full pl-10 p-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 bg-gray-900 rounded-lg border border-gray-600 max-h-60 overflow-y-auto">
              {searchResults.map((product) => (
                <div key={product._id} className="flex items-center justify-between p-3 border-b border-gray-700 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <img src={product.images[0]} alt={product.name} className="w-10 h-10 rounded object-cover" />
                    <div>
                      <p className="text-white font-medium">{product.name}</p>
                      <p className="text-gray-400 text-sm">{product.category}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => addToFeatured(product)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current Featured Products */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {homepage.featuredProducts.map((product) => (
            <div key={product._id} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <img src={product.images[0]} alt={product.name} className="w-full h-32 object-cover rounded-lg mb-3" />
              <h3 className="text-white font-medium mb-1">{product.name}</h3>
              <p className="text-gray-400 text-sm mb-3">{product.category}</p>
              <button
                onClick={() => removeFromFeatured(product._id)}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Offers */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Today's Offers</h2>

        {/* Search and Add for Offers */}
        <div className="mb-6">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products to add to today's offers..."
                value={offersSearchQuery}
                onChange={(e) => {
                  setOffersSearchQuery(e.target.value);
                  searchProducts(e.target.value, setOffersSearchResults);
                }}
                className="w-full pl-10 p-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Offers Search Results */}
          {offersSearchResults.length > 0 && (
            <div className="mt-4 bg-gray-900 rounded-lg border border-gray-600 max-h-60 overflow-y-auto">
              {offersSearchResults.map((product) => (
                <div key={product._id} className="flex items-center justify-between p-3 border-b border-gray-700 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <img src={product.images[0]} alt={product.name} className="w-10 h-10 rounded object-cover" />
                    <div>
                      <p className="text-white font-medium">{product.name}</p>
                      <p className="text-gray-400 text-sm">{product.category}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => addToOffers(product)}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current Today's Offers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {homepage.todayOffers.map((product) => (
            <div key={product._id} className="bg-gray-900 rounded-lg p-4 border border-gray-700 relative">
              <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                OFFER
              </div>
              {product.discount > 0 && (
                <div className="absolute top-2 left-2 bg-orange-600 text-white text-xs px-2 py-1 rounded-full">
                  -{product.discount}%
                </div>
              )}
              <img src={product.images[0]} alt={product.name} className="w-full h-32 object-cover rounded-lg mb-3" />
              <h3 className="text-white font-medium mb-1">{product.name}</h3>
              <p className="text-gray-400 text-sm mb-2">{product.category}</p>
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-lg font-bold text-white">₹{product.displayPrice || 'N/A'}</span>
                {product.discount > 0 && (
                  <span className="text-sm text-gray-400 line-through">₹{product.originalPrice || 'N/A'}</span>
                )}
              </div>
              <button
                onClick={() => removeFromOffers(product._id)}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomepageManagement;