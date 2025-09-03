import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'https://abinexis-backend.onrender.com/api';

const FeaturedProducts = () => {
  const [homepage, setHomepage] = useState({
    featuredProducts: [],
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    fetchHomepageData();
  }, []);

  const fetchHomepageData = async () => {
    try {
      setLoading(true);
      const homepageResponse = await axios.get(`${API_BASE_URL}/homepage`);
      setHomepage({ featuredProducts: homepageResponse.data.featuredProducts });
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

  const addToFeatured = async (product) => {
    if (!homepage.featuredProducts.find((p) => p._id === product._id)) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Please log in as admin to manage featured products');
          return;
        }

        setHomepage((prev) => ({
          ...prev,
          featuredProducts: [...prev.featuredProducts, product],
        }));

        const response = await axios.post(
          `${API_BASE_URL}/homepage/featured`,
          {
            productId: product._id,
            action: 'add',
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setHomepage({ featuredProducts: response.data.featuredProducts });
      } catch (err) {
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

      setHomepage((prev) => ({
        ...prev,
        featuredProducts: prev.featuredProducts.filter((p) => p._id !== productId),
      }));

      const response = await axios.post(
        `${API_BASE_URL}/homepage/featured`,
        {
          productId,
          action: 'remove',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setHomepage({ featuredProducts: response.data.featuredProducts });
    } catch (err) {
      await fetchHomepageData();
      alert(`Error removing featured product: ${err.response?.data?.message || err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white pt-32 pb-16">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-lg">Loading featured products...</span>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white pt-32 pb-16 p-4 lg:p-8">
      <h1 className="text-3xl font-bold text-white mb-6">Featured Products</h1>
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Manage Featured Products</h2>

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

          {searchResults.length > 0 && (
            <div className="mt-4 bg-gray-900 rounded-lg border border-gray-600 max-h-60 overflow-y-auto">
              {searchResults.map((product) => (
                <div
                  key={product._id}
                  className="flex items-center justify-between p-3 border-b border-gray-700 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-10 h-10 rounded object-cover"
                    />
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {homepage.featuredProducts.map((product) => (
            <div
              key={product._id}
              className="bg-gray-900 rounded-lg p-4 border border-gray-700"
            >
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-32 object-cover rounded-lg mb-3"
              />
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
    </div>
  );
};

export default FeaturedProducts;