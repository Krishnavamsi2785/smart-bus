import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, History, X, Maximize2, ShieldCheck, Download } from 'lucide-react';
import TicketCard from '../components/TicketCard';
import API_BASE_URL from '../config';

export default function MyTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('active'); // 'active' or 'history'
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${API_BASE_URL}/ticket/user/${user.user_id}`);
        setTickets(res.data.data);
      } catch (err) {
        setError('Failed to load travel history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  const activeTickets = tickets.filter(t => t.status === 'VALID');
  const historyTickets = tickets.filter(t => t.status !== 'VALID');
  const displayedTickets = filter === 'active' ? activeTickets : historyTickets;

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 text-center max-w-md w-full"
        >
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <Ticket className="text-blue-600" size={48} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter">Login Required</h2>
          <p className="text-slate-500 mb-8 font-medium">To access your digital wallet and secure boarding passes, please sign in.</p>
          <Link to="/login" className="block w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-slate-800 transition shadow-xl">
            Go to Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <motion.h1 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="text-5xl font-black text-slate-900 tracking-tighter mb-2"
            >
              My Travels
            </motion.h1>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Secure Digital Wallet</p>
          </div>

          <div className="bg-white p-1.5 rounded-2xl shadow-lg border border-slate-100 flex gap-1">
            <button 
              onClick={() => setFilter('active')}
              className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                filter === 'active' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Ticket size={16} /> Active ({activeTickets.length})
            </button>
            <button 
              onClick={() => setFilter('history')}
              className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                filter === 'history' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <History size={16} /> History ({historyTickets.length})
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col justify-center items-center p-20 gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Syncing Wallet...</p>
          </div>
        ) : displayedTickets.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-20 rounded-[3rem] text-center shadow-xl border border-slate-100"
          >
            <div className="text-6xl mb-6 opacity-20">🎫</div>
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Empty Wallet</h3>
            <p className="text-slate-400 mb-8 max-w-xs mx-auto font-medium text-sm">You haven't booked any journeys yet. Ready for your first trip?</p>
            <Link to="/" className="text-blue-600 font-black hover:underline uppercase text-xs tracking-widest">Book a Seat Now →</Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode='popLayout'>
              {displayedTickets.map((t) => (
                <TicketCard 
                  key={t.ticket_id} 
                  ticket={t} 
                  passengerName={user.name}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Boarding Pass Modal Overlay */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-8"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl relative"
            >
              {/* Security Watermark Background Animation */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                <motion.div 
                  animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="w-[200%] h-[200%] bg-gradient-to-tr from-blue-900 via-indigo-900 to-slate-900 absolute -top-1/2 -left-1/2"
                />
              </div>

              {/* Modal Header */}
              <div className="p-8 bg-slate-900 text-white flex justify-between items-center relative z-10">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="text-blue-500" />
                  <span className="font-black text-xs tracking-tighter uppercase">Boarding Terminal</span>
                </div>
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="p-2 hover:bg-white/10 rounded-full transition"
                >
                  <X />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-8 text-center relative z-10">
                <div className="mb-6">
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-2">{selectedTicket.bus_code}</h2>
                  <div className="flex items-center justify-center gap-3 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                    <span>{selectedTicket.from || selectedTicket.from_stop}</span>
                    <Maximize2 size={12} className="text-blue-500" />
                    <span>{selectedTicket.to || selectedTicket.to_stop}</span>
                  </div>
                </div>

                {/* Ticket Details Summary — replaces QR code */}
                <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-100 shadow-inner mb-8 text-left space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ticket ID</p>
                    <p className="font-mono text-xs font-bold text-slate-700">{(selectedTicket?.ticket_uuid || '').split('-')[0].toUpperCase()}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Passenger</p>
                    <p className="text-xs font-bold text-slate-800">{user?.name}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bus Type</p>
                    <p className="text-xs font-bold text-blue-700 uppercase">{selectedTicket?.bus_type || 'N/A'}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date &amp; Time</p>
                    <p className="text-xs font-bold text-slate-800">{new Date(selectedTicket?.issue_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Status</p>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">✓ Paid</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-50 p-4 rounded-2xl text-left border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Issue Date</p>
                    <p className="text-sm font-bold text-slate-900">{new Date(selectedTicket.issue_time).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl text-left border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Pass Status</p>
                    <p className="text-sm font-bold text-green-600 uppercase">✓ Verified</p>
                  </div>
                </div>

                <button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-blue-700 transition shadow-lg">
                  <Download size={20} /> Download Receipt
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

