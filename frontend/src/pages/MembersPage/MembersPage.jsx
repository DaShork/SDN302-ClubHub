import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { membershipService } from "../../services/membershipService";
import { resolveClubUuid, supabase } from "../../services/supabase";
import { HeroSection } from "@/components";
import MemberFormModal from "./components/MemberFormModal/MemberFormModal.jsx";
import MemberDetailModal from "./components/MemberDetailModal/MemberDetailModal.jsx";
import "./MembersPage.css";

export default function MembersPageContent() {
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
      } else {
        setLoading(false);
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
    <div className="members-page">
      <HeroSection
        variant="members"
        eyebrow="Club Directory"
        title="Members"
        titleGradient="Management"
        subtitle="View, search, add, and update roles or membership terms for club members."
      />

      <div className="events-page__body members-page__body">
        <div className="events-page__container members-page__container">
          {/* Page Header */}
          <div className="events-page__header">
            <div>
              <h2 className="events-page__title">Members Directory</h2>
              <p className="events-page__subtitle">Search, filter and manage active committee and members.</p>
            </div>
            <div className="events-page__header-actions">
              {errorMsg && (
                <span className="events-page__warn">⚠️ {errorMsg}</span>
              )}
              <button type="button" className="events-page__btn-primary" onClick={handleOpenAddModal}>
                ➕ Add New Member
              </button>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="members-page__toolbar">
            <div className="members-page__search">
              <span className="members-page__search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by name, email, code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="members-page__search-input"
              />
            </div>

            <div className="members-page__filter-group">
              <div className="members-page__filter">
                <span className="members-page__filter-label members-page__filter-label--sm">Role:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="members-page__filter-select"
                >
                  <option value="All">All Roles</option>
                  <option value="Leader">Leader</option>
                  <option value="Member">Member</option>
                  <option value="Mentor">Mentor</option>
                </select>
              </div>

              <div className="members-page__filter">
                <span className="members-page__filter-label members-page__filter-label--sm">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="members-page__filter-select"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="members-page__table-card">
            {loading ? (
              <div className="members-page__loading">
                <span className="events-page__spinner" />
                <span>Fetching club members…</span>
              </div>
            ) : (
              <div className="members-page__table-scroll">
                <table className="members-page__table">
                  <thead>
                    <tr className="members-page__head-row">
                      <th className="members-page__th members-page__th--user">User</th>
                      <th className="members-page__th">Student Code</th>
                      <th className="members-page__th">Joined Date</th>
                      <th className="members-page__th">Role</th>
                      <th className="members-page__th">Status</th>
                      <th className="members-page__th members-page__th--actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.length > 0 ? (
                      filteredMembers.map((m) => (
                        <tr key={m.id} className="members-page__row">
                          <td className="members-page__td members-page__td--user">
                            <img src={m.avatar} className="members-page__avatar" alt="avatar" />
                            <div>
                              <div className="members-page__user-name">{m.name}</div>
                              <div className="members-page__user-email">{m.email}</div>
                            </div>
                          </td>
                          <td className="members-page__td members-page__td--medium">{m.code}</td>
                          <td className="members-page__td">{m.joinedAt}</td>
                          <td className="members-page__td">
                            <span className={`members-page__role members-page__role--${m.role.toLowerCase()}`}>
                              {m.role}
                            </span>
                          </td>
                          <td className="members-page__td">
                            <span className={`members-page__status members-page__status--${m.status.toLowerCase()}`}>
                              <span className={`members-page__status-dot members-page__status-dot--${m.status.toLowerCase()}`} />
                              {m.status}
                            </span>
                          </td>
                          <td className="members-page__td members-page__td--actions">
                            <button type="button" onClick={() => handleOpenDetailModal(m)} className="members-page__action members-page__action--detail" title="View Details">
                              Detail
                            </button>
                            <button type="button" onClick={() => handleOpenEditModal(m)} className="members-page__action members-page__action--edit" title="Edit Info">
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(m.id)}
                              className={`members-page__action ${m.status === "Active" ? "members-page__action--block" : "members-page__action--activate"}`}
                              title={m.status === "Active" ? "Block Member" : "Activate Member"}
                            >
                              {m.status === "Active" ? "Block" : "Activate"}
                            </button>
                            <button type="button" onClick={() => handleDeleteMember(m.id)} className="members-page__action members-page__action--remove" title="Remove">
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="members-page__empty">
                          No members found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <MemberDetailModal
        isOpen={isDetailModalOpen}
        selectedMember={selectedMember}
        handleCloseModal={() => {
          setIsDetailModalOpen(false);
          setSelectedMember(null);
        }}
      />

      <MemberFormModal
        isOpen={isModalOpen}
        selectedMember={selectedMember}
        formData={formData}
        handleCloseModal={handleCloseModal}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
      />
    </div>
  );
}
