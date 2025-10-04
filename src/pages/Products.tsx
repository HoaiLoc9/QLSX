import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface Product {
  id: number;
  code: string;
  name: string;
  wood_type: string;
  dimensions: string;
  price: number;
  production_status: "pending" | "in_production" | "completed";
}

export default function Products() {
  const { profile } = useAuth(); // giả lập { role: "admin" } hoặc "user"
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterWoodType, setFilterWoodType] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Omit<Product, "id">>({
    code: "",
    name: "",
    wood_type: "",
    dimensions: "",
    price: 0,
    production_status: "pending",
  });

  // ✅ Load dữ liệu từ LocalStorage
  useEffect(() => {
    const stored = localStorage.getItem("products");
    if (stored) setProducts(JSON.parse(stored));
  }, []);

  // ✅ Lưu vào LocalStorage khi products thay đổi
  useEffect(() => {
    localStorage.setItem("products", JSON.stringify(products));
  }, [products]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingProduct) {
      // Cập nhật
      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? { ...p, ...formData } : p))
      );
    } else {
      // Thêm mới
      const newProduct: Product = {
        id: Date.now(),
        ...formData,
      };
      setProducts((prev) => [newProduct, ...prev]);
    }

    setShowModal(false);
    setEditingProduct(null);
    resetForm();
  };

  const handleDelete = (id: number) => {
    if (confirm("Bạn có chắc muốn xóa sản phẩm này?")) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      wood_type: "",
      dimensions: "",
      price: 0,
      production_status: "pending",
    });
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      code: product.code,
      name: product.name,
      wood_type: product.wood_type,
      dimensions: product.dimensions,
      price: product.price,
      production_status: product.production_status,
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    resetForm();
    setShowModal(true);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || product.production_status === filterStatus;
    const matchesWoodType =
      filterWoodType === "all" || product.wood_type === filterWoodType;
    return matchesSearch && matchesStatus && matchesWoodType;
  });

  const woodTypes = [...new Set(products.map((p) => p.wood_type))];
  const isAdmin = profile?.role === "admin";

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      in_production: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
    };
    const labels: Record<string, string> = {
      pending: "Chờ",
      in_production: "Đang sản xuất",
      completed: "Hoàn thành",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          styles[status] || ""
        }`}
      >
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-800">Quản lý sản phẩm</h1>
          <p className="text-stone-600 mt-1">Danh sách bàn ghế gỗ</p>
        </div>
        {isAdmin && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-amber-800 hover:bg-amber-900 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            <Plus className="w-5 h-5" />
            Thêm sản phẩm
          </button>
        )}
      </div>

      {/* Bộ lọc */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ</option>
            <option value="in_production">Đang sản xuất</option>
            <option value="completed">Hoàn thành</option>
          </select>
          <select
            value={filterWoodType}
            onChange={(e) => setFilterWoodType(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
          >
            <option value="all">Tất cả loại gỗ</option>
            {woodTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Bảng sản phẩm */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Mã SP</th>
                <th className="px-4 py-3 text-left">Tên</th>
                <th className="px-4 py-3 text-left">Loại gỗ</th>
                <th className="px-4 py-3 text-left">Kích thước</th>
                <th className="px-4 py-3 text-left">Giá</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                {isAdmin && <th className="px-4 py-3 text-left">Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-t hover:bg-stone-50">
                  <td className="px-4 py-3">{product.code}</td>
                  <td className="px-4 py-3">{product.name}</td>
                  <td className="px-4 py-3">{product.wood_type}</td>
                  <td className="px-4 py-3">{product.dimensions}</td>
                  <td className="px-4 py-3">
                    {product.price.toLocaleString("vi-VN")} đ
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(product.production_status)}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal thêm/sửa */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">
                {editingProduct ? "Sửa sản phẩm" : "Thêm sản phẩm"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  placeholder="Mã sản phẩm"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  required
                  className="border rounded-lg px-4 py-2"
                />
                <input
                  placeholder="Tên sản phẩm"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="border rounded-lg px-4 py-2"
                />
                <input
                  placeholder="Loại gỗ"
                  value={formData.wood_type}
                  onChange={(e) =>
                    setFormData({ ...formData, wood_type: e.target.value })
                  }
                  required
                  className="border rounded-lg px-4 py-2"
                />
                <input
                  placeholder="Kích thước"
                  value={formData.dimensions}
                  onChange={(e) =>
                    setFormData({ ...formData, dimensions: e.target.value })
                  }
                  required
                  className="border rounded-lg px-4 py-2"
                />
                <input
                  placeholder="Giá bán"
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseFloat(e.target.value),
                    })
                  }
                  required
                  className="border rounded-lg px-4 py-2"
                />
                <select
                  value={formData.production_status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      production_status: e.target.value as any,
                    })
                  }
                  className="border rounded-lg px-4 py-2"
                >
                  <option value="pending">Chờ</option>
                  <option value="in_production">Đang sản xuất</option>
                  <option value="completed">Hoàn thành</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-800 text-white rounded-lg"
                >
                  {editingProduct ? "Cập nhật" : "Thêm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
