import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, UserPlus } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Workers() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [workers, setWorkers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    position: "",
    shift: "morning",
    completed_products: 0,
  });

  // --- Load từ localStorage ---
  useEffect(() => {
    const saved = localStorage.getItem("workers");
    if (saved) setWorkers(JSON.parse(saved));
  }, []);

  // --- Lưu vào localStorage ---
  useEffect(() => {
    localStorage.setItem("workers", JSON.stringify(workers));
  }, [workers]);

  const openAddModal = () => {
    setEditingWorker(null);
    setFormData({ name: "", position: "", shift: "morning", completed_products: 0 });
    setShowModal(true);
  };

  const openEditModal = (worker: any) => {
    setEditingWorker(worker);
    setFormData(worker);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWorker) {
      setWorkers((prev) =>
        prev.map((w) => (w.id === editingWorker.id ? { ...w, ...formData } : w))
      );
    } else {
      setWorkers((prev) => [...prev, { ...formData, id: Date.now() }]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    if (confirm("Bạn có chắc muốn xóa nhân viên này?")) {
      setWorkers((prev) => prev.filter((w) => w.id !== id));
    }
  };

  const getShiftBadge = (shift: string) => {
    const styles: any = {
      morning: "bg-yellow-100 text-yellow-800",
      afternoon: "bg-orange-100 text-orange-800",
      night: "bg-blue-100 text-blue-800",
    };
    const labels: any = {
      morning: "Ca sáng",
      afternoon: "Ca chiều",
      night: "Ca tối",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[shift]}`}>
        {labels[shift]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-800">Quản lý nhân công</h1>
          <p className="text-stone-600 mt-1">Danh sách nhân viên trong xưởng</p>
        </div>
        {isAdmin && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-amber-800 hover:bg-amber-900 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            <Plus className="w-5 h-5" /> Thêm nhân viên
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
        <table className="w-full">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">Tên nhân viên</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">Vị trí</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">Ca làm việc</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">SP hoàn thành</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {workers.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-stone-500">
                  Chưa có nhân viên nào
                </td>
              </tr>
            ) : (
              workers.map((worker) => (
                <tr key={worker.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3 text-sm font-medium text-stone-900">{worker.name}</td>
                  <td className="px-4 py-3 text-sm text-stone-700">{worker.position}</td>
                  <td className="px-4 py-3 text-sm">{getShiftBadge(worker.shift)}</td>
                  <td className="px-4 py-3 text-sm text-stone-700">{worker.completed_products}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                        title="Phân công"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => openEditModal(worker)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(worker.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal thêm/sửa */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-stone-200">
              <h2 className="text-xl font-bold text-stone-800">
                {editingWorker ? "Sửa thông tin nhân viên" : "Thêm nhân viên mới"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <input
                type="text"
                placeholder="Tên nhân viên"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full border border-stone-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <input
                type="text"
                placeholder="Vị trí"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                required
                className="w-full border border-stone-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <select
                value={formData.shift}
                onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                className="w-full border border-stone-300 rounded-lg px-4 py-2"
              >
                <option value="morning">Ca sáng</option>
                <option value="afternoon">Ca chiều</option>
                <option value="night">Ca tối</option>
              </select>
              <input
                type="number"
                placeholder="Sản phẩm hoàn thành"
                value={formData.completed_products}
                onChange={(e) =>
                  setFormData({ ...formData, completed_products: parseInt(e.target.value) || 0 })
                }
                className="w-full border border-stone-300 rounded-lg px-4 py-2"
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-stone-300 rounded-lg hover:bg-stone-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-800 text-white rounded-lg hover:bg-amber-900"
                >
                  {editingWorker ? "Cập nhật" : "Thêm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
