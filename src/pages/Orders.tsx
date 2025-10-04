import { useEffect, useState } from 'react';
import { supabase, Database } from '../lib/supabase';
import { Plus, CreditCard as Edit2, Trash2, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderInsert = Database['public']['Tables']['orders']['Insert'];
type Product = Database['public']['Tables']['products']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];

interface OrderWithItems extends Order {
  order_items?: (OrderItem & { products?: Product })[];
}

export default function Orders() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState<OrderInsert>({
    order_number: '',
    customer_name: '',
    delivery_date: '',
    status: 'pending',
    total_amount: 0,
  });
  const [orderItems, setOrderItems] = useState<{ product_id: string; quantity: number }[]>([]);

  useEffect(() => {
    loadOrders();
    loadProducts();
  }, []);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let orderId: string;

      if (editingOrder) {
        const { error } = await supabase
          .from('orders')
          .update(formData)
          .eq('id', editingOrder.id);

        if (error) throw error;
        orderId = editingOrder.id;

        await supabase
          .from('order_items')
          .delete()
          .eq('order_id', orderId);
      } else {
        const { data, error } = await supabase
          .from('orders')
          .insert(formData)
          .select()
          .single();

        if (error) throw error;
        orderId = data.id;
      }

      for (const item of orderItems) {
        if (item.product_id && item.quantity > 0) {
          const product = products.find(p => p.id === item.product_id);
          await supabase
            .from('order_items')
            .insert({
              order_id: orderId,
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: product?.price || 0,
            });
        }
      }

      setShowModal(false);
      setEditingOrder(null);
      resetForm();
      loadOrders();
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Có lỗi xảy ra khi lưu đơn hàng');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa đơn hàng này?')) return;

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Có lỗi xảy ra khi xóa đơn hàng');
    }
  };

  const resetForm = () => {
    setFormData({
      order_number: '',
      customer_name: '',
      delivery_date: '',
      status: 'pending',
      total_amount: 0,
    });
    setOrderItems([{ product_id: '', quantity: 1 }]);
  };

  const openEditModal = (order: OrderWithItems) => {
    setEditingOrder(order);
    setFormData({
      order_number: order.order_number,
      customer_name: order.customer_name,
      delivery_date: order.delivery_date,
      status: order.status,
      total_amount: order.total_amount,
    });
    setOrderItems(
      order.order_items?.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
      })) || [{ product_id: '', quantity: 1 }]
    );
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingOrder(null);
    resetForm();
    setShowModal(true);
  };

  const addOrderItem = () => {
    setOrderItems([...orderItems, { product_id: '', quantity: 1 }]);
  };

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateOrderItem = (index: number, field: 'product_id' | 'quantity', value: string | number) => {
    const newItems = [...orderItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setOrderItems(newItems);

    const total = newItems.reduce((sum, item) => {
      const product = products.find(p => p.id === item.product_id);
      return sum + (product?.price || 0) * item.quantity;
    }, 0);
    setFormData({ ...formData, total_amount: total });
  };

  const viewOrderDetail = (order: OrderWithItems) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_production: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
    };
    const labels = {
      pending: 'Chờ',
      in_production: 'Đang sản xuất',
      completed: 'Hoàn thành',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const isAdmin = profile?.role === 'admin';

  if (loading) {
    return <div className="flex items-center justify-center h-64">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-800">Quản lý đơn hàng</h1>
          <p className="text-stone-600 mt-1">Theo dõi đơn hàng và tiến độ sản xuất</p>
        </div>
        {isAdmin && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-amber-800 hover:bg-amber-900 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            <Plus className="w-5 h-5" />
            Tạo đơn hàng
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">Số ĐH</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">Khách hàng</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">Ngày giao</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">Tổng tiền</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">Trạng thái</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-stone-50 transition">
                  <td className="px-4 py-3 text-sm font-medium text-stone-900">{order.order_number}</td>
                  <td className="px-4 py-3 text-sm text-stone-700">{order.customer_name}</td>
                  <td className="px-4 py-3 text-sm text-stone-700">
                    {new Date(order.delivery_date).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-3 text-sm text-stone-700">{order.total_amount.toLocaleString('vi-VN')} đ</td>
                  <td className="px-4 py-3 text-sm">{getStatusBadge(order.status)}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => viewOrderDetail(order)}
                        className="p-2 text-stone-600 hover:bg-stone-100 rounded-lg transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => openEditModal(order)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(order.id)}
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-stone-200">
              <h2 className="text-2xl font-bold text-stone-800">
                {editingOrder ? 'Sửa đơn hàng' : 'Tạo đơn hàng mới'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Số đơn hàng
                  </label>
                  <input
                    type="text"
                    value={formData.order_number}
                    onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Tên khách hàng
                  </label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Ngày giao hàng
                  </label>
                  <input
                    type="date"
                    value={formData.delivery_date}
                    onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Trạng thái
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="pending">Chờ</option>
                    <option value="in_production">Đang sản xuất</option>
                    <option value="completed">Hoàn thành</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-stone-700">
                    Sản phẩm trong đơn hàng
                  </label>
                  <button
                    type="button"
                    onClick={addOrderItem}
                    className="text-sm text-amber-800 hover:text-amber-900 font-semibold"
                  >
                    + Thêm sản phẩm
                  </button>
                </div>
                <div className="space-y-3">
                  {orderItems.map((item, index) => (
                    <div key={index} className="flex gap-3">
                      <select
                        value={item.product_id}
                        onChange={(e) => updateOrderItem(index, 'product_id', e.target.value)}
                        className="flex-1 px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                        required
                      >
                        <option value="">Chọn sản phẩm</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} - {product.price.toLocaleString('vi-VN')} đ
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value))}
                        className="w-24 px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                        placeholder="SL"
                        required
                      />
                      {orderItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeOrderItem(index)}
                          className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg">
                <p className="text-lg font-bold text-stone-800">
                  Tổng tiền: {formData.total_amount.toLocaleString('vi-VN')} đ
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingOrder(null);
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
                  {editingOrder ? 'Cập nhật' : 'Tạo đơn hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-stone-200">
              <h2 className="text-2xl font-bold text-stone-800">Chi tiết đơn hàng</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-stone-600">Số đơn hàng</p>
                  <p className="text-lg font-semibold text-stone-900">{selectedOrder.order_number}</p>
                </div>
                <div>
                  <p className="text-sm text-stone-600">Khách hàng</p>
                  <p className="text-lg font-semibold text-stone-900">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-stone-600">Ngày giao hàng</p>
                  <p className="text-lg font-semibold text-stone-900">
                    {new Date(selectedOrder.delivery_date).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-stone-600">Trạng thái</p>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-stone-800 mb-3">Danh sách sản phẩm</h3>
                <div className="border border-stone-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-stone-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-stone-700">Sản phẩm</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-stone-700">Số lượng</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-stone-700">Đơn giá</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-stone-700">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {selectedOrder.order_items?.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 text-sm text-stone-700">{item.products?.name}</td>
                          <td className="px-4 py-2 text-sm text-stone-700">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm text-stone-700">{item.unit_price.toLocaleString('vi-VN')} đ</td>
                          <td className="px-4 py-2 text-sm font-semibold text-stone-900">
                            {(item.quantity * item.unit_price).toLocaleString('vi-VN')} đ
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg">
                <p className="text-xl font-bold text-stone-800">
                  Tổng tiền: {selectedOrder.total_amount.toLocaleString('vi-VN')} đ
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-lg transition"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
