import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { PageHeader } from '../../components/common';
import toast from 'react-hot-toast';
import {
  FiSearch, FiPlus, FiMinus, FiShoppingCart,
  FiPackage, FiTrendingUp, FiShoppingBag, FiClipboard, FiBarChart2, FiCheckCircle, FiCreditCard, FiX,
} from '../../components/common/icons';

export default function ShopOperator() {
  const [tab, setTab] = useState('billing');

  // ── Billing state ─────────────────────────────────────────────────────────
  const [identifier, setIdentifier]   = useState('');
  const [studentData, setStudentData] = useState(null);
  const [searching, setSearching]     = useState(false);
  const [menuItems, setMenuItems]     = useState([]);
  const [cart, setCart]               = useState([]);
  const [paymentMode, setPaymentMode] = useState('wallet');
  const [processing, setProcessing]   = useState(false);
  const [lastBill, setLastBill]       = useState(null);

  // ── Items state ───────────────────────────────────────────────────────────
  const [items, setItems]           = useState([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [itemForm, setItemForm]     = useState({
    name: '', price: '', unit: 'piece',
    stock: '', minStockAlert: 5,
  });

  // ── Sales state ───────────────────────────────────────────────────────────
  const [sales, setSales]           = useState([]);
  const [todaySummary, setTodaySummary] = useState(null);
  const [saleDate, setSaleDate]     = useState(
    new Date().toISOString().slice(0, 10)
  );

  const fetchItems = useCallback(async () => {
    try {
      const r = await api.get('/shop/items?type=shop');
      setItems(r.data.items);
      setMenuItems(r.data.items.filter(i => i.isAvailable && i.stock > 0));
    } catch { /* ignore */ }
  }, []);

  const fetchSales = useCallback(async () => {
    try {
      const r = await api.get(`/shop/sales?type=shop&date=${saleDate}`);
      setSales(r.data.sales);
      setTodaySummary(r.data.todaySummary);
    } catch { /* ignore */ }
  }, [saleDate]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => { if (tab === 'sales') fetchSales(); }, [tab, fetchSales]);

  const handleSearch = async e => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setSearching(true);
    setStudentData(null);
    setCart([]);
    try {
      const r = await api.get(`/shop/find/${identifier.trim()}`);
      setStudentData(r.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Student not found');
    } finally {
      setSearching(false);
    }
  };

  const addToCart = item => {
    setCart(prev => {
      const existing = prev.find(c => c.itemId === item._id);
      if (existing) {
        if (existing.qty >= item.stock) {
          toast.error(`Only ${item.stock} available`);
          return prev;
        }
        return prev.map(c =>
          c.itemId === item._id
            ? { ...c, qty: c.qty + 1, total: (c.qty + 1) * c.unitPrice }
            : c
        );
      }
      return [...prev, {
        itemId: item._id, name: item.name, qty: 1,
        unitPrice: item.price, total: item.price, maxStock: item.stock,
      }];
    });
  };

  const removeFromCart = itemId => {
    setCart(prev => {
      const existing = prev.find(c => c.itemId === itemId);
      if (!existing) return prev;
      if (existing.qty === 1) return prev.filter(c => c.itemId !== itemId);
      return prev.map(c =>
        c.itemId === itemId
          ? { ...c, qty: c.qty - 1, total: (c.qty - 1) * c.unitPrice }
          : c
      );
    });
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.total, 0);

  const handleBill = async () => {
    if (!cart.length) { toast.error('Add items to cart'); return; }
    if (!studentData) { toast.error('Find student first'); return; }
    if (paymentMode === 'wallet' && cartTotal > studentData.wallet.balance) {
      toast.error(`Insufficient wallet balance. Available: ₹${studentData.wallet.balance}`);
      return;
    }
    setProcessing(true);
    try {
      const r = await api.post('/shop/sell', {
        studentId:   studentData.student._id,
        items:       cart.map(c => ({ itemId: c.itemId, qty: c.qty })),
        paymentMode,
        type:        'shop',
      });
      setLastBill(r.data.sale);
      toast.success(`Bill ${r.data.sale.billNo} created!`);
      if (paymentMode === 'wallet') {
        setStudentData(prev => ({
          ...prev,
          wallet: { ...prev.wallet, balance: r.data.walletBalance },
        }));
      }
      setCart([]);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Billing failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setStudentData(null);
    setIdentifier('');
    setCart([]);
    setLastBill(null);
  };

  const handleAddItem = async e => {
    e.preventDefault();
    try {
      await api.post('/shop/items', { ...itemForm, type: 'shop' });
      toast.success('Item added');
      setShowAddItem(false);
      setItemForm({ name: '', price: '', unit: 'piece', stock: '', minStockAlert: 5 });
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleStockUpdate = async (id, qty, action) => {
    try {
      await api.post(`/shop/items/${id}/stock`, { quantity: qty, action });
      toast.success('Stock updated');
      fetchItems();
    } catch { toast.error('Failed'); }
  };

  const handleToggleAvailable = async (id, current) => {
    try {
      await api.put(`/shop/items/${id}`, { isAvailable: !current });
      fetchItems();
    } catch { /* ignore */ }
  };

  return (
    <div>
      <PageHeader title={<span className="inline-flex items-center gap-2"><FiShoppingBag /> Shop</span>} subtitle="Bill students for stationery purchases" />

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'billing', label: <span className="inline-flex items-center gap-2"><FiClipboard /> Billing</span>  },
          { key: 'items',   label: <span className="inline-flex items-center gap-2"><FiPackage /> Items</span>     },
          { key: 'sales',   label: <span className="inline-flex items-center gap-2"><FiBarChart2 /> Sales</span>     },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium
              transition-colors ${
              tab === t.key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── BILLING TAB ── */}
      {tab === 'billing' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">

            {/* Search */}
            <div className="card">
              <h3 className="section-title mb-3">Find Student</h3>
              <form onSubmit={handleSearch} className="flex gap-2">
                <input className="input flex-1"
                  placeholder="Phone or Admission No (ADM2026001)"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)} />
                <button type="submit" disabled={searching}
                  className="btn-primary px-4 flex items-center gap-2">
                  <FiSearch />
                  {searching ? 'Searching...' : 'Find'}
                </button>
              </form>

              {studentData && (
                <div className="flex items-center justify-between mt-3
                  p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-200
                      text-blue-800 font-bold flex items-center
                      justify-center overflow-hidden">
                      {studentData.student.photo
                        ? <img src={studentData.student.photo} alt=""
                            className="w-10 h-10 object-cover" />
                        : studentData.student.firstName?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">
                        {studentData.student.firstName}{' '}
                        {studentData.student.lastName}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">
                        {studentData.student.admissionNo}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Wallet</p>
                      <p className="font-bold text-green-600">
                        ₹{studentData.wallet.balance.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <button onClick={handleReset}
                      className="text-gray-400 hover:text-gray-600"><FiX /></button>
                  </div>
                </div>
              )}
            </div>

            {/* Items grid */}
            {studentData && (
              <div className="card">
                <h3 className="section-title mb-3">Items</h3>
                {menuItems.length === 0 ? (
                  <p className="text-center py-6 text-gray-400 text-sm">
                    No items available. Add items in Items tab.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {menuItems.map(item => {
                      const inCart = cart.find(c => c.itemId === item._id);
                      return (
                        <button key={item._id} onClick={() => addToCart(item)}
                          className={`p-3 rounded-xl border text-left
                            transition-all relative ${
                            inCart
                              ? 'bg-blue-50 border-blue-300'
                              : 'bg-white border-gray-200 hover:border-blue-300'
                          }`}>
                          <p className="text-sm font-semibold text-gray-800">
                            {item.name}
                          </p>
                          <p className="text-blue-600 font-bold mt-0.5">
                            ₹{item.price}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Stock: {item.stock}
                          </p>
                          {inCart && (
                            <span className="absolute top-2 right-2 w-5 h-5
                              bg-blue-600 text-white text-xs rounded-full
                              flex items-center justify-center font-bold">
                              {inCart.qty}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="space-y-4">
            {lastBill && (
              <div className="card border-2 border-green-200 bg-green-50">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-green-700">
                    <span className="inline-flex items-center gap-1"><FiCheckCircle /><span>Bill Created</span></span>
                  </p>
                  <button onClick={() => setLastBill(null)}
                    className="text-green-400 text-xs"><FiX /></button>
                </div>
                <p className="font-mono text-green-800 font-bold">
                  {lastBill.billNo}
                </p>
                <p className="text-green-700 font-bold text-lg">
                  ₹{lastBill.totalAmount}
                </p>
              </div>
            )}

            <div className="card">
              <h3 className="section-title mb-3 flex items-center gap-2">
                <FiShoppingCart /> Cart
                {cart.length > 0 && (
                  <span className="ml-auto text-xs text-gray-400
                    cursor-pointer hover:text-red-500"
                    onClick={() => setCart([])}>Clear</span>
                )}
              </h3>

              {cart.length === 0 ? (
                <p className="text-center py-6 text-gray-400 text-sm">
                  Click items to add
                </p>
              ) : (
                <div className="space-y-2 mb-4">
                  {cart.map(c => (
                    <div key={c.itemId}
                      className="flex items-center justify-between
                        py-2 border-b border-gray-50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        <p className="text-xs text-gray-400">
                          ₹{c.unitPrice} × {c.qty}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => removeFromCart(c.itemId)}
                          className="w-6 h-6 rounded-full bg-gray-100
                            hover:bg-red-100 flex items-center justify-center
                            text-xs">
                          <FiMinus />
                        </button>
                        <span className="text-sm font-bold w-4 text-center">
                          {c.qty}
                        </span>
                        <button
                          onClick={() => addToCart(
                            menuItems.find(m => m._id === c.itemId) || c
                          )}
                          className="w-6 h-6 rounded-full bg-gray-100
                            hover:bg-green-100 flex items-center justify-center
                            text-xs">
                          <FiPlus />
                        </button>
                        <span className="text-sm font-semibold w-12 text-right">
                          ₹{c.total}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t
                    border-gray-200 font-bold text-gray-800">
                    <span>Total</span>
                    <span className="text-blue-600 text-lg">₹{cartTotal}</span>
                  </div>
                </div>
              )}

              {cart.length > 0 && studentData && (
                <>
                  <div className="flex gap-2 mb-3">
                    {['wallet', 'cash'].map(mode => (
                      <button key={mode} onClick={() => setPaymentMode(mode)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium
                          border transition-colors ${
                          paymentMode === mode
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-600 border-gray-200'
                        }`}>
                        <span className="inline-flex items-center gap-2">{mode === 'wallet' ? <FiCreditCard /> : <span className="font-bold">Rs</span>}<span>{mode === 'wallet' ? 'Wallet' : 'Cash'}</span></span>
                      </button>
                    ))}
                  </div>
                  <button onClick={handleBill}
                    disabled={
                      processing ||
                      (paymentMode === 'wallet' &&
                        cartTotal > studentData.wallet.balance)
                    }
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700
                      text-white font-bold rounded-lg disabled:opacity-50">
                    {processing
                      ? 'Processing...'
                      : `Charge ₹${cartTotal} via ${
                          paymentMode === 'wallet' ? 'Wallet' : 'Cash'
                        }`
                    }
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── ITEMS TAB ── */}
      {tab === 'items' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Shop Items</h3>
            <button onClick={() => setShowAddItem(true)}
              className="btn-primary flex items-center gap-2 text-sm">
              <FiPlus /> Add Item
            </button>
          </div>

          {showAddItem && (
            <form onSubmit={handleAddItem}
              className="bg-blue-50 border border-blue-200 rounded-xl
                p-4 mb-4">
              <p className="font-semibold text-blue-800 mb-3">Add New Item</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="label">Name *</label>
                  <input className="input" required placeholder="e.g. Notebook"
                    value={itemForm.name}
                    onChange={e => setItemForm(f => ({
                      ...f, name: e.target.value,
                    }))} />
                </div>
                <div>
                  <label className="label">Price (₹) *</label>
                  <input type="number" className="input" required min="1"
                    placeholder="40"
                    value={itemForm.price}
                    onChange={e => setItemForm(f => ({
                      ...f, price: e.target.value,
                    }))} />
                </div>
                <div>
                  <label className="label">Unit</label>
                  <input className="input" placeholder="piece / pack"
                    value={itemForm.unit}
                    onChange={e => setItemForm(f => ({
                      ...f, unit: e.target.value,
                    }))} />
                </div>
                <div>
                  <label className="label">Opening Stock</label>
                  <input type="number" className="input" min="0"
                    placeholder="50"
                    value={itemForm.stock}
                    onChange={e => setItemForm(f => ({
                      ...f, stock: e.target.value,
                    }))} />
                </div>
                <div>
                  <label className="label">Min Alert</label>
                  <input type="number" className="input" min="0"
                    placeholder="5"
                    value={itemForm.minStockAlert}
                    onChange={e => setItemForm(f => ({
                      ...f, minStockAlert: e.target.value,
                    }))} />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary text-sm">
                  Add Item
                </button>
                <button type="button" onClick={() => setShowAddItem(false)}
                  className="btn-secondary text-sm">
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Item</th>
                  <th className="table-header">Price</th>
                  <th className="table-header">Stock</th>
                  <th className="table-header">Available</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map(item => (
                  <tr key={item._id} className={`hover:bg-gray-50 ${
                    item.stock <= item.minStockAlert ? 'bg-red-50' : ''
                  }`}>
                    <td className="table-cell font-medium">
                      {item.name}
                      {item.stock <= item.minStockAlert && (
                        <span className="ml-2 text-xs text-red-500">
                          Low stock
                        </span>
                      )}
                    </td>
                    <td className="table-cell text-blue-600 font-semibold">
                      ₹{item.price}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStockUpdate(item._id, 1, 'remove')}
                          className="w-6 h-6 rounded bg-gray-100 hover:bg-red-100
                            flex items-center justify-center text-xs">
                          <FiMinus />
                        </button>
                        <span className={`font-bold w-8 text-center ${
                          item.stock <= item.minStockAlert
                            ? 'text-red-600' : 'text-gray-800'
                        }`}>
                          {item.stock}
                        </span>
                        <button
                          onClick={() => handleStockUpdate(item._id, 1, 'add')}
                          className="w-6 h-6 rounded bg-gray-100 hover:bg-green-100
                            flex items-center justify-center text-xs">
                          <FiPlus />
                        </button>
                        <span className="text-xs text-gray-400">{item.unit}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => handleToggleAvailable(
                          item._id, item.isAvailable
                        )}
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          item.isAvailable
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                        {item.isAvailable ? 'Available' : 'Hidden'}
                      </button>
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => handleStockUpdate(
                          item._id,
                          Number(prompt(`Add stock for ${item.name}:`) || 0),
                          'add'
                        )}
                        className="text-xs text-primary-600 hover:underline">
                        + Add Stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <FiPackage className="mx-auto text-3xl mb-2" />
                <p>No items yet. Add your first item.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SALES TAB ── */}
      {tab === 'sales' && (
        <div className="space-y-4">
          {todaySummary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Today Revenue', value: `₹${todaySummary.totalRevenue?.toLocaleString('en-IN') || 0}`, color: 'bg-blue-50 text-blue-700' },
                { label: 'Wallet Sales',  value: `₹${todaySummary.walletRevenue?.toLocaleString('en-IN') || 0}`, color: 'bg-indigo-50 text-indigo-700' },
                { label: 'Cash Sales',    value: `₹${todaySummary.cashRevenue?.toLocaleString('en-IN') || 0}`,   color: 'bg-green-50 text-green-700' },
                { label: 'Bills Today',   value: todaySummary.count || 0, color: 'bg-purple-50 text-purple-700' },
              ].map(stat => (
                <div key={stat.label} className={`rounded-xl p-4 ${stat.color}`}>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs font-medium opacity-75 mt-0.5">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <label className="label mb-0">Date</label>
              <input type="date" className="input w-44"
                value={saleDate}
                onChange={e => setSaleDate(e.target.value)} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-header">Bill No</th>
                    <th className="table-header">Student</th>
                    <th className="table-header">Items</th>
                    <th className="table-header">Amount</th>
                    <th className="table-header">Payment</th>
                    <th className="table-header">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sales.map(sale => (
                    <tr key={sale._id} className="hover:bg-gray-50">
                      <td className="table-cell font-mono text-xs">
                        {sale.billNo}
                      </td>
                      <td className="table-cell">
                        <p className="font-medium">
                          {sale.student?.firstName} {sale.student?.lastName}
                        </p>
                        <p className="text-xs text-gray-400 font-mono">
                          {sale.student?.admissionNo}
                        </p>
                      </td>
                      <td className="table-cell text-xs text-gray-500">
                        {sale.items?.map(i => `${i.name} x${i.qty}`).join(', ')}
                      </td>
                      <td className="table-cell font-bold text-blue-600">
                        ₹{sale.totalAmount}
                      </td>
                      <td className="table-cell">
                        <span className={`text-xs font-medium px-2 py-0.5
                          rounded-full ${
                          sale.paymentMode === 'wallet'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          <span className="inline-flex items-center gap-1">{sale.paymentMode === 'wallet' ? <FiCreditCard /> : <span className="font-bold">Rs</span>}<span>{sale.paymentMode}</span></span>
                        </span>
                      </td>
                      <td className="table-cell text-xs text-gray-500">
                        {new Date(sale.date).toLocaleTimeString('en-IN', {
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sales.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <FiTrendingUp className="mx-auto text-3xl mb-2" />
                  <p>No sales for this date</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
