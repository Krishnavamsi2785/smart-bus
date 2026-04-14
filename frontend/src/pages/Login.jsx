import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../config';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isRegister ? 'register' : 'login';
      const payload = isRegister ? { name, phone, password } : { phone, password };
      
      const res = await axios.post(`${API_BASE_URL}/auth/${endpoint}`, payload);
      
      if (!isRegister) {
        // Login mode
        login(res.data.data, res.data.token);
        navigate('/');
      } else {
        // Register mode: switch to login
        setIsRegister(false);
        alert('Registration successful! Please login.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 flex justify-center items-center h-full mt-20">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 animate-fade-in">
        <h2 className="text-3xl font-black text-center text-blue-900 mb-2">
          {isRegister ? 'Join SmartBus' : 'Welcome Back'}
        </h2>
        <p className="text-center text-gray-500 mb-8 text-sm font-medium">
          {isRegister ? 'Start your digital travel journey' : 'Login to access your tickets'}
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold mb-6 border border-red-100 flex items-center gap-2">
            <span>❌</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegister && (
            <div className="flex flex-col">
              <label className="text-xs font-black uppercase tracking-widest mb-1 text-gray-400">Full Name</label>
              <input 
                required
                type="text" 
                className="p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-blue-500 transition-all" 
                placeholder="John Doe" 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="flex flex-col">
            <label className="text-xs font-black uppercase tracking-widest mb-1 text-gray-400">Phone Number</label>
            <input 
              required
              type="text" 
              className="p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-blue-500 transition-all font-mono" 
              placeholder="000 000 0000" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col">
            <label className="text-xs font-black uppercase tracking-widest mb-1 text-gray-400">Password</label>
            <input 
              required
              type="password" 
              className="p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-blue-500 transition-all" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-4 rounded-xl transition transform active:scale-95 shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? 'Processing...' : (isRegister ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm font-medium">
            {isRegister ? 'Already have an account?' : 'Don\'t have an account?'}
            <button 
              onClick={() => setIsRegister(!isRegister)}
              className="ml-2 text-blue-600 font-black hover:underline focus:outline-none"
            >
              {isRegister ? 'Login' : 'Register Here'}
            </button>
          </p>
          {!isRegister && (
             <p className="mt-6 text-[10px] font-bold text-gray-400 bg-gray-50 border border-gray-200 p-2 rounded-lg inline-block text-center uppercase tracking-widest">
               Admin Shortcut <br/><span className="text-blue-900 mt-1 block">Phone: admin — Pass: password</span>
             </p>
          )}
        </div>
      </div>
    </div>
  );
}
