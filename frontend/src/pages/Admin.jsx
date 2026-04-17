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
  const [busData, setBusData] = useState({ bus_code: '', bus_number: '', bus_type: 'EXPRESS', depot_id: 'DP01', depot_name: 'Central Depot', route_id: '1' });
  const [editMode, setEditMode] = useState(false);
  const [targetId, setTargetId] = useState(null);

  // Depot State
  const [depotData, setDepotData] = useState([]);
  const [depotForm, setDepotForm] = useState({ depot_id: '', name: '' });
  const [fleetFilterDepot, setFleetFilterDepot] = useState('');
  const [revenueData, setRevenueData] = useState([]);
  const [revFilterDate, setRevFilterDate] = useState('');
  const [revFilterDepot, setRevFilterDepot] = useState('');
  const [passRevenue, setPassRevenue] = useState({ total: 0, count: 0, passes: [] });
  const [passRevFilterDepot, setPassRevFilterDepot] = useState('');
  
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
      const [ticks, bus, rts, deps] = await Promise.all([
        axios.get(`${API_BASE_URL}/ticket/recent`),
        axios.get(`${API_BASE_URL}/bus`),
        axios.get(`${API_BASE_URL}/routes`),
        axios.get(`${API_BASE_URL}/depot`)
      ]);
      setLedgerData({ 
        tickets: ticks.data.data || [], 
        buses: bus.data.data || [], 
        routes: rts.data.data || [] 
      });
      setDepotData(deps.data.data || []);
    } catch (err) {
      console.error("Failed to load ledgers", err);
    }
  };

  const fetchRevenue = async () => {
    try {
      let q = [];
      if (revFilterDate) q.push(`date=${revFilterDate}`);
      if (revFilterDepot) q.push(`depot_id=${revFilterDepot}`);
      const qs = q.length ? '?' + q.join('&') : '';
      const res = await axios.get(`${API_BASE_URL}/ticket/analytics${qs}`);
      setRevenueData(res.data.data || []);
    } catch (err) {
      console.error("Failed to load revenue", err);
    }
  };

  const fetchPassRevenue = async (depotFilter) => {
    try {
      const qs = depotFilter ? `?depot_id=${depotFilter}` : '';
      const res = await axios.get(`${API_BASE_URL}/pass/revenue${qs}`);
      setPassRevenue(res.data.data || { total: 0, count: 0, passes: [] });
    } catch (err) { console.error('Pass revenue fetch failed', err); }
  };

  useEffect(() => {
    fetchStats();
    fetchLedgers();
    fetchRevenue();
    fetchPassRevenue(passRevFilterDepot);
  }, [revFilterDate, revFilterDepot, passRevFilterDepot]);

  const downloadCSV = () => {
    if (!revenueData.length) return;
    const header = ['Depot Name', 'Depot ID', 'Bus Code', 'Ticket Sales', 'Total Revenue (INR)'];
    const rows = revenueData.map(item => [
      item.depot_name || 'N/A',
      item.depot_id || 'N/A',
      item.bus_code || 'N/A',
      item.ticket_count || 0,
      item.total_revenue || 0
    ]);
    const csvContent = [header, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `APSRTC_Revenue_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleBusSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      if (editMode) {
        await axios.put(`${API_BASE_URL}/bus/edit/${targetId}`, busData);
        setSuccessMsg(`Successfully updated Bus: ${busData.bus_code.toUpperCase()}`);
      } else {
        await axios.post(`${API_BASE_URL}/bus/create`, busData);
        setSuccessMsg(`Successfully deployed Bus: ${busData.bus_code.toUpperCase()}`);
      }
      setBusData({ bus_code: '', bus_number: '', bus_type: 'EXPRESS', depot_id: 'DP01', depot_name: 'Central Depot', route_id: '1' });
      setActiveForm('none');
      setEditMode(false);
      fetchStats();
      fetchLedgers();
    } catch (err) {
      setError('Failed to deploy/edit Fleet. Verify parameters.');
    } finally {
      setLoading(false);
    }
  };

  const removeBusRecord = async (code) => {
    if (!window.confirm("Are you sure you want to permanently delete this bus?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/bus/delete/${code}`);
      setSuccessMsg(`Deleted Bus: ${code}`);
      fetchStats();
      fetchLedgers();
    } catch (err) {
      setError('Failed to delete bus');
    }
  };

  const handleRouteSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const finalData = { ...routeData };
      if(finalData.stops.length > 0) {
        finalData.start_stop = finalData.stops[0].stop_name;
        finalData.end_stop = finalData.stops[finalData.stops.length - 1].stop_name;
      }
      if (editMode) {
        await axios.put(`${API_BASE_URL}/routes/edit/${targetId}`, finalData);
        setSuccessMsg(`Successfully updated Route: ${routeData.route_name}`);
      } else {
        await axios.post(`${API_BASE_URL}/routes/create`, finalData);
        setSuccessMsg(`Successfully created new Network: ${routeData.route_name}`);
      }
      setRouteData({ 
        route_name: '', start_stop: '', end_stop: '', total_distance: 0, 
        stops: [{ stop_id: 1, stop_name: '', distance_from_start: 0, stop_order: 1 }, { stop_id: 2, stop_name: '', distance_from_start: 10, stop_order: 2 }] 
      });
      setActiveForm('none');
      setEditMode(false);
      fetchStats();
      fetchLedgers();
    } catch (err) {
      setError('Failed to modify Route. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDepotSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await axios.post(`${API_BASE_URL}/depot/create`, depotForm);
      setSuccessMsg(`Successfully constructed Depot: ${depotForm.name}`);
      setDepotForm({ depot_id: '', name: '' });
      fetchLedgers();
    } catch (err) {
      setError('Failed to construct Depot. Ensure unique ID.');
    } finally {
      setLoading(false);
    }
  };

  const removeRouteRecord = async (id) => {
    if (!window.confirm("Delete this entire Route mapping?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/routes/delete/${id}`);
      setSuccessMsg(`Deleted Route ID: ${id}`);
      fetchStats();
      fetchLedgers();
    } catch (err) {
      setError('Failed to delete route');
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 flex items-center justify-between">
               <div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Revenue</p>
                 <p className="text-3xl font-black text-green-600">₹{stats.revenue || 0}</p>
               </div>
               <div className="text-4xl opacity-20">💰</div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 flex items-center justify-between">
               <div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Bookings</p>
                 <p className="text-3xl font-black text-blue-800">{stats.totalTickets || 0}</p>
               </div>
               <div className="text-4xl opacity-20">🎟️</div>
            </div>
          </div>
        )}

        {/* Quick Actions / Toggles */}
        {activeForm === 'none' && (
          <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-gray-100">
             <h2 className="text-xl font-black text-gray-800 mb-8 border-b pb-4">Strategic Administration</h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

                <div onClick={() => setActiveForm('depot')} className="bg-green-50 p-6 rounded-3xl border border-green-100 hover:bg-green-100 transition-colors cursor-pointer group">
                  <p className="text-xs font-black text-green-900 uppercase tracking-widest mb-1">Manage Depots</p>
                  <p className="text-sm font-medium text-green-700/70">Create and oversee independent operational facility logic maps.</p>
                  <div className="mt-4 text-green-600 font-black text-xs uppercase tracking-tighter group-hover:translate-x-1 transition-transform">View Depots →</div>
                </div>
             </div>
          </div>
        )}

        {/* Fleet Creation Form */}
        {activeForm === 'bus' && (
          <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-blue-100">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
               <h2 className="text-xl font-black text-blue-900">{editMode ? 'Edit Fleet Details' : 'Add New Bus to Fleet'}</h2>
               <button type="button" onClick={() => { setActiveForm('none'); setEditMode(false); }} className="text-gray-400 hover:text-red-500 font-black text-[10px] bg-red-50 px-3 py-1 rounded-full uppercase tracking-widest">Cancel ✕</button>
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
                 <div>
                   <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Assign to Depot</label>
                   <select required value={busData.depot_id} onChange={e => {
                     const selectedDept = depotData.find(d => d.depot_id === e.target.value);
                     setBusData({...busData, depot_id: e.target.value, depot_name: selectedDept ? selectedDept.name : '' });
                   }} className="w-full bg-gray-50 border-2 border-gray-100 p-3 rounded-xl font-bold uppercase">
                     <option value="" disabled>-- Select Database Depot --</option>
                     {depotData.map(depot => (
                       <option key={depot.depot_id} value={depot.depot_id}>{depot.name} ({depot.depot_id})</option>
                     ))}
                   </select>
                 </div>
               </div>
               <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-blue-700 transition">{editMode ? 'UPDATE BUS CONFIGURATION' : 'DEPLOY BUS'}</button>
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

               <button type="submit" className="w-full bg-purple-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-purple-700 transition relative z-20 hover:scale-[1.01] active:scale-[0.99] duration-200">{editMode ? 'UPDATE MAP CONFIGURATION' : 'PUBLISH ROUTE NETWORK'}</button>
            </form>
          </div>
        )}

        {/* Depot Management Form */}
        {activeForm === 'depot' && (
          <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-green-100">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
               <h2 className="text-xl font-black text-green-900">Configure Operational Depot</h2>
               <button type="button" onClick={() => setActiveForm('none')} className="text-gray-400 hover:text-red-500 font-black text-[10px] bg-red-50 px-3 py-1 rounded-full uppercase tracking-widest">Cancel ✕</button>
            </div>
            
            <form onSubmit={handleDepotSubmit} className="space-y-6 mb-12">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Depot ID Code (e.g. DP01)</label>
                   <input required type="text" value={depotForm.depot_id} onChange={e => setDepotForm({...depotForm, depot_id: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 p-3 rounded-xl font-bold uppercase"/>
                 </div>
                 <div>
                   <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Full Depot Name</label>
                   <input required type="text" value={depotForm.name} onChange={e => setDepotForm({...depotForm, name: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 p-3 rounded-xl font-bold"/>
                 </div>
               </div>
               <button type="submit" className="w-full bg-green-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-green-700 transition">REGISTER DEPOT</button>
            </form>

            <h3 className="text-lg font-black text-gray-800 mb-4 border-b pb-2">Active Depots Map</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {depotData.map(d => (
                 <div key={d.depot_id} className="p-4 border-2 border-gray-100 rounded-2xl flex flex-col justify-between hover:border-green-300 transition">
                   <div>
                     <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">{d.depot_id}</p>
                     <p className="text-lg font-bold text-gray-800 mb-4">{d.name}</p>
                   </div>
                   <button onClick={() => { setActiveLedger('buses'); setFleetFilterDepot(d.depot_id); setActiveForm('none'); setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100); }} className="w-full bg-green-50 text-green-700 font-black text-xs py-2 rounded-lg hover:bg-green-100 transition">Monitor Fleet →</button>
                 </div>
              ))}
              {depotData.length === 0 && <p className="text-gray-400 font-bold p-4">No Depots logic found in DB.</p>}
            </div>
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
              <button onClick={() => setActiveLedger('revenue')} className={`flex-1 md:flex-none px-6 py-3 text-xs font-black uppercase rounded-xl transition ${activeLedger === 'revenue' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>Revenue</button>
              <button onClick={() => setActiveLedger('pass_revenue')} className={`flex-1 md:flex-none px-6 py-3 text-xs font-black uppercase rounded-xl transition ${activeLedger === 'pass_revenue' ? 'bg-white shadow text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}>💳 Pass Revenue</button>
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
              <div>
                {fleetFilterDepot && (
                   <div className="mb-4 flex items-center justify-between bg-blue-50 border border-blue-200 p-3 rounded-xl text-blue-900 font-bold text-sm">
                     <span>Showing isolated fleet logic for Depot: <span className="font-black uppercase">{fleetFilterDepot}</span></span>
                     <button onClick={() => setFleetFilterDepot('')} className="bg-blue-200 hover:bg-blue-300 text-blue-800 text-xs px-3 py-1 rounded-lg transition">Clear Filter ✕</button>
                   </div>
                )}
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] uppercase font-black tracking-widest text-gray-400">
                      <th className="p-4 rounded-l-xl">Code</th>
                      <th className="p-4">Plate</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 rounded-r-xl text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerData.buses.filter(b => fleetFilterDepot ? b.depot_id === fleetFilterDepot : true).map(b => (
                      <tr key={b.bus_id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                        <td className="p-4 font-black text-blue-600">{b.bus_code}</td>
                      <td className="p-4 text-sm font-bold uppercase">{b.bus_number}</td>
                      <td className="p-4 text-xs font-bold text-gray-500 uppercase">{b.bus_type}</td>
                      <td className="p-4">
                         <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-blue-50 text-blue-700 rounded-md">{b.status}</span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                         <button onClick={() => { setBusData({ bus_code: b.bus_code, bus_number: b.bus_number, bus_type: b.bus_type, depot_id: b.depot_id || 'DP01', depot_name: b.depot_name || 'Central Depot', route_id: b.assigned_routes?.[0] || '1' }); setTargetId(b.bus_code); setEditMode(true); setActiveForm('bus'); }} className="text-blue-500 hover:bg-blue-50 px-2 py-1 rounded text-xs font-black uppercase transition">Edit</button>
                         <button onClick={() => removeBusRecord(b.bus_code)} className="text-red-500 hover:bg-red-50 px-2 py-1 rounded text-xs font-black uppercase transition">Del</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}

            {activeLedger === 'routes' && (
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50 text-[10px] uppercase font-black tracking-widest text-gray-400">
                    <th className="p-4 rounded-l-xl">ID</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Distance</th>
                    <th className="p-4">Nodes</th>
                    <th className="p-4 rounded-r-xl text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerData.routes.map(r => (
                    <tr key={r.route_id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="p-4 font-black">{r.route_id}</td>
                      <td className="p-4 text-sm font-bold text-purple-700 uppercase">{r.route_name}</td>
                      <td className="p-4 text-sm font-bold text-gray-500">{r.total_distance} km</td>
                      <td className="p-4 text-sm font-bold text-gray-500">{r.stops ? r.stops.length : 0} Stops</td>
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => { setRouteData({ route_name: r.route_name, start_stop: r.start_stop, end_stop: r.end_stop, total_distance: r.total_distance, stops: r.stops }); setTargetId(r.route_id); setEditMode(true); setActiveForm('route'); }} className="text-purple-500 hover:bg-purple-50 px-2 py-1 rounded text-xs font-black uppercase transition">Edit</button>
                        <button onClick={() => removeRouteRecord(r.route_id)} className="text-red-500 hover:bg-red-50 px-2 py-1 rounded text-xs font-black uppercase transition">Del</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeLedger === 'revenue' && (
              <div>
                <div className="flex flex-wrap gap-4 mb-6 bg-blue-50 p-4 rounded-2xl border border-blue-100">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-blue-800 mb-1">Filter by Date</label>
                    <input type="date" value={revFilterDate} onChange={e => setRevFilterDate(e.target.value)} className="p-2 border rounded-xl text-xs font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-blue-800 mb-1">Filter by Depot ID</label>
                    <input type="text" placeholder="e.g. DP01" value={revFilterDepot} onChange={e => setRevFilterDepot(e.target.value)} className="p-2 border rounded-xl text-xs font-bold uppercase" />
                  </div>
                  <div className="ml-auto self-end">
                    <button onClick={downloadCSV} className="bg-green-600 hover:bg-green-700 text-white font-black text-xs px-4 py-2 rounded-xl shadow transition">⬇ Download Excel Report</button>
                  </div>
                </div>

                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] uppercase font-black tracking-widest text-gray-400">
                      <th className="p-4 rounded-l-xl">Depot Name</th>
                      <th className="p-4">Depot ID</th>
                      <th className="p-4">Bus Code</th>
                      <th className="p-4">Tickets Sold</th>
                      <th className="p-4 rounded-r-xl text-right">Revenue (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueData.length === 0 && (
                      <tr><td colSpan="5" className="p-4 text-center text-gray-400 font-bold">No revenue data available for selected filters.</td></tr>
                    )}
                    {revenueData.map((r, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition">
                        <td className="p-4 font-black">{r.depot_name || 'N/A'}</td>
                        <td className="p-4 text-sm font-bold text-gray-500 uppercase">{r.depot_id || 'N/A'}</td>
                        <td className="p-4 text-sm font-black text-blue-600 uppercase">{r.bus_code || 'N/A'}</td>
                        <td className="p-4 text-sm font-bold">{r.ticket_count || 0}</td>
                        <td className="p-4 text-right font-black text-green-600 text-lg">₹{r.total_revenue || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeLedger === 'pass_revenue' && (
              <div>
                <div className="flex flex-wrap gap-4 mb-6 bg-purple-50 p-4 rounded-2xl border border-purple-100 items-end">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-purple-800 mb-1">Filter by Depot ID</label>
                    <select value={passRevFilterDepot} onChange={e => setPassRevFilterDepot(e.target.value)} className="p-2 border rounded-xl text-xs font-bold">
                      <option value="">All Depots</option>
                      {depotData.map(d => <option key={d.depot_id} value={d.depot_id}>{d.name} ({d.depot_id})</option>)}
                    </select>
                  </div>
                  <div className="bg-white border border-purple-200 px-6 py-3 rounded-xl">
                    <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Total Pass Revenue</p>
                    <p className="text-2xl font-black text-purple-700">₹{passRevenue.total} <span className="text-sm font-bold text-purple-400">({passRevenue.count} Active Passes)</span></p>
                  </div>
                </div>
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] uppercase font-black tracking-widest text-gray-400">
                      <th className="p-4 rounded-l-xl">Pass ID</th>
                      <th className="p-4">Holder</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Depot</th>
                      <th className="p-4">Route</th>
                      <th className="p-4 rounded-r-xl text-right">Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(passRevenue.passes || []).length === 0 && (
                      <tr><td colSpan="6" className="p-6 text-center text-gray-400 font-bold">No active passes found{passRevFilterDepot ? ` for depot ${passRevFilterDepot}` : ''}.</td></tr>
                    )}
                    {(passRevenue.passes || []).map((p, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition">
                        <td className="p-4 font-mono text-xs font-bold">{p.pass_id}</td>
                        <td className="p-4 font-black text-sm">{p.applicant_details?.full_name || 'N/A'}</td>
                        <td className="p-4">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                            p.pass_type === 'GOLD' ? 'bg-yellow-100 text-yellow-800' :
                            p.pass_type === 'PLATINUM' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-200 text-gray-700'
                          }`}>{p.pass_type}</span>
                        </td>
                        <td className="p-4 text-sm font-bold text-gray-500 uppercase">{p.depot_id}</td>
                        <td className="p-4 text-sm font-bold">{p.from_stop} → {p.to_stop}</td>
                        <td className="p-4 text-right font-black text-green-600 text-lg">₹{p.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
