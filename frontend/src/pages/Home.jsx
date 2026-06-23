import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { eventService } from "../services/eventService";
import { alumniService } from "../services/alumniService";

export default function Home() {
  const [recentEvents, setRecentEvents] = useState([]);
  const [featuredAlumni, setFeaturedAlumni] = useState([]);

  useEffect(() => {
    // Fetch a couple of items to showcase on the home page
    const loadHomeData = async () => {
      try {
        const eventsList = await eventService.getEvents();
        setRecentEvents(eventsList.slice(0, 2));

        const alumniList = await alumniService.getAlumni();
        setFeaturedAlumni(alumniList.slice(0, 2));
      } catch (err) {
        console.error("Error loading home page preview data:", err);
      }
    };
    loadHomeData();
  }, []);

  return (
    <div className="flex-1 flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative px-6 py-20 md:py-32 primary-gradient overflow-hidden border-b border-white/5">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-accent-green/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-accent-blue/10 blur-3xl pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-accent-green/10 border border-accent-green/20 text-xs font-semibold text-accent-green mb-6 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green"></span>
            <span>Welcome to ClubHub FPTU MVP</span>
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-secondary-100 tracking-tight leading-tight">
            Connecting FPTU <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-accent-green to-accent-blue bg-clip-text text-transparent">
              Club Community
            </span>
          </h1>
          <p className="text-sm md:text-lg text-secondary-200 mt-6 max-w-2xl mx-auto leading-relaxed">
            Centralized club management platform for FPT University. Discover amazing campus events, share knowledge across student generations, and network with successful alumni.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/events"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl button-gradient text-white font-bold text-sm shadow-lg shadow-accent-green/10 hover:shadow-accent-green/25 hover:scale-[1.02] active:scale-95 transition-all text-center"
            >
              Explore Events
            </Link>
            <Link
              to="/alumni"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary-600 border border-white/10 hover:border-accent-green/40 hover:bg-primary-700 text-secondary-100 font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all text-center"
            >
              Alumni Directory
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="py-12 bg-primary-900 border-b border-white/5 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { count: "30+", label: "Active Clubs" },
            { count: "1,200+", label: "Club Members" },
            { count: "150+", label: "Events Hosted" },
            { count: "500+", label: "Connected Alumni" }
          ].map((stat, i) => (
            <div key={i} className="glass-panel p-6 rounded-2xl text-center border border-white/5">
              <span className="block text-3xl font-extrabold text-accent-green leading-none">
                {stat.count}
              </span>
              <span className="block text-xs font-semibold text-secondary-300 mt-2 uppercase tracking-wider">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Main Core Modules / Features Spotlights */}
      <section className="py-20 px-6 bg-primary-900 border-b border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-secondary-100">Core Features Built for FPTU</h2>
            <p className="text-sm text-secondary-300 mt-2 max-w-xl mx-auto">
              Everything FPT University clubs need to maintain continuity, host events, and foster strong networking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="glass-panel p-8 rounded-2xl border border-white/5 card-hover text-left flex flex-col h-full">
              <div className="w-12 h-12 rounded-xl bg-accent-green/10 border border-accent-green/20 flex items-center justify-center text-accent-green mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-secondary-100">Event Management</h3>
              <p className="text-xs text-secondary-300 mt-3 leading-relaxed flex-grow">
                View, register, and attend club activities. Leaders can create events, specify registration quotas, and use the check-in panel to log attendance during event execution.
              </p>
              <Link to="/events" className="text-accent-green text-xs font-bold mt-6 inline-flex items-center space-x-1 hover:underline">
                <span>Go to Events</span>
                <span>→</span>
              </Link>
            </div>

            {/* Feature 2 */}
            <div className="glass-panel p-8 rounded-2xl border border-white/5 card-hover text-left flex flex-col h-full">
              <div className="w-12 h-12 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-accent-blue mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-secondary-100">Alumni Directory</h3>
              <p className="text-xs text-secondary-300 mt-3 leading-relaxed flex-grow">
                Search FPT alumni profiles by graduation year, major, former clubs, and current job company. Submit your alumni profile or approve student requests as IC-PDP.
              </p>
              <Link to="/alumni" className="text-accent-blue text-xs font-bold mt-6 inline-flex items-center space-x-1 hover:underline">
                <span>Browse Alumni</span>
                <span>→</span>
              </Link>
            </div>

            {/* Feature 3 */}
            <div className="glass-panel p-8 rounded-2xl border border-white/5 card-hover text-left flex flex-col h-full">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-secondary-100">Knowledge Base</h3>
              <p className="text-xs text-secondary-300 mt-3 leading-relaxed flex-grow">
                Never lose files, manuals, codebases, or event strategies. Document procedures, store media links, and keep resources accessible for the next generation of leaders.
              </p>
              <Link to="/kb" className="text-purple-400 text-xs font-bold mt-6 inline-flex items-center space-x-1 hover:underline">
                <span>View Knowledge Base</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase Grid of Events & Alumni previews */}
      <section className="py-20 px-6 bg-primary-900 border-b border-white/5 relative">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Left Column: Upcoming Events Preview */}
          <div className="flex flex-col text-left">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-secondary-100">Featured Events</h3>
              <Link to="/events" className="text-accent-green hover:underline font-bold text-xs">
                View All Events
              </Link>
            </div>

            <div className="space-y-4">
              {recentEvents.map((evt) => (
                <div key={evt.id} className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row gap-4 border border-white/5 hover:border-accent-green/20 transition-all">
                  <div className={`w-full sm:w-28 h-20 rounded-xl bg-gradient-to-tr ${evt.banner_gradient} flex items-center justify-center text-white shrink-0`}>
                    <span className="text-[10px] uppercase font-bold tracking-wider">{evt.club_name.split(" ")[0]}</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-accent-green font-bold uppercase tracking-wider">{evt.club_name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          evt.status === "Finished" ? "bg-white/10 text-secondary-300" :
                          evt.status === "Ongoing" ? "bg-blue-500/20 text-accent-blue" :
                          "bg-accent-green/20 text-accent-green"
                        }`}>{evt.status}</span>
                      </div>
                      <h4 className="text-base font-bold text-secondary-100 mt-1">{evt.title}</h4>
                      <p className="text-xs text-secondary-300 line-clamp-1 mt-1 leading-normal">{evt.description}</p>
                    </div>
                    <div className="flex items-center text-[10px] text-secondary-300 mt-2 space-x-3">
                      <span className="flex items-center space-x-1">
                        <svg className="w-3.5 h-3.5 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{evt.date}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <svg className="w-3.5 h-3.5 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{evt.location.split(",")[0]}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Alumni Preview */}
          <div className="flex flex-col text-left">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-secondary-100">Alumni Spotlight</h3>
              <Link to="/alumni" className="text-accent-blue hover:underline font-bold text-xs">
                Search Alumni
              </Link>
            </div>

            <div className="space-y-4">
              {featuredAlumni.map((al) => (
                <div key={al.id} className="glass-panel p-5 rounded-2xl flex gap-4 border border-white/5 hover:border-accent-blue/20 transition-all">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-tr ${al.avatar_gradient} flex items-center justify-center font-bold text-white text-base shadow shrink-0`}>
                    {al.name.charAt(0)}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-bold text-secondary-100">{al.name}</h4>
                        <span className="text-[10px] text-accent-blue font-bold tracking-wider">Class of {al.graduation_year}</span>
                      </div>
                      <span className="text-xs text-secondary-200 block font-medium mt-0.5">{al.current_role} @ {al.current_company}</span>
                      <p className="text-xs text-secondary-300 mt-2 line-clamp-2 leading-normal italic">
                        "{al.bio}"
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                      <span className="text-[10px] text-secondary-300">Former {al.club_role} in {al.former_club.split(" ")[0]}</span>
                      <a href={al.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-accent-blue font-bold hover:underline inline-flex items-center space-x-0.5">
                        <span>LinkedIn Profile</span>
                        <span>↗</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
