import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Home, MapPin, Plus } from 'lucide-react';

const OwnerDash = () => {
  const [baseAddress, setBaseAddress] = useState('');
  const [suffix, setSuffix] = useState('');
  const [variants, setVariants] = useState([]);
  const [activeTnaInput, setActiveTnaInput] = useState({});

  // Centralized API instance with Auth Header
  const api = axios.create({
    baseURL: 'http://localhost:5000/api/v1',
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchVariants = async () => {
    try {
      // Backend now gets Owner ID from the Token, no need to pass it in URL
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
    <div className="p-6 space-y-6 pb-24">
      {/* Registration UI */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <Home className="text-blue-600" size={20} /> Register Unit
        </h2>
        <form onSubmit={handleRegister} className="space-y-3">
          <input type="text" placeholder="Base Address" className="w-full p-3 bg-gray-50 rounded-xl border"
            value={baseAddress} onChange={(e) => setBaseAddress(e.target.value)} required />
          <input type="text" placeholder="Suffix (e.g. A101)" maxLength={4} className="w-full p-3 bg-gray-50 rounded-xl border uppercase font-mono"
            value={suffix} onChange={(e) => setSuffix(e.target.value)} required />
          <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Add Property</button>
        </form>
      </div>

      {/* Property List */}
      <div className="space-y-3">
        <h3 className="font-bold text-gray-700">My Properties</h3>
        {variants.map((v) => (
          <div key={v.id} className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <MapPin className="text-blue-500" size={20} />
              <div>
                <p className="text-sm font-bold">{v.full_address}</p>
                <p className="text-xs text-gray-400 font-mono">{v.suffix}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder="TNA to Link" className="flex-1 text-xs p-2 bg-gray-50 border rounded-lg font-mono"
                value={activeTnaInput[v.id] || ''}
                onChange={(e) => setActiveTnaInput({...activeTnaInput, [v.id]: e.target.value})} />
              <button onClick={() => handleLink(v.id)} className="bg-green-600 text-white text-xs px-4 py-2 rounded-lg font-bold">Link</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OwnerDash;