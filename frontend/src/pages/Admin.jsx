import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import API_BASE_URL from '../config';

export default function Admin() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [activeForm, setActiveForm] = useState('none');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Ledger State
  const [activeLedger, setActiveLedger] = useState('tickets');
  const [ledgerData, setLedgerData] = useState({ tickets: [], buses: [], routes: [] });
  
  // State for Bus Form
  const [busData, setBusData] = useState({ bus_code: '', bus_number: '', bus_type: 'EXPRESS', depot: 'Central Depot', route_id: '1' });
  
  // State for Route Form
  const [routeData, setRouteData] = useState({ 
    route_name: '', start_stop: '', end_stop: '', total_distance: 0, 
    stops: [
      { stop_id: 1, stop_name: '', distance_from_start: 0, stop_order: 1 },
      { stop_id: 2, stop_name: '', distance_from_start: 10, stop_order: 2 }
    ] 
  });

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/ticket/stats`);
      setStats(res.data.data);
    } catch (err) {
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchLedgers = async () => {
    try {
      const [ticks, bus, rts] = await Promise.all([
        axios.get(`${API_BASE_URL}/ticket/recent`),
        axios.get(`${API_BASE_URL}/bus`),
        axios.get(`${API_BASE_URL}/routes`)
      ]);
      setLedgerData({ 
        tickets: ticks.data.data || [], 
        buses: bus.data.data || [], 
        routes: rts.data.data || [] 
      });
    } catch (err) {
      console.error("Failed to load ledgers", err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchLedgers();
  }, []);

  const handleBusSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await axios.post(`${API_BASE_URL}/bus/create`, busData);
      setSuccessMsg(`Successfully deployed Bus: ${busData.bus_code.toUpperCase()}`);
      setBusData({ bus_code: '', bus_number: '', bus_type: 'EXPRESS', depot: 'Central Depot', route_id: '1' });
      setActiveForm('none');
      fetchStats();
      fetchLedgers();
    } catch (err) {
      setError('Failed to deploy Fleet. Verify parameters.');
    } finally {
      setLoading(false);
    }
  };

  const handleRouteSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      // Autocomplete start/end stops for the backend based on nodes
      const finalData = { ...routeData };
      if(finalData.stops.length > 0) {
        finalData.start_stop = finalData.stops[0].stop_name;
        finalData.end_stop = finalData.stops[finalData.stops.length - 1].stop_name;
      }
      await axios.post(`${API_BASE_URL}/routes/create`, finalData);
      setSuccessMsg(`Successfully created new Network: ${routeData.route_name}`);
      setRouteData({ 
        route_name: '', start_stop: '', end_stop: '', total_distance: 0, 
        stops: [{ stop_id: 1, stop_name: '', distance_from_start: 0, stop_order: 1 }, { stop_id: 2, stop_name: '', distance_from_start: 10, stop_order: 2 }] 
      });
      setActiveForm('none');
      fetchStats();
      fetchLedgers();
    } catch (err) {
      setError('Failed to create Route. Verify the node maps. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const addRouteStop = () => {
    setRouteData({
      ...routeData,
      stops: [...routeData.stops, { stop_id: routeData.stops.length + 1, stop_name: '', distance_from_start: 0, stop_order: routeData.stops.length + 1 }]
    });
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="p-8 max-w-md mx-auto mt-20 text-center bg-white shadow-2xl rounded-3xl border border-red-100">
        <div className="text-4xl mb-4">🔐</div>
        <h2 className="text-2xl font-black text-red-600 mb-2">Restricted Access</h2>
        <p className="text-gray-500 mb-6 font-medium">This dashboard is for System Administrators only.</p>
        <Link to="/" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-blue-900 p-10 text-white rounded-b-[3rem] shadow-2xl mb-12">
        <div className="max-w-6xl mx-auto flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black tracking-tight">System Administration</h1>
            <p className="text-blue-300 font-bold uppercase tracking-widest text-xs mt-1">APSRTC Fleet & Revenue Control</p>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-md text-xs font-black uppercase">
            Live Monitoring
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6">
        {successMsg && (
          <div className="bg-green-50 border-2 border-green-200 text-green-700 p-4 mb-8 rounded-2xl shadow-sm flex items-center justify-between font-bold">
            {successMsg}
            <button onClick={() => setSuccessMsg('')} className="text-green-500">×</button>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 p-4 mb-8 rounded-2xl shadow-sm flex items-center justify-between font-bold">
            {error}
            <button onClick={() => setError('')} className="text-red-500">×</button>
          </div>
        )}

        {loading && !stats ? (
          <div className="text-center py-20 text-blue-900 font-black animate-pulse">Loading Live Intelligence...</div>
        ) : stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 flex items-center justify-between">
               <div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Revenue</p>
                 <p className="text-3xl font-black text-green-600">₹{stats.total_revenue}</p>
               </div>
               <div className="text-4xl opacity-20">💰</div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 flex items-center justify-between">
               <div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Bookings</p>
                 <p className="text-3xl font-black text-blue-800">{stats.total_tickets}</p>
               </div>
               <div className="text-4xl opacity-20">🎟️</div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 flex items-center justify-between">
               <div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Fleet</p>
                 <p className="text-3xl font-black text-yellow-600">{stats.active_buses}</p>
               </div>
               <div className="text-4xl opacity-20">🚌</div>
            </div>
          </div>
        )}

        {/* Quick Actions / Toggles */}
        {activeForm === 'none' && (
          <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-gray-100">
             <h2 className="text-xl font-black text-gray-800 mb-8 border-b pb-4">Strategic Administration</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div onClick={() => setActiveForm('bus')} className="bg-blue-50 p-6 rounded-3xl border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer group">
                  <p className="text-xs font-black text-blue-900 uppercase tracking-widest mb-1">Deploy New Bus</p>
                  <p className="text-sm font-medium text-blue-700/70">Create a new bus code and assign it to an existing route network.</p>
                  <div className="mt-4 text-blue-600 font-black text-xs uppercase tracking-tighter group-hover:translate-x-1 transition-transform">Configure Fleet →</div>
                </div>

                <div onClick={() => setActiveForm('route')} className="bg-purple-50 p-6 rounded-3xl border border-purple-100 hover:bg-purple-100 transition-colors cursor-pointer group">
                  <p className="text-xs font-black text-purple-900 uppercase tracking-widest mb-1">Build Route Network</p>
                  <p className="text-sm font-medium text-purple-700/70">Map out a new sequence of stops and geographic distances.</p>
                  <div className="mt-4 text-purple-600 font-black text-xs uppercase tracking-tighter group-hover:translate-x-1 transition-transform">Create Route →</div>
                </div>
             </div>
          </div>
        )}

        {/* Fleet Creation Form */}
        {activeForm === 'bus' && (
          <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-blue-100">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
               <h2 className="text-xl font-black text-blue-900">Add New Bus to Fleet</h2>
               <button type="button" onClick={() => setActiveForm('none')} className="text-gray-400 hover:text-red-500 font-black text-[10px] bg-red-50 px-3 py-1 rounded-full uppercase tracking-widest">Cancel ✕</button>
            </div>
            <form onSubmit={handleBusSubmit} className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Bus Code (e.g. B015)</label>
                   <input required type="text" value={busData.bus_code} onChange={e => setBusData({...busData, bus_code: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 p-3 rounded-xl font-bold uppercase"/>
                 </div>
                 <div>
                   <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">License Plate</label>
                   <input required type="text" value={busData.bus_number} onChange={e => setBusData({...busData, bus_number: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 p-3 rounded-xl font-bold uppercase"/>
                 </div>
                 <div>
                   <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Bus Category Type</label>
                   <select value={busData.bus_type} onChange={e => setBusData({...busData, bus_type: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 p-3 rounded-xl font-bold uppercase">
                     <option value="PALLE VELUGU">PALLE VELUGU (0.60x)</option>
                     <option value="EXPRESS">EXPRESS (0.90x)</option>
                     <option value="METRO">METRO (1.00x)</option>
                     <option value="DELUXE">DELUXE (1.10x)</option>
                     <option value="ULTRA DELUXE">ULTRA DELUXE (1.40x)</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Assign to Route ID</label>
                   <input required type="number" value={busData.route_id} onChange={e => setBusData({...busData, route_id: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 p-3 rounded-xl font-bold"/>
                 </div>
               </div>
               <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-blue-700 transition">DEPLOY BUS</button>
            </form>
          </div>
        )}

        {/* Route Creation Form */}
        {activeForm === 'route' && (
          <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-purple-100">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
               <h2 className="text-xl font-black text-purple-900">Map a New Route</h2>
               <button type="button" onClick={() => setActiveForm('none')} className="text-gray-400 hover:text-red-500 font-black text-[10px] bg-red-50 px-3 py-1 rounded-full uppercase tracking-widest">Cancel ✕</button>
            </div>
            <form onSubmit={handleRouteSubmit} className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                 <div>
                   <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Route Route Name (e.g. Nellore to Tirupati)</label>
                   <input required type="text" value={routeData.route_name} onChange={e => setRouteData({...routeData, route_name: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 p-3 rounded-xl font-bold uppercase"/>
                 </div>
                 <div>
                   <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Total Distance (KM)</label>
                   <input required type="number" value={routeData.total_distance} onChange={e => setRouteData({...routeData, total_distance: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 p-3 rounded-xl font-bold"/>
                 </div>
               </div>

               <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 mt-6 relative z-10">
                 <h3 className="text-[10px] font-black text-purple-800 uppercase tracking-widest mb-4">Route Waypoints (Stops)</h3>
                 {routeData.stops.map((stop, i) => (
                   <div key={i} className="flex gap-4 mb-4 items-center">
                     <span className="text-purple-400 font-black text-xs">{i + 1}.</span>
                     <input required type="text" placeholder="Stop Name (e.g. Gudur)" value={stop.stop_name} onChange={e => {
                       const newStops = [...routeData.stops];
                       newStops[i].stop_name = e.target.value;
                       setRouteData({...routeData, stops: newStops});
                     }} className="flex-1 bg-white border-2 border-purple-100 p-2 rounded-lg font-bold uppercase text-sm focus:outline-none focus:border-purple-300"/>
                     <input required type="number" placeholder="KM offset" value={stop.distance_from_start} onChange={e => {
                       const newStops = [...routeData.stops];
                       newStops[i].distance_from_start = e.target.value;
                       setRouteData({...routeData, stops: newStops});
                     }} className="w-24 bg-white border-2 border-purple-100 p-2 rounded-lg font-bold text-sm text-center focus:outline-none focus:border-purple-300"/>
                   </div>
                 ))}
                 <button type="button" onClick={addRouteStop} className="w-full border-2 border-dashed border-purple-300 text-purple-600 font-black py-2 rounded-xl mt-2 text-xs uppercase hover:bg-purple-100 transition tracking-widest">+ Append Extra Stop Node</button>
               </div>

               <button type="submit" className="w-full bg-purple-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-purple-700 transition relative z-20 hover:scale-[1.01] active:scale-[0.99] duration-200">PUBLISH ROUTE NETWORK</button>
            </form>
          </div>
        )}

        {/* System Ledgers */}
        <div className="mt-12 bg-white rounded-[3rem] p-10 shadow-2xl border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b pb-4">
            <h2 className="text-xl font-black text-gray-800 flex items-center gap-3">
              <span className="bg-green-600 text-white w-2 h-8 rounded-full" />
              System Data Ledgers
            </h2>
            <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full md:w-auto">
              <button onClick={() => setActiveLedger('tickets')} className={`flex-1 md:flex-none px-6 py-3 text-xs font-black uppercase rounded-xl transition ${activeLedger === 'tickets' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>Tickets</button>
              <button onClick={() => setActiveLedger('buses')} className={`flex-1 md:flex-none px-6 py-3 text-xs font-black uppercase rounded-xl transition ${activeLedger === 'buses' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>Fleet</button>
              <button onClick={() => setActiveLedger('routes')} className={`flex-1 md:flex-none px-6 py-3 text-xs font-black uppercase rounded-xl transition ${activeLedger === 'routes' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>Routes</button>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar pb-4">
            {activeLedger === 'tickets' && (
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50 text-[10px] uppercase font-black tracking-widest text-gray-400">
                    <th className="p-4 rounded-l-xl">Ticket ID</th>
                    <th className="p-4">Route ID</th>
                    <th className="p-4">Bus ID</th>
                    <th className="p-4">Fare</th>
                    <th className="p-4 rounded-r-xl">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerData.tickets.length === 0 && (
                    <tr><td colSpan="5" className="p-4 text-center text-gray-400 font-bold">No tickets processed yet.</td></tr>
                  )}
                  {ledgerData.tickets.map(t => (
                    <tr key={t.ticket_id || t.ticket_uuid} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="p-4 font-mono text-xs">{t.ticket_uuid ? t.ticket_uuid.split('-')[0].toUpperCase() : t.ticket_id}</td>
                      <td className="p-4 text-sm font-bold">{t.route_id}</td>
                      <td className="p-4 text-sm font-bold">{t.bus_id}</td>
                      <td className="p-4 text-sm font-black text-green-600">₹{t.fare}</td>
                      <td className="p-4">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${t.status === 'VALID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{t.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeLedger === 'buses' && (
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50 text-[10px] uppercase font-black tracking-widest text-gray-400">
                    <th className="p-4 rounded-l-xl">Code</th>
                    <th className="p-4">Plate</th>
                    <th className="p-4">Type</th>
                    <th className="p-4 rounded-r-xl">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerData.buses.map(b => (
                    <tr key={b.bus_id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="p-4 font-black text-blue-600">{b.bus_code}</td>
                      <td className="p-4 text-sm font-bold uppercase">{b.bus_number}</td>
                      <td className="p-4 text-xs font-bold text-gray-500 uppercase">{b.bus_type}</td>
                      <td className="p-4">
                         <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-blue-50 text-blue-700 rounded-md">{b.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeLedger === 'routes' && (
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50 text-[10px] uppercase font-black tracking-widest text-gray-400">
                    <th className="p-4 rounded-l-xl">ID</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Distance</th>
                    <th className="p-4 rounded-r-xl">Nodes</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerData.routes.map(r => (
                    <tr key={r.route_id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="p-4 font-black">{r.route_id}</td>
                      <td className="p-4 text-sm font-bold text-purple-700 uppercase">{r.route_name}</td>
                      <td className="p-4 text-sm font-bold text-gray-500">{r.total_distance} km</td>
                      <td className="p-4 text-sm font-bold text-gray-500">{r.stops ? r.stops.length : 0} Stops</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
