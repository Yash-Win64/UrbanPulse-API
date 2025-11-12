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
} from "recharts";
import { motion } from "framer-motion";

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
  const [filteredData, setFilteredData] = useState<AirData[]>([]);
  const [view, setView] = useState<"hourly" | "daily" | "monthly">("hourly");
  const [live, setLive] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cityFilter, setCityFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");

  // Fetch hourly data
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
        setFilteredData(normalized.slice(-5)); // default last 5 records
      } catch (e) {
        console.error("Air hourly fetch error:", e);
        setError("Failed to load hourly data");
      }
    };
    fetchHourly();
  }, []);

  // Fetch live AQI
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

  // Compute daily / monthly averages
  const computeAverages = (interval: "daily" | "monthly") => {
    const grouped: Record<string, { avg_aqi: number[]; avg_pm25: number[] }> = {};

    data.forEach((item) => {
      const date = new Date(item.hour_start);
      const key =
        interval === "daily"
          ? date.toISOString().split("T")[0]
          : `${date.getFullYear()}-${date.getMonth() + 1}`;
      if (!grouped[key]) grouped[key] = { avg_aqi: [], avg_pm25: [] };
      grouped[key].avg_aqi.push(item.avg_aqi);
      grouped[key].avg_pm25.push(item.avg_pm25);
    });

    return Object.entries(grouped).map(([key, values]) => ({
      hour_start: key,
      avg_aqi:
        values.avg_aqi.reduce((a, b) => a + b, 0) / values.avg_aqi.length,
      avg_pm25:
        values.avg_pm25.reduce((a, b) => a + b, 0) / values.avg_pm25.length,
      city: data[0]?.city || "Unknown",
      samples: values.avg_aqi.length,
    }));
  };

  // Update chart based on view
  useEffect(() => {
    if (view === "hourly") setFilteredData(data.slice(-5));
    else if (view === "daily") setFilteredData(computeAverages("daily"));
    else if (view === "monthly") setFilteredData(computeAverages("monthly"));
  }, [view, data]);

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

  const uniqueCities = Array.from(new Set(data.map((d) => d.city)));

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-10">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-6 text-center">
          <h3 className="text-sm text-slate-900 font-medium">Live AQI</h3>
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
        <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl p-6 text-center">
          <h3 className="text-sm text-slate-900 font-medium">City</h3>
          <p className="text-2xl font-bold text-white mt-1">
            {live?.city || latest?.city || "Unknown"}
          </p>
        </div>
      </div>

      {/* View Selector */}
      <div className="flex flex-wrap justify-center mb-6 space-x-3">
        {["hourly", "daily", "monthly"].map((v) => (
          <button
            key={v}
            className={`px-4 py-2 rounded-lg ${
              view === v ? "bg-amber-400 text-black" : "bg-slate-700"
            }`}
            onClick={() => setView(v as any)}
          >
            {v === "hourly"
              ? "Last 5 Hours"
              : v === "daily"
              ? "Daily Avg (Week)"
              : "Monthly Avg"}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-slate-900 p-6 rounded-2xl shadow-lg mb-10">
        <h3 className="text-lg font-semibold text-amber-300 mb-4 text-center">
          📈 AQI Trend ({view})
        </h3>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="hour_start"
              tickFormatter={(v) => v}
              tick={{ fill: "#9ca3af", fontSize: 11 }}
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
            <Line
              dataKey="avg_pm25"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={false}
              name="PM2.5"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Filter + Table */}
      <div className="bg-slate-900 p-6 rounded-2xl shadow-2xl overflow-x-auto border border-slate-800">
        <h3 className="text-lg font-semibold text-green-400 mb-4 text-center">
          📋 Hourly Air Quality Data
        </h3>

        {/* Filters */}
        <div className="flex flex-wrap justify-center mb-4 gap-3">
          <select
            className="bg-slate-800 text-slate-200 px-3 py-2 rounded-lg"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          >
            <option value="">All Cities</option>
            {uniqueCities.map((c, i) => (
              <option key={i} value={c}>
                {c}
              </option>
            ))}
          </select>

          <input
            type="date"
            className="bg-slate-800 text-slate-200 px-3 py-2 rounded-lg"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>

        <div className="overflow-y-auto max-h-[450px] rounded-lg">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-900 text-slate-300 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-4 py-3">Date / Hour</th>
                <th className="px-4 py-3">AQI</th>
                <th className="px-4 py-3">PM2.5 (µg/m³)</th>
                <th className="px-4 py-3">Samples</th>
                <th className="px-4 py-3">City</th>
              </tr>
            </thead>
            <tbody>
              {data
                .filter(
                  (row) =>
                    (!cityFilter || row.city === cityFilter) &&
                    (!dateFilter ||
                      new Date(row.hour_start)
                        .toISOString()
                        .startsWith(dateFilter))
                )
                .slice(-24)
                .map((row, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className={`${
                      i % 2 === 0
                        ? "bg-slate-800/50 hover:bg-slate-700/80"
                        : "bg-slate-900/40 hover:bg-slate-700/60"
                    } border-t border-slate-800 transition-all duration-300`}
                  >
                    <td className="px-4 py-3 font-medium text-slate-200">
                      {new Date(row.hour_start).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "numeric",
                        hour12: true,
                      })}
                    </td>
                    <td className="px-4 py-3 text-amber-300 font-semibold">
                      {fmt(row.avg_aqi)}
                    </td>
                    <td className="px-4 py-3 text-cyan-300 font-semibold">
                      {fmt(row.avg_pm25)}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{row.samples}</td>
                    <td className="px-4 py-3 text-slate-300">{row.city}</td>
                  </motion.tr>
                ))}
            </tbody>
          </table>
        </div>

        <motion.div
          className="text-center text-slate-500 text-xs mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Data auto-updates from your live backend every few hours 🌍
        </motion.div>
      </div>
    </div>
  );
}
