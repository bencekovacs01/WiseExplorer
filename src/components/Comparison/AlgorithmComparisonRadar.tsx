import React from 'react';
import { Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer,  } from 'recharts';
import { Box, Typography } from '@mui/material';
import { BitonicMetric } from './PerformanceMetrics';

interface ChartProps {
    data: {
      backtracking: BitonicMetric | null;
      bitonic: BitonicMetric | null;
      bitonicWE: BitonicMetric | null;
      bitonicEW: BitonicMetric | null;
      bitonicSN: BitonicMetric | null;
      bitonicNS: BitonicMetric | null;
      branchAndBound: BitonicMetric | null;
      dynamicProgramming: BitonicMetric | null;
    };
  }

export const AlgorithmComparisonRadar: React.FC<ChartProps> = ({ data }) => {
    const normalizeData = (metric: string, value: number | undefined) => {
      if (!value) return 0;
      
      const allValues = Object.values(data)
        .filter(d => d !== null)
        .map(d => d?.[metric as keyof BitonicMetric] as number | undefined)
        .filter(v => v !== undefined) as number[];
        
      const max = Math.max(...allValues);
      
      if (['executionTimeMs', 'memoryUsageMB', 'routeDistance'].includes(metric)) {
        return max === 0 ? 0 : 100 - ((value / max) * 100);
      }
      return max === 0 ? 0 : (value / max) * 100;
    };
  
    const radarData = [
      { metric: 'Execution Speed', 
        backtracking: normalizeData('executionTimeMs', data.backtracking?.executionTimeMs),
        bitonicWE: normalizeData('executionTimeMs', data.bitonicWE?.executionTimeMs),
        bitonicEW: normalizeData('executionTimeMs', data.bitonicEW?.executionTimeMs),
        bitonicSN: normalizeData('executionTimeMs', data.bitonicSN?.executionTimeMs),
        bitonicNS: normalizeData('executionTimeMs', data.bitonicNS?.executionTimeMs),
        branchAndBound: normalizeData('executionTimeMs', data.branchAndBound?.executionTimeMs),
        dynamicProgramming: normalizeData('executionTimeMs', data.dynamicProgramming?.executionTimeMs)
      },
      { metric: 'Memory Efficiency',
        backtracking: normalizeData('memoryUsageMB', data.backtracking?.memoryUsageMB),
        bitonicWE: normalizeData('memoryUsageMB', data.bitonicWE?.memoryUsageMB),
        bitonicEW: normalizeData('memoryUsageMB', data.bitonicEW?.memoryUsageMB),
        bitonicSN: normalizeData('memoryUsageMB', data.bitonicSN?.memoryUsageMB),
        bitonicNS: normalizeData('memoryUsageMB', data.bitonicNS?.memoryUsageMB),
        branchAndBound: normalizeData('memoryUsageMB', data.branchAndBound?.memoryUsageMB),
        dynamicProgramming: normalizeData('memoryUsageMB', data.dynamicProgramming?.memoryUsageMB)
      },
      { metric: 'Route Efficiency',
        backtracking: normalizeData('routeDistance', data.backtracking?.routeDistance),
        bitonicWE: normalizeData('routeDistance', data.bitonicWE?.routeDistance),
        bitonicEW: normalizeData('routeDistance', data.bitonicEW?.routeDistance),
        bitonicSN: normalizeData('routeDistance', data.bitonicSN?.routeDistance),
        bitonicNS: normalizeData('routeDistance', data.bitonicNS?.routeDistance),
        branchAndBound: normalizeData('routeDistance', data.branchAndBound?.routeDistance),
        dynamicProgramming: normalizeData('routeDistance', data.dynamicProgramming?.routeDistance)
      }
    ];
  
    return (
      <Box sx={{ width: '100%', height: 300, mt: 2 }}>
        <Typography variant="subtitle2">Algorithm Performance Comparison</Typography>
        <ResponsiveContainer>
          <RadarChart outerRadius={90} data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            {data.backtracking && <Radar name="Backtracking" dataKey="backtracking" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />}
            {data.branchAndBound && <Radar name="Branch & Bound" dataKey="branchAndBound" stroke="#fc5c9c" fill="#fc5c9c" fillOpacity={0.6} />}
            {data.dynamicProgramming && <Radar name="Dynamic Programming" dataKey="dynamicProgramming" stroke="#00b4d8" fill="#00b4d8" fillOpacity={0.6} />}
            {data.bitonicWE && <Radar name="W→E" dataKey="bitonicWE" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />}
            {data.bitonicEW && <Radar name="E→W" dataKey="bitonicEW" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />}
            {data.bitonicSN && <Radar name="S→N" dataKey="bitonicSN" stroke="#ff8042" fill="#ff8042" fillOpacity={0.6} />}
            {data.bitonicNS && <Radar name="N→S" dataKey="bitonicNS" stroke="#0088FE" fill="#0088FE" fillOpacity={0.6} />}
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </Box>
    );
  };