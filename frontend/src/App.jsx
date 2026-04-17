import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import MyTickets from './pages/MyTickets';
import Login from './pages/Login';
import Conductor from './pages/Conductor';
import Admin from './pages/Admin';
import Passes from './pages/Passes';
import DepotPortal from './pages/DepotPortal';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-center font-black">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100 flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/tickets" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />
              <Route path="/passes" element={<ProtectedRoute><Passes /></ProtectedRoute>} />
              <Route path="/conductor" element={<ProtectedRoute><Conductor /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
              <Route path="/depot-login" element={<DepotPortal />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
