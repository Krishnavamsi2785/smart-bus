import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../config';

function Passes() {
  const { user } = useAuth();
  const [activePass, setActivePass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [depotData, setDepotData] = useState([]);
  const [routeData, setRouteData] = useState([]);
  const [busData, setBusData] = useState([]);
  
  const [viewMode, setViewMode] = useState('SHOP');
  const [selectedPassType, setSelectedPassType] = useState('');
  
  const [formData, setFormData] = useState({
    full_name: '', phone: '', aadhar: '', college_name: '', father_name: '', year_of_study: '', age: '',
    duration: '', depot_id: '', route_id: '', from_stop_id: '', to_stop_id: '', pass_id: ''
  });

  const [files, setFiles] = useState({ passport_photo: '', college_cert: '', tenth_cert: '' });
  const [pricePreview, setPricePreview] = useState(null); // { price, distance }
  const [priceLoading, setPriceLoading] = useState(false);

  const fetchDependencies = async () => {
    try {
      const [dep, rt, pass, bus] = await Promise.all([
        axios.get(`${API_BASE_URL}/depot`),
        axios.get(`${API_BASE_URL}/routes`),
        axios.get(`${API_BASE_URL}/pass/user/${user.user_id}`),
        axios.get(`${API_BASE_URL}/bus`)
      ]);
      setDepotData(dep.data.data || []);
      setRouteData(rt.data.data || []);
      setBusData(bus.data.data || []);
      
      const passObj = pass.data.data;
      if (passObj) {
        if (passObj.status === 'ACTIVE') { setActivePass(passObj); setViewMode('ACTIVE'); }
        else if (passObj.status === 'PENDING' || passObj.status === 'PENDING_RENEWAL') { setActivePass(passObj); setViewMode('WAITING'); }
        else if (passObj.status === 'APPROVED') { setActivePass(passObj); setViewMode('PAY'); }
      }
    } catch (err) {
      setError('Failed to load pass data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDependencies(); }, []);

  // Auto-fetch price whenever all required fields are set
  const fetchPricePreview = useCallback(async () => {
    const { route_id, from_stop_id, to_stop_id, duration } = formData;
    if (!route_id || !from_stop_id || !to_stop_id || !duration || !selectedPassType) {
      setPricePreview(null);
      return;
    }
    setPriceLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/pass/price`, {
        params: { route_id, from_stop_id, to_stop_id, pass_type: selectedPassType, duration }
      });
      setPricePreview(res.data.data);
    } catch {
      setPricePreview(null);
    } finally {
      setPriceLoading(false);
    }
  }, [formData.route_id, formData.from_stop_id, formData.to_stop_id, formData.duration, selectedPassType]);

  useEffect(() => { fetchPricePreview(); }, [fetchPricePreview]);

  const handleFileUpload = (e, key) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setFiles(prev => ({ ...prev, [key]: reader.result }));
    reader.readAsDataURL(file);
  };

  const getStopsForRoute = () => {
    if (!formData.route_id) return [];
    const r = routeData.find(x => x.route_id === parseInt(formData.route_id));
    return r ? (r.stops || []) : [];
  };

  const getRoutesForDepot = () => {
    if (!formData.depot_id) return [];
    const buses = busData.filter(b => b.depot_id === formData.depot_id);
    const validIds = new Set();
    buses.forEach(b => (b.assigned_routes || []).forEach(r => validIds.add(String(r))));
    const filtered = routeData.filter(r => validIds.has(String(r.route_id)));
    return filtered.length > 0 ? filtered : (buses.length > 0 ? routeData : []);
  };

  const handleDepotChange = (depotId) => {
    setFormData(prev => ({ ...prev, depot_id: depotId, route_id: '', from_stop_id: '', to_stop_id: '' }));
    setPricePreview(null);
  };

  const handleRouteChange = (routeId) => {
    setFormData(prev => ({ ...prev, route_id: routeId, from_stop_id: '', to_stop_id: '' }));
    setPricePreview(null);
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!pricePreview) { setError('Please complete all selections to see the fare first.'); return; }
    setSubmitLoading(true);
    try {
      const payload = {
        user_id: user.user_id,
        pass_type: selectedPassType,
        duration: parseInt(formData.duration),
        depot_id: formData.depot_id,
        route_id: formData.route_id,
        from_stop_id: formData.from_stop_id,
        to_stop_id: formData.to_stop_id,
        applicant_details: { 
          full_name: formData.full_name, phone: formData.phone, age: formData.age, aadhar: formData.aadhar, 
          college_name: formData.college_name, father_name: formData.father_name, year_of_study: formData.year_of_study 
        },
        documents: files
      };
      const res = await axios.post(`${API_BASE_URL}/pass/apply`, payload);
      setActivePass(res.data.data);
      if (res.data.data.status === 'APPROVED') setViewMode('PAY');
      else setViewMode('WAITING');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit application');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleRenewal = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
       const res = await axios.post(`${API_BASE_URL}/pass/renew`, { pass_id: formData.pass_id });
       setActivePass(res.data.data);
       if (res.data.data.status === 'APPROVED') setViewMode('PAY');
       else setViewMode('WAITING');
    } catch (err) { setError('Failed to trigger renewal.'); }
    finally { setSubmitLoading(false); }
  };

  const handlePayment = async () => {
    setSubmitLoading(true);
    try {
      // 1. Create Razorpay order on backend
      const orderRes = await axios.post(`${API_BASE_URL}/payment/create-order`, { 
        amount: activePass.price 
      });
      const order = orderRes.data.data;

      // 2. Handle Simulator/Demo mode (no real Razorpay keys configured)
      if (order.is_simulator) {
        console.warn('--- DEMO MODE: Auto-confirming pass payment ---');
        setTimeout(async () => {
          const res = await axios.post(`${API_BASE_URL}/pass/pay`, { pass_id: activePass.pass_id });
          setActivePass(res.data.data);
          setViewMode('ACTIVE');
          setSubmitLoading(false);
        }, 1500);
        return;
      }

      // 3. Real Razorpay Checkout
      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: 'INR',
        name: 'APSRTC Smart Bus Pass',
        description: `${activePass.pass_type} Pass — ${activePass.from_stop} → ${activePass.to_stop}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            // 4. Verify payment signature on backend
            const verifyRes = await axios.post(`${API_BASE_URL}/payment/verify-payment`, response);
            if (verifyRes.data.success) {
              // 5. Activate the pass in DB
              const activateRes = await axios.post(`${API_BASE_URL}/pass/pay`, { 
                pass_id: activePass.pass_id,
                payment_id: response.razorpay_payment_id
              });
              setActivePass(activateRes.data.data);
              setViewMode('ACTIVE');
            } else {
              setError('Payment verification failed. Please contact support.');
            }
          } catch {
            setError('Payment verification error. Your money is safe — contact support with your Pass ID.');
          }
        },
        prefill: {
          name: user.name,
          contact: user.phone
        },
        theme: { color: '#1e3a8a' },
        modal: {
          ondismiss: () => setSubmitLoading(false)
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        setError('Payment failed. Please try again.');
        setSubmitLoading(false);
      });
      rzp.open();

    } catch (err) {
      setError('Could not initialize payment: ' + (err.response?.data?.error || err.message));
      setSubmitLoading(false);
    }
  };

  if (loading) return <div className="p-10 font-bold text-center animate-pulse text-blue-900">Loading Pass Ecosystem...</div>;

  const PassCard = ({ passParams }) => {
    const isSilv = passParams.pass_type === 'SILVER';
    const isGold = passParams.pass_type === 'GOLD';
    const isPlat = passParams.pass_type === 'PLATINUM';

    // Tier-specific design tokens
    const tier = {
      SILVER: {
        bg: 'linear-gradient(135deg, #e8e8e8 0%, #c0c0c0 40%, #a8a8a8 60%, #d8d8d8 100%)',
        headerBg: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 50%, #6b7280 100%)',
        accent: '#6b7280',
        accentLight: '#f3f4f6',
        textHeader: '#ffffff',
        textBody: '#1f2937',
        textMuted: '#6b7280',
        shimmer: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
        borderColor: '#9ca3af',
        badgeIcon: '🥈',
        badgeLabel: 'SILVER TIER',
        badgeBg: 'linear-gradient(135deg, #9ca3af, #6b7280)',
        stripBg: 'linear-gradient(90deg, #6b7280, #9ca3af, #6b7280)',
        org: 'APSRTC · Pallevelugu Network',
        tagline: 'STUDENT TRAVEL PASS'
      },
      GOLD: {
        bg: 'linear-gradient(135deg, #fef3c7 0%, #f59e0b 30%, #d97706 60%, #fbbf24 100%)',
        headerBg: 'linear-gradient(135deg, #b45309 0%, #d97706 50%, #b45309 100%)',
        accent: '#b45309',
        accentLight: '#fffbeb',
        textHeader: '#ffffff',
        textBody: '#1c1003',
        textMuted: '#92400e',
        shimmer: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
        borderColor: '#d97706',
        badgeIcon: '👑',
        badgeLabel: 'GOLD TIER',
        badgeBg: 'linear-gradient(135deg, #f59e0b, #b45309)',
        stripBg: 'linear-gradient(90deg, #b45309, #f59e0b, #d97706)',
        org: 'APSRTC · Metro Express Network',
        tagline: 'STUDENT TRAVEL PASS'
      },
      PLATINUM: {
        bg: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 30%, #4f46e5 60%, #1e1b4b 100%)',
        headerBg: 'linear-gradient(135deg, #0f0a2e 0%, #1e1b4b 50%, #0f0a2e 100%)',
        accent: '#818cf8',
        accentLight: 'rgba(255,255,255,0.08)',
        textHeader: '#c7d2fe',
        textBody: '#e0e7ff',
        textMuted: '#a5b4fc',
        shimmer: 'linear-gradient(90deg, transparent, rgba(165,180,252,0.4), transparent)',
        borderColor: '#6366f1',
        badgeIcon: '💎',
        badgeLabel: 'PLATINUM TIER',
        badgeBg: 'linear-gradient(135deg, #6366f1, #312e81)',
        stripBg: 'linear-gradient(90deg, #312e81, #818cf8, #4f46e5)',
        org: 'APSRTC · All Network Access',
        tagline: 'GENERAL TRAVEL PASS'
      }
    }[passParams.pass_type] || {};

    return (
      <div style={{ fontFamily: "'Inter', sans-serif", maxWidth: 520, margin: '0 auto' }}>
        {/* ── CARD SHELL ── */}
        <div style={{
          background: tier.bg,
          borderRadius: 24,
          boxShadow: `0 25px 60px rgba(0,0,0,0.35), 0 0 0 1px ${tier.borderColor}`,
          overflow: 'hidden',
          position: 'relative'
        }}>

          {/* Shimmer sweep animation */}
          <div style={{
            position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%',
            background: tier.shimmer,
            transform: 'skewX(-20deg)',
            animation: 'shimmer 4s infinite',
            zIndex: 1, pointerEvents: 'none'
          }}/>

          {/* ── HEADER BAND ── */}
          <div style={{ background: tier.headerBg, padding: '18px 24px', position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: tier.textHeader, fontSize: 9, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.7 }}>APSRTC Smart Bus System</div>
                <div style={{ color: tier.textHeader, fontSize: 13, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 2 }}>{tier.tagline}</div>
              </div>
              {/* Chest Badge */}
              <div style={{
                width: 54, height: 54,
                background: tier.badgeBg,
                borderRadius: '50%',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                border: '2px solid rgba(255,255,255,0.3)',
                flexShrink: 0
              }}>
                <span style={{ fontSize: 22, lineHeight: 1 }}>{tier.badgeIcon}</span>
                <span style={{ color: '#fff', fontSize: 5, fontWeight: 900, letterSpacing: '0.1em', marginTop: 2 }}>{tier.badgeLabel.split(' ')[0]}</span>
              </div>
            </div>
          </div>

          {/* ── HOLOGRAPHIC STRIP ── */}
          <div style={{ height: 5, background: tier.stripBg, position: 'relative', zIndex: 2 }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(255,255,255,0.15) 4px, rgba(255,255,255,0.15) 5px)'
            }}/>
          </div>

          {/* ── CARD BODY ── */}
          <div style={{ padding: '20px 24px 24px', position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

              {/* Photo */}
              <div style={{ flexShrink: 0 }}>
                {passParams.documents?.passport_photo ? (
                  <div style={{
                    width: 72, height: 72,
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: `3px solid ${tier.borderColor}`,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                  }}>
                    <img src={passParams.documents.passport_photo} alt="Holder" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                  </div>
                ) : (
                  <div style={{
                    width: 72, height: 72, borderRadius: 12,
                    background: tier.accentLight,
                    border: `3px solid ${tier.borderColor}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, opacity: 0.5
                  }}>👤</div>
                )}
              </div>

              {/* Identity */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: tier.textMuted, fontSize: 8, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Holder Name</div>
                <div style={{ color: tier.textBody, fontSize: 18, fontWeight: 900, marginTop: 2, letterSpacing: '0.02em', lineHeight: 1.2 }}>
                  {passParams.applicant_details?.full_name || 'PASS HOLDER'}
                </div>
                {!isPlat && passParams.applicant_details?.college_name && (
                  <div style={{ color: tier.textMuted, fontSize: 11, fontWeight: 700, marginTop: 4, letterSpacing: '0.02em' }}>
                    {passParams.applicant_details.college_name}
                  </div>
                )}
                {!isPlat && passParams.applicant_details?.year_of_study && (
                  <div style={{ color: tier.accent, fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>
                    {passParams.applicant_details.year_of_study}
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: `${tier.borderColor}55`, margin: '16px 0' }}/>

            {/* Route Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div>
                <div style={{ color: tier.textMuted, fontSize: 8, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 2 }}>From</div>
                <div style={{ color: tier.textBody, fontSize: 12, fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.3 }}>{passParams.from_stop || '—'}</div>
              </div>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: tier.badgeBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, color: '#fff', flexShrink: 0
              }}>→</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: tier.textMuted, fontSize: 8, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 2 }}>To</div>
                <div style={{ color: tier.textBody, fontSize: 12, fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.3 }}>{passParams.to_stop || '—'}</div>
              </div>
            </div>

            {/* Meta Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div style={{ background: tier.accentLight, borderRadius: 10, padding: '10px 12px', border: `1px solid ${tier.borderColor}33` }}>
                <div style={{ color: tier.textMuted, fontSize: 7, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 3 }}>Duration</div>
                <div style={{ color: tier.textBody, fontSize: 13, fontWeight: 900 }}>{passParams.duration}M</div>
              </div>
              <div style={{ background: tier.accentLight, borderRadius: 10, padding: '10px 12px', border: `1px solid ${tier.borderColor}33` }}>
                <div style={{ color: tier.textMuted, fontSize: 7, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 3 }}>Valid Until</div>
                <div style={{ color: tier.textBody, fontSize: 11, fontWeight: 900 }}>{passParams.valid_until ? new Date(passParams.valid_until).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' }) : 'N/A'}</div>
              </div>
              <div style={{ background: tier.accentLight, borderRadius: 10, padding: '10px 12px', border: `1px solid ${tier.borderColor}33` }}>
                <div style={{ color: tier.textMuted, fontSize: 7, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 3 }}>Status</div>
                <div style={{ color: '#22c55e', fontSize: 11, fontWeight: 900, textTransform: 'uppercase' }}>● {passParams.status}</div>
              </div>
            </div>
          </div>

          {/* ── MAGNETIC STRIPE FOOTER ── */}
          <div style={{
            background: 'rgba(0,0,0,0.35)',
            padding: '10px 24px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            position: 'relative', zIndex: 2
          }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Pass ID</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 900, letterSpacing: '0.08em', fontFamily: 'monospace' }}>{passParams.pass_id}</div>
            </div>
            {/* Barcode strips */}
            <div style={{ display: 'flex', gap: 2, alignItems: 'center', opacity: 0.5 }}>
              {[3,1,4,2,5,1,2,4,3,1,5,2,3,1,4].map((w, i) => (
                <div key={i} style={{ width: w, height: 24, background: 'white', borderRadius: 1 }}/>
              ))}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Network</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: 900, textTransform: 'uppercase' }}>{tier.org?.split('·')[1]?.trim()}</div>
            </div>
          </div>

        </div>

        {/* Shimmer keyframe */}
        <style>{`@keyframes shimmer { 0%{left:-100%} 100%{left:200%} }`}</style>
      </div>
    );
  };

  const cls = {
    select: "w-full bg-gray-50 border-2 border-gray-100 p-3 rounded-xl font-bold focus:border-blue-400 outline-none transition disabled:opacity-40 disabled:cursor-not-allowed",
    input: "w-full bg-gray-50 border-2 border-gray-100 p-3 rounded-xl font-bold focus:border-blue-400 outline-none transition",
    label: "block text-xs font-black text-gray-400 uppercase tracking-widest mb-2"
  };

  const depotRoutes = getRoutesForDepot();
  const routeStops  = getStopsForRoute();
  const discountMap = { SILVER: '55%', GOLD: '45%', PLATINUM: '35%' };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-blue-900 p-10 text-white rounded-b-[3rem] shadow-2xl mb-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-black tracking-tight">Passes Hub</h1>
          <p className="text-blue-300 font-bold uppercase tracking-widest text-xs mt-1">APSRTC Dedicated Student & General Passes</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-600 font-bold p-4 rounded-xl mb-6 flex justify-between"><span>{error}</span><button onClick={() => setError('')} className="text-red-400 font-black">✕</button></div>}

        {viewMode === 'ACTIVE' && (
          <div>
            <h2 className="text-2xl font-black text-gray-800 mb-6">Your Valid Digital Pass</h2>
            <PassCard passParams={activePass} />
          </div>
        )}

        {viewMode === 'WAITING' && (
          <div className="p-10 bg-yellow-50 text-center rounded-[3rem] border border-yellow-200">
             <div className="text-5xl mb-4">⏳</div>
             <h2 className="text-2xl font-black text-yellow-800 mb-2">Pending Depot Verification</h2>
             <p className="text-yellow-700 font-bold">Your <b>{activePass?.pass_type} PASS</b> application is waiting for depot admin approval.</p>
             <p className="text-yellow-500 text-xs font-bold mt-4 uppercase tracking-widest">Depot admin must approve at /depot-login</p>
          </div>
        )}

        {viewMode === 'PAY' && (
           <div className="p-10 bg-green-50 text-center rounded-[3rem] border border-green-200 max-w-xl mx-auto">
             <div className="text-5xl mb-4">{activePass?.pass_type === 'PLATINUM' ? '💎' : '✅'}</div>
             <h2 className="text-2xl font-black text-green-800 mb-1">
               {activePass?.pass_type === 'PLATINUM' ? 'Instant Approval — Pay to Activate' : 'Application Approved by Depot!'}
             </h2>
             <p className="text-green-600 font-bold text-sm mb-6">
               {activePass?.pass_type === 'PLATINUM'
                 ? 'Platinum pass requires no document verification. Pay now to instantly activate.'
                 : 'Your documents have been verified by the depot. Complete payment to receive your digital pass.'}
             </p>
             <div className="bg-white p-6 rounded-2xl mx-auto max-w-sm mb-6 border border-green-100 shadow-sm">
                <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-1">
                  {activePass?.pass_type} Pass · {activePass?.duration} Month(s)
                </p>
                <p className="text-sm font-bold text-gray-500 mb-2">📍 {activePass?.from_stop} → {activePass?.to_stop}</p>
                <p className="text-4xl font-black text-green-700">₹{activePass?.price}</p>
                <p className="text-xs text-gray-400 font-bold mt-1">35% off standard fare applied</p>
             </div>
             <button 
               disabled={submitLoading} 
               onClick={handlePayment} 
               className="bg-blue-900 text-white font-black px-10 py-4 rounded-xl shadow-lg hover:bg-black transition disabled:opacity-50 flex items-center gap-3 mx-auto"
             >
               {submitLoading ? (
                 <span className="animate-pulse">Connecting to Payment Gateway...</span>
               ) : (
                 <>
                   <span>💳 Pay ₹{activePass?.price} via Razorpay</span>
                 </>
               )}
             </button>
             <p className="text-[10px] text-gray-400 font-bold mt-4 uppercase tracking-widest">Secured by Razorpay · Your Pass generates instantly after payment</p>
           </div>
        )}

        {viewMode === 'SHOP' && (
           <div>
             <h2 className="text-2xl font-black text-gray-800 mb-6">Choose Your Pass Type</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div onClick={() => { setSelectedPassType('SILVER'); setViewMode('FORM'); }} className="p-8 rounded-3xl border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-gray-200 cursor-pointer hover:scale-[1.02] transition shadow-lg group">
                  <h3 className="text-xl font-black text-gray-800 mb-1">🎖 Silver Pass</h3>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Student · Pallevelugu Only</p>
                  <p className="font-bold text-sm text-gray-600">Save <b>55%</b> off your standard monthly fare.</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase mt-4 group-hover:text-gray-700 transition">Apply Now →</p>
                </div>
                <div onClick={() => { setSelectedPassType('GOLD'); setViewMode('FORM'); }} className="p-8 rounded-3xl border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 to-yellow-200 cursor-pointer hover:scale-[1.02] transition shadow-lg group">
                  <h3 className="text-xl font-black text-yellow-900 mb-1">👑 Gold Pass</h3>
                  <p className="text-xs font-bold text-yellow-700 uppercase tracking-widest mb-3">Student · Metro Access</p>
                  <p className="font-bold text-sm text-yellow-800">Save <b>45%</b> off monthly standard fare.</p>
                  <p className="text-[10px] font-black text-yellow-600 uppercase mt-4 group-hover:text-yellow-900 transition">Apply Now →</p>
                </div>
                <div onClick={() => { setSelectedPassType('PLATINUM'); setViewMode('FORM'); }} className="p-8 rounded-3xl border-2 border-purple-300 bg-gradient-to-br from-purple-100 to-purple-300 cursor-pointer hover:scale-[1.02] transition shadow-lg group">
                  <h3 className="text-xl font-black text-purple-900 mb-1">💎 Platinum Pass</h3>
                  <p className="text-xs font-bold text-purple-700 uppercase tracking-widest mb-3">General · Instant Approval</p>
                  <p className="font-bold text-sm text-purple-800">Save <b>35%</b> off. No document verification needed.</p>
                  <p className="text-[10px] font-black text-purple-600 uppercase mt-4 group-hover:text-purple-900 transition">Apply Now →</p>
                </div>
                <div onClick={() => { setSelectedPassType('RENEWAL'); setViewMode('FORM'); }} className="p-8 rounded-3xl border-2 border-blue-200 bg-blue-50 cursor-pointer hover:scale-[1.02] transition shadow-lg">
                  <h3 className="text-xl font-black text-blue-900 mb-1">🔄 Renewal Portal</h3>
                  <p className="font-bold text-sm text-blue-700 mt-3">Already have a pass? Enter your Pass ID to renew.</p>
                </div>
             </div>
           </div>
        )}

        {viewMode === 'FORM' && (
           <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100">
              <div className="flex justify-between items-center mb-8 border-b pb-4">
                 <div>
                   <h2 className="text-2xl font-black text-gray-800 uppercase">{selectedPassType} Pass Application</h2>
                   {selectedPassType !== 'RENEWAL' && <p className="text-xs font-bold text-gray-400 mt-1">Discount: {discountMap[selectedPassType]} off standard fare</p>}
                 </div>
                 <button onClick={() => { setViewMode('SHOP'); setPricePreview(null); }} className="text-xs font-black text-red-500 uppercase border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50 transition">✕ Cancel</button>
              </div>

              {selectedPassType === 'RENEWAL' ? (
                <form onSubmit={handleRenewal} className="space-y-6">
                   <div>
                     <label className={cls.label}>Your Current / Expired Pass ID</label>
                     <input required type="text" value={formData.pass_id} onChange={e => setFormData({...formData, pass_id: e.target.value})} className={cls.input} placeholder="PASS-XXXXXXXX"/>
                   </div>
                   <button disabled={submitLoading} type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-blue-700 transition uppercase tracking-widest disabled:opacity-50">
                     {submitLoading ? 'Submitting...' : 'Submit Renewal'}
                   </button>
                </form>
              ) : (
                <form onSubmit={handleApply} className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                     <div>
                       <label className={cls.label}>Full Legal Name</label>
                       <input required type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className={cls.input}/>
                     </div>
                     <div>
                       <label className={cls.label}>Phone Number</label>
                       <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={cls.input}/>
                     </div>
                     
                     {selectedPassType !== 'PLATINUM' && (
                       <>
                         <div>
                           <label className={cls.label}>Aadhar Number</label>
                           <input required type="text" value={formData.aadhar} onChange={e => setFormData({...formData, aadhar: e.target.value})} className={cls.input}/>
                         </div>
                         <div>
                           <label className={cls.label}>Father's Name</label>
                           <input required type="text" value={formData.father_name} onChange={e => setFormData({...formData, father_name: e.target.value})} className={cls.input}/>
                         </div>
                         <div>
                           <label className={cls.label}>College / Institution</label>
                           <input required type="text" value={formData.college_name} onChange={e => setFormData({...formData, college_name: e.target.value})} className={cls.input}/>
                         </div>
                         <div>
                           <label className={cls.label}>Year of Study</label>
                           <input required type="text" value={formData.year_of_study} onChange={e => setFormData({...formData, year_of_study: e.target.value})} className={cls.input} placeholder="e.g. 2nd Year"/>
                         </div>
                       </>
                     )}

                     {selectedPassType === 'PLATINUM' && (
                       <div>
                         <label className={cls.label}>Age</label>
                         <input required type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className={cls.input}/>
                       </div>
                     )}
                   </div>

                   {/* ─── Route Selection ─── */}
                   <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 space-y-4">
                     <p className="text-xs font-black text-blue-800 uppercase tracking-widest border-b border-blue-200 pb-2">Route Selection</p>
                     
                     <div>
                       <label className={cls.label}>Step 1 — Select Depot</label>
                       <select required value={formData.depot_id} onChange={e => handleDepotChange(e.target.value)} className={cls.select}>
                         <option value="">-- Choose Depot --</option>
                         {depotData.map(d => <option key={d.depot_id} value={d.depot_id}>{d.name} ({d.depot_id})</option>)}
                       </select>
                     </div>

                     <div>
                       <label className={cls.label}>Step 2 — Select Route {formData.depot_id && <span className="text-blue-500 normal-case">{depotRoutes.length} available</span>}</label>
                       <select required value={formData.route_id} onChange={e => handleRouteChange(e.target.value)} className={cls.select} disabled={!formData.depot_id}>
                         <option value="">{!formData.depot_id ? '⬆ Select Depot first' : '-- Select Route --'}</option>
                         {depotRoutes.map(r => <option key={r.route_id} value={r.route_id}>{r.route_name}</option>)}
                       </select>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <label className={cls.label}>Step 3a — From Stop {formData.route_id && <span className="text-blue-500 normal-case">{routeStops.length} stops</span>}</label>
                         <select required value={formData.from_stop_id} onChange={e => setFormData({...formData, from_stop_id: e.target.value, to_stop_id: ''})} className={cls.select} disabled={!formData.route_id}>
                           <option value="">{!formData.route_id ? '⬆ Select Route first' : '-- Origin Stop --'}</option>
                           {routeStops.map(s => <option key={s.stop_id} value={s.stop_id}>{s.stop_name}</option>)}
                         </select>
                       </div>
                       <div>
                         <label className={cls.label}>Step 3b — To Stop</label>
                         <select required value={formData.to_stop_id} onChange={e => setFormData({...formData, to_stop_id: e.target.value})} className={cls.select} disabled={!formData.from_stop_id}>
                           <option value="">{!formData.from_stop_id ? '⬆ Select From first' : '-- Destination Stop --'}</option>
                           {routeStops.filter(s => String(s.stop_id) !== String(formData.from_stop_id)).map(s => <option key={s.stop_id} value={s.stop_id}>{s.stop_name}</option>)}
                         </select>
                       </div>
                     </div>

                     <div>
                       <label className={cls.label}>Step 4 — Duration</label>
                       <select required value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className={cls.select} disabled={!formData.to_stop_id}>
                         <option value="">{!formData.to_stop_id ? '⬆ Select Stops first' : '-- Select Duration --'}</option>
                         <option value="1">1 Month</option>
                         <option value="3">3 Months (Quarterly)</option>
                         <option value="6">6 Months (Half-Yearly)</option>
                       </select>
                     </div>
                   </div>

                   {/* ─── Fare Preview ─── */}
                   {(priceLoading || pricePreview) && (
                     <div className={`rounded-2xl p-6 border-2 text-center ${pricePreview ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                       {priceLoading ? (
                         <p className="font-bold text-gray-400 animate-pulse">Calculating fare...</p>
                       ) : pricePreview && (
                         <>
                           <p className="text-[10px] font-black uppercase tracking-widest text-green-600 mb-1">Calculated Pass Fare ({selectedPassType} — {discountMap[selectedPassType]} off)</p>
                           <p className="text-4xl font-black text-green-700">₹{pricePreview.price}</p>
                           <p className="text-xs text-green-500 font-bold mt-1">Route Distance: ~{pricePreview.distance} km · {formData.duration} month(s)</p>
                         </>
                       )}
                     </div>
                   )}

                   {/* ─── Documents ─── */}
                   <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 space-y-4">
                     <p className="text-xs font-black text-gray-800 uppercase tracking-widest border-b border-gray-200 pb-2">Document Uploads (Images Only)</p>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div>
                         <label className={cls.label}>Passport Photo</label>
                         <input required type="file" accept="image/*" onChange={e => handleFileUpload(e, 'passport_photo')} className="text-xs"/>
                       </div>
                       {selectedPassType !== 'PLATINUM' && (
                         <>
                           <div>
                             <label className={cls.label}>College Certificate</label>
                             <input required type="file" accept="image/*" onChange={e => handleFileUpload(e, 'college_cert')} className="text-xs"/>
                           </div>
                           <div>
                             <label className={cls.label}>10th Certificate</label>
                             <input required type="file" accept="image/*" onChange={e => handleFileUpload(e, 'tenth_cert')} className="text-xs"/>
                           </div>
                         </>
                       )}
                     </div>
                   </div>
                   
                   <button disabled={submitLoading || !pricePreview} type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-blue-700 transition uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed">
                     {submitLoading ? 'Submitting...' : pricePreview ? `Apply — Pay ₹${pricePreview.price} at Depot` : 'Complete All Fields Above'}
                   </button>
                </form>
              )}
           </div>
        )}
      </div>
    </div>
  );
}

export default Passes;
