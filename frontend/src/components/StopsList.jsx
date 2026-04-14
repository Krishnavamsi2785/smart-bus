export default function StopsList({ stops, setFrom, setTo, fromStop, toStop }) {
  return (
    <div className="space-y-1">
      {stops.map((stop, index) => (
        <div key={index} className="flex items-center gap-2 py-1">
          {/* Stop dot + name */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-2.5 h-2.5 bg-blue-400 rounded-full flex-shrink-0"></div>
            <span className="text-sm font-medium text-gray-700 truncate">{stop.stop_name}</span>
          </div>
          {/* FROM button */}
          <button
            onClick={() => setFrom(stop.stop_id)}
            className={`text-xs px-2 py-1 rounded-lg font-bold border transition-all flex-shrink-0 ${
              fromStop === stop.stop_id
                ? 'bg-green-500 text-white border-green-500'
                : 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
            }`}
          >
            FROM
          </button>
          {/* TO button */}
          <button
            onClick={() => setTo(stop.stop_id)}
            className={`text-xs px-2 py-1 rounded-lg font-bold border transition-all flex-shrink-0 ${
              toStop === stop.stop_id
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
            }`}
          >
            TO
          </button>
        </div>
      ))}
    </div>
  );
}
