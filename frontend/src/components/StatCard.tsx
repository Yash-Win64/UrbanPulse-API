import { motion } from "framer-motion";

interface Props {
  title: string;
  value: string | number | undefined;
}

export default function StatCard({ title, value }: Props) {
  return (
    <motion.div
      className="bg-card rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all border border-gray-100"
      whileHover={{ scale: 1.05 }}
    >
      <h2 className="text-gray-500 text-sm">{title}</h2>
      <p className="text-2xl font-semibold text-dark mt-2">{value ?? "--"}</p>
    </motion.div>
  );
}
