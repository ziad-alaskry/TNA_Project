import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusCircle, Clipboard, CheckCircle, Unlock, Layers } from 'lucide-react';

const VisitorDash = () => {
  const [tnas, setTnas] = useState([]); // Changed from single tna to array
  const [loading, setLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));

  // Utility for API calls with Auth Header
  const api = axios.create({
    baseURL: 'http://localhost:5000/api/v1',
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchTnas = async () => {
    try {
      const res = await api.get(`/tna/active/${user.id}`);
      // Assuming backend returns an array of active TNAs now
      setTnas(Array.isArray(res.data) ? res.data : [res.data]);
    } catch (err) { setTnas([]); }
  };

  useEffect(() => { fetchTnas(); }, []);

  const handleRequestTna = async () => {
    if (tnas.length >= 5) return alert("Maximum 5 TNAs reached.");
    setLoading(true);
    try {
      await api.post('/tna/request');
      fetchTnas();
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || "Limit Reached"));
    } finally { setLoading(false); }
  };

  const handleUnlink = async (tnaCode) => {
    if (!window.confirm("Unlink this address?")) return;
    try {
      await api.post('/bindings/unlink', { tna_code: tnaCode });
      fetchTnas();
      alert("Unlinked!");
    } catch (err) {
      alert("TRANSIT LOCK: " + (err.response?.data?.error || "Failed"));
    }
  };

  return (
    <div className="p-6 space-y-6 pb-24">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My TNAs</h2>
          <p className="text-gray-500 text-sm">{tnas.length} of 5 active</p>
        </div>
        <button onClick={handleRequestTna} disabled={loading || tnas.length >= 5}
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg active:scale-95 disabled:bg-gray-300">
          <PlusCircle size={24} />
        </button>
      </div>

      <div className="space-y-4">
        {tnas.length === 0 && <p className="text-center py-10 text-gray-400">No active TNAs. Click the + to start.</p>}
        {tnas.map((item, idx) => (
          <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
            <div className="flex justify-between items-center border-b pb-3 border-gray-50">
               <span className="text-3xl font-mono font-bold text-blue-900">{item.tna_code}</span>
               <button onClick={() => {navigator.clipboard.writeText(item.tna_code); alert("Copied!")}} className="text-blue-500"><Clipboard size={18}/></button>
            </div>
            <button onClick={() => handleUnlink(item.tna_code)} className="w-full flex items-center justify-center gap-2 py-2 text-red-600 bg-red-50 rounded-xl font-bold text-sm">
              <Unlock size={16}/> Unlink This Address
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VisitorDash;