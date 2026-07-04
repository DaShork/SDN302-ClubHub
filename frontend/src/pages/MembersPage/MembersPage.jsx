import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { membershipService } from "../../services/membershipService";
import { resolveClubUuid, supabase } from "../../services/supabase";

export default function MembersPage() {
  const { clubId } = useParams();
  const [resolvedClubId, setResolvedClubId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // 1. Members List State
  const [members, setMembers] = useState([
    { id: "1", name: "Lê Thanh Tùng", code: "SE160123", email: "tungltse160123@fpt.edu.vn", phone: "0987654321", role: "Leader", joinedAt: "2026-05-01", status: "Active", term: "Term 11 (2026)", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=tunglt" },
    { id: "2", name: "Trần Quốc Bảo", code: "SE160245", email: "baotqse160245@fpt.edu.vn", phone: "0912345678", role: "Leader", joinedAt: "2026-05-01", status: "Active", term: "Term 11 (2026)", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=baotq" },
    { id: "3", name: "Nguyễn Hoàng Nam", code: "SE160789", email: "namnhse160789@fpt.edu.vn", phone: "0945678912", role: "Member", joinedAt: "2026-06-10", status: "Active", term: "Term 11 (2026)", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=namnh" },
    { id: "4", name: "Phạm Minh Thư", code: "SE150912", email: "thupmse150912@fpt.edu.vn", phone: "0934567890", role: "Member", joinedAt: "2026-06-12", status: "Active", term: "Term 11 (2026)", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=thupm" },
    { id: "5", name: "Đặng Hoàng Duy", code: "SE170321", email: "duydhse170321@fpt.edu.vn", phone: "0901234567", role: "Member", joinedAt: "2026-06-15", status: "Active", term: "Term 11 (2026)", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=duydh" },
    { id: "6", name: "Vũ Phương Nam", code: "SE170566", email: "namvpse170566@fpt.edu.vn", phone: "0978901234", role: "Mentor", joinedAt: "2026-05-10", status: "Inactive", term: "Term 10 (Alumni)", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=namvp" }
  ]);

  // Load from Supabase
  async function fetchMembers(uuid) {
    try {
      setLoading(true);
      setErrorMsg(null);

      // Query active and inactive memberships in parallel
      const [activeM, inactiveM] = await Promise.all([
        membershipService.getClubMemberships(uuid, "active").catch(() => []),
        membershipService.getClubMemberships(uuid, "inactive").catch(() => [])
      ]);

      const allData = [...activeM, ...inactiveM];

      // Always replace state with Supabase data (even if empty)
      const parsed = allData.map(m => ({
        id: m.id,
        profileId: m.profiles?.id || null,
        name: m.profiles?.full_name || "Unknown Profile",
        code: m.profiles?.student_code || "—",
        email: m.profiles?.email || "—",
        phone: m.profiles?.phone || "—",
        role: m.position || "Member",
        joinedAt: m.joined_at || new Date().toISOString().split("T")[0],
        status: m.status === "active" ? "Active" : "Inactive",
        term: "Term 11 (2026)",
        avatar: m.profiles?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${m.id}`,
        faculty: m.profiles?.faculty || "",
        major: m.profiles?.major || ""
      }));
      setMembers(parsed);

    } catch (err) {
      console.error("Supabase members load error:", err);
      setErrorMsg("Không thể tải danh sách từ database.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function init() {
      if (clubId) {
        const uuid = await resolveClubUuid(clubId);
        setResolvedClubId(uuid);
        if (uuid) {
          fetchMembers(uuid);
        } else {
          setLoading(false);
        }
      }
    }
    init();
  }, [clubId]);

  // 2. States for Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // 3. States for Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Form States
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    studentCode: "",
    role: "Member",
    status: "Active",
    term: "Term 11 (2026)"
  });

  // 4. Handlers
  const handleOpenAddModal = () => {
    setSelectedMember(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      studentCode: "",
      role: "Member",
      status: "Active",
      term: "Term 11 (2026)"
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member) => {
    setSelectedMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone || "",
      studentCode: member.code || "",
      role: member.role,
      status: member.status,
      term: member.term || "Term 11 (2026)"
    });
    setIsModalOpen(true);
  };

  const handleOpenDetailModal = (member) => {
    setSelectedMember(member);
    setIsDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMember(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedMember) {
      // Edit mode: Update membership position & status + update profile name/phone
      try {
        // Update memberships table
        await membershipService.updatePosition(selectedMember.id, formData.role);
        await membershipService.updateStatus(selectedMember.id, formData.status.toLowerCase());

        // Also update profiles table (name + phone + student_code)
        if (selectedMember.profileId) {
          await supabase
            .from("profiles")
            .update({
              full_name: formData.name,
              phone: formData.phone || null,
              student_code: formData.studentCode || null,
              updated_at: new Date().toISOString()
            })
            .eq("id", selectedMember.profileId);
        }

        if (resolvedClubId) fetchMembers(resolvedClubId);
      } catch (err) {
        console.warn("Supabase update failed, mutating local state instead:", err);
        setMembers((prev) =>
          prev.map((m) =>
            m.id === selectedMember.id ? { ...m, ...formData } : m
          )
        );
      }
    } else {
      // Add mode (Resolves existing profile or inserts new profile, then links membership)
      try {
        let profileId = null;
        
        // 1. Search for profile by email
        const { data: profileList, error: pError } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", formData.email);

        if (pError) throw pError;

        if (profileList && profileList.length > 0) {
          profileId = profileList[0].id;
          // Update phone and student_code if provided
          await supabase
            .from("profiles")
            .update({
              phone: formData.phone || null,
              student_code: formData.studentCode || null
            })
            .eq("id", profileId);
        } else {
          // 2. Create a new profile with all form fields
          const { data: newProfileList, error: npError } = await supabase
            .from("profiles")
            .insert([
              {
                full_name: formData.name,
                email: formData.email,
                phone: formData.phone || null,
                student_code: formData.studentCode || null,
                status: formData.status ? formData.status.toLowerCase() : "active"
              }
            ])
            .select();

          if (npError) throw npError;
          profileId = newProfileList[0].id;
        }

        // 3. Insert membership with position and status
        const { error: memError } = await supabase
          .from("memberships")
          .insert([{
            club_id: resolvedClubId || clubId,
            profile_id: profileId,
            position: formData.role || "Member",
            status: formData.status ? formData.status.toLowerCase() : "active",
            joined_at: new Date().toISOString().split("T")[0]
          }]);

        if (memError) throw memError;

        // Reload and then close modal
        if (resolvedClubId) {
          await fetchMembers(resolvedClubId);
        }
        handleCloseModal();
        return; // exit early — don't fall through to handleCloseModal below
      } catch (err) {
        console.error("Supabase add member failed:", err);
        setErrorMsg(`Thêm thành viên thất bại: ${err.message || "Lỗi không xác định"}`);
      }
    }
    handleCloseModal();
  };

  const handleDeleteMember = async (id) => {
    if (confirm("Are you sure you want to remove this member from the club?")) {
      try {
        await membershipService.updateStatus(id, "left");
        if (resolvedClubId) fetchMembers(resolvedClubId);
      } catch (err) {
        console.warn("Supabase remove failed, updating local state:", err);
        setMembers((prev) => prev.filter((m) => m.id !== id));
      }
    }
  };

  const handleToggleStatus = async (id) => {
    const currentMember = members.find((m) => m.id === id);
    if (!currentMember) return;
    const newStatus = currentMember.status === "Active" ? "inactive" : "active";

    try {
      await membershipService.updateStatus(id, newStatus);
      if (resolvedClubId) fetchMembers(resolvedClubId);
    } catch (err) {
      console.warn("Supabase status toggle failed, updating local state:", err);
      setMembers((prev) =>
        prev.map((m) =>
          m.id === id
            ? { ...m, status: m.status === "Active" ? "Inactive" : "Active" }
            : m
        )
      );
    }
  };

  // 5. Filter Logic
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.code.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "All" || m.role === roleFilter;
    const matchesStatus = statusFilter === "All" || m.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#06231D] tracking-tight">Members Management</h2>
          <p className="text-xs text-[#4A5D59]">View, search, add, and update roles or membership terms for club members.</p>
        </div>
        <div className="flex gap-2">
          {errorMsg && (
            <span className="bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-2 rounded-xl flex items-center gap-1 font-medium animate-fade-in">
              ⚠️ {errorMsg}
            </span>
          )}
          <button
            onClick={handleOpenAddModal}
            className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#0E4B43] to-[#22C55E] text-white font-bold text-xs hover:opacity-90 transition-all flex items-center gap-2 shadow-lg cursor-pointer tactile-btn"
          >
            <span>➕</span> Add New Member
          </button>
        </div>
      </div>

      {/* 1. Upper Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-[#06231D]/10 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#4A5D59]">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search by name, email, code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#06231D] placeholder-[#4A5D59] focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#4A5D59] hidden sm:inline">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#06231D] focus:outline-none focus:border-[#22C55E]"
            >
              <option value="All">All Roles</option>
              <option value="Leader">Leader</option>
              <option value="Member">Member</option>
              <option value="Mentor">Mentor</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#4A5D59] hidden sm:inline">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#06231D] focus:outline-none focus:border-[#22C55E]"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Table Section */}
      <div className="rounded-2xl bg-white border border-[#06231D]/10 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-[#4A5D59] flex flex-col items-center justify-center gap-2">
            <span className="w-6 h-6 border-2 border-[#22C55E] border-t-transparent rounded-full animate-spin"></span>
            <span>Fetching club members...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#06231D]/10 text-[#4A5D59] bg-[#F4F1EA]/70">
                  <th className="py-3.5 px-6 font-bold">User</th>
                  <th className="py-3.5 px-4 font-bold">Student Code</th>
                  <th className="py-3.5 px-4 font-bold">Joined Date</th>
                  <th className="py-3.5 px-4 font-bold">Role</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-6 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((m) => (
                    <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-all text-[#06231D]">
                      <td className="py-4 px-6 flex items-center gap-3">
                        <img src={m.avatar} className="w-9 h-9 rounded-xl bg-[#0E4B43]/10 border border-gray-200" alt="avatar" />
                        <div>
                          <div className="font-bold text-[#06231D] leading-tight">{m.name}</div>
                          <div className="text-[11px] text-[#4A5D59] mt-0.5">{m.email}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-medium">{m.code}</td>
                      <td className="py-4 px-4">{m.joinedAt}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          m.role === "Leader"
                            ? "bg-red-500/10 text-red-600 border-red-500/20"
                            : m.role === "Mentor"
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                        }`}>
                          {m.role}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          m.status === "Active"
                            ? "bg-[#22C55E]/10 text-[#0E4B43] border-[#22C55E]/20"
                            : "bg-gray-100 text-gray-500 border-gray-200"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${m.status === "Active" ? "bg-[#22C55E]" : "bg-gray-400"}`}></span>
                          {m.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2.5">
                        <button
                          onClick={() => handleOpenDetailModal(m)}
                          className="text-xs text-[#4A5D59] hover:text-[#06231D] font-medium transition-all"
                          title="View Details"
                        >
                          Detail
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(m)}
                          className="text-xs text-[#22C55E] hover:underline font-bold"
                          title="Edit Info"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(m.id)}
                          className={`text-xs ${m.status === "Active" ? "text-amber-600 hover:text-amber-500 font-semibold" : "text-emerald-600 hover:text-emerald-500 font-semibold"} transition-all`}
                          title={m.status === "Active" ? "Block Member" : "Activate Member"}
                        >
                          {m.status === "Active" ? "Block" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleDeleteMember(m.id)}
                          className="text-xs text-red-500 hover:text-red-600 transition-all font-bold"
                          title="Remove"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-[#4A5D59]">
                      No members found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Modal Form (Add / Edit Member) */}
      <MemberFormModal
        isOpen={isModalOpen}
        selectedMember={selectedMember}
        formData={formData}
        handleCloseModal={handleCloseModal}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
      />

      {/* 5. Detail Modal */}
      <MemberDetailModal
        isOpen={isDetailModalOpen}
        selectedMember={selectedMember}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </div>
  );
}

function MemberFormModal({
  isOpen,
  selectedMember,
  formData,
  handleCloseModal,
  handleInputChange,
  handleSubmit
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseModal}></div>

      <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full p-6 z-50 shadow-2xl relative animate-fade-in text-sm text-[#06231D]">
        <button onClick={handleCloseModal} className="absolute top-4 right-4 text-[#4A5D59] hover:text-[#06231D] p-1">
          ✕
        </button>
        <h3 className="text-lg font-bold text-[#06231D] mb-4">
          {selectedMember ? "✏️ Edit Member Info" : "➕ Add New Member"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-[#4A5D59] uppercase mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g. Nguyễn Văn A"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#06231D] placeholder-[#4A5D59] focus:outline-none focus:border-[#22C55E]"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-[#4A5D59] uppercase mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              placeholder="e.g. anv@fpt.edu.vn"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#06231D] placeholder-[#4A5D59] focus:outline-none focus:border-[#22C55E]"
            />
          </div>

          {/* Phone + Student Code in 2-col grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-[#4A5D59] uppercase mb-1">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="e.g. 09xxxxxxxx"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#06231D] placeholder-[#4A5D59] focus:outline-none focus:border-[#22C55E]"
              />
            </div>

            {/* Student Code */}
            <div>
              <label className="block text-xs font-bold text-[#4A5D59] uppercase mb-1">Student Code</label>
              <input
                type="text"
                name="studentCode"
                required
                value={formData.studentCode}
                onChange={handleInputChange}
                placeholder="e.g. SE180xxx"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#06231D] placeholder-[#4A5D59] focus:outline-none focus:border-[#22C55E]"
              />
            </div>
          </div>

          {/* Grid (Role and Status) */}
          <div className="grid grid-cols-2 gap-4">
            {/* Role */}
            <div>
              <label className="block text-xs font-bold text-[#4A5D59] uppercase mb-1">Role / Position</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#06231D] focus:outline-none focus:border-[#22C55E]"
              >
                <option value="Leader">Leader</option>
                <option value="Member">Member</option>
                <option value="Mentor">Mentor</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-[#4A5D59] uppercase mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#06231D] focus:outline-none focus:border-[#22C55E]"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Membership Plan Term */}
          <div>
            <label className="block text-xs font-bold text-[#4A5D59] uppercase mb-1">Membership Plan (Term)</label>
            <select
              name="term"
              value={formData.term}
              onChange={handleInputChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#06231D] focus:outline-none focus:border-[#22C55E]"
            >
              <option value="Term 11 (2026)">Term 11 (2026) - Current</option>
              <option value="Term 10 (Alumni)">Term 10 (Alumni)</option>
              <option value="Term 9 (Alumni)">Term 9 (Alumni)</option>
            </select>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 justify-end border-t border-gray-100 pt-4 mt-6">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs text-[#4A5D59] font-medium tactile-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0E4B43] to-[#22C55E] text-white font-bold text-xs hover:opacity-90 cursor-pointer tactile-btn"
            >
              {selectedMember ? "Save Changes" : "Create Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MemberDetailModal({ isOpen, selectedMember, onClose }) {
  if (!isOpen || !selectedMember) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>

      <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full p-6 z-50 shadow-2xl relative animate-fade-in text-sm text-[#06231D]">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#4A5D59] hover:text-[#06231D] p-1">
          ✕
        </button>
        <h3 className="text-lg font-bold text-[#06231D] mb-6">👤 Member Profile Card</h3>

        <div className="flex flex-col items-center text-center pb-6 border-b border-gray-100">
          <img src={selectedMember.avatar} className="w-20 h-20 rounded-2xl bg-[#0E4B43]/10 border-2 border-[#22C55E] shadow-md mb-4" alt="" />
          <h4 className="text-lg font-bold text-[#06231D]">{selectedMember.name}</h4>
          <p className="text-xs text-[#4A5D59]">{selectedMember.code} • {selectedMember.term}</p>
          <span className={`px-2.5 py-0.5 mt-2 rounded-full text-[10px] font-bold border ${
            selectedMember.role === "Leader"
              ? "bg-red-500/10 text-red-600 border-red-500/20"
              : selectedMember.role === "Mentor"
              ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
              : "bg-blue-500/10 text-blue-600 border-blue-500/20"
          }`}>
            {selectedMember.role}
          </span>
        </div>

        <div className="py-4 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#4A5D59]">Email:</span>
            <span className="font-semibold text-[#06231D]">{selectedMember.email}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#4A5D59]">Phone Number:</span>
            <span className="font-semibold text-[#06231D]">{selectedMember.phone}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#4A5D59]">Joined At:</span>
            <span className="font-semibold text-[#06231D]">{selectedMember.joinedAt}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#4A5D59]">Status:</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
              selectedMember.status === "Active" ? "bg-[#22C55E]/10 text-[#0E4B43] border-[#22C55E]/20" : "bg-gray-100 text-gray-500 border-gray-200"
            }`}>
              {selectedMember.status}
            </span>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs text-[#4A5D59] font-medium cursor-pointer"
          >
            Close View
          </button>
        </div>
      </div>
    </div>
  );
}
