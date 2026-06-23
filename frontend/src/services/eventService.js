import { supabase } from "./supabase";

// Helper to check if Supabase is properly configured
const isSupabaseConfigured = () => {
  return (
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_URL !== "" &&
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    import.meta.env.VITE_SUPABASE_ANON_KEY !== ""
  );
};

// Rich Mock Data for LocalStorage Fallback
const DEFAULT_EVENTS = [
  {
    id: "evt-1",
    title: "FPT TechDay 2026",
    description: "An annual tech exhibition showcasing innovative student projects, workshops by industry experts, and coding challenges with prizes up to 10M VND. Join us to experience the latest in AI, IoT, and Web3.",
    club_name: "JS Club (Javascript Club)",
    date: "2026-07-15",
    time: "08:00 - 17:00",
    location: "Hall Alpha, FPTU Campus",
    status: "Upcoming",
    capacity: 200,
    registered_count: 145,
    banner_gradient: "from-blue-600 to-indigo-800",
    registrations: [
      { student_id: "HE150123", name: "Nguyen Van An", email: "annvhe150123@fpt.edu.vn", role: "Student", checked_in: false },
      { student_id: "HE160245", name: "Tran Thi Binh", email: "binhtthe160245@fpt.edu.vn", role: "Student", checked_in: false },
      { student_id: "HE160999", name: "Le Hoang Nam", email: "namlhhe160999@fpt.edu.vn", role: "Club Member", checked_in: false }
    ]
  },
  {
    id: "evt-2",
    title: "Golden Bell Challenge 2026",
    description: "Test your knowledge of English vocabulary, grammar, and general knowledge in this thrilling arena quiz. Over 100 students compete, but only one will ring the Golden Bell!",
    club_name: "FPTU English Club (EC)",
    date: "2026-07-20",
    time: "13:30 - 16:30",
    location: "Hall Beta, FPTU Campus",
    status: "Upcoming",
    capacity: 100,
    registered_count: 88,
    banner_gradient: "from-amber-500 to-red-600",
    registrations: [
      { student_id: "HE150123", name: "Nguyen Van An", email: "annvhe150123@fpt.edu.vn", role: "Student", checked_in: false },
      { student_id: "HE140567", name: "Pham Minh Duc", email: "ducpmhe140567@fpt.edu.vn", role: "Student", checked_in: false }
    ]
  },
  {
    id: "evt-3",
    title: "Club Orientation Day 2026",
    description: "Welcome K21 students! Meet all 30+ clubs at FPT University, watch live performances, participate in minigames, and find your second home on campus. Mandatory check-in for active members.",
    club_name: "IC-PDP (Department of Personal Development)",
    date: "2026-06-15",
    time: "09:00 - 16:00",
    location: "FPTU Campus Yard",
    status: "Finished",
    capacity: 500,
    registered_count: 420,
    banner_gradient: "from-emerald-600 to-teal-800",
    registrations: [
      { student_id: "HE150123", name: "Nguyen Van An", email: "annvhe150123@fpt.edu.vn", role: "Student", checked_in: true },
      { student_id: "HE160245", name: "Tran Thi Binh", email: "binhtthe160245@fpt.edu.vn", role: "Student", checked_in: true },
      { student_id: "HE160999", name: "Le Hoang Nam", email: "namlhhe160999@fpt.edu.vn", role: "Club Member", checked_in: true }
    ]
  },
  {
    id: "evt-4",
    title: "Vovinam Championship 2026",
    description: "The premier martial arts tournament at FPT University. Watch members from the Vovinam Club showcase their skills in self-defense, performance, and sparring categories.",
    club_name: "FPTU Vovinam Club",
    date: "2026-06-23",
    time: "08:00 - 12:00",
    location: "Sports Center, FPTU Campus",
    status: "Ongoing",
    capacity: 150,
    registered_count: 110,
    banner_gradient: "from-red-600 to-orange-500",
    registrations: [
      { student_id: "HE160245", name: "Tran Thi Binh", email: "binhtthe160245@fpt.edu.vn", role: "Student", checked_in: true },
      { student_id: "HE140567", name: "Pham Minh Duc", email: "ducpmhe140567@fpt.edu.vn", role: "Student", checked_in: false }
    ]
  },
  {
    id: "evt-5",
    title: "Acoustic Night: Summer Vibes",
    description: "An intimate music night under the stars. Relax with acoustic covers of classic and modern songs, and join the open-mic session to share your own music.",
    club_name: "F-Music Club (FMC)",
    date: "2026-07-02",
    time: "18:30 - 21:30",
    location: "Library Ground, FPTU Campus",
    status: "Upcoming",
    capacity: 120,
    registered_count: 75,
    banner_gradient: "from-purple-600 to-pink-700",
    registrations: [
      { student_id: "HE160999", name: "Le Hoang Nam", email: "namlhhe160999@fpt.edu.vn", role: "Club Member", checked_in: false }
    ]
  }
];

