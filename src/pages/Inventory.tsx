import { useEffect, useState } from 'react';
import { supabase, Database } from '../lib/supabase';
import { Plus, CreditCard as Edit2, Trash2, ArrowUpCircle, ArrowDownCircle, History } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type Inventory = Database['public']['Tables']['inventory']['Row'];
type InventoryInsert = Database['public']['Tables']['inventory']['Insert'];
type InventoryTransaction = Database['public']['Tables']['inventory_transactions']['Row'];

interface InventoryWithTransactions extends Inventory {
  inventory_transactions?: InventoryTransaction[];
}

export default function Inventory() {
  const { profile } = useAuth();
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  const [editingInventory, setEditingInventory] = useState<Inventory | null>(null);
  const [formData, setFormData] = useState<InventoryInsert>({
    wood_code: '',
    wood_type: '',
    quantity: 0,
    unit: 'm3',
    current_stock: 0,
    min_stock: 0,
  });
  const [transactionData, setTransactionData] = useState({
    transaction_type: 'import' as 'import' | 'export',
    quantity: 0,
    reference_number: '',
    notes: '',
  });

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async (inventoryId: string) => {
    try {
      const { data, error } = await supabase
        .from('inventory_transactions')
        .select('*')
        .eq('inventory_id', inventoryId)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingInventory) {
        const { error } = await supabase
          .from('inventory')
          .update(formData)
          .eq('id', editingInventory.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('inventory')
          .insert(formData);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingInventory(null);
      resetForm();
      loadInventory();
    } catch (error) {
      console.error('Error saving inventory:', error);
      alert('Có lỗi xảy ra khi lưu nguyên liệu');
    }
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedInventory) return;

    try {
      const { error } = await supabase
        .from('inventory_transactions')
        .insert({
          inventory_id: selectedInventory.id,
          transaction_type: transactionData.transaction_type,
          quantity: transactionData.quantity,
          reference_number: transactionData.reference_number || null,
          notes: transactionData.notes || null,
        });

      if (error) throw error;

      setShowTransactionModal(false);
      setTransactionData({
        transaction_type: 'import',
        quantity: 0,
        reference_number: '',
        notes: '',
      });
      loadInventory();
    } catch (error) {
      console.error('Error creating transaction:', error);
      alert('Có lỗi xảy ra khi tạo giao dịch');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa nguyên liệu này?')) return;

    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadInventory();
    } catch (error) {
      console.error('Error deleting inventory:', error);
      alert('Có lỗi xảy ra khi xóa nguyên liệu');
    }
  };

  const resetForm = () => {
    setFormData({
      wood_code: '',
      wood_type: '',
      quantity: 0,
      unit: 'm3',
      current_stock: 0,
      min_stock: 0,
    });
  };

  const openEditModal = (item: Inventory) => {
    setEditingInventory(item);
    setFormData({
      wood_code: item.wood_code,
      wood_type: item.wood_type,
      quantity: item.quantity,
      unit: item.unit,
      current_stock: item.current_stock,
      min_stock: item.min_stock,
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingInventory(null);
    resetForm();
    setShowModal(true);
  };

  const openTransactionModal = (item: Inventory, type: 'import' | 'export') => {
    setSelectedInventory(item);
    setTransactionData({
      transaction_type: type,
      quantity: 0,
      reference_number: '',
      notes: '',
    });
    setShowTransactionModal(true);
  };

  const openHistoryModal = (item: Inventory) => {
    setSelectedInventory(item);
    loadTransactions(item.id);
    setShowHistoryModal(true);
  };

  const getStockStatus = (item: Inventory) => {
    if (item.current_stock <= item.min_stock) {
      return <span className="text-red-600 font-semibold">Cần nhập thêm</span>;
    } else if (item.current_stock <= item.min_stock * 1.5) {
      return <span className="text-orange-600 font-semibold">Sắp hết</span>;
    }
    return <span className="text-green-600 font-semibold">Đủ</span>;
  };

  const isAdmin = profile?.role === 'admin';

  if (loading) {
    return <div className="flex items-center justify-center h-64">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-800">Quản lý kho nguyên liệu</h1>
          <p className="text-stone-600 mt-1">Theo dõi nhập xuất gỗ nguyên liệu</p>
        </div>
        {isAdmin && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-amber-800 hover:bg-amber-900 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            <Plus className="w-5 h-5" />
            Thêm nguyên liệu
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <p className="text-blue-600 text-sm font-semibold mb-2">Tổng loại nguyên liệu</p>
          <p className="text-3xl font-bold text-blue-900">{inventory.length}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-600 text-sm font-semibold mb-2">Nguyên liệu cần nhập</p>
          <p className="text-3xl font-bold text-red-900">
            {inventory.filter(i => i.current_stock <= i.min_stock).length}
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <p className="text-green-600 text-sm font-semibold mb-2">Nguyên liệu đủ</p>
          <p className="text-3xl font-bold text-green-900">
            {inventory.filter(i => i.current_stock > i.min_stock * 1.5).length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">Mã gỗ</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">Loại gỗ</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">Tồn kho</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">Đơn vị</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">Tồn tối thiểu</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">Tình trạng</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {inventory.map((item) => (
                <tr key={item.id} className="hover:bg-stone-50 transition">
                  <td className="px-4 py-3 text-sm font-medium text-stone-900">{item.wood_code}</td>
                  <td className="px-4 py-3 text-sm text-stone-700">{item.wood_type}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-stone-900">{item.current_stock}</td>
                  <td className="px-4 py-3 text-sm text-stone-700">{item.unit}</td>
                  <td className="px-4 py-3 text-sm text-stone-700">{item.min_stock}</td>
                  <td className="px-4 py-3 text-sm">{getStockStatus(item)}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openHistoryModal(item)}
                        className="p-2 text-stone-600 hover:bg-stone-100 rounded-lg transition"
                        title="Lịch sử"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => openTransactionModal(item, 'import')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Nhập kho"
                          >
                            <ArrowUpCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openTransactionModal(item, 'export')}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                            title="Xuất kho"
                          >
                            <ArrowDownCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
            <div className="p-6 border-b border-stone-200">
              <h2 className="text-2xl font-bold text-stone-800">
                {editingInventory ? 'Sửa nguyên liệu' : 'Thêm nguyên liệu mới'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Mã gỗ
                  </label>
                  <input
                    type="text"
                    value={formData.wood_code}
                    onChange={(e) => setFormData({ ...formData, wood_code: e.target.value })}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Loại gỗ
                  </label>
                  <input
                    type="text"
                    value={formData.wood_type}
                    onChange={(e) => setFormData({ ...formData, wood_type: e.target.value })}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Số lượng ban đầu
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => {
                      const qty = parseFloat(e.target.value);
                      setFormData({ ...formData, quantity: qty, current_stock: qty });
                    }}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Đơn vị tính
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="m3">m³</option>
                    <option value="kg">kg</option>
                    <option value="board">Tấm</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Mức tồn kho tối thiểu
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.min_stock}
                  onChange={(e) => setFormData({ ...formData, min_stock: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingInventory(null);
                    resetForm();
                  }}
                  className="px-6 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-lg transition"
                >
                  {editingInventory ? 'Cập nhật' : 'Thêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTransactionModal && selectedInventory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-stone-200">
              <h2 className="text-2xl font-bold text-stone-800">
                {transactionData.transaction_type === 'import' ? 'Nhập kho' : 'Xuất kho'} - {selectedInventory.wood_type}
              </h2>
            </div>
            <form onSubmit={handleTransaction} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Số lượng ({selectedInventory.unit})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={transactionData.quantity}
                  onChange={(e) => setTransactionData({ ...transactionData, quantity: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Số chứng từ
                </label>
                <input
                  type="text"
                  value={transactionData.reference_number}
                  onChange={(e) => setTransactionData({ ...transactionData, reference_number: e.target.value })}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="VD: PNK-001, PXK-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Ghi chú
                </label>
                <textarea
                  value={transactionData.notes}
                  onChange={(e) => setTransactionData({ ...transactionData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  rows={3}
                  placeholder="Ghi chú thêm về giao dịch..."
                />
              </div>

              <div className="bg-stone-50 p-4 rounded-lg">
                <p className="text-sm text-stone-600">Tồn kho hiện tại: <span className="font-semibold">{selectedInventory.current_stock} {selectedInventory.unit}</span></p>
                <p className="text-sm text-stone-600 mt-1">
                  Sau giao dịch:
                  <span className="font-semibold ml-1">
                    {transactionData.transaction_type === 'import'
                      ? selectedInventory.current_stock + (transactionData.quantity || 0)
                      : selectedInventory.current_stock - (transactionData.quantity || 0)
                    } {selectedInventory.unit}
                  </span>
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowTransactionModal(false);
                    setSelectedInventory(null);
                  }}
                  className="px-6 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2 text-white rounded-lg transition ${
                    transactionData.transaction_type === 'import'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  {transactionData.transaction_type === 'import' ? 'Nhập kho' : 'Xuất kho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHistoryModal && selectedInventory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-stone-200">
              <h2 className="text-2xl font-bold text-stone-800">
                Lịch sử giao dịch - {selectedInventory.wood_type}
              </h2>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-stone-50 border-b border-stone-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">Ngày giờ</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">Loại</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">Số lượng</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">Số chứng từ</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-stone-50">
                        <td className="px-4 py-3 text-sm text-stone-700">
                          {new Date(transaction.transaction_date).toLocaleString('vi-VN')}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {transaction.transaction_type === 'import' ? (
                            <span className="inline-flex items-center gap-1 text-green-700 bg-green-100 px-2 py-1 rounded font-semibold">
                              <ArrowUpCircle className="w-4 h-4" />
                              Nhập
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-orange-700 bg-orange-100 px-2 py-1 rounded font-semibold">
                              <ArrowDownCircle className="w-4 h-4" />
                              Xuất
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-stone-900">
                          {transaction.quantity} {selectedInventory.unit}
                        </td>
                        <td className="px-4 py-3 text-sm text-stone-700">{transaction.reference_number || '-'}</td>
                        <td className="px-4 py-3 text-sm text-stone-700">{transaction.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-6 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedInventory(null);
                  setTransactions([]);
                }}
                className="px-6 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-lg transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
