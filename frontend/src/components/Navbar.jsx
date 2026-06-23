import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar() {
  const { role, changeRole, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/events", label: "Events" },
    { to: "/alumni", label: "Alumni Directory" },
    { to: "/kb", label: "Knowledge Base" },
    { to: "/ai", label: "AI Assistant" }
  ];

  return (
    <nav className="sticky top-0 z-50 h-20 bg-primary-900/95 border-b border-white/5 backdrop-blur-md px-6 flex items-center justify-between max-w-full">
      {/* Brand Logo */}
      <Link to="/" className="flex items-center space-x-2 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-800 to-accent-green flex items-center justify-center font-bold text-xl text-white shadow-md shadow-accent-green/20 group-hover:scale-105 transition-transform">
          C
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-lg text-secondary-100 tracking-wide leading-none group-hover:text-accent-green transition-colors">
            ClubHub
          </span>
          <span className="text-xs text-secondary-300 font-medium tracking-widest uppercase">
            FPT University
          </span>
        </div>
      </Link>

      {/* Desktop Navigation Links */}
      <div className="hidden lg:flex items-center space-x-6">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `text-sm font-semibold tracking-wide transition-all hover:text-accent-green ${
                isActive ? "text-accent-green border-b-2 border-accent-green pb-1" : "text-secondary-200"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>

      {/* Role Switcher & User Profile */}
      <div className="hidden md:flex items-center space-x-4">
        {/* Role Switcher Selector */}
        <div className="flex items-center space-x-2 bg-primary-600/50 border border-white/10 rounded-xl px-3 py-1.5">
          <span className="text-xs text-secondary-300 font-medium">Role:</span>
          <select
            value={role}
            onChange={(e) => changeRole(e.target.value)}
            className="bg-transparent text-accent-green font-bold text-xs outline-none cursor-pointer border-none p-0 select-none"
          >
            <option value="Student" className="bg-primary-900 text-secondary-100">Student</option>
            <option value="Club Member" className="bg-primary-900 text-secondary-100">Club Member</option>
            <option value="Club Leader" className="bg-primary-900 text-secondary-100">Club Leader</option>
            <option value="IC-PDP" className="bg-primary-900 text-secondary-100">IC-PDP (Admin)</option>
          </select>
        </div>

        {/* User Info Badge */}
        <div className="flex items-center space-x-2 bg-primary-800/80 border border-white/5 rounded-xl py-1.5 px-3">
          <div className="w-6 h-6 rounded-full bg-accent-green flex items-center justify-center text-white text-xs font-bold uppercase">
            {user.name.charAt(0)}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-secondary-100 leading-tight">
              {user.name}
            </span>
            <span className="text-[10px] text-secondary-300">
              {user.student_id}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Menu Button */}
      <div className="flex lg:hidden items-center space-x-3">
        {/* Role Switcher in Mobile Nav */}
        <div className="flex items-center space-x-1 bg-primary-600/30 border border-white/10 rounded-lg px-2 py-1">
          <select
            value={role}
            onChange={(e) => changeRole(e.target.value)}
            className="bg-transparent text-accent-green font-bold text-xs outline-none cursor-pointer border-none"
          >
            <option value="Student" className="bg-primary-900 text-secondary-100">Student</option>
            <option value="Club Member" className="bg-primary-900 text-secondary-100">Member</option>
            <option value="Club Leader" className="bg-primary-900 text-secondary-100">Leader</option>
            <option value="IC-PDP" className="bg-primary-900 text-secondary-100">IC-PDP</option>
          </select>
        </div>

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 rounded-xl bg-primary-800/50 text-secondary-100 border border-white/5 outline-none hover:bg-primary-700/50"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {isMenuOpen && (
        <div className="absolute top-20 left-0 w-full bg-primary-900 border-b border-white/10 p-6 flex flex-col space-y-4 shadow-xl z-40 lg:hidden">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setIsMenuOpen(false)}
              className={({ isActive }) =>
                `text-base font-semibold transition-all py-2 border-b border-white/5 ${
                  isActive ? "text-accent-green" : "text-secondary-200"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          {/* User profile inside drawer for mobile */}
          <div className="flex items-center space-x-3 pt-2">
            <div className="w-8 h-8 rounded-full bg-accent-green flex items-center justify-center text-white text-sm font-bold uppercase">
              {user.name.charAt(0)}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-semibold text-secondary-100 leading-tight">
                {user.name}
              </span>
              <span className="text-xs text-secondary-300">
                {user.student_id} • {user.role}
              </span>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
