import { useEffect, useState } from "react";
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
import { motion } from "framer-motion";

type HourlyTraffic = {
  hour_start: string;
  avg_speed: number;
  free_flow_avg: number;
};

const BASE_URL =
  (import.meta.env.VITE_API_BASE as string) ||
  "http://127.0.0.1:8000/api/analytics";

export default function TrafficPage() {
  const [data, setData] = useState<HourlyTraffic[]>([]);
  const [filteredData, setFilteredData] = useState<HourlyTraffic[]>([]);
  const [view, setView] = useState<"latest" | "daily" | "monthly">("latest");
  const [loading, setLoading] = useState(true);

  // Fetch hourly traffic data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${BASE_URL}/traffic/hourly`);
        const d = await res.json();
        const arr = Array.isArray(d) ? d : [];
        const normalized = arr
          .map((r) => ({
            hour_start: r.hour_start,
            avg_speed: Number(r.avg_speed) || 0,
            free_flow_avg: Number(r.free_flow_avg) || 0,
          }))
          .filter((x) => x.hour_start)
          .sort(
            (a, b) =>
              new Date(a.hour_start).getTime() - new Date(b.hour_start).getTime()
          );
        setData(normalized);
        setFilteredData(normalized.slice(-4)); // default: latest 4 records
      } catch (e) {
        console.error("Traffic fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Compute daily & monthly averages
  const computeAverages = (interval: "daily" | "monthly") => {
    const grouped: Record<string, { avg_speed: number[]; free_flow_avg: number[] }> = {};
    data.forEach((item) => {
      const date = new Date(item.hour_start);
      const key =
        interval === "daily"
          ? date.toISOString().split("T")[0]
          : `${date.getFullYear()}-${date.getMonth() + 1}`;
      if (!grouped[key]) grouped[key] = { avg_speed: [], free_flow_avg: [] };
      grouped[key].avg_speed.push(item.avg_speed);
      grouped[key].free_flow_avg.push(item.free_flow_avg);
    });
    return Object.entries(grouped).map(([key, values]) => ({
      hour_start: key,
      avg_speed:
        values.avg_speed.reduce((a, b) => a + b, 0) / values.avg_speed.length,
      free_flow_avg:
        values.free_flow_avg.reduce((a, b) => a + b, 0) /
        values.free_flow_avg.length,
    }));
  };

  // Update filtered data on view change
  useEffect(() => {
    if (view === "latest") setFilteredData(data.slice(-4));
    else if (view === "daily") setFilteredData(computeAverages("daily"));
    else if (view === "monthly") setFilteredData(computeAverages("monthly"));
  }, [view, data]);

  const fmt = (v: number | undefined | null) =>
    typeof v === "number" && !isNaN(v) ? v.toFixed(1) : "—";

  const latest = data.at(-1);

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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
        <motion.div
          className="bg-gradient-to-r from-orange-500 to-red-400 rounded-2xl p-6 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-sm text-slate-900 font-medium">Avg Speed</h3>
          <p className="text-4xl font-bold text-white mt-1">
            {fmt(latest?.avg_speed)} km/h
          </p>
        </motion.div>

        <motion.div
          className="bg-gradient-to-r from-sky-500 to-cyan-400 rounded-2xl p-6 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3 className="text-sm text-slate-900 font-medium">Free Flow Avg</h3>
          <p className="text-4xl font-bold text-white mt-1">
            {fmt(latest?.free_flow_avg)} %
          </p>
        </motion.div>
      </div>

      {/* View Selector */}
      <div className="flex justify-center mb-6 space-x-3">
        {["latest", "daily", "monthly"].map((v) => (
          <button
            key={v}
            className={`px-4 py-2 rounded-lg transition ${
              view === v ? "bg-amber-400 text-black" : "bg-slate-700 hover:bg-slate-600"
            }`}
            onClick={() => setView(v as any)}
          >
            {v === "latest"
              ? "Last 4 Records"
              : v === "daily"
              ? "Daily Avg"
              : "Monthly Avg"}
          </button>
        ))}
      </div>

      {/* Line Chart */}
      <motion.div
        className="bg-slate-900 p-6 rounded-2xl shadow-lg mb-10"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h3 className="text-lg font-semibold text-amber-300 mb-4 text-center">
          📈 Traffic Trends ({view === "latest" ? "Hourly" : view})
        </h3>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="hour_start"
              tickFormatter={(v) => {
                const date = new Date(v);
                return isNaN(date.getTime())
                  ? v
                  : date.toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "numeric",
                      hour12: true,
                    });
              }}
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
              name="Free Flow Avg (%)"
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Bar Chart */}
      <motion.div
        className="bg-slate-900 p-6 rounded-2xl shadow-lg"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <h3 className="text-lg font-semibold text-pink-400 mb-4 text-center">
          🚗 Top 10 Fastest Hours
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.slice(-10)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="hour_start"
              tickFormatter={(v) => {
                const date = new Date(v);
                return isNaN(date.getTime())
                  ? v
                  : date.toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "numeric",
                      hour12: true,
                    });
              }}
              tick={{ fill: "#9ca3af", fontSize: 10 }}
              angle={-15}
              textAnchor="end"
            />
            <YAxis tick={{ fill: "#9ca3af" }} />
            <Tooltip />
            <Bar dataKey="avg_speed" fill="#f59e0b" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <footer className="text-center text-xs text-slate-500 mt-8">
        © {new Date().getFullYear()} UrbanPulse — Traffic Analytics
      </footer>
    </div>
  );
}




