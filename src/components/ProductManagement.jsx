import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit3, Trash2, Save, X, Star, Upload } from 'lucide-react';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false); // New loading state for save button
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    brand: '',
    category: '',
    subCategory: '',
    shippingCost: '',
    countInStock: '',
    features: [''],
    filters: [{ name: '', values: [''], priceAdjustments: [{ value: '', price: '', discountPrice: '' }] }],
    images: [],
    existingImages: [],
  });

  const categories = [
    'Kitchen', 'Health', 'Fashion', 'Beauty', 'Electronics',
    'Fitness', 'Spiritual', 'Kids', 'Pets', 'Stationery',
  ];

  // Fetch products and check admin status
  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in as an admin to access product management.');
        return;
      }

      const productResponse = await axios.get('https://abinexis-backend.onrender.com/api/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsAdmin(true);
      setProducts(productResponse.data);
      setError(null);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Only admins can access product management.');
      } else if (err.response?.status === 401) {
        setError('Please log in as an admin to access product management.');
      } else {
        setError(err.response?.data?.message || 'Error fetching products');
      }
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleProductInputChange = (field, value) => {
    setProductForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (index, event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please upload a valid image file.');
        return;
      }
      const newImages = [...productForm.images];
      newImages[index] = file;
      const newExistingImages = [...productForm.existingImages];
      newExistingImages[index] = null; // Clear existing image at this index
      setProductForm((prev) => ({ ...prev, images: newImages, existingImages: newExistingImages }));
    }
  };

  const addImageSlot = () => {
    setProductForm((prev) => ({
      ...prev,
      images: [...prev.images, null],
      existingImages: [...prev.existingImages, null],
    }));
  };

  const removeImageSlot = (index) => {
    const newImages = productForm.images.filter((_, i) => i !== index);
    const newExistingImages = productForm.existingImages.filter((_, i) => i !== index);
    setProductForm((prev) => ({ ...prev, images: newImages, existingImages: newExistingImages }));
  };

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...productForm.features];
    newFeatures[index] = value;
    setProductForm((prev) => ({ ...prev, features: newFeatures }));
  };

  const addFeature = () => {
    setProductForm((prev) => ({ ...prev, features: [...prev.features, ''] }));
  };

  const removeFeature = (index) => {
    const newFeatures = productForm.features.filter((_, i) => i !== index);
    setProductForm((prev) => ({ ...prev, features: newFeatures }));
  };

  const handleFilterChange = (filterIndex, field, value) => {
    const newFilters = [...productForm.filters];
    newFilters[filterIndex][field] = value;
    setProductForm((prev) => ({ ...prev, filters: newFilters }));
  };

  const handleFilterValueChange = (filterIndex, valueIndex, value) => {
    const newFilters = [...productForm.filters];
    newFilters[filterIndex].values[valueIndex] = value;
    newFilters[filterIndex].priceAdjustments[valueIndex] = {
      ...newFilters[filterIndex].priceAdjustments[valueIndex],
      value,
    };
    setProductForm((prev) => ({ ...prev, filters: newFilters }));
  };

  const handlePriceAdjustmentChange = (filterIndex, adjIndex, field, value) => {
    const newFilters = [...productForm.filters];
    newFilters[filterIndex].priceAdjustments[adjIndex][field] = value;
    setProductForm((prev) => ({ ...prev, filters: newFilters }));
  };

  const addFilter = () => {
    setProductForm((prev) => ({
      ...prev,
      filters: [...prev.filters, { name: '', values: [''], priceAdjustments: [{ value: '', price: '', discountPrice: '' }] }],
    }));
  };

  const addFilterValue = (filterIndex) => {
    const newFilters = [...productForm.filters];
    newFilters[filterIndex].values.push('');
    newFilters[filterIndex].priceAdjustments.push({ value: '', price: '', discountPrice: '' });
    setProductForm((prev) => ({ ...prev, filters: newFilters }));
  };

  const removeFilterValue = (filterIndex, adjIndex) => {
    const newFilters = [...productForm.filters];
    newFilters[filterIndex].values.splice(adjIndex, 1);
    newFilters[filterIndex].priceAdjustments.splice(adjIndex, 1);
    setProductForm((prev) => ({ ...prev, filters: newFilters }));
  };

  const openProductModal = (product = null) => {
    if (!isAdmin) {
      alert('Only admins can manage products.');
      return;
    }
    if (product) {
      setEditingProduct(product);
      setProductForm({
        ...product,
        images: product.images ? [...product.images] : [],
        existingImages: product.images ? [...product.images] : [],
        filters: product.filters && product.filters.length > 0
          ? product.filters
          : [{ name: '', values: [''], priceAdjustments: [{ value: '', price: '', discountPrice: '' }] }],
        features: product.features && product.features.length > 0 ? product.features : [''],
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        brand: '',
        category: '',
        subCategory: '',
        shippingCost: '',
        countInStock: '',
        features: [''],
        filters: [{ name: '', values: [''], priceAdjustments: [{ value: '', price: '', discountPrice: '' }] }],
        images: [],
        existingImages: [],
      });
    }
    setShowProductModal(true);
  };

  const validateForm = () => {
    if (!productForm.name.trim()) {
      alert('Product name is required.');
      return false;
    }
    if (!productForm.description.trim()) {
      alert('Description is required.');
      return false;
    }
    if (!productForm.category) {
      alert('Category is required.');
      return false;
    }
    if (!productForm.subCategory.trim()) {
      alert('Subcategory is required.');
      return false;
    }
    if (!productForm.shippingCost || isNaN(Number(productForm.shippingCost))) {
      alert('Please enter a valid number for Shipping Cost.');
      return false;
    }
    if (!productForm.countInStock || isNaN(Number(productForm.countInStock))) {
      alert('Please enter a valid number for Stock Count.');
      return false;
    }
    for (let filterIndex = 0; filterIndex < productForm.filters.length; filterIndex++) {
      const filter = productForm.filters[filterIndex];
      if (!filter.name.trim()) {
        alert(`Filter name is required for Filter ${filterIndex + 1}.`);
        return false;
      }
      for (let adjIndex = 0; adjIndex < filter.priceAdjustments.length; adjIndex++) {
        const adjustment = filter.priceAdjustments[adjIndex];
        if (!adjustment.value.trim()) {
          alert(`Filter value is required for ${filter.name || 'Filter ' + (filterIndex + 1)}.`);
          return false;
        }
        if (!adjustment.price || isNaN(Number(adjustment.price))) {
          alert(`Please enter a valid number for Price in ${filter.name || 'Filter ' + (filterIndex + 1)}.`);
          return false;
        }
        if (adjustment.discountPrice && isNaN(Number(adjustment.discountPrice))) {
          alert(`Please enter a valid number for Discount Price in ${filter.name || 'Filter ' + (filterIndex + 1)}.`);
          return false;
        }
      }
    }
    return true;
  };

  const saveProduct = async () => {
    if (!validateForm()) return;
    if (isSaving) return; // Prevent double-clicking

    setIsSaving(true); // Set loading state
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('name', productForm.name);
      formData.append('description', productForm.description);
      formData.append('brand', productForm.brand);
      formData.append('category', productForm.category);
      formData.append('subCategory', productForm.subCategory);
      formData.append('shippingCost', productForm.shippingCost);
      formData.append('countInStock', productForm.countInStock);
      formData.append('features', JSON.stringify(productForm.features));
      formData.append('filters', JSON.stringify(productForm.filters));

      // Append new images
      productForm.images.forEach((image, index) => {
        if (image instanceof File) {
          formData.append('images', image);
        }
      });

      // Append existing images
      const validExistingImages = productForm.existingImages.filter(url => url && typeof url === 'string');
      if (validExistingImages.length > 0) {
        formData.append('existingImages', JSON.stringify(validExistingImages));
      }

      if (editingProduct) {
        // Optimistic update for editing
        setProducts((prev) =>
          prev.map((p) => (p._id === editingProduct._id ? { ...p, ...productForm, _id: editingProduct._id } : p))
        );
        const response = await axios.put(
          `https://abinexis-backend.onrender.com/api/products/${editingProduct._id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        setProducts((prev) =>
          prev.map((p) => (p._id === editingProduct._id ? response.data : p))
        );
      } else {
        // Optimistic update for adding
        const tempProduct = {
          _id: `temp-${Date.now()}`,
          ...productForm,
          images: productForm.images.map(image => (image instanceof File ? URL.createObjectURL(image) : image)),
        };
        setProducts((prev) => [...prev, tempProduct]);
        const response = await axios.post('https://abinexis-backend.onrender.com/api/products', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        setProducts((prev) => prev.filter((p) => !p._id.startsWith('temp-')));
        setProducts((prev) => [...prev, response.data]);
      }

      await fetchProducts(); // Refetch to sync with server
      setShowProductModal(false);
    } catch (err) {
      // Revert optimistic update on error
      if (editingProduct) {
        await fetchProducts(); // Refetch to restore previous state
      } else {
        setProducts((prev) => prev.filter((p) => !p._id.startsWith('temp-')));
      }
      alert(err.response?.data?.message || 'Error saving product');
    } finally {
      setIsSaving(false); // Reset loading state
    }
  };

  const deleteProduct = async (productId) => {
    if (!isAdmin) {
      alert('Only admins can delete products.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      // Optimistic update
      setProducts((prev) => prev.filter((p) => p._id !== productId));
      await axios.delete(`https://abinexis-backend.onrender.com/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchProducts(); // Refetch to sync with server
    } catch (err) {
      await fetchProducts(); // Refetch to restore previous state
      alert(err.response?.data?.message || 'Error deleting product');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 p-6 text-white">
        <h1 className="text-3xl font-bold mb-6">Product Management</h1>
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-10">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Product Management</h1>
          <button
            onClick={() => openProductModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add Product</span>
          </button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product._id} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:border-white/20 transition-all">
              <img
                src={product.images[0] || 'https://via.placeholder.com/300'}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-white font-semibold mb-2">{product.name}</h3>
                <p className="text-gray-400 text-sm mb-2">{product.category} • {product.brand}</p>
                <p className="text-gray-300 text-sm mb-3 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-green-400 font-semibold">Stock: {product.countInStock}</span>
                  {/* <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-gray-400 text-sm">{product.rating || 0} ({product.numReviews || 0})</span>
                  </div> */}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openProductModal(product)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => deleteProduct(product._id)}
                    className="bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Product Modal */}
        {showProductModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h2>
                  <button
                    onClick={() => setShowProductModal(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Product Name</label>
                      <input
                        type="text"
                        value={productForm.name}
                        onChange={(e) => handleProductInputChange('name', e.target.value)}
                        className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Description</label>
                      <textarea
                        value={productForm.description}
                        onChange={(e) => handleProductInputChange('description', e.target.value)}
                        rows={4}
                        className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Brand</label>
                      <input
                        type="text"
                        value={productForm.brand}
                        onChange={(e) => handleProductInputChange('brand', e.target.value)}
                        className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Category</label>
                      <select
                        value={productForm.category}
                        onChange={(e) => handleProductInputChange('category', e.target.value)}
                        className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Sub Category</label>
                      <input
                        type="text"
                        value={productForm.subCategory}
                        onChange={(e) => handleProductInputChange('subCategory', e.target.value)}
                        className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">Stock Count</label>
                        <input
                          type="number"
                          value={productForm.countInStock}
                          onChange={(e) => handleProductInputChange('countInStock', e.target.value)}
                          placeholder="Stock Count"
                          className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">Shipping Cost</label>
                        <input
                          type="number"
                          value={productForm.shippingCost}
                          onChange={(e) => handleProductInputChange('shippingCost', e.target.value)}
                          placeholder="Shipping Cost"
                          className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Product Features</label>
                      {productForm.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2 mb-2">
                          <input
                            type="text"
                            value={feature}
                            onChange={(e) => handleFeatureChange(index, e.target.value)}
                            placeholder="Enter feature"
                            className="flex-1 p-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            onClick={() => removeFeature(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={addFeature}
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                      >
                        + Add Feature
                      </button>
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Product Images</label>
                      {productForm.images.map((image, index) => (
                        <div key={index} className="mb-3 p-3 bg-gray-900 border border-gray-600 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">Image {index + 1}</span>
                            <button
                              onClick={() => removeImageSlot(index)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="space-y-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(index, e)}
                              className="hidden"
                              id={`image-upload-${index}`}
                            />
                            <label
                              htmlFor={`image-upload-${index}`}
                              className="flex items-center justify-center w-full p-3 bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
                            >
                              <div className="text-center">
                                <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                                <span className="text-gray-400 text-sm">Click to upload or replace image</span>
                              </div>
                            </label>
                            {(image || productForm.existingImages[index]) && (
                              <div className="mt-2">
                                <img
                                  src={image instanceof File ? URL.createObjectURL(image) : productForm.existingImages[index]}
                                  alt={`Product ${index + 1}`}
                                  className="w-full h-32 object-cover rounded-lg border border-gray-600"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={addImageSlot}
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center space-x-1"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Another Image</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Filters Section */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Product Filters & Pricing</h3>
                  {productForm.filters.map((filter, filterIndex) => (
                    <div key={filterIndex} className="bg-gray-900 p-4 rounded-lg mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-gray-300 text-sm font-medium mb-2">Filter Name (e.g., Size, Color)</label>
                          <input
                            type="text"
                            value={filter.name}
                            onChange={(e) => handleFilterChange(filterIndex, 'name', e.target.value)}
                            className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-gray-300 text-sm font-medium">Filter Values & Pricing</label>
                        {filter.priceAdjustments.map((adjustment, adjIndex) => (
                          <div key={adjIndex} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                            <input
                              type="text"
                              value={adjustment.value}
                              onChange={(e) => handleFilterValueChange(filterIndex, adjIndex, e.target.value)}
                              placeholder="Value (e.g., S, Red)"
                              className="p-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            />
                            <input
                              type="number"
                              value={adjustment.price}
                              onChange={(e) => handlePriceAdjustmentChange(filterIndex, adjIndex, 'price', e.target.value)}
                              placeholder="Price"
                              className="p-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            />
                            <input
                              type="number"
                              value={adjustment.discountPrice}
                              onChange={(e) => handlePriceAdjustmentChange(filterIndex, adjIndex, 'discountPrice', e.target.value)}
                              placeholder="Discount Price"
                              className="p-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                              onClick={() => removeFilterValue(filterIndex, adjIndex)}
                              className="text-red-400 hover:text-red-300 flex items-center justify-center"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addFilterValue(filterIndex)}
                          className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                        >
                          + Add Value
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={addFilter}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    + Add Filter
                  </button>
                </div>

                {/* Save Button */}
                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    onClick={() => setShowProductModal(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveProduct}
                    className={`bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                      isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                    }`}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        <span>{editingProduct ? 'Update Product' : 'Save Product'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductManagement;