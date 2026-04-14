import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth(); 

  return (
    <div className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-lg px-8">
      <Link to="/" className="text-2xl font-black tracking-tighter hover:text-blue-100 transition">SmartBus</Link>
      <div className="flex items-center gap-6 font-bold uppercase tracking-widest text-[10px]">
        <Link to="/" className="hover:text-blue-100 transition">Search</Link>
        <Link to="/tickets" className="hover:text-blue-100 transition">My History</Link>
        
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
        ) : (
          <Link to="/login" className="bg-white text-blue-600 px-4 py-1 rounded shadow-sm hover:bg-blue-50 transition">
            Login
          </Link>
        )}
      </div>
    </div>
  );
}
