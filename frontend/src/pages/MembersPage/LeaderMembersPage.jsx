import { useEffect, useState, useMemo } from "react";
import { membershipService } from "../../services/membershipService";
import { supabase } from "../../services/supabase";
import { LeaderDashboardHeader, LeaderEmptyState, Loading } from "@/components";
import { useLeaderScope } from "@/contexts/LeaderScopeContext.jsx";
import MemberFormModal from "./components/MemberFormModal/MemberFormModal.jsx";
import MemberDetailModal from "./components/MemberDetailModal/MemberDetailModal.jsx";
import "./MembersPage.css";

/**
 * LeaderMembersPage — aggregated members view across every club the
 * current user leads. Each member row is tagged with the club they belong
 * to so the leader can see the picture at a glance. When a single club is
 * picked from the leader header the table collapses to that club's view
 * with the legacy action affordances.
 *
 * Write actions (Add / Edit / Delete) intentionally operate on the filtered
 * scope. If no filter is applied we require a single-club filter for writes
 * to avoid ambiguous cross-club mutations.
 */
export default function LeaderMembersPage() {
  const {
    ledClubs,
    ledClubIds,
    loading: leaderLoading,
    selectedClubId,
    selectedClub,
    isAllScope,
  } = useLeaderScope();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Each row is the existing shape used by the legacy MembersPage, plus a
  // `clubId` + `clubName` pair so we can render a "Club" column in the
  // aggregated view.
  const [members, setMembers] = useState([]);

  // Filter UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    studentCode: "",
    role: "Member",
    status: "Active",
    term: "Term 11 (2026)",
  });

  const targetIds = useMemo(() => {
    if (isAllScope) return ledClubIds;
    return selectedClubId ? [selectedClubId] : [];
  }, [isAllScope, selectedClubId, ledClubIds]);

  async function fetchForClub(uuid, clubName) {
    const [activeM, inactiveM] = await Promise.all([
      membershipService.getClubMemberships(uuid, "active").catch(() => []),
      membershipService.getClubMemberships(uuid, "inactive").catch(() => []),
    ]);
    const all = [...(activeM || []), ...(inactiveM || [])];
    return all.map((m) => ({
      id: m.id,
      clubId: uuid,
      clubName,
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
      major: m.profiles?.major || "",
    }));
  }

  async function loadAll() {
    if (targetIds.length === 0) {
      setMembers([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setErrorMsg(null);
      const clubById = new Map(ledClubs.map((c) => [c.id, c.name]));
      const rows = (
        await Promise.all(
          targetIds.map((id) => fetchForClub(id, clubById.get(id) || "—"))
        )
      ).flat();
      setMembers(rows);
    } catch (err) {
      console.error("Supabase members load error:", err);
      setErrorMsg("Không thể tải danh sách từ database.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetIds.join("|")]);

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "All" || m.role === roleFilter;
    const matchesStatus = statusFilter === "All" || m.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleOpenAddModal = () => {
    if (isAllScope) {
      // Cross-club add is ambiguous — ask user to pick a single club first.
      alert("Vui lòng chọn 1 CLB cụ thể từ bộ lọc phía trên trước khi thêm thành viên.");
      return;
    }
    setSelectedMember(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      studentCode: "",
      role: "Member",
      status: "Active",
      term: "Term 11 (2026)",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member) => {
    if (isAllScope) {
      alert("Vui lòng chọn 1 CLB cụ thể từ bộ lọc phía trên trước khi sửa thành viên.");
      return;
    }
    setSelectedMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone || "",
      studentCode: member.code || "",
      role: member.role,
      status: member.status,
      term: member.term || "Term 11 (2026)",
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
      try {
        await membershipService.updatePosition(selectedMember.id, formData.role);
        await membershipService.updateStatus(selectedMember.id, formData.status.toLowerCase());
        if (selectedMember.profileId) {
          await supabase
            .from("profiles")
            .update({
              full_name: formData.name,
              phone: formData.phone || null,
              student_code: formData.studentCode || null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", selectedMember.profileId);
        }
        loadAll();
      } catch (err) {
        console.warn("Supabase update failed, mutating local state instead:", err);
        setMembers((prev) => prev.map((m) => (m.id === selectedMember.id ? { ...m, ...formData } : m)));
      }
    } else {
      // Add — only allowed when a single club is selected.
      if (!selectedClubId) return;
      try {
        let profileId = null;
        const { data: profileList } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", formData.email);
        if (profileList && profileList.length > 0) {
          profileId = profileList[0].id;
          await supabase
            .from("profiles")
            .update({ phone: formData.phone || null, student_code: formData.studentCode || null })
            .eq("id", profileId);
        } else {
          const { data: newProfileList, error: npError } = await supabase
            .from("profiles")
            .insert([
              {
                full_name: formData.name,
                email: formData.email,
                phone: formData.phone || null,
                student_code: formData.studentCode || null,
                status: formData.status ? formData.status.toLowerCase() : "active",
              },
            ])
            .select();
          if (npError) throw npError;
          profileId = newProfileList[0].id;
        }
        const { error: memError } = await supabase.from("memberships").insert([
          {
            club_id: selectedClubId,
            profile_id: profileId,
            position: formData.role || "Member",
            status: formData.status ? formData.status.toLowerCase() : "active",
            joined_at: new Date().toISOString().split("T")[0],
          },
        ]);
        if (memError) throw memError;
        await loadAll();
        handleCloseModal();
        return;
      } catch (err) {
        console.error("Supabase add member failed:", err);
        setErrorMsg(`Thêm thành viên thất bại: ${err.message || "Lỗi không xác định"}`);
      }
    }
    handleCloseModal();
  };

  const handleDeleteMember = async (id) => {
    if (isAllScope) {
      alert("Vui lòng chọn 1 CLB cụ thể trước khi xóa thành viên.");
      return;
    }
    if (confirm("Are you sure you want to remove this member from the club?")) {
      try {
        await membershipService.updateStatus(id, "left");
        loadAll();
      } catch (err) {
        console.warn("Supabase remove failed, updating local state:", err);
        setMembers((prev) => prev.filter((m) => m.id !== id));
      }
    }
  };

  const handleToggleStatus = async (id) => {
    if (isAllScope) {
      alert("Vui lòng chọn 1 CLB cụ thể trước khi đổi trạng thái.");
      return;
    }
    const currentMember = members.find((m) => m.id === id);
    if (!currentMember) return;
    const newStatus = currentMember.status === "Active" ? "inactive" : "active";
    try {
      await membershipService.updateStatus(id, newStatus);
      loadAll();
    } catch (err) {
      console.warn("Supabase status toggle failed, updating local state:", err);
      setMembers((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, status: m.status === "Active" ? "Inactive" : "Active" } : m
        )
      );
    }
  };

  if (leaderLoading) {
    return <Loading fullScreen />;
  }

  if (!leaderLoading && ledClubs.length === 0) {
    return (
      <>
        <LeaderDashboardHeader
          ledClubs={ledClubs}
          eyebrow="Members"
          title="Members Management"
          subtitle="Search, filter and manage members across the clubs you lead."
        />
        <LeaderEmptyState />
      </>
    );
  }

  const eyebrow = isAllScope
    ? `Members across ${ledClubs.length} club${ledClubs.length === 1 ? "" : "s"}`
    : selectedClub
      ? `Members of ${selectedClub.name}`
      : "Members Management";

  return (
    <div className="members-page">
      <div className="events-page__body members-page__body">
        <div className="events-page__container members-page__container">
          <LeaderDashboardHeader
            ledClubs={ledClubs}
            eyebrow={eyebrow}
            title="Members Management"
            subtitle="Search, filter and manage active committee and members."
          />

          <div className="events-page__header">
            <div>
              <h2 className="events-page__title">Members Directory</h2>
              <p className="events-page__subtitle">Search, filter and manage active committee and members.</p>
            </div>
            <div className="events-page__header-actions">
              {errorMsg && <span className="events-page__warn">⚠️ {errorMsg}</span>}
              <button type="button" className="events-page__btn-primary" onClick={handleOpenAddModal}>
                ➕ Add New Member
              </button>
            </div>
          </div>

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
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="members-page__filter-select">
                  <option value="All">All Roles</option>
                  <option value="Leader">Leader</option>
                  <option value="Member">Member</option>
                  <option value="Mentor">Mentor</option>
                </select>
              </div>

              <div className="members-page__filter">
                <span className="members-page__filter-label members-page__filter-label--sm">Status:</span>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="members-page__filter-select">
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

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
                      {isAllScope && <th className="members-page__th">Club</th>}
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
                        <tr key={`${m.id}-${m.clubId}`} className="members-page__row">
                          {isAllScope && (
                            <td className="members-page__td members-page__td--medium">
                              <span className="members-page__role members-page__role--leader">{m.clubName}</span>
                            </td>
                          )}
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
                            <span className={`members-page__role members-page__role--${m.role.toLowerCase()}`}>{m.role}</span>
                          </td>
                          <td className="members-page__td">
                            <span className={`members-page__status members-page__status--${m.status.toLowerCase()}`}>
                              <span className={`members-page__status-dot members-page__status-dot--${m.status.toLowerCase()}`} />
                              {m.status}
                            </span>
                          </td>
                          <td className="members-page__td members-page__td--actions">
                            <button
                              type="button"
                              onClick={() => handleOpenDetailModal(m)}
                              className="members-page__action members-page__action--detail"
                              title="View Details"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(m)}
                              className="members-page__action members-page__action--edit"
                              title="Edit"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(m.id)}
                              className="members-page__action members-page__action--toggle"
                              title="Toggle status"
                            >
                              {m.status === "Active" ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMember(m.id)}
                              className="members-page__action members-page__action--delete"
                              title="Remove"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={isAllScope ? 7 : 6} className="members-page__empty">
                          No members match your filters.
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

      <MemberFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        formData={formData}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        editing={!!selectedMember}
      />
      <MemberDetailModal
        open={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        member={selectedMember}
      />
    </div>
  );
}