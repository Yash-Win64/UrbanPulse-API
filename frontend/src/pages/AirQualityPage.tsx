import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";

interface AirData {
  hour_start: string;
  city: string;
  avg_aqi: number;
  avg_pm25: number;
  samples: number;
}

const BASE_URL =
  (import.meta.env.VITE_API_BASE as string) ||
  "http://127.0.0.1:8000/api/analytics";

export default function AirQualityPage() {
  const [data, setData] = useState<AirData[]>([]);
  const [live, setLive] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch hourly data for charts
  useEffect(() => {
    const fetchHourly = async () => {
      try {
        const res = await fetch(`${BASE_URL}/air/hourly`);
        const d = await res.json();
        const arr = Array.isArray(d) ? d : [];
        const normalized = arr
          .map((r) => ({
            ...r,
            hour_start: r.hour_start,
          }))
          .filter((x) => x.hour_start)
          .sort(
            (a, b) =>
              new Date(a.hour_start).getTime() - new Date(b.hour_start).getTime()
          );
        setData(normalized);
      } catch (e) {
        console.error("Air hourly fetch error:", e);
        setError("Failed to load hourly data");
      }
    };
    fetchHourly();
  }, []);

  // Fetch live AQI and PM2.5 for summary cards
  useEffect(() => {
    const fetchLive = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/air_quality");
        const d = await res.json();
        setLive(d.air_quality);
      } catch (e) {
        console.error("Air live fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchLive();
  }, []);

  const fmt = (v: any) => (v !== undefined && v !== null ? v.toFixed(1) : "—");

  const getAqiCategory = (aqi: number | null) => {
    if (aqi == null) return { label: "No Data", color: "bg-gray-500" };
    if (aqi <= 50) return { label: "Good", color: "bg-green-500" };
    if (aqi <= 100) return { label: "Satisfactory", color: "bg-yellow-500" };
    if (aqi <= 200) return { label: "Moderate", color: "bg-orange-500" };
    if (aqi <= 300) return { label: "Poor", color: "bg-red-500" };
    if (aqi <= 400) return { label: "Very Poor", color: "bg-purple-600" };
    return { label: "Severe", color: "bg-rose-700" };
  };

  const latest = data.at(-1);
  const category = getAqiCategory(live?.aqi ?? latest?.avg_aqi ?? null);

  if (loading)
    return (
      <div className="text-center text-slate-400 mt-10">
        Loading Air Quality Data...
      </div>
    );
  if (error)
    return (
      <div className="text-center text-red-400 mt-10">Error: {error}</div>
    );

  return (
    <div className="p-8 min-h-screen bg-slate-950 text-slate-100">
      <h1 className="text-4xl font-bold text-center text-amber-400 mb-2">
        🌫️ UrbanPulse Air Quality Dashboard
      </h1>
      <p className="text-center text-slate-400 mb-8">
        Bangalore, India — Real-time Air Quality Analytics
      </p>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-6 text-center">
          <h3 className="text-sm text-slate-900 font-medium">AQI</h3>
          <p className="text-4xl font-bold text-white mt-1">
            {fmt(live?.aqi ?? latest?.avg_aqi)}
          </p>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-cyan-400 rounded-2xl p-6 text-center">
          <h3 className="text-sm text-slate-900 font-medium">PM2.5 (µg/m³)</h3>
          <p className="text-4xl font-bold text-white mt-1">
            {fmt(live?.pm2_5 ?? latest?.avg_pm25)}
          </p>
        </div>
        <div
          className={`p-6 rounded-2xl text-center shadow-lg ${category.color}`}
        >
          <h3 className="text-sm text-slate-900 font-medium">
            Air Quality Level
          </h3>
          <p className="text-2xl font-bold text-white mt-1">
            {category.label}
          </p>
        </div>
      </div>

      {/* AQI Line Chart */}
      <div className="bg-slate-900 p-6 rounded-2xl shadow-lg mb-10">
        <h3 className="text-lg font-semibold text-amber-300 mb-4 text-center">
          📈 AQI Trend (Hourly)
        </h3>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="hour_start"
              tickFormatter={(v) =>
                new Date(v).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  hour: "numeric",
                  hour12: true,
                })
              }
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              angle={-15}
              textAnchor="end"
            />
            <YAxis tick={{ fill: "#9ca3af" }} />
            <Tooltip />
            <Legend />
            <Line
              dataKey="avg_aqi"
              stroke="#facc15"
              strokeWidth={2}
              dot={false}
              name="AQI"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* AQI Distribution Bar Chart */}
      <div className="bg-slate-900 p-6 rounded-2xl shadow-lg">
        <h3 className="text-lg font-semibold text-pink-400 mb-4 text-center">
          📊 AQI Distribution (Last 10 Hours)
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.slice(-10)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="hour_start"
              tickFormatter={(v) =>
                new Date(v).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  hour: "numeric",
                  hour12: true,
                })
              }
              tick={{ fill: "#9ca3af", fontSize: 10 }}
              angle={-15}
              textAnchor="end"
            />
            <YAxis tick={{ fill: "#9ca3af" }} />
            <Tooltip />
            <Bar dataKey="avg_aqi" fill="#facc15" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <footer className="text-center text-xs text-slate-500 mt-8">
        © {new Date().getFullYear()} UrbanPulse — Air Quality Analytics
      </footer>
    </div>
  );
}
