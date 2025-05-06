"use client" // Keep this if needed, although dynamic import handles SSR

import React, { useEffect, useState } from 'react' // Import React
import { Bar, Line, Pie } from 'react-chartjs-2'
// Import Chart.js essentials including auto-registration
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  tension?: number; // Added for Line chart option
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  scales?: any;
  plugins?: any; // Allow plugins config (like legend, tooltip)
}

interface ChartProps {
  type: 'line' | 'bar' | 'pie';
  data: ChartData;
  options: ChartOptions;
}

export function Chart({ type, data, options }: ChartProps) {
 
   const defaultOptions: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
          legend: {
              position: 'top' as const, // Sensible default legend position
          },
          tooltip: {
              enabled: true, // Ensure tooltips are on
          }
      },
   };

   // Merge options, letting user-provided options override defaults
   const chartOptions = { ...defaultOptions, ...options };
   // Ensure scales are properly structured if provided
   if (options.scales) {
       chartOptions.scales = { ...defaultOptions.scales, ...options.scales };
   }
   if (options.plugins) {
      chartOptions.plugins = { ...defaultOptions.plugins, ...options.plugins };
   }


  // Render the appropriate chart type
  switch (type) {
    case 'line':
      // Ensure data/options are valid before rendering
      if (!data || !data.datasets) return <div className="text-red-500">Invalid Line Chart Data</div>;
      return <Line data={data} options={chartOptions} />;
    case 'bar':
      if (!data || !data.datasets) return <div className="text-red-500">Invalid Bar Chart Data</div>;
      return <Bar data={data} options={chartOptions} />;
    case 'pie':
       if (!data || !data.datasets) return <div className="text-red-500">Invalid Pie Chart Data</div>;
      return <Pie data={data} options={chartOptions} />;
    default:
      console.warn("Unsupported chart type provided:", type);
      return <div className="text-orange-500">Unsupported chart type: {type}</div>;
  }
}