import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Home, Plus, MapPin, Hash } from 'lucide-react';

const OwnerDash = () => {
  const [baseAddress, setBaseAddress] = useState('');
  const [suffix, setSuffix] = useState('');
  const [variants, setVariants] = useState([]);
  const [ownerId] = useState(2); // Mocked Owner ID from our Seed (Sarah Owner)
  const [activeTnaInput, setActiveTnaInput] = useState({}); // To track input per address row

  // Fetch existing variants on load

  // inside the component 
const handleLink = async (variantId) => {
  const tnaCode = activeTnaInput[variantId]?.trim(); // Add .trim() here
  if (!tnaCode) return alert("Please enter a TNA code");

  try {
    await axios.post('http://localhost:5000/api/v1/bindings/link', {
      tna_code: tnaCode, 
      variant_id: variantId
    });

    alert("TNA Linked Successfully!");
    
    // Clear the input for that specific variant after success
    setActiveTnaInput(prev => ({ ...prev, [variantId]: '' }));
    fetchVariants(); 
  } catch (err) {
    alert("Linking failed: " + (err.response?.data?.error || "Invalid TNA"));
  }
};
  
  const fetchVariants = async () => {
      try {
          const res = await axios.get(`http://localhost:5000/api/v1/addresses/owner/${ownerId}`);
          setVariants(res.data);
        } catch (err) {
            console.error("Failed to fetch variants");
        }
    };
    
    useEffect(() => {
      fetchVariants();
    }, []);
    
 const handleRegister = async (e) => {
  e.preventDefault();
  
  // 1. Strict Validation
  if (!baseAddress || baseAddress.trim() === "") {
    return alert("Please enter a valid Base Address");
  }
  if (suffix.length !== 4) {
    return alert("Suffix must be exactly 4 characters");
  }

  try {
    const payload = {
      owner_id: ownerId,
      base_address: baseAddress,
      suffix: suffix.toUpperCase()
    };
    
    console.log("Sending Payload:", payload); // Debugging line

    await axios.post('http://localhost:5000/api/v1/addresses/register', payload);
    
    setSuffix('');
    // Optionally keep baseAddress if they are adding multiple units to the same house
    fetchVariants(); 
    alert("Address Variant Registered!");
  } catch (err) {
    alert("Registration failed: " + (err.response?.data?.error || "Server error"));
  }
};

  return (
    <div className="p-6 space-y-6">
      {/* Registration Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Home className="text-blue-600" size={24} /> Register New Variant
        </h2>
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Base National Address</label>
            <input 
              type="text" 
              placeholder="e.g. 1234 King Fahad Rd, Riyadh"
              className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={baseAddress}
              onChange={(e) => setBaseAddress(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">4-Char Suffix (Unit/Room)</label>
            <input 
              type="text" 
              placeholder="e.g. ROOM, UNIT, B101"
              maxLength={4}
              className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono"
              value={suffix}
              onChange={(e) => setSuffix(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors">
            Add Address Variant
          </button>
        </form>
      </div>

      {/* List of Variants */}
      <div className="space-y-3">
        <h3 className="font-bold text-gray-700 px-1">Your Registered Addresses</h3>
        {variants.map((v) => (
  <div key={v.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><MapPin size={20} /></div>
        <div>
          <p className="text-sm font-bold text-gray-800">{v.full_address}</p>
          <p className="text-xs text-gray-500 font-mono">{v.suffix}</p>
        </div>
      </div>
    </div>

    {/* Link Input Section */}
    <div className="flex gap-2">
      <input 
        type="text" 
        placeholder="Enter TNA (TNA-ABCD1234$)"
        className="flex-1 text-xs p-2 bg-gray-50 border border-gray-200 rounded-lg font-mono"
        onChange={(e) => setActiveTnaInput({...activeTnaInput, [v.id]: e.target.value})}
      />
      <button 
        onClick={() => handleLink(v.id)}
        className="bg-green-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-green-700"
      >
        Link
      </button>
    </div>
  </div>
))}
      </div>
    </div>
  );
};

export default OwnerDash;