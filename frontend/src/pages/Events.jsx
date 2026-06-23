import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { eventService } from "../services/eventService";

export default function Events() {
  const { user, role } = useAuth();
  
  // State
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("All"); // All, Upcoming, Ongoing, Finished
  const [searchQuery, setSearchQuery] = useState("");
  
  // Selected event for Detail Modal
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Modal toggle states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Success/Error notifications within page
  const [notification, setNotification] = useState(null);
  
  // Create Event Form state
  const [newEventForm, setNewEventForm] = useState({
    title: "",
    description: "",
    club_name: role === "Club Leader" ? (user.club_name || "JS Club (Javascript Club)") : "",
    date: "",
    time: "",
    location: "",
    capacity: 100,
    banner_gradient: "from-blue-600 to-indigo-800"
  });

  // Load events
  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await eventService.getEvents();
      setEvents(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load events. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Update club name in form when role changes
  useEffect(() => {
    if (role === "Club Leader") {
      setNewEventForm((prev) => ({
        ...prev,
        club_name: user.club_name || "JS Club (Javascript Club)"
      }));
    }
  }, [role, user]);

  const showToast = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Filters & Search
  const filteredEvents = events.filter((evt) => {
    const matchesSearch =
      evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.club_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.location.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (activeTab === "All") return matchesSearch;
    return evt.status.toLowerCase() === activeTab.toLowerCase() && matchesSearch;
  });

  // Handle Event Creation
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEventForm.title || !newEventForm.date || !newEventForm.location || !newEventForm.club_name) {
      showToast("Please fill in all required fields", "danger");
      return;
    }

    try {
      const created = await eventService.createEvent(newEventForm);
      showToast(`Successfully created event: "${created.title}"`);
      setShowCreateModal(false);
      // Reset form
      setNewEventForm({
        title: "",
        description: "",
        club_name: role === "Club Leader" ? (user.club_name || "JS Club (Javascript Club)") : "",
        date: "",
        time: "",
        location: "",
        capacity: 100,
        banner_gradient: getRandomGradient()
      });
      loadEvents(); // Reload lists
    } catch (err) {
      showToast(err.message || "Failed to create event", "danger");
    }
  };

  // Handle Registration
  const handleRegister = async (eventId) => {
    try {
      const updatedEvent = await eventService.registerForEvent(eventId, {
        student_id: user.student_id,
        name: user.name,
        email: user.email,
        role: user.role
      });
      showToast("Successfully registered for this event!");
      loadEvents(); // Reload list
      
      // Update selected event detail view if modal is open
      if (selectedEvent && selectedEvent.id === eventId) {
        const registrations = await eventService.getRegistrations(eventId);
        setSelectedEvent((prev) => ({
          ...prev,
          registered_count: prev.registered_count + 1,
          registrations: registrations
        }));
      }
    } catch (err) {
      showToast(err.message || "Registration failed", "danger");
    }
  };

  // Handle attendance check-in
  const handleCheckInToggle = async (eventId, studentId, currentStatus) => {
    try {
      await eventService.checkInAttendee(eventId, studentId, !currentStatus);
      
      // Refresh registrations in modal state
      const updatedRegs = await eventService.getRegistrations(eventId);
      setSelectedEvent((prev) => ({
        ...prev,
        registrations: updatedRegs
      }));
      
      showToast(`Updated check-in status for member.`);
      loadEvents(); // Sync main list
    } catch (err) {
      showToast(err.message || "Check-in update failed", "danger");
    }
  };

  // Helper colors/gradients
  const gradients = [
    { name: "Blue Sky", val: "from-blue-600 to-indigo-800" },
    { name: "Sunset Gold", val: "from-amber-500 to-red-600" },
    { name: "Emerald Mint", val: "from-emerald-600 to-teal-800" },
    { name: "Lava Red", val: "from-red-600 to-orange-500" },
    { name: "Deep Purple", val: "from-purple-600 to-pink-700" }
  ];

  const getRandomGradient = () => {
    const randomIndex = Math.floor(Math.random() * gradients.length);
    return gradients[randomIndex].val;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Upcoming": return "bg-accent-green/20 text-accent-green border border-accent-green/30";
      case "Ongoing": return "bg-accent-blue/20 text-accent-blue border border-accent-blue/30";
      case "Finished": return "bg-white/10 text-secondary-300 border border-white/10";
      case "Cancelled": return "bg-red-500/20 text-red-500 border border-red-500/30";
      default: return "bg-secondary-600 text-secondary-100";
    }
  };

  const isAlreadyRegistered = (evt) => {
    if (!evt || !evt.registrations) return false;
    return evt.registrations.some((r) => r.student_id === user.student_id);
  };

  const openDetails = async (evt) => {
    try {
      const registrations = await eventService.getRegistrations(evt.id);
      setSelectedEvent({ ...evt, registrations });
      setShowDetailsModal(true);
    } catch (err) {
      setSelectedEvent({ ...evt, registrations: [] });
      setShowDetailsModal(true);
    }
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 relative">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-5 py-3.5 rounded-xl shadow-2xl transition-all duration-300 animate-slide-in ${
          notification.type === "danger" ? "bg-red-500 text-white" : "bg-accent-green text-primary-900 font-bold"
        }`}>
          <span className="text-sm">{notification.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-6 mb-8 text-left">
        <div>
          <h1 className="text-3xl font-extrabold text-secondary-100 tracking-tight margin-0 leading-none">
            Campus Event Hub
          </h1>
          <p className="text-xs text-secondary-300 mt-2">
            Organize, register, and attend club activities at FPT University.
          </p>
        </div>
        
        {/* Actions - Create Event for Leaders/IC-PDP */}
        {(role === "Club Leader" || role === "IC-PDP") && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 md:mt-0 px-5 py-2.5 rounded-xl button-gradient text-white font-bold text-xs shadow-md shadow-accent-green/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Event</span>
          </button>
        )}
      </div>

      {/* Filters and Search controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search events, clubs, locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-primary-600/40 border border-white/10 rounded-xl py-2 px-10 text-xs text-secondary-100 placeholder-secondary-300 outline-none focus:border-accent-green transition-colors h-11"
          />
          <svg className="absolute left-3.5 top-3.5 w-4 h-4 text-secondary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center space-x-2 bg-primary-600/20 border border-white/5 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
          {["All", "Upcoming", "Ongoing", "Finished"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab
                  ? "bg-accent-green text-primary-900 shadow"
                  : "text-secondary-200 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-accent-green border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-secondary-300 mt-4 font-semibold">Loading events...</span>
        </div>
      ) : error ? (
        <div className="py-20 text-center glass-panel rounded-2xl border border-red-500/10 max-w-lg mx-auto">
          <span className="text-red-500 font-bold block">Error loading events</span>
          <p className="text-xs text-secondary-300 mt-1">{error}</p>
          <button onClick={loadEvents} className="mt-4 px-4 py-2 bg-primary-600 border border-white/10 text-xs rounded-xl font-bold text-secondary-100 hover:bg-primary-700">
            Retry
          </button>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="py-24 text-center glass-panel rounded-2xl border border-white/5">
          <svg className="w-12 h-12 text-secondary-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="block text-secondary-200 font-bold mt-4">No events found</span>
          <p className="text-xs text-secondary-300 mt-1">Try modifying your filters or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {filteredEvents.map((evt) => {
            const pct = Math.min(100, Math.round((evt.registered_count / evt.capacity) * 100));
            const registered = isAlreadyRegistered(evt);
            return (
              <div
                key={evt.id}
                className="bg-card-bg rounded-2xl border border-white/5 overflow-hidden flex flex-col h-full card-hover"
              >
                {/* Banner Gradient */}
                <div className={`h-36 bg-gradient-to-br ${evt.banner_gradient} p-5 flex flex-col justify-between relative`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-extrabold px-2.5 py-1 rounded bg-black/30 backdrop-blur-md text-white border border-white/10">
                      {evt.club_name.split(" ")[0]}
                    </span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide ${getStatusColor(evt.status)}`}>
                      {evt.status}
                    </span>
                  </div>
                  
                  {registered && (
                    <span className="absolute top-4 right-4 bg-accent-green text-primary-900 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider flex items-center space-x-1 shadow-lg shadow-accent-green/20">
                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Registered</span>
                    </span>
                  )}
                  
                  <div>
                    <h3 className="text-lg font-bold text-white leading-snug drop-shadow-md">
                      {evt.title}
                    </h3>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-accent-green font-bold tracking-wider uppercase block">
                      {evt.club_name}
                    </span>
                    <p className="text-xs text-secondary-300 mt-2 line-clamp-3 leading-relaxed">
                      {evt.description}
                    </p>
                  </div>

                  <div className="mt-5 space-y-4">
                    {/* Metadata */}
                    <div className="space-y-1.5 pt-4 border-t border-white/5">
                      <div className="flex items-center text-xs text-secondary-200">
                        <svg className="w-4 h-4 text-accent-green mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{evt.date} • {evt.time}</span>
                      </div>
                      <div className="flex items-center text-xs text-secondary-200">
                        <svg className="w-4 h-4 text-accent-green mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{evt.location}</span>
                      </div>
                    </div>

                    {/* Progress Registration */}
                    <div>
                      <div className="flex justify-between text-[10px] text-secondary-300 font-bold mb-1">
                        <span>REGISTRATION LIMIT</span>
                        <span>{evt.registered_count} / {evt.capacity} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-primary-600/30 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-accent-green h-full rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Details Button */}
                    <button
                      onClick={() => openDetails(evt)}
                      className="w-full py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 border border-white/5 text-secondary-100 font-bold text-xs hover:border-accent-green/20 transition-all cursor-pointer text-center"
                    >
                      View Details & Action
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: Create Event */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-card-bg border border-white/10 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-left relative animate-scale-in">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-secondary-300 hover:text-white cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-secondary-100 mb-6">Create New Event</h3>
            
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-secondary-200 mb-1.5 uppercase">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FPT TechDay 2026"
                  value={newEventForm.title}
                  onChange={(e) => setNewEventForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full bg-primary-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-secondary-100 outline-none focus:border-accent-green"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary-200 mb-1.5 uppercase">Description</label>
                <textarea
                  placeholder="Write details about the event, timeline, requirements..."
                  rows={3}
                  value={newEventForm.description}
                  onChange={(e) => setNewEventForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full bg-primary-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-secondary-100 outline-none focus:border-accent-green resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-secondary-200 mb-1.5 uppercase">Hosting Club *</label>
                  {role === "Club Leader" ? (
                    <input
                      type="text"
                      disabled
                      value={newEventForm.club_name}
                      className="w-full bg-primary-900/50 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-secondary-300 cursor-not-allowed"
                    />
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="e.g. JS Club"
                      value={newEventForm.club_name}
                      onChange={(e) => setNewEventForm((p) => ({ ...p, club_name: e.target.value }))}
                      className="w-full bg-primary-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-secondary-100 outline-none focus:border-accent-green"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary-200 mb-1.5 uppercase">Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hall Alpha, FPTU"
                    value={newEventForm.location}
                    onChange={(e) => setNewEventForm((p) => ({ ...p, location: e.target.value }))}
                    className="w-full bg-primary-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-secondary-100 outline-none focus:border-accent-green"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-secondary-200 mb-1.5 uppercase">Date *</label>
                  <input
                    type="date"
                    required
                    value={newEventForm.date}
                    onChange={(e) => setNewEventForm((p) => ({ ...p, date: e.target.value }))}
                    className="w-full bg-primary-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-secondary-100 outline-none focus:border-accent-green"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary-200 mb-1.5 uppercase">Time Window</label>
                  <input
                    type="text"
                    placeholder="e.g. 08:00 - 12:00"
                    value={newEventForm.time}
                    onChange={(e) => setNewEventForm((p) => ({ ...p, time: e.target.value }))}
                    className="w-full bg-primary-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-secondary-100 outline-none focus:border-accent-green"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary-200 mb-1.5 uppercase">Capacity Limit</label>
                  <input
                    type="number"
                    min={1}
                    value={newEventForm.capacity}
                    onChange={(e) => setNewEventForm((p) => ({ ...p, capacity: e.target.value }))}
                    className="w-full bg-primary-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-secondary-100 outline-none focus:border-accent-green"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary-200 mb-1.5 uppercase">Card Banner Style</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {gradients.map((grad) => (
                    <button
                      key={grad.val}
                      type="button"
                      onClick={() => setNewEventForm((p) => ({ ...p, banner_gradient: grad.val }))}
                      className={`h-10 rounded-lg bg-gradient-to-tr ${grad.val} border-2 flex items-center justify-center text-[10px] text-white font-bold cursor-pointer transition-all ${
                        newEventForm.banner_gradient === grad.val ? "border-accent-green scale-105" : "border-transparent"
                      }`}
                    >
                      {grad.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-secondary-200 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl button-gradient text-white text-xs font-bold cursor-pointer"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Event Details & Action */}
      {showDetailsModal && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-card-bg border border-white/10 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 text-left relative animate-scale-in">
            
            <button
              onClick={() => setShowDetailsModal(false)}
              className="absolute top-4 right-4 text-secondary-300 hover:text-white cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Event Header Banner */}
            <div className={`p-6 rounded-xl bg-gradient-to-br ${selectedEvent.banner_gradient} text-white mb-6`}>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-black/30 border border-white/10">
                  {selectedEvent.club_name.split(" ")[0]}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getStatusColor(selectedEvent.status)}`}>
                  {selectedEvent.status}
                </span>
              </div>
              <h2 className="text-2xl font-extrabold mt-3 leading-snug drop-shadow-md">
                {selectedEvent.title}
              </h2>
              <span className="text-xs text-white/90 font-bold block mt-1 tracking-wider uppercase">
                Hosted by {selectedEvent.club_name}
              </span>
            </div>

            {/* Grid Split Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Details & Registration */}
              <div className="lg:col-span-2 space-y-5">
                <div>
                  <h4 className="text-xs font-bold text-accent-green uppercase tracking-wider">About the Event</h4>
                  <p className="text-xs text-secondary-100 mt-2 leading-relaxed whitespace-pre-line">
                    {selectedEvent.description || "No description provided."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <div>
                    <h5 className="text-[10px] font-bold text-secondary-300 uppercase">Date & Time</h5>
                    <div className="flex items-center text-xs font-semibold text-secondary-100 mt-1">
                      <svg className="w-4 h-4 text-accent-green mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{selectedEvent.date} ({selectedEvent.time || "N/A"})</span>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-[10px] font-bold text-secondary-300 uppercase">Location</h5>
                    <div className="flex items-center text-xs font-semibold text-secondary-100 mt-1">
                      <svg className="w-4 h-4 text-accent-green mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{selectedEvent.location}</span>
                    </div>
                  </div>
                </div>

                {/* Capacity Counter */}
                <div className="p-4 bg-primary-600/30 rounded-xl border border-white/5">
                  <div className="flex justify-between items-center text-xs font-bold text-secondary-200 mb-2">
                    <span>Attendance quota progress:</span>
                    <span>{selectedEvent.registered_count} / {selectedEvent.capacity} seats taken</span>
                  </div>
                  <div className="w-full bg-primary-900 rounded-full h-2 overflow-hidden mb-3">
                    <div
                      className="bg-accent-green h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (selectedEvent.registered_count / selectedEvent.capacity) * 100)}%` }}
                    ></div>
                  </div>
                  
                  {/* Actions for Student registration */}
                  <div className="flex items-center justify-between gap-4 pt-2">
                    {isAlreadyRegistered(selectedEvent) ? (
                      <div className="bg-accent-green/10 border border-accent-green/20 rounded-xl px-4 py-2.5 w-full flex items-center justify-center space-x-2 text-accent-green font-bold text-xs text-center">
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>You are registered for this event</span>
                      </div>
                    ) : selectedEvent.status === "Finished" ? (
                      <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 w-full text-secondary-300 font-bold text-xs text-center">
                        This event has already finished
                      </div>
                    ) : selectedEvent.status === "Cancelled" ? (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 w-full text-red-500 font-bold text-xs text-center">
                        This event was cancelled
                      </div>
                    ) : selectedEvent.registered_count >= selectedEvent.capacity ? (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 w-full text-red-500 font-bold text-xs text-center">
                        Registration quota is full
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRegister(selectedEvent.id)}
                        className="w-full py-2.5 rounded-xl button-gradient text-white font-bold text-xs shadow-md hover:scale-[1.01] transition-transform cursor-pointer text-center"
                      >
                        Register to Join Event
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Attendance / Manager Check-in Panel (Club Leader/IC-PDP only) */}
              <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-white/5 pt-6 lg:pt-0 lg:pl-6 text-left">
                <h4 className="text-xs font-bold text-accent-blue uppercase tracking-wider mb-3">
                  Attendance Check-in
                </h4>

                {/* Validate user authority */}
                {(role === "Club Leader" || role === "IC-PDP") ? (
                  <div className="space-y-3">
                    <p className="text-[10px] text-secondary-300 leading-normal">
                      As a <strong>{role}</strong>, you can toggle attendance status during the event check-in.
                    </p>

                    <div className="bg-primary-900 border border-white/5 rounded-xl p-3 max-h-60 overflow-y-auto space-y-2">
                      {!selectedEvent.registrations || selectedEvent.registrations.length === 0 ? (
                        <p className="text-[10px] text-secondary-300 text-center py-6">No registrations yet.</p>
                      ) : (
                        selectedEvent.registrations.map((reg) => (
                          <div
                            key={reg.student_id}
                            className="flex items-center justify-between border-b border-white/5 pb-2 last:border-b-0 last:pb-0"
                          >
                            <div className="flex flex-col max-w-[70%]">
                              <span className="text-[11px] font-bold text-secondary-100 truncate">
                                {reg.name}
                              </span>
                              <span className="text-[9px] text-secondary-300 leading-none">
                                {reg.student_id} • {reg.role}
                              </span>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => handleCheckInToggle(selectedEvent.id, reg.student_id, reg.checked_in)}
                              className={`px-2 py-1 rounded text-[9px] font-extrabold uppercase transition-colors cursor-pointer border ${
                                reg.checked_in
                                  ? "bg-accent-green/20 text-accent-green border-accent-green/30 hover:bg-accent-green/30"
                                  : "bg-primary-600 text-secondary-200 border-white/5 hover:bg-primary-700"
                              }`}
                            >
                              {reg.checked_in ? "Attended" : "Check-in"}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-primary-600/30 rounded-xl border border-white/5 p-4 text-center py-8">
                    <svg className="w-8 h-8 text-secondary-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <p className="text-[10px] text-secondary-300 mt-3 leading-normal">
                      Only <strong>Club Leaders</strong> or <strong>IC-PDP</strong> admins have check-in authority.
                    </p>
                    <p className="text-[9px] text-accent-green mt-2 leading-tight">
                      Use the "Role Selector" in the top navbar to switch roles and test this dashboard.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/5 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-secondary-100 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
