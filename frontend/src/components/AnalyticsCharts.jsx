import React from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Legend 
} from 'recharts';

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b'];

export const DistributionChart = ({ data }) => {
  return (
    <div className="h-[300px] w-full mt-6">
      <h4 className="text-center mb-4 text-sm font-semibold opacity-70 uppercase tracking-wider">Class Distribution</h4>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(30, 41, 59, 0.9)', 
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px'
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const TrendChart = ({ data, metrics }) => {
  return (
    <div className="h-[350px] w-full mt-10">
      <h4 className="text-center mb-4 text-sm font-semibold opacity-70 uppercase tracking-wider">
        {metrics.y_label} vs {metrics.x_label} Trends
      </h4>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis 
            type="number" 
            dataKey="x" 
            name={metrics.x_label} 
            stroke="#94a3b8" 
            fontSize={12}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name={metrics.y_label} 
            stroke="#94a3b8" 
            fontSize={12}
          />
          <ZAxis type="number" range={[50, 400]} />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{ 
              backgroundColor: 'rgba(30, 41, 59, 0.9)', 
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Scatter 
            name="Positive/Case" 
            data={data.filter(d => d.target === 1)} 
            fill="#ec4899" 
            shape="circle" 
          />
          <Scatter 
            name="Negative/Control" 
            data={data.filter(d => d.target === 0)} 
            fill="#6366f1" 
            shape="diamond" 
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};
