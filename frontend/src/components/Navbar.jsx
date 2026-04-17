import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth(); 
  const location = useLocation();

  // Completely hide the navbar on depot portal — it has its own header
  if (location.pathname.startsWith('/depot-login')) return null;

  return (
    <div className="bg-blue-600 text-white p-4 flex flex-col md:flex-row justify-between items-center shadow-lg px-8 gap-4 md:gap-0">
      <Link to="/" className="text-2xl font-black tracking-tighter hover:text-blue-100 transition">SmartBus</Link>
      <div className="flex flex-wrap justify-center md:justify-end items-center gap-3 md:gap-6 font-bold uppercase tracking-widest text-[10px]">

        {user && (
          <>
            <Link to="/passes" className="bg-blue-800 px-3 py-1 rounded border border-blue-700 hover:bg-blue-700 transition">Bus Passes</Link>
            <Link to="/tickets" className="hover:text-blue-100 transition">My History</Link>
          </>
        )}

        {user?.role === 'ADMIN' && (
          <Link to="/admin" className="bg-white/10 px-3 py-1 rounded border border-white/20 hover:bg-white/20 transition">Admin Panel</Link>
        )}
        
        {user?.role === 'CONDUCTOR' && (
          <Link to="/conductor" className="bg-green-500/80 px-3 py-1 rounded border border-green-400 hover:bg-green-600 transition">Scanner</Link>
        )}
        
        {user ? (
          <div className="flex items-center gap-4 border-l pl-6 border-blue-500">
            <span className="text-blue-200">Hi, {user.name}</span>
            <button 
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded shadow-sm text-white transition"
            >
              Logout
            </button>
          </div>
        ) : !location.pathname.startsWith('/login') && (
          <Link to="/login" className="bg-white text-blue-600 px-4 py-1 rounded shadow-sm hover:bg-blue-50 transition">
            Login
          </Link>
        )}
      </div>
    </div>
  );
}
