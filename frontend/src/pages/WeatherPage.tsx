import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

type HourlyWeather = {
  hour_start?: string;
  avg_temp?: number | null;
  avg_humidity?: number | null;
  avg_wind_speed?: number | null;
};

const BASE_URL =
  (import.meta.env.VITE_API_BASE as string) ||
  "http://127.0.0.1:8000/api/analytics";

export default function WeatherPage() {
  const [data, setData] = useState<HourlyWeather[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"latest" | "week">("latest");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${BASE_URL}/weather/hourly`);
        const d = await res.json();
        const arr = Array.isArray(d) ? d : [];
        const normalized = arr
          .map((r) => ({
            hour_start: r.hour_start,
            avg_temp:
              typeof r.avg_temp === "number"
                ? r.avg_temp
                : typeof r.avg_temperature === "number"
                ? r.avg_temperature
                : null,
            avg_humidity:
              typeof r.avg_humidity === "number" ? r.avg_humidity : null,
            avg_wind_speed:
              typeof r.avg_wind_speed === "number" ? r.avg_wind_speed : null,
          }))
          .filter((x) => x.hour_start)
          .sort(
            (a, b) =>
              new Date(a.hour_start!).getTime() -
              new Date(b.hour_start!).getTime()
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

  const fmt = (v: any) =>
    typeof v === "number" && !isNaN(v) ? v.toFixed(1) : "—";
  const latest = data.at(-1);

  // === Daily averages ===
  const dailyAvg = (() => {
    const grouped: Record<string, HourlyWeather[]> = {};
    data.forEach((item) => {
      const day = new Date(item.hour_start!).toISOString().split("T")[0];
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(item);
    });
    return Object.entries(grouped)
      .map(([date, vals]) => ({
        date,
        avg_temp:
          vals.reduce((a, b) => a + (b.avg_temp || 0), 0) / vals.length,
        avg_humidity:
          vals.reduce((a, b) => a + (b.avg_humidity || 0), 0) / vals.length,
      }))
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
  })();

  // === Weekly averages ===
  const weeklyAvg = (() => {
    const grouped: Record<string, HourlyWeather[]> = {};
    data.forEach((item) => {
      const date = new Date(item.hour_start!);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const key = weekStart.toISOString().split("T")[0];
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
    return Object.entries(grouped)
      .map(([week, vals]) => ({
        week,
        avg_temp:
          vals.reduce((a, b) => a + (b.avg_temp || 0), 0) / vals.length,
        avg_humidity:
          vals.reduce((a, b) => a + (b.avg_humidity || 0), 0) / vals.length,
      }))
      .sort(
        (a, b) => new Date(a.week).getTime() - new Date(b.week).getTime()
      );
  })();

  // === View selection ===
  const filteredData = view === "latest" ? data.slice(-10) : weeklyAvg;

  const chartLabel =
    view === "latest" ? "Latest Records" : "Weekly Averages";

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

      {/* Toggle Buttons */}
      <div className="flex justify-center mb-6">
        {["latest", "week"].map((option) => (
          <button
            key={option}
            onClick={() => setView(option as any)}
            className={`mx-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${
              view === option
                ? "bg-amber-400 text-slate-900"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300"
            }`}
          >
            {option === "latest" ? "Latest" : "Weekly"}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-slate-900 p-6 rounded-2xl shadow-lg mb-10">
        <h3 className="text-lg font-semibold text-amber-300 mb-4 text-center">
          📈 Weather Trends — {chartLabel}
        </h3>

        <ResponsiveContainer width="100%" height={350}>
          <AreaChart
            data={filteredData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="humGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey={view === "latest" ? "hour_start" : "week"}
              tickFormatter={(v) =>
                new Date(v).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                })
              }
              tick={{ fill: "#9ca3af", fontSize: 10 }}
              angle={-15}
              textAnchor="end"
            />
            <YAxis tick={{ fill: "#9ca3af" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "none",
                borderRadius: "10px",
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="avg_temp"
              stroke="#f59e0b"
              fillOpacity={1}
              fill="url(#tempGradient)"
              name="Temperature (°C)"
            />
            <Area
              type="monotone"
              dataKey="avg_humidity"
              stroke="#06b6d4"
              fillOpacity={1}
              fill="url(#humGradient)"
              name="Humidity (%)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <footer className="text-center text-xs text-slate-500 mt-8">
        © {new Date().getFullYear()} UrbanPulse — Weather Analytics
      </footer>
    </div>
  );
}



