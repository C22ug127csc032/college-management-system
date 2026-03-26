import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { EmptyState, Modal, PageHeader, PageSpinner, Table } from '../../components/common';
import { FiClock, FiPackage } from '../../components/common/icons';
import toast from 'react-hot-toast';

const CATEGORY_OPTIONS = [
  { value: 'academic', label: 'Academic' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'general_stocks', label: 'General Stocks' },
];

const initialItemForm = {
  name: '',
  quantity: '',
  code: '',
  category: 'academic',
  unit: 'pcs',
  openingStock: '',
  currentStock: '',
  minStockAlert: '5',
};

const initialTxnForm = {
  inventoryId: '',
  quantity: '',
  unitPrice: '',
  vendorName: '',
  vendorPhone: '',
  invoiceNo: '',
  reference: '',
  remarks: '',
};

const formatCurrency = value => `Rs. ${Number(value || 0).toLocaleString('en-IN')}`;

const formatCategoryLabel = value => CATEGORY_OPTIONS.find(option => option.value === value)?.label || value || '-';

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('items');
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [form, setForm] = useState(initialItemForm);
  const [txnForm, setTxnForm] = useState(initialTxnForm);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsResponse, statsResponse, transactionsResponse] = await Promise.all([
        api.get('/inventory'),
        api.get('/inventory/stats'),
        api.get('/inventory/transactions'),
      ]);
      setItems(itemsResponse.data.items || []);
      setStats(statsResponse.data.stats || []);
      setLowStockItems(statsResponse.data.lowStockItems || []);
      setTransactions(transactionsResponse.data.transactions || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const totalStockValue = useMemo(
    () => items.reduce((sum, item) => sum + ((Number(item.currentStock) || 0) * (Number(item.purchasePrice) || 0)), 0),
    [items]
  );

  const openCreateModal = () => {
    setEditingItem(null);
    setForm(initialItemForm);
    setShowItemModal(true);
  };

  const openEditModal = item => {
    setEditingItem(item);
    setForm({
      name: item.name || '',
      quantity: item.currentStock ?? '',
      code: item.code || '',
      category: item.category || 'academic',
      unit: item.unit || 'pcs',
      openingStock: item.openingStock ?? '',
      currentStock: item.currentStock ?? '',
      minStockAlert: item.minStockAlert ?? '5',
    });
    setShowItemModal(true);
  };

  const closeItemModal = () => {
    setShowItemModal(false);
    setEditingItem(null);
    setForm(initialItemForm);
  };

  const openTransactionModal = () => {
    setTxnForm(current => ({
      ...initialTxnForm,
      inventoryId: current.inventoryId && items.some(item => item._id === current.inventoryId)
        ? current.inventoryId
        : (items[0]?._id || ''),
    }));
    setShowTxnModal(true);
  };

  const closeTxnModal = () => {
    setShowTxnModal(false);
    setTxnForm(initialTxnForm);
  };

  const saveItem = async e => {
    e.preventDefault();
    const quantity = Number(form.quantity || 0);
    const openingStock = Number(form.openingStock || quantity || 0);
    const currentStock = Number(form.currentStock || quantity || openingStock || 0);

    const payload = {
      name: form.name,
      code: form.code,
      category: form.category,
      unit: form.unit,
      openingStock,
      currentStock,
      minStockAlert: Number(form.minStockAlert || 0),
    };

    try {
      if (editingItem?._id) {
        await api.put(`/inventory/${editingItem._id}`, payload);
        toast.success('Inventory item updated');
      } else {
        await api.post('/inventory', payload);
        toast.success('Inventory item added');
      }
      closeItemModal();
      fetchInventory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save inventory item');
    }
  };

  const deleteItem = async item => {
    const confirmed = window.confirm(`Delete ${item.name}?`);
    if (!confirmed) return;

    try {
      await api.delete(`/inventory/${item._id}`);
      toast.success('Inventory item deleted');
      fetchInventory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete inventory item');
    }
  };

  const addTransaction = async e => {
    e.preventDefault();

    try {
      await api.post('/inventory/transactions', {
        inventoryId: txnForm.inventoryId,
        quantity: Number(txnForm.quantity || 0),
        unitPrice: Number(txnForm.unitPrice || 0),
        vendorName: txnForm.vendorName,
        vendorPhone: txnForm.vendorPhone,
        invoiceNo: txnForm.invoiceNo,
        reference: txnForm.reference,
        remarks: txnForm.remarks,
      });
      toast.success('Transaction recorded');
      closeTxnModal();
      fetchInventory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record transaction');
    }
  };

  const headerAction = tab === 'items' ? (
    <button onClick={openCreateModal} className="btn-primary">
      + Add Item
    </button>
  ) : (
    <button onClick={openTransactionModal} className="btn-primary" disabled={!items.length}>
      + Add Transaction
    </button>
  );

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Manage academic, hostel, and general stocks. Transaction entries are only for outside-vendor purchases by admin and super-admin."
        action={headerAction}
      />

      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
        <div className="card">
          <p className="text-2xl font-bold text-gray-900">{items.length}</p>
          <p className="text-sm text-gray-500">Academic, hostel, and general stock items</p>
        </div>
        <div className="card">
          <p className="text-2xl font-bold text-red-600">{lowStockItems.length}</p>
          <p className="text-sm text-gray-500">Low stock alerts</p>
        </div>
        <div className="card">
          <p className="text-2xl font-bold text-green-700">{formatCurrency(totalStockValue)}</p>
          <p className="text-sm text-gray-500">Estimated stock value</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {['items', 'transactions'].map(value => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${tab === value ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? <PageSpinner /> : tab === 'items' ? (
          <div className="overflow-x-auto">
            <Table headers={['Name', 'Code', 'Category', 'Current Stock', 'Min Alert', 'Unit', 'Buying Price', 'Selling Price', 'Actions']}>
              {items.map(item => {
                const isLow = Number(item.currentStock || 0) <= Number(item.minStockAlert || 0);
                return (
                  <tr key={item._id} className={isLow ? 'bg-red-50/60 hover:bg-red-50' : 'hover:bg-gray-50'}>
                    <td className="table-cell">
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.supplier || 'No default vendor'}</p>
                    </td>
                    <td className="table-cell font-mono text-xs text-gray-500">{item.code || '-'}</td>
                    <td className="table-cell capitalize text-gray-700">{formatCategoryLabel(item.category)}</td>
                    <td className="table-cell font-medium text-gray-900">{item.currentStock || 0}</td>
                    <td className="table-cell">
                      <span className={isLow ? 'font-semibold text-red-600' : 'text-gray-600'}>{item.minStockAlert || 0}</span>
                    </td>
                    <td className="table-cell text-gray-600">{item.unit || '-'}</td>
                    <td className="table-cell font-medium text-gray-900">{formatCurrency(item.purchasePrice)}</td>
                    <td className="table-cell font-medium text-green-700">{formatCurrency(item.sellingPrice)}</td>
                    <td className="table-cell">
                      <div className="flex items-center justify-end gap-3 whitespace-nowrap text-sm">
                        <button type="button" onClick={() => openEditModal(item)} className="text-primary-600 hover:underline">
                          Edit
                        </button>
                        <button type="button" onClick={() => deleteItem(item)} className="text-red-600 hover:underline">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </Table>
            {items.length === 0 && <EmptyState message="No inventory items yet" icon={<FiPackage />} />}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              This page records only stock purchased from outside vendors. These entries are managed by admin and super-admin users.
            </div>
            <div className="overflow-x-auto">
              <Table headers={['Item', 'Category', 'Vendor', 'Quantity', 'Buying Price', 'Total', 'Invoice / Ref', 'Date', 'Remarks']}>
              {transactions.map(txn => (
                <tr key={txn._id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <p className="font-medium text-gray-900">{txn.inventory?.name || '-'}</p>
                    <p className="text-xs text-gray-400">{txn.inventory?.code || '-'}</p>
                  </td>
                  <td className="table-cell capitalize text-gray-700">{formatCategoryLabel(txn.inventory?.category)}</td>
                  <td className="table-cell">
                    <p className="font-medium text-gray-900">{txn.vendorName || '-'}</p>
                    <p className="text-xs text-gray-500">{txn.vendorPhone || '-'}</p>
                  </td>
                  <td className="table-cell">{txn.quantity} {txn.inventory?.unit || ''}</td>
                  <td className="table-cell">{formatCurrency(txn.unitPrice)}</td>
                  <td className="table-cell font-medium text-green-700">{formatCurrency(txn.totalAmount)}</td>
                  <td className="table-cell text-gray-500">{txn.invoiceNo || txn.reference || '-'}</td>
                  <td className="table-cell text-gray-500">{new Date(txn.date).toLocaleString('en-IN')}</td>
                  <td className="table-cell text-gray-500">{txn.remarks || '-'}</td>
                </tr>
              ))}
            </Table>
              {transactions.length === 0 && <EmptyState message="No purchase transactions found" icon={<FiClock />} />}
            </div>
          </div>
        )}
      </div>

      {stats.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map(group => (
            <div key={group._id || 'uncategorized'} className="card">
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">{formatCategoryLabel(group._id || 'uncategorized')}</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{group.count || 0}</p>
              <p className="text-sm text-gray-500">items</p>
              <p className="mt-2 text-sm font-medium text-green-700">{formatCurrency(group.totalValue || 0)}</p>
            </div>
          ))}
        </div>
      )}

      <Modal open={showItemModal} onClose={closeItemModal} title={editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}>
        <form onSubmit={saveItem} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="label">Name *</label>
              <input className="input" value={form.name} onChange={e => setForm(current => ({ ...current, name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Quantity</label>
              <input type="number" min="0" className="input" value={form.quantity} onChange={e => setForm(current => ({ ...current, quantity: e.target.value }))} placeholder="Quick stock entry" />
            </div>
            <div>
              <label className="label">Code</label>
              <input className="input" value={form.code} onChange={e => setForm(current => ({ ...current, code: e.target.value }))} placeholder="Auto-generated if empty" />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={e => setForm(current => ({ ...current, category: e.target.value }))}>
                {CATEGORY_OPTIONS.map(category => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Unit</label>
              <input className="input" value={form.unit} onChange={e => setForm(current => ({ ...current, unit: e.target.value }))} />
            </div>
            <div>
              <label className="label">Opening Stock</label>
              <input type="number" min="0" className="input" value={form.openingStock} onChange={e => setForm(current => ({ ...current, openingStock: e.target.value }))} />
            </div>
            <div>
              <label className="label">Current Stock</label>
              <input type="number" min="0" className="input" value={form.currentStock} onChange={e => setForm(current => ({ ...current, currentStock: e.target.value }))} />
            </div>
            <div>
              <label className="label">Minimum Alert</label>
              <input type="number" min="0" className="input" value={form.minStockAlert} onChange={e => setForm(current => ({ ...current, minStockAlert: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={closeItemModal} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editingItem ? 'Update Item' : 'Add Item'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={showTxnModal} onClose={closeTxnModal} title="Outside Vendor Purchase Entry">
        <form onSubmit={addTransaction} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="label">Item *</label>
              <select className="input" value={txnForm.inventoryId} onChange={e => setTxnForm(current => ({ ...current, inventoryId: e.target.value }))} required>
                <option value="">Select item</option>
                {items.map(item => (
                  <option key={item._id} value={item._id}>
                    {item.name} ({item.category})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Quantity *</label>
              <input type="number" min="1" className="input" value={txnForm.quantity} onChange={e => setTxnForm(current => ({ ...current, quantity: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Buying Price *</label>
              <input type="number" min="0" className="input" value={txnForm.unitPrice} onChange={e => setTxnForm(current => ({ ...current, unitPrice: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Vendor Name *</label>
              <input className="input" value={txnForm.vendorName} onChange={e => setTxnForm(current => ({ ...current, vendorName: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Vendor Phone</label>
              <input className="input" value={txnForm.vendorPhone} onChange={e => setTxnForm(current => ({ ...current, vendorPhone: e.target.value }))} />
            </div>
            <div>
              <label className="label">Invoice No</label>
              <input className="input" value={txnForm.invoiceNo} onChange={e => setTxnForm(current => ({ ...current, invoiceNo: e.target.value }))} />
            </div>
            <div>
              <label className="label">Reference</label>
              <input className="input" value={txnForm.reference} onChange={e => setTxnForm(current => ({ ...current, reference: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Remarks</label>
              <textarea className="input min-h-[96px]" value={txnForm.remarks} onChange={e => setTxnForm(current => ({ ...current, remarks: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={closeTxnModal} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Purchase Entry</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
