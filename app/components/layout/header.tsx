import { Bell, User } from 'lucide-react';
import Stories from '@/components/Stories/stories';

function Header() {
  return (
    <header className="w-full bg-gradient-to-b from-gray-900 to-transparent text-white absolute top-0 left-0 z-991">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <img src="logo.jpeg" alt="Logo" className="w-6 h-6 rounded" />
            </div>
          <div className="leading-tight">
            <h1 className="text-sm font-semibold tracking-wide">OZIO</h1>
            <span className="text-[10px] text-zinc-400 uppercase">
              Nightlife
            </span>
          </div>
        </div>

        {/* Right: Icons */}
        <div className="flex items-center gap-4">
          <button className="hover:text-blue-400 transition">
            <Bell size={18} />
          </button>
          <button className="hover:text-blue-400 transition">
            <User size={18} />
          </button>
        </div>

      </div>
      <Stories />
    </header>
  );
}

export default Header;
