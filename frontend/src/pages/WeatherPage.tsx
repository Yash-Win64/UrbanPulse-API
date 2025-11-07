import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  Legend,
  BarChart,
  Bar,
} from "recharts";

type HourlyWeather = {
  hour_start?: string;
  avg_temp?: number;
  avg_temperature?: number;
  avg_humidity?: number;
  avg_wind_speed?: number;
  samples?: number;
};

const BASE_URL =
  (import.meta.env.VITE_API_BASE as string) ||
  "http://127.0.0.1:8000/api/analytics";

export default function WeatherPage() {
  const [data, setData] = useState<HourlyWeather[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${BASE_URL}/weather/hourly`);
        const d = await res.json();
        const arr = Array.isArray(d) ? d : [];
        const normalized = arr
          .map((r) => ({
            hour_start: r.hour_start,
            avg_temp: r.avg_temp ?? r.avg_temperature ?? null,
            avg_humidity: r.avg_humidity ?? null,
            avg_wind_speed: r.avg_wind_speed ?? null,
            samples: r.samples ?? null,
          }))
          .filter((x) => x.hour_start)
          .sort(
            (a, b) =>
              new Date(a.hour_start).getTime() - new Date(b.hour_start).getTime()
          );
        setData(normalized);
      } catch (e) {
        console.error("Weather fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const latest = data.at(-1);
  const fmt = (v: any) => (v ? v.toFixed(1) : "—");

  if (loading)
    return (
      <div className="text-center text-slate-400 mt-10">
        Loading Weather Data...
      </div>
    );

  return (
    <div className="p-8 min-h-screen bg-slate-950 text-slate-100">
      <h1 className="text-4xl font-bold text-center text-amber-400 mb-2">
        🌤️ UrbanPulse Weather Dashboard
      </h1>
      <p className="text-center text-slate-400 mb-8">
        Bangalore, India — Real-time Weather Analytics
      </p>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        <div className="bg-gradient-to-r from-amber-500 to-orange-400 rounded-2xl p-6 text-center">
          <h3 className="text-sm text-slate-900 font-medium">Temperature</h3>
          <p className="text-4xl font-bold text-white mt-1">
            {fmt(latest?.avg_temp)}°C
          </p>
        </div>
        <div className="bg-gradient-to-r from-sky-500 to-cyan-400 rounded-2xl p-6 text-center">
          <h3 className="text-sm text-slate-900 font-medium">Humidity</h3>
          <p className="text-4xl font-bold text-white mt-1">
            {fmt(latest?.avg_humidity)}%
          </p>
        </div>
        <div className="bg-gradient-to-r from-emerald-500 to-teal-400 rounded-2xl p-6 text-center">
          <h3 className="text-sm text-slate-900 font-medium">Wind Speed</h3>
          <p className="text-4xl font-bold text-white mt-1">
            {fmt(latest?.avg_wind_speed)} km/h
          </p>
        </div>
      </div>

      {/* Line Chart */}
      <div className="bg-slate-900 p-6 rounded-2xl shadow-lg mb-10">
        <h3 className="text-lg font-semibold text-amber-300 mb-4 text-center">
          📈 Weather Trends (Hourly)
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
              dataKey="avg_temp"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              name="Temperature (°C)"
            />
            <Line
              dataKey="avg_humidity"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={false}
              name="Humidity (%)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Chart */}
      <div className="bg-slate-900 p-6 rounded-2xl shadow-lg">
        <h3 className="text-lg font-semibold text-pink-400 mb-4 text-center">
          🌡️ Temperature Distribution (Top 10 Hours)
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
            <Bar dataKey="avg_temp" fill="#f59e0b" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <footer className="text-center text-xs text-slate-500 mt-8">
        © {new Date().getFullYear()} UrbanPulse — Weather Analytics
      </footer>
    </div>
  );
}

