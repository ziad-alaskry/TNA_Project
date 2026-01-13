import React, { useState,useEffect } from 'react';
import axios from 'axios';
import { PlusCircle, Clipboard, CheckCircle, Unlock } from 'lucide-react';

const VisitorDash = () => {
  const [tna, setTna] = useState(null);
  const [loading, setLoading] = useState(false);
  const [visitorId] = useState(1); // Mocked logged-in user ID

  const handleRequestTna = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/v1/tna/request', {
        visitor_id: visitorId
      });
      setTna(response.data.tna_code);
    } catch (err) {
      const msg = err.response?.data?.error || "Cannot connect to server";
      alert("Error: " + msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (!window.confirm("Are you sure? This will remove your connection to the physical address.")) return;
    
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/v1/bindings/unlink', {
        tna_code: tna
      });
      setTna(null);
      alert("Address unlinked successfully.");
    } catch (err) {
      const msg = err.response?.data?.error || "Unlinking failed";
      alert("TRANSIT LOCK: " + msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  const fetchActiveTna = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/v1/tna/active/${visitorId}`);
      if (res.data && res.data.tna_code) {
        setTna(res.data.tna_code);
      }
    } catch (err) {
      console.log("No active TNA found for this user.");
    }
  };
  fetchActiveTna();
}, [visitorId]);

  const copyToClipboard = () => {
    if (!tna) return;
    navigator.clipboard.writeText(tna);
    alert("TNA Code copied!");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-800">Your TNA</h2>
        <p className="text-gray-500 text-sm mt-1">Temporary National Address for your stay.</p>

        {!tna ? (
          <button
            onClick={handleRequestTna}
            disabled={loading}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "Issuing..." : <><PlusCircle size={20} /> Request New TNA</>}
          </button>
        ) : (
          <div className="space-y-4">
            <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 border-dashed rounded-xl text-center">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Active TNA Code</span>
              <div className="text-3xl font-mono font-bold text-blue-900 mt-1 select-all">
                {tna}
              </div>
              <div className="flex justify-center gap-4 mt-4">
                <button 
                  onClick={copyToClipboard}
                  className="text-blue-600 flex items-center gap-1 text-sm font-medium hover:underline"
                >
                  <Clipboard size={16} /> Copy
                </button>
                <span className="text-green-600 flex items-center gap-1 text-sm font-medium">
                  <CheckCircle size={16} /> Verified
                </span>
              </div>
            </div>

            <button
              onClick={handleUnlink}
              disabled={loading}
              className="w-full bg-red-50 text-red-600 border border-red-100 font-bold py-3 rounded-xl hover:bg-red-100 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Unlock size={18} /> {loading ? "Processing..." : "Unlink Physical Address"}
            </button>
          </div>
        )}
      </div>

      <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
        <h4 className="font-bold text-orange-800 text-sm">Next Step:</h4>
        <p className="text-orange-700 text-xs mt-1">
          Share this code with an Address Owner to link your TNA to a physical location. 
          Unlinking is disabled if a shipment is <span className="font-bold underline">IN_TRANSIT</span>.
        </p>
      </div>
    </div>
  );
};

export default VisitorDash;