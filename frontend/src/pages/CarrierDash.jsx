import React, { useState } from 'react';
import axios from 'axios';
import { Search, MapPin, Truck, AlertTriangle, PlusCircle } from 'lucide-react';

const CarrierDash = () => {
  // Resolution State
  const [resolveTna, setResolveTna] = useState('');
  const [resolutionResult, setResolutionResult] = useState(null);
  const [resolveError, setResolveError] = useState(null);

  // Shipment State
  const [trackingNum, setTrackingNum] = useState('');
  const [shipTna, setShipTna] = useState('');

  // 1. Resolve TNA to Physical Address
  const handleResolve = async () => {
    setResolveError(null);
    setResolutionResult(null);
    try {
      const res = await axios.post('http://localhost:5000/api/v1/resolve', {
        tna_code: resolveTna.trim().toUpperCase()
      });
      setResolutionResult(res.data);
    } catch (err) {
      setResolveError(err.response?.data?.error || "Resolution Failed");
    }
  };

  // 2. Create Shipment (Triggers Transit-Lock)
  const handleCreateShipment = async () => {
    try {
      await axios.post('http://localhost:5000/api/v1/shipments/update', {
        tracking_number: trackingNum,
        tna_code: shipTna.trim().toUpperCase()
      });
      alert("Shipment Started: Transit-Lock is now ACTIVE for this TNA.");
      setTrackingNum('');
      setShipTna('');
    } catch (err) {
      alert("Failed: " + (err.response?.data?.error || "Server Error"));
    }
  };

  return (
    <div className="p-6 space-y-8 pb-24">
      {/* SECTION 1: ADDRESS RESOLVER */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Search className="text-blue-600" size={24} />
          <h2 className="text-xl font-bold text-gray-800">TNA Resolver</h2>
        </div>
        
        <div className="space-y-3">
          <input 
            type="text" 
            placeholder="Enter TNA (TNA-ABCD1234$)"
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-mono text-center text-lg"
            value={resolveTna}
            onChange={(e) => setResolveTna(e.target.value)}
          />
          <button 
            onClick={handleResolve}
            className="w-full bg-blue-900 text-white font-bold py-4 rounded-xl hover:bg-black transition-colors"
          >
            Lookup Destination
          </button>
        </div>

        {resolutionResult && (
          <div className="mt-4 bg-green-50 border border-green-200 p-4 rounded-xl">
            <p className="text-xs font-bold text-green-600 uppercase mb-1">Physical Destination</p>
            <p className="text-lg font-bold text-green-900">{resolutionResult.physical_address}</p>
          </div>
        )}

        {resolveError && (
          <div className="mt-4 bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-2 text-red-700">
            <AlertTriangle size={18} />
            <p className="text-sm font-medium">{resolveError}</p>
          </div>
        )}
      </div>

      {/* SECTION 2: SHIPMENT INITIALIZATION (TRANSIT-LOCK) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Truck className="text-orange-500" size={24} />
          <h2 className="text-xl font-bold text-gray-800">Initialize Shipment</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase">Tracking Number</label>
            <input 
              type="text" 
              placeholder="SHP-990022"
              className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl"
              value={trackingNum}
              onChange={(e) => setTrackingNum(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase">Destination TNA</label>
            <input 
              type="text" 
              placeholder="TNA-XXXX1234$"
              className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono"
              value={shipTna}
              onChange={(e) => setShipTna(e.target.value)}
            />
          </div>
          <button 
            onClick={handleCreateShipment}
            className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600 shadow-lg shadow-orange-100"
          >
            Start Transit & Lock Address
          </button>
        </div>
      </div>
    </div>
  );
};

export default CarrierDash;