import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Package, ShoppingCart, Users, Archive, TrendingUp, AlertCircle } from 'lucide-react';

interface Stats {
  totalProducts: number;
  completedProducts: number;
  activeOrders: number;
  totalWorkers: number;
  lowStockItems: number;
  ordersInProduction: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    completedProducts: 0,
    activeOrders: 0,
    totalWorkers: 0,
    lowStockItems: 0,
    ordersInProduction: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [products, orders, workers, inventory] = await Promise.all([
        supabase.from('products').select('production_status', { count: 'exact' }),
        supabase.from('orders').select('status', { count: 'exact' }),
        supabase.from('workers').select('id', { count: 'exact' }),
        supabase.from('inventory').select('current_stock, min_stock', { count: 'exact' }),
      ]);

      const completedProducts = products.data?.filter(p => p.production_status === 'completed').length || 0;
      const activeOrders = orders.data?.filter(o => o.status !== 'completed').length || 0;
      const ordersInProduction = orders.data?.filter(o => o.status === 'in_production').length || 0;
      const lowStockItems = inventory.data?.filter(i => i.current_stock <= i.min_stock).length || 0;

      setStats({
        totalProducts: products.count || 0,
        completedProducts,
        activeOrders,
        totalWorkers: workers.count || 0,
        lowStockItems,
        ordersInProduction,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Tổng sản phẩm',
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Đơn hàng đang xử lý',
      value: stats.activeOrders,
      icon: ShoppingCart,
      color: 'bg-amber-500',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Nhân công',
      value: stats.totalWorkers,
      icon: Users,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Nguyên liệu sắp hết',
      value: stats.lowStockItems,
      icon: AlertCircle,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  const productionCards = [
    {
      title: 'Đơn hàng đang sản xuất',
      value: stats.ordersInProduction,
      icon: TrendingUp,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Sản phẩm hoàn thành',
      value: stats.completedProducts,
      icon: Package,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-stone-600">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-800">Dashboard</h1>
          <p className="text-stone-600 mt-1">Tổng quan hệ thống quản lý sản xuất</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-stone-600 text-sm font-medium">{card.title}</p>
                  <p className={`text-3xl font-bold mt-2 ${card.textColor}`}>
                    {card.value}
                  </p>
                </div>
                <div className={`${card.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${card.textColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {productionCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-stone-600 text-sm font-medium mb-2">{card.title}</p>
                  <p className={`text-4xl font-bold ${card.textColor}`}>
                    {card.value}
                  </p>
                </div>
                <div className={`${card.bgColor} p-4 rounded-xl`}>
                  <Icon className={`w-10 h-10 ${card.textColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-gradient-to-br from-amber-900 to-amber-950 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Hệ thống hoạt động tốt</h2>
            <p className="text-amber-200">
              Tất cả các module đang hoạt động bình thường
            </p>
          </div>
          <Archive className="w-16 h-16 text-amber-300 opacity-50" />
        </div>
      </div>
    </div>
  );
}
