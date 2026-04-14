import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import API_BASE_URL from '../config';

export default function Conductor() {
  const { user } = useAuth();
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isScanning) return;

    let scanner;
    
    // Slight delay to ensure DOM element is ready before initializing
    const timer = setTimeout(() => {
      scanner = new Html5QrcodeScanner("reader", { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      });

      scanner.render(onScanSuccess, onScanFailure);
    }, 100);

    function onScanSuccess(decodedText) {
      if (scanner) {
         scanner.clear().catch(e => console.error(e));
      }
      
      let finalUuid = decodedText;
      try {
        const payload = JSON.parse(decodedText);
        if (payload && payload.id) {
          finalUuid = payload.id;
        }
      } catch(e) {
        // Fallback for older tickets that only contain a raw UUID
        console.log("Legacy ticket scanned");
      }

      validateTicket(finalUuid);
      setIsScanning(false);
    }

    function onScanFailure(err) {
      // quiet fail for constant scanning
    }

    return () => {
      clearTimeout(timer);
      if (scanner) {
        scanner.clear().catch(e => console.error("Scanner clear error", e));
      }
    };
  }, [isScanning]);

  const validateTicket = async (uuid) => {
    try {
      setLoading(true);
      setError("");
      // API call to the existing validation endpoint
      const res = await axios.get(`${API_BASE_URL}/ticket/${uuid}`);
      setScanResult(res.data.data);
    } catch (err) {
      setError("Invalid OR Fake Ticket detected! ❌");
      setScanResult(null);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'CONDUCTOR' && user?.role !== 'ADMIN') {
    return (
      <div className="p-8 max-w-md mx-auto mt-20 text-center bg-white shadow-2xl rounded-3xl border border-red-100">
        <div className="text-4xl mb-4">🚫</div>
        <h2 className="text-2xl font-black text-red-600 mb-2">Access Denied</h2>
        <p className="text-gray-500 mb-6 font-medium">This page is for Authorized APSRTC Conductors only.</p>
        <Link to="/" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-12 flex flex-col items-center">
      
      {/* Header */}
      <div className="w-full bg-blue-700 p-6 text-white text-center shadow-lg rounded-b-3xl mb-8">
        <h1 className="text-2xl font-black tracking-tight italic">CONDUCTOR SCANNER</h1>
        <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mt-1">APSRTC Official Terminal</p>
      </div>

      <div className="w-full max-w-md px-6">
        
        {/* Scanner Container */}
        {!isScanning && !scanResult && (
          <div className="text-center py-20">
            <button 
              onClick={() => setIsScanning(true)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white p-12 rounded-[2.5rem] shadow-2xl transition transform active:scale-95 space-y-4"
            >
              <div className="text-5xl">📷</div>
              <div className="font-black text-xl tracking-tighter">OPEN SCANNER</div>
            </button>
          </div>
        )}

        {isScanning && (
          <div className="bg-white p-4 rounded-3xl shadow-2xl overflow-hidden animate-fade-in relative z-10">
            <div id="reader" className="rounded-2xl overflow-hidden"></div>
            <button 
              onClick={() => setIsScanning(false)}
              className="w-full mt-4 bg-red-50 text-red-600 font-black py-3 rounded-xl"
            >
              Cancel Scan
            </button>
          </div>
        )}

        {/* Validation Result Result */}
        {scanResult && (
          <div className={`p-8 rounded-[2.5rem] shadow-2xl border-4 animate-fade-in-up text-center ${
            scanResult.is_valid ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
          }`}>
            <div className={`text-6xl mb-4 ${scanResult.is_valid ? 'animate-bounce' : 'animate-shake'}`}>
              {scanResult.is_valid ? '✅' : '❌'}
            </div>
            <h2 className={`text-3xl font-black mb-2 ${scanResult.is_valid ? 'text-green-700' : 'text-red-700'}`}>
              {scanResult.is_valid ? 'VALID TICKET' : 'EXPIRED / FAKE'}
            </h2>
            
            <div className="bg-white/50 p-4 rounded-2xl mb-6 space-y-1">
              <p className="font-bold text-gray-400 text-xs uppercase">Route / Bus</p>
              <p className="text-lg font-black text-gray-800">{scanResult.bus_code}</p>
              <div className="pt-2 mt-2 border-t border-gray-100 flex justify-center gap-4 text-xs font-bold uppercase">
                 <span className="text-gray-500">Fare: ₹{scanResult.fare}</span>
                 <span className="text-blue-500">ID: {scanResult.ticket_uuid.substring(0,8)}</span>
              </div>
            </div>

            <button 
              onClick={() => { setScanResult(null); setIsScanning(true); }}
              className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg transition transform active:scale-95"
            >
              SCAN NEXT PASSENGER
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-600 text-white p-6 rounded-3xl shadow-2xl text-center animate-shake">
            <h3 className="text-xl font-black mb-2">SYSTEM ALERT</h3>
            <p className="font-bold opacity-90">{error}</p>
            <button onClick={() => { setError(""); setIsScanning(true); }} className="mt-4 bg-white/20 px-4 py-2 rounded-xl text-xs font-black uppercase">Retry Scan</button>
          </div>
        )}

      </div>
    </div>
  );
}
