import React, { useState } from 'react';
import axios from 'axios';
import { User, Lock, Mail, ShieldCheck, CreditCard } from 'lucide-react';

const Login = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role: 'VISITOR', 
    id_number: '' 
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isRegister ? 'register' : 'login';
    try {
      const res = await axios.post(`http://localhost:5000/api/v1/auth/${endpoint}`, formData);
      if (!isRegister) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        onLoginSuccess(res.data.user);
      } else {
        alert("Registration successful! Please login.");
        setIsRegister(false);
      }
    } catch (err) {
      alert(err.response?.data?.error || "Auth Error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-blue-900 tracking-tighter">Project TNA</h1>
          <p className="text-gray-500 mt-2">{isRegister ? "Create your identity" : "Welcome back"}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              {/* Full Name Input */}
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  className="w-full pl-10 p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  required 
                />
              </div>

              {/* ID Number Input - REQUIRED BY DB */}
              <div className="relative">
                <CreditCard className="absolute left-3 top-3 text-gray-400" size={20} />
                <input 
                  type="text" 
                  placeholder="ID Number (e.g. 10928374)" 
                  className="w-full pl-10 p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                  onChange={(e) => setFormData({...formData, id_number: e.target.value})} 
                  required 
                />
              </div>
            </>
          )}
            
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
            <input 
              type="email" 
              placeholder="Email Address" 
              className="w-full pl-10 p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
              onChange={(e) => setFormData({...formData, email: e.target.value})} 
              required 
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full pl-10 p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
              onChange={(e) => setFormData({...formData, password: e.target.value})} 
              required 
            />
          </div>
          
          {isRegister && (
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-3 text-gray-400" size={20} />
              <select 
                className="w-full pl-10 p-3 bg-gray-50 border rounded-xl appearance-none outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              >
                <option value="VISITOR">VISITOR</option>
                <option value="OWNER">OWNER</option>
                <option value="CARRIER">CARRIER</option>
              </select>
            </div>
          )}

          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-all active:scale-95">
            {isRegister ? "Create Account" : "Sign In"}
          </button>
        </form>

        <button 
          onClick={() => setIsRegister(!isRegister)} 
          className="w-full mt-6 text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors"
        >
          {isRegister ? "Already have an account? Login" : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );
};

export default Login;