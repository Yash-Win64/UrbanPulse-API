import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import TrafficPage from "../pages/TrafficPage";
import WeatherPage from "../pages/WeatherPage";
import AirQualityPage from "../pages/AirQualityPage";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

function AppRouter() {
  return (
    <Router>
      <div className="flex min-h-screen bg-gray-900 text-white">
        <Sidebar />
        <div className="flex-1 p-6">
          <Navbar />
          <Routes>
            <Route path="/" element={<Navigate to="/traffic" />} />
            <Route path="/traffic" element={<TrafficPage />} />
            <Route path="/weather" element={<WeatherPage />} />
            <Route path="/air" element={<AirQualityPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default AppRouter;
