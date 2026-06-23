export default function Footer() {
  return (
    <footer className="w-full bg-primary-900 border-t border-white/5 py-10 px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0">
        
        {/* Brand Information */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-800 to-accent-green flex items-center justify-center font-bold text-base text-white">
              C
            </div>
            <span className="font-bold text-base text-secondary-100 tracking-wider">
              ClubHub FPTU
            </span>
          </div>
          <p className="text-xs text-secondary-300 mt-2 max-w-xs">
            Centralized Club Management Platform. Supporting student activities, knowledge preservation, and alumni networking.
          </p>
        </div>

        {/* Links */}
        <div className="flex space-x-8 text-xs text-secondary-200">
          <a href="#" className="hover:text-accent-green transition-colors">
            FPT University
          </a>
          <a href="#" className="hover:text-accent-green transition-colors">
            IC-PDP Department
          </a>
          <a href="#" className="hover:text-accent-green transition-colors">
            Support Center
          </a>
          <a href="#" className="hover:text-accent-green transition-colors">
            Privacy Policy
          </a>
        </div>

        {/* Copyright */}
        <div className="text-center md:text-right">
          <span className="text-[10px] text-secondary-300 block">
            © {new Date().getFullYear()} ClubHub FPTU. Developed as an MVP for SDN302.
          </span>
          <span className="text-[10px] text-accent-green font-semibold block mt-1">
            Built with React + Vite + TailwindCSS + Supabase
          </span>
        </div>

      </div>
    </footer>
  );
}