// LocalStorage helpers
const getLocalEvents = () => {
  const data = localStorage.getItem("clubhub_events");
  if (!data) {
    localStorage.setItem("clubhub_events", JSON.stringify(DEFAULT_EVENTS));
    return DEFAULT_EVENTS;
  }
  return JSON.parse(data);
};

const saveLocalEvents = (events) => {
  localStorage.setItem("clubhub_events", JSON.stringify(events));
};

export const eventService = {
  // Get all events
  async getEvents() {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .order("date", { ascending: true });
        if (!error) return data;
        console.warn("Supabase error fetching events, falling back to local storage:", error);
      } catch (e) {
        console.warn("Supabase exception, falling back to local storage:", e);
      }
    }
    return getLocalEvents();
  },

  // Create a new event
  async createEvent(eventData) {
    const newEvent = {
      id: eventData.id || `evt-${Date.now()}`,
      title: eventData.title,
      description: eventData.description,
      club_name: eventData.club_name,
      date: eventData.date,
      time: eventData.time,
      location: eventData.location,
      status: eventData.status || "Upcoming",
      capacity: parseInt(eventData.capacity) || 100,
      registered_count: 0,
      banner_gradient: eventData.banner_gradient || "from-teal-600 to-cyan-800",
      registrations: []
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("events")
          .insert([newEvent])
          .select()
          .single();
        if (!error) return data;
        console.warn("Supabase error creating event, falling back to local storage:", error);
      } catch (e) {
        console.warn("Supabase exception, falling back to local storage:", e);
      }
    }

    const events = getLocalEvents();
    events.unshift(newEvent);
    saveLocalEvents(events);
    return newEvent;
  },

  // Update an existing event
  async updateEvent(eventId, eventData) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("events")
          .update(eventData)
          .eq("id", eventId)
          .select()
          .single();
        if (!error) return data;
        console.warn("Supabase error updating event, falling back to local storage:", error);
      } catch (e) {
        console.warn("Supabase exception, falling back to local storage:", e);
      }
    }

    const events = getLocalEvents();
    const index = events.findIndex((e) => e.id === eventId);
    if (index !== -1) {
      events[index] = { ...events[index], ...eventData };
      saveLocalEvents(events);
      return events[index];
    }
    throw new Error("Event not found");
  },

  // Register for an event
  async registerForEvent(eventId, user) {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from("event_registrations")
          .insert([{ event_id: eventId, student_id: user.student_id, name: user.name, email: user.email, role: user.role }]);
        if (!error) {
          // Increment registered count
          await supabase.rpc("increment_event_registered_count", { event_id: eventId });
          return true;
        }
        console.warn("Supabase error registering for event, falling back to local storage:", error);
      } catch (e) {
        console.warn("Supabase exception, falling back to local storage:", e);
      }
    }

    const events = getLocalEvents();
    const index = events.findIndex((e) => e.id === eventId);
    if (index !== -1) {
      const event = events[index];
      // Check if already registered
      const isAlreadyRegistered = event.registrations.some(
        (r) => r.student_id === user.student_id
      );
      if (isAlreadyRegistered) {
        throw new Error("You have already registered for this event");
      }
      if (event.registered_count >= event.capacity) {
        throw new Error("This event is fully booked");
      }
      
      event.registrations.push({
        student_id: user.student_id,
        name: user.name,
        email: user.email,
        role: user.role || "Student",
        checked_in: false
      });
      event.registered_count += 1;
      events[index] = event;
      saveLocalEvents(events);
      return event;
    }
    throw new Error("Event not found");
  },

  // Get registrations for check-in
  async getRegistrations(eventId) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("event_registrations")
          .select("*")
          .eq("event_id", eventId);
        if (!error) return data;
        console.warn("Supabase error getting registrations, falling back to local storage:", error);
      } catch (e) {
        console.warn("Supabase exception, falling back to local storage:", e);
      }
    }

    const events = getLocalEvents();
    const event = events.find((e) => e.id === eventId);
    return event ? event.registrations : [];
  },

  // Toggle/set attendance check-in status
  async checkInAttendee(eventId, studentId, checkedIn) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("event_registrations")
          .update({ checked_in: checkedIn })
          .eq("event_id", eventId)
          .eq("student_id", studentId)
          .select()
          .single();
        if (!error) return data;
        console.warn("Supabase error checking in, falling back to local storage:", error);
      } catch (e) {
        console.warn("Supabase exception, falling back to local storage:", e);
      }
    }

    const events = getLocalEvents();
    const index = events.findIndex((e) => e.id === eventId);
    if (index !== -1) {
      const event = events[index];
      const regIndex = event.registrations.findIndex((r) => r.student_id === studentId);
      if (regIndex !== -1) {
        event.registrations[regIndex].checked_in = checkedIn;
        events[index] = event;
        saveLocalEvents(events);
        return event.registrations[regIndex];
      }
    }
    throw new Error("Registration not found");
  }
};
