import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { EmptyState, Modal, PageHeader, PageSpinner, Table } from '../../components/common';
import { FiClock, FiPackage } from '../../components/common/icons';
import toast from 'react-hot-toast';

const initialItemForm = {
  name: '',
  category: 'general',
  openingStock: '',
  currentStock: '',
  unit: '',
  minStockAlert: '5',
  purchasePrice: '',
};

const initialTxnForm = {
  type: 'purchase',
  quantity: '',
  unitPrice: '',
  remarks: '',
};

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('items');
  const [showAdd, setShowAdd] = useState(false);
  const [showTxn, setShowTxn] = useState(null);
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

  const addItem = async e => {
    e.preventDefault();
    try {
      await api.post('/inventory', {
        ...form,
        openingStock: Number(form.openingStock || form.currentStock || 0),
        currentStock: Number(form.currentStock || form.openingStock || 0),
        minStockAlert: Number(form.minStockAlert || 0),
        purchasePrice: Number(form.purchasePrice || 0),
      });
      toast.success('Inventory item added');
      setShowAdd(false);
      setForm(initialItemForm);
      fetchInventory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add item');
    }
  };

  const addTxn = async e => {
    e.preventDefault();
    if (!showTxn?._id) return;
    try {
      await api.post('/inventory/transactions', {
        inventoryId: showTxn._id,
        type: txnForm.type,
        quantity: Number(txnForm.quantity || 0),
        unitPrice: txnForm.unitPrice === '' ? undefined : Number(txnForm.unitPrice),
        remarks: txnForm.remarks,
      });
      toast.success('Transaction recorded');
      setShowTxn(null);
      setTxnForm(initialTxnForm);
      fetchInventory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record transaction');
    }
  };

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Track stock, low-stock alerts, and item transactions"
        action={
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            + Add Item
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <p className="text-2xl font-bold text-gray-900">{items.length}</p>
          <p className="text-sm text-gray-500">Inventory items</p>
        </div>
        <div className="card">
          <p className="text-2xl font-bold text-red-600">{lowStockItems.length}</p>
          <p className="text-sm text-gray-500">Low stock alerts</p>
        </div>
        <div className="card">
          <p className="text-2xl font-bold text-green-700">Rs. {totalStockValue.toLocaleString('en-IN')}</p>
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
            <Table headers={['Name', 'Code', 'Category', 'Stock', 'Min Alert', 'Unit', 'Value', 'Actions']}>
              {items.map(item => {
                const isLow = Number(item.currentStock || 0) <= Number(item.minStockAlert || 0);
                return (
                  <tr key={item._id} className={isLow ? 'bg-red-50/60 hover:bg-red-50' : 'hover:bg-gray-50'}>
                    <td className="table-cell">
                      <p className="font-semibold text-gray-900">{item.name}</p>
                    </td>
                    <td className="table-cell font-mono text-xs text-gray-500">{item.code || '-'}</td>
                    <td className="table-cell capitalize text-gray-700">{item.category || '-'}</td>
                    <td className="table-cell font-medium text-gray-900">{item.currentStock || 0}</td>
                    <td className="table-cell">
                      <span className={isLow ? 'font-semibold text-red-600' : 'text-gray-600'}>{item.minStockAlert || 0}</span>
                    </td>
                    <td className="table-cell text-gray-600">{item.unit || '-'}</td>
                    <td className="table-cell font-medium text-green-700">
                      Rs. {((Number(item.currentStock) || 0) * (Number(item.purchasePrice) || 0)).toLocaleString('en-IN')}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center justify-end gap-3 whitespace-nowrap text-sm">
                        <button
                          type="button"
                          onClick={() => setShowTxn(item)}
                          className="text-primary-600 hover:underline"
                        >
                          Record Txn
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </Table>
            {items.length === 0 && <EmptyState message="No inventory items" icon={<FiPackage />} />}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table headers={['Item', 'Type', 'Quantity', 'Unit Price', 'Date', 'Remarks']}>
              {transactions.map(txn => (
                <tr key={txn._id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <p className="font-medium text-gray-900">{txn.inventory?.name || '-'}</p>
                    <p className="text-xs text-gray-400">{txn.inventory?.code || '-'}</p>
                  </td>
                  <td className="table-cell capitalize"><span className="badge-blue">{txn.type}</span></td>
                  <td className="table-cell">{txn.quantity}</td>
                  <td className="table-cell">{txn.unitPrice ? `Rs. ${Number(txn.unitPrice).toLocaleString('en-IN')}` : '-'}</td>
                  <td className="table-cell text-gray-500">{new Date(txn.date).toLocaleString('en-IN')}</td>
                  <td className="table-cell text-gray-500">{txn.remarks || '-'}</td>
                </tr>
              ))}
            </Table>
            {transactions.length === 0 && <EmptyState message="No transactions found" icon={<FiClock />} />}
          </div>
        )}
      </div>

      {stats.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(group => (
            <div key={group._id || 'uncategorized'} className="card">
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">{group._id || 'Uncategorized'}</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{group.count || 0}</p>
              <p className="text-sm text-gray-500">items</p>
              <p className="mt-2 text-sm font-medium text-green-700">Rs. {(group.totalValue || 0).toLocaleString('en-IN')}</p>
            </div>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => { setShowAdd(false); setForm(initialItemForm); }} title="Add Inventory Item">
        <form onSubmit={addItem} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Name *</label><input className="input" value={form.name} onChange={e => setForm(current => ({ ...current, name: e.target.value }))} required /></div>
            <div><label className="label">Category</label>
              <select className="input" value={form.category} onChange={e => setForm(current => ({ ...current, category: e.target.value }))}>
                {['academic', 'hostel', 'general', 'lab', 'sports'].map(category => <option key={category} value={category}>{category}</option>)}
              </select>
            </div>
            <div><label className="label">Opening Stock</label><input type="number" className="input" value={form.openingStock} onChange={e => setForm(current => ({ ...current, openingStock: e.target.value, currentStock: e.target.value }))} /></div>
            <div><label className="label">Unit</label><input className="input" value={form.unit} onChange={e => setForm(current => ({ ...current, unit: e.target.value }))} /></div>
            <div><label className="label">Min Alert</label><input type="number" className="input" value={form.minStockAlert} onChange={e => setForm(current => ({ ...current, minStockAlert: e.target.value }))} /></div>
            <div><label className="label">Purchase Price</label><input type="number" className="input" value={form.purchasePrice} onChange={e => setForm(current => ({ ...current, purchasePrice: e.target.value }))} /></div>
          </div>
          <div className="flex justify-end gap-3"><button type="button" onClick={() => { setShowAdd(false); setForm(initialItemForm); }} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Add Item</button></div>
        </form>
      </Modal>

      <Modal open={!!showTxn} onClose={() => { setShowTxn(null); setTxnForm(initialTxnForm); }} title={`Transaction - ${showTxn?.name || ''}`}>
        <form onSubmit={addTxn} className="space-y-3">
          <div><label className="label">Type</label>
            <select className="input" value={txnForm.type} onChange={e => setTxnForm(current => ({ ...current, type: e.target.value }))}>
              {['purchase', 'usage', 'adjustment'].map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div><label className="label">Quantity *</label><input type="number" className="input" value={txnForm.quantity} onChange={e => setTxnForm(current => ({ ...current, quantity: e.target.value }))} required /></div>
          {txnForm.type === 'purchase' && <div><label className="label">Unit Price</label><input type="number" className="input" value={txnForm.unitPrice} onChange={e => setTxnForm(current => ({ ...current, unitPrice: e.target.value }))} /></div>}
          <div><label className="label">Remarks</label><input className="input" value={txnForm.remarks} onChange={e => setTxnForm(current => ({ ...current, remarks: e.target.value }))} /></div>
          <div className="flex justify-end gap-3"><button type="button" onClick={() => { setShowTxn(null); setTxnForm(initialTxnForm); }} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Record</button></div>
        </form>
      </Modal>
    </div>
  );
}
