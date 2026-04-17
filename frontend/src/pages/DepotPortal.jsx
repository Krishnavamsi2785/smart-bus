import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';

function DepotPortal() {
  const [depotAuth, setDepotAuth] = useState(null);
  const [allDepots, setAllDepots] = useState([]);
  const [loginForm, setLoginForm] = useState({ depot_id: '', password: '' });
  const [loginError, setLoginError] = useState('');
  
  const [activeTab, setActiveTab] = useState('NEW'); // NEW | RENEWAL | APPROVED
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ active_buses: 0, pass_revenue: 0 });
  const [newApplications, setNewApplications] = useState([]);
  const [renewalApplications, setRenewalApplications] = useState([]);
  const [approvedApplications, setApprovedApplications] = useState([]);
  const [payingPassId, setPayingPassId] = useState(null);

  // Load all depots for login validation
  useEffect(() => {
    axios.get(`${API_BASE_URL}/depot`)
      .then(res => setAllDepots(res.data.data || []))
      .catch(console.error);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    const cleanId = loginForm.depot_id.trim().toUpperCase();
    const cleanPw = loginForm.password.trim().toUpperCase();
    if (!cleanId) return;
    const exists = allDepots.find(d => d.depot_id.toUpperCase() === cleanId);
    if (!exists) {
      setLoginError(`Depot ID "${cleanId}" not found. Please create it in Admin Panel first.`);
      return;
    }
    if (cleanId !== cleanPw) {
      setLoginError(`Password must match Depot ID exactly. Use "${cleanId}" as the password.`);
      return;
    }
    setDepotAuth(cleanId);
    setLoginError('');
  };

  const fetchAll = async () => {
    if (!depotAuth) return;
    setLoading(true);
    try {
      const [busRes, newRes, approvedRes, revenueRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/bus`),
        axios.get(`${API_BASE_URL}/pass/depot/${depotAuth}`),
        axios.get(`${API_BASE_URL}/pass/depot/${depotAuth}/approved`),
        axios.get(`${API_BASE_URL}/pass/revenue?depot_id=${depotAuth}`)
      ]);

      const localBuses = (busRes.data.data || []).filter(b => b.depot_id === depotAuth);
      setStats({
        active_buses: localBuses.length,
        pass_revenue: revenueRes.data.data?.total || 0
      });

      const pending = newRes.data.data || [];
      setNewApplications(pending.filter(p => p.status === 'PENDING'));
      setRenewalApplications(pending.filter(p => p.status === 'PENDING_RENEWAL'));
      setApprovedApplications(approvedRes.data.data || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [depotAuth]);

  const approvePass = async (pass_id) => {
    if (!window.confirm(`Approve pass ${pass_id}?`)) return;
    try {
      await axios.post(`${API_BASE_URL}/pass/approve`, { pass_id });
      await fetchAll();
    } catch (err) { alert('Approval failed: ' + err.message); }
  };

  const deletePass = async (pass_id) => {
    if (!window.confirm(`Permanently delete pass ${pass_id}? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API_BASE_URL}/pass/${pass_id}`);
      await fetchAll();
    } catch (err) { alert('Delete failed: ' + err.message); }
  };

  // Trigger Razorpay for an approved pass (user pays)
  const initiatePassPayment = async (pass) => {
    setPayingPassId(pass.pass_id);
    try {
      const orderRes = await axios.post(`${API_BASE_URL}/payment/create-order`, { amount: pass.price });
      const order = orderRes.data.data;

      if (order.is_simulator) {
        // Demo mode: auto-confirm
        await axios.post(`${API_BASE_URL}/pass/pay`, { pass_id: pass.pass_id });
        alert(`✅ Payment simulated! Pass ${pass.pass_id} is now ACTIVE.`);
        await fetchAll();
        return;
      }

      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: 'INR',
        name: 'APSRTC Smart Bus Pass',
        description: `${pass.pass_type} Pass — ${pass.from_stop} → ${pass.to_stop}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            const verifyRes = await axios.post(`${API_BASE_URL}/payment/verify-payment`, response);
            if (verifyRes.data.success) {
              await axios.post(`${API_BASE_URL}/pass/pay`, { pass_id: pass.pass_id });
              alert(`✅ Payment successful! Pass ${pass.pass_id} activated.`);
              await fetchAll();
            }
          } catch { alert('Payment verification failed.'); }
        },
        theme: { color: '#1e3a8a' },
        modal: { ondismiss: () => setPayingPassId(null) }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert('Payment Error: ' + err.message);
    } finally {
      setPayingPassId(null);
    }
  };

  // ── Login Screen ──
  if (!depotAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-900 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-sm w-full relative overflow-hidden">
          <div className="absolute -right-8 -top-8 text-9xl opacity-5">🏢</div>
          <h1 className="text-3xl font-black text-blue-900 tracking-tight mb-1">Depot Control</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-8">Secure Administrator Access</p>
          {loginError && <div className="bg-red-50 text-red-600 font-bold p-3 rounded-xl mb-4 text-xs border border-red-200">{loginError}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Depot ID</label>
              <input required type="text" value={loginForm.depot_id} onChange={e => setLoginForm({...loginForm, depot_id: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 p-3 rounded-xl font-bold uppercase tracking-widest" placeholder="e.g. DP01"/>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Password (same as Depot ID)</label>
              <input required type="password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 p-3 rounded-xl font-bold"/>
            </div>
            <button type="submit" className="w-full bg-blue-900 text-white font-black py-4 rounded-xl shadow-lg hover:bg-black transition uppercase tracking-widest text-sm">Enter Dashboard</button>
          </form>
          <p className="text-center text-[10px] text-gray-400 mt-6 font-bold uppercase tracking-widest">Password = Your Depot ID</p>
        </div>
      </div>
    );
  }

  const depotName = allDepots.find(d => d.depot_id === depotAuth)?.name || depotAuth;

  const TabButton = ({ id, label, count, color = 'blue' }) => {
    const colorMap = {
      blue: activeTab === id ? 'bg-blue-900 text-white' : 'bg-white text-blue-900 hover:bg-blue-50',
      yellow: activeTab === id ? 'bg-yellow-500 text-white' : 'bg-white text-yellow-700 hover:bg-yellow-50',
      green: activeTab === id ? 'bg-green-600 text-white' : 'bg-white text-green-700 hover:bg-green-50',
    };
    return (
      <button onClick={() => setActiveTab(id)} className={`px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition border-2 border-current flex items-center gap-2 ${colorMap[color]}`}>
        {label}
        {count > 0 && <span className={`text-xs font-black px-2 py-0.5 rounded-full ${activeTab === id ? 'bg-white/30' : 'bg-current/10'}`}>{count}</span>}
      </button>
    );
  };

  const PassCard = ({ app, isApproved }) => (
    <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl flex flex-col md:flex-row justify-between md:items-start gap-6 shadow-sm">
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md
            ${app.pass_type === 'GOLD' ? 'bg-yellow-100 text-yellow-800' :
              app.pass_type === 'PLATINUM' ? 'bg-purple-100 text-purple-800' :
              'bg-gray-200 text-gray-700'}`}>
            {app.pass_type}
          </span>
          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md
            ${app.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
              app.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
              'bg-orange-100 text-orange-800'}`}>
            {app.status}
          </span>
          <span className="text-[10px] font-black text-gray-400">₹{app.price}</span>
        </div>
        <h3 className="text-lg font-black text-gray-900">{app.applicant_details?.full_name}</h3>
        {app.applicant_details?.college_name && <p className="text-sm font-bold text-gray-500">{app.applicant_details.college_name}</p>}
        <p className="text-sm font-bold text-gray-600 mt-1">📍 {app.from_stop} → {app.to_stop}</p>
        <p className="text-xs font-bold text-gray-400 mt-1">ID: {app.pass_id} · {app.duration} Month(s)</p>
      </div>
      
      {/* Documents */}
      <div className="flex gap-3">
        {app.documents?.passport_photo && (
          <div className="text-center">
            <img src={app.documents.passport_photo} alt="Photo" className="w-14 h-14 rounded-xl border object-cover shadow-sm"/>
            <p className="text-[8px] font-black uppercase mt-1">Photo</p>
          </div>
        )}
        {app.documents?.college_cert && (
          <div className="text-center">
            <img src={app.documents.college_cert} alt="College" className="w-14 h-14 rounded-xl border object-cover shadow-sm hover:scale-150 transition cursor-pointer origin-bottom-right"/>
            <p className="text-[8px] font-black uppercase mt-1">College</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 min-w-[160px]">
        {!isApproved && (
          <button onClick={() => approvePass(app.pass_id)} className="bg-green-500 hover:bg-green-600 text-white font-black px-4 py-3 rounded-xl shadow text-xs uppercase tracking-widest transition">
            ✅ Approve
          </button>
        )}
        {isApproved && app.status === 'APPROVED' && (
          <button
            disabled={payingPassId === app.pass_id}
            onClick={() => initiatePassPayment(app)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black px-4 py-3 rounded-xl shadow text-xs uppercase tracking-widest transition disabled:opacity-50"
          >
            {payingPassId === app.pass_id ? 'Processing...' : `💳 Collect ₹${app.price}`}
          </button>
        )}
        {app.status === 'ACTIVE' && (
          <span className="bg-green-100 text-green-700 font-black text-xs text-center px-4 py-2 rounded-xl">✅ Pass Active</span>
        )}
        <button onClick={() => deletePass(app.pass_id)} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-black px-4 py-2 rounded-xl text-xs uppercase transition">
          🗑 Delete
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-blue-900 p-8 text-white rounded-b-[3rem] shadow-2xl mb-10">
        <div className="max-w-6xl mx-auto flex justify-between items-end">
          <div>
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1">Depot Console</p>
            <h1 className="text-3xl font-black tracking-tight">{depotName}</h1>
            <p className="text-blue-300 text-xs font-bold uppercase tracking-widest mt-1">{depotAuth} · Pass Management Dashboard</p>
          </div>
          <button onClick={() => setDepotAuth(null)} className="bg-red-500 hover:bg-red-600 text-white font-black px-5 py-2 rounded-xl text-xs uppercase transition">Logout</button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-7 rounded-3xl shadow-lg border border-gray-100 flex justify-between items-center">
            <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Fleet</p><p className="text-4xl font-black text-yellow-600">{stats.active_buses}</p></div>
            <div className="text-4xl opacity-20">🚌</div>
          </div>
          <div className="bg-white p-7 rounded-3xl shadow-lg border border-gray-100 flex justify-between items-center">
            <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pass Revenue</p><p className="text-4xl font-black text-green-600">₹{stats.pass_revenue}</p></div>
            <div className="text-4xl opacity-20">💳</div>
          </div>
          <div className="bg-white p-7 rounded-3xl shadow-lg border border-gray-100 flex justify-between items-center">
            <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pending Review</p><p className="text-4xl font-black text-orange-500">{newApplications.length + renewalApplications.length}</p></div>
            <div className="text-4xl opacity-20">⏳</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-3 mb-8">
          <TabButton id="NEW" label="New Applications" count={newApplications.length} color="blue"/>
          <TabButton id="RENEWAL" label="Renewal Requests" count={renewalApplications.length} color="yellow"/>
          <TabButton id="APPROVED" label="Approved / Active" count={approvedApplications.length} color="green"/>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-16 font-black text-gray-400 animate-pulse">Loading applications...</div>
        ) : (
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">

            {activeTab === 'NEW' && (
              <>
                <h2 className="text-lg font-black text-gray-800 mb-6 border-b pb-3">New Pass Applications — Awaiting Verification</h2>
                {newApplications.length === 0 ? (
                  <div className="p-10 border-2 border-dashed border-gray-200 rounded-2xl text-center text-gray-400 font-black">No pending new applications.</div>
                ) : (
                  <div className="space-y-4">{newApplications.map(app => <PassCard key={app.pass_id} app={app} isApproved={false}/>)}</div>
                )}
              </>
            )}

            {activeTab === 'RENEWAL' && (
              <>
                <h2 className="text-lg font-black text-gray-800 mb-6 border-b pb-3">Renewal Requests — Awaiting Re-Verification</h2>
                {renewalApplications.length === 0 ? (
                  <div className="p-10 border-2 border-dashed border-gray-200 rounded-2xl text-center text-gray-400 font-black">No pending renewal requests.</div>
                ) : (
                  <div className="space-y-4">{renewalApplications.map(app => <PassCard key={app.pass_id} app={app} isApproved={false}/>)}</div>
                )}
              </>
            )}

            {activeTab === 'APPROVED' && (
              <>
                <h2 className="text-lg font-black text-gray-800 mb-6 border-b pb-3">Approved Applications — Collect Payment or Delete</h2>
                {approvedApplications.length === 0 ? (
                  <div className="p-10 border-2 border-dashed border-gray-200 rounded-2xl text-center text-gray-400 font-black">No approved passes yet.</div>
                ) : (
                  <div className="space-y-4">{approvedApplications.map(app => <PassCard key={app.pass_id} app={app} isApproved={true}/>)}</div>
                )}
              </>
            )}

          </div>
        )}
      </div>
    </div>
  );
}

export default DepotPortal;
