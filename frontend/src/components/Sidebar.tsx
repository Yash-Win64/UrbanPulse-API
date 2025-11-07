import { NavLink } from "react-router-dom";
import { Wind, Cloud, Car } from "lucide-react";

export default function Sidebar() {
  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-5 py-3 rounded-lg font-medium transition-colors ${
      isActive ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800"
    }`;

  return (
    <aside className="w-56 bg-gray-950 p-4 border-r border-gray-800">
      <h2 className="text-lg font-semibold mb-6 text-blue-400">UrbanPulse</h2>
      <nav className="flex flex-col gap-2">
        <NavLink to="/traffic" className={linkClasses}>
          <Car size={18} /> Traffic
        </NavLink>
        <NavLink to="/weather" className={linkClasses}>
          <Cloud size={18} /> Weather
        </NavLink>
        <NavLink to="/air" className={linkClasses}>
          <Wind size={18} /> Air Quality
        </NavLink>
      </nav>
    </aside>
  );
}
