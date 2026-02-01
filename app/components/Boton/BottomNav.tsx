import { Compass, Sparkles, Heart, User } from 'lucide-react';

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-990">
      <div className="max-w-md mx-auto h-16 flex items-center justify-around">

        <NavItem
          icon={<Compass size={20} />}
          label="Explore"
          active
        />

        <NavItem
          icon={<Sparkles size={20} />}
          label="VibeCheck"
        />

        <NavItem
          icon={<Heart size={20} />}
          label="Saved"
        />

        <NavItem
          icon={<User size={20} />}
          label="Profile"
        />

      </div>
    </nav>
  );
}

function NavItem({ icon, label, active }) {
  return (
    <button
      className={`flex flex-col items-center justify-center gap-1 text-xs transition
        ${active ? 'text-blue-500' : 'text-zinc-400 hover:text-zinc-200'}
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default BottomNav;
