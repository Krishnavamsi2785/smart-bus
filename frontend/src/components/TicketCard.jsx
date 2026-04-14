import React, { useState, useEffect } from 'react';

export default function TicketCard({ ticket, passengerName }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const calcTime = () => {
      const diff = new Date(ticket.expiry_time).getTime() - Date.now();
      setRemaining(Math.max(0, diff));
    };
    calcTime();
    const interval = setInterval(calcTime, 1000);
    return () => clearInterval(interval);
  }, [ticket.expiry_time]);

  const isActive = remaining > 0;
  
  const formatTime = (ms) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="bg-white text-black w-full max-w-xs mx-auto font-mono text-center shadow-2xl uppercase leading-tight relative overflow-hidden" 
         style={{ filter: "drop-shadow(0px 10px 15px rgba(0,0,0,0.1))" }}>
      
      <div className="h-4 border-t-8 border-dotted border-gray-300 w-full absolute top-0 -mt-2"></div>
      
      <div className="p-6 pt-8 pb-8">
        <h2 className="text-xl font-black mb-1">* APSRTC ONLINE *</h2>
        <p className="text-xs border-b-2 border-dashed border-gray-400 pb-4 mb-4 font-bold">DIGITAL E-TICKET</p>
        
        <div className="text-left text-sm mb-4 space-y-1">
          <p><strong>PASSENGER:</strong> {passengerName || 'GUEST'}</p>
          <p><strong>BUS NO:</strong> {ticket.bus_code} ({ticket.bus_type})</p>
        </div>
        
        <div className="border-y-2 border-dashed border-gray-400 py-4 mb-4 text-left space-y-2 bg-gray-50 p-2">
          <p><strong>SRC:</strong> {ticket.from || ticket.from_stop}</p>
          <p><strong>DST:</strong> {ticket.to || ticket.to_stop}</p>
        </div>
        
        <div className="text-4xl font-black mb-4">
          ₹{ticket.fare}.00
        </div>
        
        <div className="text-xs mb-4">
          <p className="text-gray-500">TKN REF:</p>
          <p className="font-bold break-all leading-none mt-1">{ticket.ticket_uuid || ticket.ticket_id}</p>
        </div>
        
        <div className="border-t-2 border-dashed border-gray-400 pt-4 mb-2 text-left">
          <p className="text-xs"><strong>ISSUE:</strong> {new Date(ticket.issue_time).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</p>
          <p className="text-xs mt-1"><strong>EXPIRY:</strong> {new Date(ticket.expiry_time).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</p>
        </div>
        
        {/* Dynamic Verification Mark & Timer */}
        <div className={`mt-6 p-3 border-4 border-double ${isActive ? 'border-green-600 text-green-700 bg-green-50' : 'border-red-600 text-red-700 bg-red-50'}`}>
          <div className="text-lg font-black tracking-widest">
            {isActive ? 'STATUS: VALID' : 'EXPIRED'}
          </div>
          {isActive ? (
             <div className="text-3xl font-bold animate-pulse mt-1">{formatTime(remaining)}</div>
          ) : (
             <div className="text-2xl mt-1 line-through opacity-70">00:00</div>
          )}
        </div>
      </div>
      
      <div className="h-4 border-b-8 border-dotted border-gray-300 w-full absolute bottom-0 -mb-2"></div>
    </div>
  );
}
