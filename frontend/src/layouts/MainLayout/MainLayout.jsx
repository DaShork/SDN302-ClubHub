import { useState } from "react";
import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import logoImg from "../../assets/logo.png";

export default function MainLayout() {
  const { clubId } = useParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Mock data for Topbar
  const clubName = "FPTU Software Engineering Club (F-Code)";
  const user = {
    name: "Lê Thanh Tùng",
    role: "Club Leader",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=tunglt",
    email: "tungltse160123@fpt.edu.vn"
  };

  const navItems = [
    {
      name: "Dashboard",
      path: `/club/${clubId}/dashboard`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      )
    },
    {
      name: "Members",
      path: `/club/${clubId}/members`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      name: "Events",
      path: `/club/${clubId}/events`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      name: "Workshops",
      path: `/club/${clubId}/workshops`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
        </svg>
      )
    },
    {
      name: "Knowledge",
      path: `/club/${clubId}/knowledge`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      name: "Documents",
      path: `/club/${clubId}/documents`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
        </svg>
      )
    },
    {
      name: "Announcements",
      path: `/club/${clubId}/announcements`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      )
    }
  ];

  return (
    <div className="flex min-h-[100dvh] overflow-hidden bg-[#F4F1EA] text-[#06231D]">
      {/* 1. Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white/80 backdrop-blur-md border-r border-[#06231D]/10 flex-shrink-0">
        {/* Brand/Logo - Premium Dark Green style */}
        <div className="h-20 flex items-center px-6 border-b border-[#06231D]/10 bg-[#06231D] relative overflow-hidden">
          <Link to="/" className="flex items-center gap-3 relative z-10">
            <img src={logoImg} alt="ClubHub Logo" className="h-10 w-10 object-contain rounded-full bg-white p-0.5" />
            <span className="font-bold text-lg tracking-wider text-white">ClubHub</span>
          </Link>
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0E4B43] to-[#22C55E]/20 opacity-40"></div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 tactile-btn ${
                  isActive
                    ? "bg-[#22C55E]/10 text-[#0E4B43] shadow-[inset_3px_0_0_#22C55E]"
                    : "text-[#4A5D59] hover:bg-[#06231D]/5 hover:text-[#06231D]"
                }`
              }
            >
              <span className="opacity-80">{item.icon}</span>
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Quick Back link */}
        <div className="p-4 border-t border-[#06231D]/10">
          <Link to="/" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-[#06231D]/10 hover:bg-[#06231D]/5 text-xs font-semibold text-[#4A5D59] hover:text-[#06231D] transition-all tactile-btn">
            <span>←</span> Back to Main Portal
          </Link>
        </div>
      </aside>

      {/* Mobile Sidebar overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          
          <aside className="relative flex flex-col w-64 max-w-xs bg-white border-r border-[#06231D]/10 z-50 animate-slide-in">
            <div className="h-20 flex items-center justify-between px-6 border-b border-[#06231D]/10 bg-[#06231D]">
              <Link to="/" className="flex items-center gap-3">
                <img src={logoImg} alt="ClubHub Logo" className="h-10 w-10 object-contain rounded-full bg-white p-0.5" />
                <span className="font-bold text-lg tracking-wider text-white">ClubHub</span>
              </Link>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-white hover:text-gray-200 p-1">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-[#22C55E]/10 text-[#0E4B43] border-l-4 border-[#22C55E] font-bold"
                        : "text-[#4A5D59] hover:bg-[#06231D]/5 hover:text-[#06231D]"
                    }`
                  }
                >
                  {item.icon}
                  {item.name}
                </NavLink>
              ))}
            </nav>

            <div className="p-4 border-t border-[#06231D]/10">
              <Link to="/" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-[#06231D]/10 hover:bg-[#06231D]/5 text-xs text-[#4A5D59] hover:text-[#06231D] transition-all">
                ← Back to Main Portal
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* Main Container */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* 2. Topbar */}
        <header className="h-20 flex items-center justify-between px-6 bg-white/85 backdrop-blur-md border-b border-[#06231D]/10 z-40 flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* Hamburger for mobile */}
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-[#06231D] hover:text-[#0E4B43] p-1.5 hover:bg-gray-100 rounded-xl transition-all tactile-btn">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {/* Club Information Banner */}
            <div>
              <div className="text-xs text-[#22C55E] font-bold tracking-widest uppercase">Club Context</div>
              <h1 className="text-sm md:text-base font-bold text-[#06231D] truncate max-w-[200px] sm:max-w-md">{clubName}</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications Panel */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="p-2.5 text-[#06231D] hover:bg-gray-100 bg-gray-50 rounded-xl border border-gray-200/80 transition-all relative tactile-btn"
              >
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>

              {isNotificationOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotificationOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#06231D]/10 py-2 z-50 animate-fade-in text-sm text-[#06231D] premium-shadow">
                    <div className="px-4 py-2 border-b border-[#06231D]/10 font-bold text-[#06231D]">Notifications</div>
                    <div className="max-h-64 overflow-y-auto">
                      <div className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 cursor-pointer transition-all">
                        <p className="font-semibold text-xs text-[#06231D]">New member registration</p>
                        <p className="text-[#4A5D59] text-[11px] mt-0.5">Nguyễn Văn A requested to join the club.</p>
                      </div>
                      <div className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 cursor-pointer transition-all">
                        <p className="font-semibold text-xs text-[#06231D]">Workshop update</p>
                        <p className="text-[#4A5D59] text-[11px] mt-0.5">Vite + TailwindCSS workshop starts in 2 hours.</p>
                      </div>
                    </div>
                    <div className="px-4 py-2 text-center text-xs text-[#22C55E] hover:underline cursor-pointer border-t border-[#06231D]/10 mt-1 font-bold">
                      View all alerts
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-3 p-1.5 pr-3 text-[#06231D] hover:bg-gray-100 bg-gray-50 rounded-xl border border-gray-200/80 transition-all tactile-btn"
              >
                <img src={user.avatar} className="w-8 h-8 rounded-lg bg-[#0E4B43]" alt="avatar" />
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-[#06231D] leading-tight">{user.name}</div>
                  <div className="text-[10px] text-[#22C55E] font-bold tracking-wider leading-none mt-0.5">{user.role}</div>
                </div>
                <svg className="w-4 h-4 text-[#4A5D59] hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isUserMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#06231D]/10 py-2 z-50 animate-fade-in text-sm text-[#06231D]">
                    <div className="px-4 py-3 border-b border-[#06231D]/10">
                      <p className="font-bold leading-tight">{user.name}</p>
                      <p className="text-[#4A5D59] text-xs truncate mt-0.5">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link to="/" onClick={() => setIsUserMenuOpen(false)} className="block px-4 py-2 text-[#4A5D59] hover:bg-gray-50 hover:text-[#06231D]">
                        My Profile
                      </Link>
                      <Link to="/" onClick={() => setIsUserMenuOpen(false)} className="block px-4 py-2 text-[#4A5D59] hover:bg-gray-50 hover:text-[#06231D]">
                        Club Settings
                      </Link>
                    </div>
                    <div className="border-t border-gray-100 pt-1 mt-1">
                      <button className="block w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 font-bold transition-all">
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* 3. Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#F4F1EA] p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Dynamic Content */}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
