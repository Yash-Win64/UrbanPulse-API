import { useEffect, useState } from "react";
import axios from "axios";

interface TrafficData {
  id: number;
  location: string;
  hour_start: string;
  avg_speed: number;
  free_flow_avg: number;
  samples: number;
}

interface WeatherData {
  id: number;
  city: string;
  hour_start: string;
  avg_temp: number;
  avg_humidity: number;
  samples: number;
}

interface AirData {
  id: number;
  city: string;
  hour_start: string;
  avg_pm25: number;
  avg_aqi: number;
  samples: number;
}

export default function Dashboard() {
  const [traffic, setTraffic] = useState<TrafficData[]>([]);
  const [weather, setWeather] = useState<WeatherData[]>([]);
  const [air, setAir] = useState<AirData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [t, w, a] = await Promise.all([
          axios.get("http://127.0.0.1:8000/api/traffic/hourly"),
          axios.get("http://127.0.0.1:8000/api/weather/hourly"),
          axios.get("http://127.0.0.1:8000/api/air/hourly"),
        ]);
        setTraffic(t.data);
        setWeather(w.data);
        setAir(a.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  if (loading) return <div className="text-center mt-10 text-xl text-gray-600">Loading dashboard...</div>;

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold text-center text-blue-600">UrbanPulse Dashboard</h1>

      {/* Traffic Section */}
      <section className="bg-white rounded-2xl shadow-lg p-5">
        <h2 className="text-2xl font-semibold mb-4">🚗 Traffic Trends</h2>
        <table className="table-auto w-full text-left">
          <thead className="border-b">
            <tr>
              <th>Location</th>
              <th>Avg Speed</th>
              <th>Free Flow</th>
              <th>Samples</th>
            </tr>
          </thead>
          <tbody>
            {traffic.slice(-5).map((t) => (
              <tr key={t.id} className="border-b">
                <td>{t.location}</td>
                <td>{t.avg_speed.toFixed(2)} km/h</td>
                <td>{t.free_flow_avg.toFixed(2)} km/h</td>
                <td>{t.samples}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Weather Section */}
      <section className="bg-white rounded-2xl shadow-lg p-5">
        <h2 className="text-2xl font-semibold mb-4">🌦 Weather Overview</h2>
        <table className="table-auto w-full text-left">
          <thead className="border-b">
            <tr>
              <th>City</th>
              <th>Avg Temp</th>
              <th>Humidity</th>
              <th>Samples</th>
            </tr>
          </thead>
          <tbody>
            {weather.slice(-5).map((w) => (
              <tr key={w.id} className="border-b">
                <td>{w.city}</td>
                <td>{w.avg_temp.toFixed(1)} °C</td>
                <td>{w.avg_humidity.toFixed(0)}%</td>
                <td>{w.samples}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Air Quality Section */}
      <section className="bg-white rounded-2xl shadow-lg p-5">
        <h2 className="text-2xl font-semibold mb-4">🌫 Air Quality Insights</h2>
        <table className="table-auto w-full text-left">
          <thead className="border-b">
            <tr>
              <th>City</th>
              <th>PM2.5</th>
              <th>AQI</th>
              <th>Samples</th>
            </tr>
          </thead>
          <tbody>
            {air.slice(-5).map((a) => (
              <tr key={a.id} className="border-b">
                <td>{a.city}</td>
                <td>{a.avg_pm25.toFixed(1)}</td>
                <td>{a.avg_aqi.toFixed(0)}</td>
                <td>{a.samples}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
