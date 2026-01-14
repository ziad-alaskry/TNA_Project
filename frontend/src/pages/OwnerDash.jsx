import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Home, MapPin, Lock, Info } from 'lucide-react';

const OwnerDash = () => {
  const [baseAddress, setBaseAddress] = useState('');
  const [suffix, setSuffix] = useState('');
  const [variants, setVariants] = useState([]);
  const [activeTnaInput, setActiveTnaInput] = useState({});

  const api = axios.create({
    baseURL: 'http://localhost:5000/api/v1',
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchVariants = async () => {
    try {
      const res = await api.get('/addresses/my-properties'); 
      setVariants(res.data);
    } catch (err) {
      console.error("Fetch failed", err);
    }
  };

  useEffect(() => { fetchVariants(); }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await api.post('/addresses/register', {
        base_address: baseAddress,
        suffix: suffix.toUpperCase()
      });
      setSuffix('');
      fetchVariants();
      alert("Address Registered!");
    } catch (err) {
      alert(err.response?.data?.error || "Registration failed");
    }
  };

  const handleLink = async (variantId) => {
    const tnaCode = activeTnaInput[variantId]?.trim().toUpperCase();
    if (!tnaCode) return;

    try {
      await api.post('/bindings/link', { tna_code: tnaCode, variant_id: variantId });
      alert("TNA Linked Successfully!");
      setActiveTnaInput(prev => ({ ...prev, [variantId]: '' }));
      fetchVariants();
    } catch (err) {
      alert(err.response?.data?.error || "Link failed");
    }
  };

  return (
    <div className="p-6 space-y-6 pb-24 max-w-2xl mx-auto">
      {/* Registration Section */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-blue-900">
          <Home className="text-blue-600" size={20} /> Register Unit
        </h2>
        <form onSubmit={handleRegister} className="space-y-3">
          <input type="text" placeholder="Base Address" className="w-full p-3 bg-gray-50 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500"
            value={baseAddress} onChange={(e) => setBaseAddress(e.target.value)} required />
          <input type="text" placeholder="Suffix (4 chars)" maxLength={4} className="w-full p-3 bg-gray-50 rounded-xl border uppercase font-mono outline-none focus:ring-2 focus:ring-blue-500"
            value={suffix} onChange={(e) => setSuffix(e.target.value)} required />
          <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">Add Property</button>
        </form>
      </div>

      {/* Properties List */}
      <div className="space-y-4">
        <h3 className="font-bold text-gray-700">My Properties</h3>
        
        {variants.map((v) => {
          const isLinked = !!v.linked_tna_code; // Boolean check for linked status

          return (
            <div key={v.id} className={`p-5 rounded-2xl border transition-all ${isLinked ? 'bg-gray-50 border-gray-200' : 'bg-white border-blue-100 shadow-sm'}`}>
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <MapPin className={isLinked ? "text-gray-400" : "text-blue-600"} size={20} />
                  <div>
                    <p className={`text-sm font-bold ${isLinked ? 'text-gray-500' : 'text-gray-900'}`}>{v.full_address}</p>
                    <p className="text-[10px] text-gray-400 font-mono">SUFFIX: {v.suffix}</p>
                  </div>
                </div>
                {isLinked && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md">
                    <Lock size={12} /> OCCUPIED
                  </div>
                )}
              </div>

              {/* TNA LINKING SECTION */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder={isLinked ? "Address Locked" : "Enter TNA Code"}
                    disabled={isLinked} // DISABLE INPUT IF LINKED
                    className={`flex-1 text-xs p-3 rounded-xl border font-mono outline-none transition-all ${
                      isLinked 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-300' 
                        : 'bg-white border-gray-200 focus:border-blue-500'
                    }`}
                    value={isLinked ? "********" : (activeTnaInput[v.id] || '')}
                    onChange={(e) => setActiveTnaInput({...activeTnaInput, [v.id]: e.target.value})} 
                  />
                  <button 
                    onClick={() => handleLink(v.id)} 
                    disabled={isLinked} // DISABLE BUTTON IF LINKED
                    className={`text-xs px-5 py-3 rounded-xl font-bold transition-all ${
                      isLinked 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                    }`}
                  >
                    Link
                  </button>
                </div>

                {/* BOUND TNA INFO DISPLAY */}
                {isLinked && (
                  <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 p-2 rounded-lg">
                    <Info size={14} className="text-blue-500" />
                    <p className="text-[11px] text-blue-800">
                      Bound to: <span className="font-mono font-bold tracking-tight">{v.linked_tna_code}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OwnerDash;