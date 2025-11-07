import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";

type HourlyTraffic = {
  hour_start?: string;
  avg_speed?: number;
  free_flow_avg?: number;
};

const BASE_URL =
  (import.meta.env.VITE_API_BASE as string) ||
  "http://127.0.0.1:8000/api/analytics";

export default function TrafficPage() {
  const [data, setData] = useState<HourlyTraffic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${BASE_URL}/traffic/hourly`);
        const d = await res.json();
        const arr = Array.isArray(d) ? d : [];
        const normalized = arr
          .map((r) => ({
            hour_start: r.hour_start,
            avg_speed: r.avg_speed,
            free_flow_avg: r.free_flow_avg,
          }))
          .filter((x) => x.hour_start)
          .sort(
            (a, b) =>
              new Date(a.hour_start).getTime() - new Date(b.hour_start).getTime()
          );
        setData(normalized);
      } catch (e) {
        console.error("Traffic fetch error:", e);
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
        Loading Traffic Data...
      </div>
    );

  return (
    <div className="p-8 min-h-screen bg-slate-950 text-slate-100">
      <h1 className="text-4xl font-bold text-center text-amber-400 mb-2">
        🚦 UrbanPulse Traffic Dashboard
      </h1>
      <p className="text-center text-slate-400 mb-8">
        Bangalore, India — Real-time Traffic Analytics
      </p>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
        <div className="bg-gradient-to-r from-orange-500 to-red-400 rounded-2xl p-6 text-center">
          <h3 className="text-sm text-slate-900 font-medium">Avg Speed</h3>
          <p className="text-4xl font-bold text-white mt-1">
            {fmt(latest?.avg_speed)} km/h
          </p>
        </div>
        <div className="bg-gradient-to-r from-sky-500 to-cyan-400 rounded-2xl p-6 text-center">
          <h3 className="text-sm text-slate-900 font-medium">Free Flow Avg</h3>
          <p className="text-4xl font-bold text-white mt-1">
            {fmt(latest?.free_flow_avg)} km/h
          </p>
        </div>
      </div>

      {/* Line Chart */}
      <div className="bg-slate-900 p-6 rounded-2xl shadow-lg mb-10">
        <h3 className="text-lg font-semibold text-amber-300 mb-4 text-center">
          📈 Traffic Trends (Hourly)
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
              dataKey="avg_speed"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              name="Avg Speed (km/h)"
            />
            <Line
              dataKey="free_flow_avg"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={false}
              name="Free Flow Avg (km/h)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Chart */}
      <div className="bg-slate-900 p-6 rounded-2xl shadow-lg">
        <h3 className="text-lg font-semibold text-pink-400 mb-4 text-center">
          🚗 Top 10 Fastest Hours
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
            <Bar dataKey="avg_speed" fill="#f59e0b" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <footer className="text-center text-xs text-slate-500 mt-8">
        © {new Date().getFullYear()} UrbanPulse — Traffic Analytics
      </footer>
    </div>
  );
}




