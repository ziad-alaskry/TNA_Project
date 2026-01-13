import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { User, Home, Truck, MapPin } from 'lucide-react';
import VisitorDash from './pages/VisitorDash';
import OwnerDash from './pages/OwnerDash';
import CarrierDash from './pages/CarrierDash';


function App() {
  return (
    <Router>
      <div className="min-h-screen pb-20">
        {/* Header */}
        <header className="bg-blue-600 text-white p-4 shadow-md sticky top-0 z-10">
          <h1 className="text-xl font-bold ml-6"> TNA Portal</h1>
        </header>

        {/* Main Content Area */}
        <main className="max-w-md mx-auto">
          <Routes>
            <Route path="/" element={<VisitorDash />} />
            <Route path="/owner" element={<OwnerDash />} />
            <Route path="/carrier" element={<CarrierDash />} />
          </Routes>
        </main>

        {/* Bottom Mobile Navigation */}
        <nav className="fixed max-w-full bottom-0 left-0 right-0 
        bg-white border-t border-gray-200 flex 
        justify-around p-3 shadow-lg lg:max-w-full lg:mx-auto">
          <Link to="/" className="flex flex-col items-center text-gray-600 hover:text-blue-600">
            <User size={24} />
            <span className="text-xs">Visitor</span>
          </Link>
          <Link to="/owner" className="flex flex-col items-center text-gray-600 hover:text-blue-600">
            <Home size={24} />
            <span className="text-xs">Owner</span>
          </Link>
          <Link to="/carrier" className="flex flex-col items-center text-gray-600 hover:text-blue-600">
            <Truck size={24} />
            <span className="text-xs">Carrier</span>
          </Link>
        </nav>
      </div>
    </Router>
  );
}

export default App;