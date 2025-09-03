import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'https://abinexis-backend.onrender.com/api';

const TodaysOffers = () => {
  const [homepage, setHomepage] = useState({
    todayOffers: [],
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offersSearchQuery, setOffersSearchQuery] = useState('');
  const [offersSearchResults, setOffersSearchResults] = useState([]);

  useEffect(() => {
    fetchHomepageData();
  }, []);

  const fetchOfferPrices = async (offers) => {
    return Promise.all(
      offers.map(async (product) => {
        if (product.displayPrice !== undefined) {
          return product;
        }
        const initialFilters = {};
        product.filters?.forEach((filter) => {
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
            discount:
              priceDetails.normalPrice > priceDetails.effectivePrice &&
              priceDetails.effectivePrice > 0
                ? Math.round(
                    ((priceDetails.normalPrice - priceDetails.effectivePrice) /
                      priceDetails.normalPrice) *
                      100
                  )
                : 0,
          };
        } catch (err) {
          console.error(`Error fetching price details for product ${product._id}:`, err);
          return { ...product, displayPrice: 0, originalPrice: 0, discount: 0 };
        }
      })
    );
  };

  const fetchHomepageData = async () => {
    try {
      setLoading(true);
      const homepageResponse = await axios.get(`${API_BASE_URL}/homepage`);
      const offersWithPrice = await fetchOfferPrices(homepageResponse.data.todayOffers);
      setHomepage({ todayOffers: offersWithPrice });
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

  const addToOffers = async (product) => {
    if (!homepage.todayOffers.find((p) => p._id === product._id)) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Please log in as admin to manage today offers');
          return;
        }

        const initialFilters = {};
        product.filters?.forEach((filter) => {
          if (filter.values && filter.values.length > 0) {
            initialFilters[filter.name] = filter.values[0];
          }
        });
        const priceResponse = await axios.get(
          `${API_BASE_URL}/products/${product._id}/price-details`,
          { params: { selectedFilters: JSON.stringify(initialFilters) } }
        );
        const priceDetails = priceResponse.data;

        setHomepage((prev) => ({
          ...prev,
          todayOffers: [
            ...prev.todayOffers,
            {
              ...product,
              displayPrice: priceDetails.effectivePrice || 0,
              originalPrice: priceDetails.normalPrice || 0,
              discount:
                priceDetails.normalPrice > priceDetails.effectivePrice &&
                priceDetails.effectivePrice > 0
                  ? Math.round(
                      ((priceDetails.normalPrice - priceDetails.effectivePrice) /
                        priceDetails.normalPrice) *
                        100
                    )
                  : 0,
            },
          ],
        }));

        await axios.post(
          `${API_BASE_URL}/homepage/offers`,
          {
            productId: product._id,
            action: 'add',
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (err) {
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

      setHomepage((prev) => ({
        ...prev,
        todayOffers: prev.todayOffers.filter((p) => p._id !== productId),
      }));

      const response = await axios.post(
        `${API_BASE_URL}/homepage/offers`,
        {
          productId,
          action: 'remove',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const updatedOffers = await fetchOfferPrices(response.data.todayOffers);
      setHomepage((prev) => ({
        ...prev,
        todayOffers: updatedOffers,
      }));
    } catch (err) {
      await fetchHomepageData();
      alert(`Error removing today's offer: ${err.response?.data?.message || err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white pt-32 pb-16">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-lg">Loading today's offers...</span>
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
      <h1 className="text-3xl font-bold text-white mb-6">Today's Offers</h1>
      <div className="bg-white/2 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Manage Today's Offers</h2>

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
                className="w-full pl-10 p-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-white/10"
              />
            </div>
          </div>

          {offersSearchResults.length > 0 && (
            <div className="mt-4 bg-white/8 rounded-lg border border-gray-600 max-h-60 overflow-y-auto">
              {offersSearchResults.map((product) => (
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {homepage.todayOffers.map((product) => (
            <div
              key={product._id}
              className="bg-gray-900 rounded-lg p-4 border border-gray-700 relative"
            >
              <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                OFFER
              </div>
              {product.discount > 0 && (
                <div className="absolute top-2 left-2 bg-orange-600 text-white text-xs px-2 py-1 rounded-full">
                  -{product.discount}%
                </div>
              )}
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-32 object-cover rounded-lg mb-3"
              />
              <h3 className="text-white font-medium mb-1">{product.name}</h3>
              <p className="text-gray-400 text-sm mb-2">{product.category}</p>
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-lg font-bold text-white">
                  ₹{product.displayPrice || 'N/A'}
                </span>
                {product.discount > 0 && (
                  <span className="text-sm text-gray-400 line-through">
                    ₹{product.originalPrice || 'N/A'}
                  </span>
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

export default TodaysOffers;