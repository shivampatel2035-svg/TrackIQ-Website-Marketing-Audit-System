import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, LabelList, Tooltip, CartesianGrid,
} from 'recharts';
import type { AuditReport } from '../data/dummyData';

const tooltipStyle = {
  background: 'rgba(17,24,39,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  color: '#fff',
  fontSize: 12,
  backdropFilter: 'blur(8px)',
};

export function Charts({ report }: { report: AuditReport }) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl glass p-6"
      >
        <h3 className="text-sm font-semibold text-white">Resource Distribution</h3>
        <p className="text-xs text-slate-500">File count by asset type</p>
        <div className="mt-2 h-52">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={report.charts.resourceDistribution}
                dataKey="value"
                nameKey="name"
                innerRadius={48}
                outerRadius={78}
                paddingAngle={3}
                stroke="none"
              >
                {report.charts.resourceDistribution.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {report.charts.resourceDistribution.map((d) => (
            <div key={d.name} className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
              {d.name} · {d.value} {d.value === 1 ? 'file' : 'files'}
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="rounded-2xl glass p-6"
      >
        <h3 className="text-sm font-semibold text-white">Score Breakdown</h3>
        <p className="text-xs text-slate-500">Category scores out of 100</p>
        <div className="mt-2 h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={report.charts.scoreBreakdown} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={36}>
                {report.charts.scoreBreakdown.map((d, i) => (
                  <Cell key={i} fill={d.fill} />
                ))}
                <LabelList dataKey="value" position="top" fill="#fff" fontSize={11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-2xl glass p-6"
      >
        <h3 className="text-sm font-semibold text-white">Score Trend</h3>
        <p className="text-xs text-slate-500">Your scans this session</p>
        <div className="mt-2 h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={report.charts.trend} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={28} fill="#6366F1">
                <LabelList dataKey="score" position="top" fill="#fff" fontSize={11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
