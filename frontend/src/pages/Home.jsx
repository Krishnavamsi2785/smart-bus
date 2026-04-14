import React, { useState, useEffect } from "react";
import axios from "axios";
import TicketCard from "../components/TicketCard";
import StopsList from "../components/StopsList";
import { useAuth } from "../context/AuthContext";
import API_BASE_URL from "../config";

export default function Home() {
  const { user } = useAuth();
  
  // Tabs State
  const [searchMode, setSearchMode] = useState("route"); // "route" or "code"
  
  // Search Inputs
  const [code, setCode] = useState("");
  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");
  
  // Results State
  const [searchResults, setSearchResults] = useState([]);
  const [bus, setBus] = useState(null);
  const [fromStop, setFromStop] = useState('');
  const [toStop, setToStop] = useState('');
  const [fare, setFare] = useState(null);
  const [ticket, setTicket] = useState(null);
  
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Search by Bus Code
  const fetchBusByCode = async () => {
    if (!code) return;
    try {
      setLoading(true);
      setError("");
      resetBooking();
      
      
      const res = await axios.get(`${API_BASE_URL}/bus/${code}`);
      if (res.data && res.data.data) {
        setBus(res.data.data);
      }
    } catch (err) {
      setError("Bus not found. Ensure the code is correct (e.g. B001) ❌");
    } finally {
      setLoading(false);
    }
  };

  // Search by Stop Names
  const fetchBusesByRoute = async () => {
    const qFrom = fromQuery.trim();
    const qTo = toQuery.trim();
    
    if (!qFrom || !qTo) return;
    try {
      setLoading(true);
      setError("");
      resetBooking();
      setSearchResults([]);
      
      
      const res = await axios.get(`${API_BASE_URL}/bus/search/route?from=${qFrom}&to=${qTo}`);
      if (res.data && res.data.data.length > 0) {
        setSearchResults(res.data.data);
      } else {
        setError(`No buses found between "${qFrom}" and "${qTo}". Ensure the stop names are spelled correctly (e.g. Nellore, Chennai). 📍`);
      }
    } catch (err) {
      setError("Search failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // When a bus is selected from the search results
  const selectBus = async (busCode, sourceId, destId) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/bus/${busCode}`);
      if (res.data && res.data.data) {
        setBus(res.data.data);
        setFromStop(sourceId);
        setToStop(destId);
        setSearchResults([]);
      }
    } catch (err) {
      setError("Failed to load bus details.");
    } finally {
      setLoading(false);
    }
  };

  const resetBooking = () => {
    setBus(null);
    setTicket(null);
    setFromStop('');
    setToStop('');
    setFare(null);
    setSearchResults([]);
  };

  // Compute Fare
  useEffect(() => {
    if (fromStop && toStop && bus) {
      const stop1 = bus.stops.find(s => s.stop_id === fromStop);
      const stop2 = bus.stops.find(s => s.stop_id === toStop);
      
      if (stop1 && stop2) {
        const multipliers = {
          'PALLE VELUGU': 0.60,
          'ULTRA PALLE VELUGU': 0.75,
          'EXPRESS': 0.90,
          'METRO': 1.00,
          'DELUXE': 1.10,
          'ULTRA DELUXE': 1.40
        };

        const rate = multipliers[bus.bus_type] || 0.60;
        const distanceKm = Math.abs(parseFloat(stop2.distance_from_start) - parseFloat(stop1.distance_from_start));
        let calculated = Math.round(distanceKm * rate);
        if (calculated < 10) calculated = 10;
        setFare(calculated);
      }
    } else {
      setFare(null);
    }
  }, [fromStop, toStop, bus]);

  const initiatePayment = async () => {
    if (!user) return setError("Login required to book tickets! 🎫");
    try {
      setLoading(true);
      setError("");

      // 1. Create Order on Backend
      const orderRes = await axios.post(`${API_BASE_URL}/payment/create-order`, { 
        amount: fare 
      });
      const order = orderRes.data.data;

      // 2. Handle Simulator Mode (Instant Success for Demo)
      if (order.is_simulator) {
        setLoading(true);
        console.warn("--- DEMO MODE: Auto-Confirming Ticket ---");
        // Add a tiny delay for realism
        setTimeout(() => {
          confirmTicket(`SIM_PAY_${Date.now()}`);
        }, 1500);
        return;
      }

      // 3. Real Razorpay Checkout Configuration
      const options = {
        key: order.key_id || "rzp_test_placeholder", 
        amount: order.amount,
        currency: "INR",
        name: "APSRTC SMART BUS",
        description: `${bus.bus_type} - ${getStopName(fromStop)} to ${getStopName(toStop)}`,
        order_id: order.id,
        handler: async (response) => {
          // 4. Verify Payment on Backend
          try {
            const verifyRes = await axios.post(`${API_BASE_URL}/payment/verify-payment`, response);
            if (verifyRes.data.success) {
              confirmTicket(response.razorpay_payment_id);
            }
          } catch (err) {
            setError("Payment verification failed. Security alert triggered. 🛡️");
          }
        },
        prefill: {
          name: user.name,
          contact: user.phone
        },
        theme: { color: "#1e3a8a" },
        modal: {
          ondismiss: () => setLoading(false)
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError("Payment gateway is temporarily unavailable. 💳");
      setLoading(false);
    }
  };

  const confirmTicket = async (paymentId) => {
    try {
      const ticketPayload = {
        user_id: user.user_id,
        bus_id: bus.bus_id,
        route_id: bus.route_id,
        from_stop_id: fromStop,
        to_stop_id: toStop,
        fare: fare,
        payment_id: paymentId
      };
      const ticketRes = await axios.post(`${API_BASE_URL}/ticket/create`, ticketPayload);
      setTicket(ticketRes.data.data);
    } catch (err) {
      setError("Payment successful, but ticket generation failed! Save this ID: " + paymentId);
    } finally {
      setLoading(false);
    }
  };

  const getStopName = (stopId) => {
    if(!bus) return '';
    return bus.stops.find(s => s.stop_id === stopId)?.stop_name || '';
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] pb-20 flex flex-col items-center">
      
      {/* Hero Banner Section */}
      <div className="w-full bg-gradient-to-r from-blue-800 to-blue-600 shadow-xl p-12 flex flex-col items-center rounded-b-[3rem] mb-8">
        <div className="bg-white/10 p-2 rounded-2xl mb-4 backdrop-blur-md">
          <span className="text-4xl text-white">🏙️</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
          Smart Bus AP 🚍
        </h1>
        <p className="text-blue-100 font-bold opacity-80">Andhra Pradesh Digital Transit Service</p>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-xl px-4 relative">
        
        {error && (
          <div className="bg-red-50 border-2 border-red-100 text-red-600 p-4 mb-8 rounded-2xl shadow-sm flex items-center justify-between animate-shake">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <span className="font-black text-sm">{error}</span>
            </div>
            <button onClick={() => setError("")} className="text-red-300 hover:text-red-600 font-black">×</button>
          </div>
        )}

        {/* State 1: Dual Search Interface */}
        {!ticket && !bus && (
          <div className="bg-white shadow-2xl p-8 rounded-[2rem] border border-gray-100 animate-fade-in">
            
            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <button 
                onClick={() => setSearchMode("route")}
                className={`flex-1 py-6 text-sm font-black uppercase tracking-widest rounded-2xl transition-all ${searchMode === "route" ? "bg-blue-600 text-white shadow-lg ring-4 ring-blue-200 scale-105" : "bg-white border-2 border-slate-100 text-slate-500 hover:bg-slate-50 hover:scale-100"}`}
              >
                <div className="text-3xl mb-2">📍</div>
                Search Route
              </button>
              <button 
                onClick={() => setSearchMode("code")}
                className={`flex-1 py-6 text-sm font-black uppercase tracking-widest rounded-2xl transition-all ${searchMode === "code" ? "bg-blue-600 text-white shadow-lg ring-4 ring-blue-200 scale-105" : "bg-white border-2 border-slate-100 text-slate-500 hover:bg-slate-50 hover:scale-100"}`}
              >
                <div className="text-3xl mb-2">🎫</div>
                Generate Ticket
              </button>
            </div>

            {searchMode === "route" ? (
              <div className="space-y-4">
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="From: Departure City"
                    value={fromQuery}
                    onChange={(e) => setFromQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-black text-blue-900"
                  />
                  <span className="absolute left-4 top-4 text-xl opacity-40">📍</span>
                </div>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="To: Destination"
                    value={toQuery}
                    onChange={(e) => setToQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-black text-blue-900"
                  />
                  <span className="absolute left-4 top-4 text-xl opacity-40">🏁</span>
                </div>
                <button
                  onClick={fetchBusesByRoute}
                  disabled={loading || !fromQuery || !toQuery}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-lg transition transform active:scale-95"
                >
                  {loading ? "Searching..." : "Find Available Buses"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter Code (e.g. B003)"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-black text-blue-900 uppercase"
                  />
                  <span className="absolute left-4 top-4 text-xl opacity-40">🚌</span>
                </div>
                <button
                  onClick={fetchBusByCode}
                  disabled={loading || !code}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-lg transition transform active:scale-95"
                >
                  {loading ? "Loading..." : "Get Route Details"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* State 2: Search Results List */}
        {!ticket && !bus && searchResults.length > 0 && (
          <div className="mt-8 space-y-4 animate-fade-in-up">
            <h3 className="px-4 text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Available Options ({searchResults.length})</h3>
            {searchResults.map((b) => (
              <div 
                key={b.bus_id} 
                onClick={() => selectBus(b.bus_code, b.from_id, b.to_id)}
                className="bg-white p-6 rounded-3xl shadow-xl hover:shadow-2xl border border-transparent hover:border-blue-100 transition-all cursor-pointer flex justify-between items-center group active:scale-[0.98]"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-black text-blue-900 leading-tight">{b.route_name}</span>
                    <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter italic">
                      {b.bus_type}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">
                    {b.bus_number} • Bus {b.bus_code}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl group-hover:bg-blue-50 transition-colors">
                  <span className="text-blue-600 font-extrabold text-sm tracking-tighter">SELECT →</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* State 3: Bus Selected & Ticket Selection */}
        {!ticket && bus && (
          <div className="bg-white shadow-[0_15px_60px_rgba(0,0,0,0.1)] p-8 rounded-[2.5rem] border-t-8 border-blue-600 animate-fade-in-up">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-black text-blue-950 leading-tight">{bus.route_name}</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">{bus.bus_code} • {bus.bus_number}</p>
                <div className="mt-3">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter italic">
                    {bus.bus_type} Verified
                  </span>
                </div>
              </div>
              <button onClick={resetBooking} className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition">🔙</button>
            </div>

            <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 mb-8 shadow-inner">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 text-center">Confirm Journey Limits</h3>
              <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                <StopsList 
                  stops={bus.stops} 
                  setFrom={setFromStop} 
                  setTo={setToStop} 
                  fromStop={fromStop} 
                  toStop={toStop} 
                />
              </div>
            </div>

            <div className="bg-blue-900 p-6 rounded-[2rem] text-white flex justify-between items-center mb-8 shadow-2xl relative overflow-hidden">
               <div className="relative z-10">
                 <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest leading-none mb-1">Payable Now</p>
                 <p className="text-4xl font-black italic tracking-tighter leading-none">
                   {fare !== null ? `₹${fare}` : <span className="text-blue-700 opacity-50">--</span>}
                 </p>
               </div>
               <button
                onClick={initiatePayment}
                disabled={!fromStop || !toStop || fromStop === toStop || loading}
                className="relative z-10 bg-green-500 hover:bg-green-400 active:scale-90 disabled:opacity-30 disabled:scale-100 p-5 rounded-3xl transition-all shadow-lg"
                title={loading ? "Connecting to Bank..." : "Proceed to Payment"}
               >
                 <span className="text-2xl">{loading ? "⌛" : "⚡"}</span>
               </button>
               {/* Aesthetic Glow */}
               <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-800 rounded-full blur-3xl opacity-50"></div>
            </div>

            <p className="text-[10px] text-center font-bold text-gray-400 uppercase tracking-widest">
              Price based on {bus.bus_type} category rates
            </p>
          </div>
        )}

        {/* State 4: Ticket Display */}
        {ticket && (
          <div className="flex flex-col items-center animate-fade-in">
            <TicketCard 
              passengerName={user?.name}
              ticket={{
                bus_code: bus.bus_number,
                bus_type: bus.bus_type,
                from: getStopName(ticket.from_stop_id),
                to: getStopName(ticket.to_stop_id),
                fare: ticket.fare,
                ticket_id: ticket.ticket_uuid,
                ticket_uuid: ticket.ticket_uuid,
                issue_time: ticket.issue_time || new Date().toISOString(),
                expiry_time: ticket.expiry_time
              }} 
            />

            <button 
              className="mt-12 bg-white border border-gray-200 text-gray-500 font-bold py-3 px-8 rounded-2xl hover:bg-gray-50 transition-all font-black uppercase text-[10px] tracking-widest"
              onClick={resetBooking}
            >
              ← Search Another Journey
            </button>
          </div>
        )}
      </div>
    </div>
  );
}