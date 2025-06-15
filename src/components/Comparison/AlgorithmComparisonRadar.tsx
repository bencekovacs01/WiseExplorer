import React from 'react';
import {
    Legend,
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
    Radar,
    RadarChart,
    ResponsiveContainer,
} from 'recharts';
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
        bitonicCW: BitonicMetric | null; // Clockwise
        bitonicCCW: BitonicMetric | null; // Counterclockwise
        bitonicIO: BitonicMetric | null; // Inside-Out
        bitonicOI: BitonicMetric | null; // Outside-In
        branchAndBound: BitonicMetric | null;
        dynamicProgramming: BitonicMetric | null;
    };
}

export const AlgorithmComparisonRadar: React.FC<ChartProps> = ({ data }) => {
    const normalizeData = (metric: string, value: number | undefined) => {
        if (!value) return 0;

        const allValues = Object.values(data)
            .filter((d) => d !== null)
            .map(
                (d) => d?.[metric as keyof BitonicMetric] as number | undefined,
            )
            .filter((v) => v !== undefined) as number[];

        const max = Math.max(...allValues);

        if (
            ['executionTimeMs', 'memoryUsageMB', 'routeDistance'].includes(
                metric,
            )
        ) {
            return max === 0 ? 0 : 100 - (value / max) * 100;
        }
        return max === 0 ? 0 : (value / max) * 100;
    };

    const radarData = [
        {
            metric: 'Execution Speed',
            backtracking: normalizeData(
                'executionTimeMs',
                data.backtracking?.executionTimeMs,
            ),
            bitonicWE: normalizeData(
                'executionTimeMs',
                data.bitonicWE?.executionTimeMs,
            ),
            bitonicEW: normalizeData(
                'executionTimeMs',
                data.bitonicEW?.executionTimeMs,
            ),
            bitonicSN: normalizeData(
                'executionTimeMs',
                data.bitonicSN?.executionTimeMs,
            ),
            bitonicNS: normalizeData(
                'executionTimeMs',
                data.bitonicNS?.executionTimeMs,
            ),
            bitonicCW: normalizeData(
                'executionTimeMs',
                data.bitonicCW?.executionTimeMs,
            ),
            bitonicCCW: normalizeData(
                'executionTimeMs',
                data.bitonicCCW?.executionTimeMs,
            ),
            bitonicIO: normalizeData(
                'executionTimeMs',
                data.bitonicIO?.executionTimeMs,
            ),
            bitonicOI: normalizeData(
                'executionTimeMs',
                data.bitonicOI?.executionTimeMs,
            ),
            branchAndBound: normalizeData(
                'executionTimeMs',
                data.branchAndBound?.executionTimeMs,
            ),
            dynamicProgramming: normalizeData(
                'executionTimeMs',
                data.dynamicProgramming?.executionTimeMs,
            ),
        },
        {
            metric: 'Memory Efficiency',
            backtracking: normalizeData(
                'memoryUsageMB',
                data.backtracking?.memoryUsageMB,
            ),
            bitonicWE: normalizeData(
                'memoryUsageMB',
                data.bitonicWE?.memoryUsageMB,
            ),
            bitonicEW: normalizeData(
                'memoryUsageMB',
                data.bitonicEW?.memoryUsageMB,
            ),
            bitonicSN: normalizeData(
                'memoryUsageMB',
                data.bitonicSN?.memoryUsageMB,
            ),
            bitonicNS: normalizeData(
                'memoryUsageMB',
                data.bitonicNS?.memoryUsageMB,
            ),
            bitonicCW: normalizeData(
                'memoryUsageMB',
                data.bitonicCW?.memoryUsageMB,
            ),
            bitonicCCW: normalizeData(
                'memoryUsageMB',
                data.bitonicCCW?.memoryUsageMB,
            ),
            bitonicIO: normalizeData(
                'memoryUsageMB',
                data.bitonicIO?.memoryUsageMB,
            ),
            bitonicOI: normalizeData(
                'memoryUsageMB',
                data.bitonicOI?.memoryUsageMB,
            ),
            branchAndBound: normalizeData(
                'memoryUsageMB',
                data.branchAndBound?.memoryUsageMB,
            ),
            dynamicProgramming: normalizeData(
                'memoryUsageMB',
                data.dynamicProgramming?.memoryUsageMB,
            ),
        },
        {
            metric: 'Route Efficiency',
            backtracking: normalizeData(
                'routeDistance',
                data.backtracking?.routeDistance,
            ),
            bitonicWE: normalizeData(
                'routeDistance',
                data.bitonicWE?.routeDistance,
            ),
            bitonicEW: normalizeData(
                'routeDistance',
                data.bitonicEW?.routeDistance,
            ),
            bitonicSN: normalizeData(
                'routeDistance',
                data.bitonicSN?.routeDistance,
            ),
            bitonicNS: normalizeData(
                'routeDistance',
                data.bitonicNS?.routeDistance,
            ),
            bitonicCW: normalizeData(
                'routeDistance',
                data.bitonicCW?.routeDistance,
            ),
            bitonicCCW: normalizeData(
                'routeDistance',
                data.bitonicCCW?.routeDistance,
            ),
            bitonicIO: normalizeData(
                'routeDistance',
                data.bitonicIO?.routeDistance,
            ),
            bitonicOI: normalizeData(
                'routeDistance',
                data.bitonicOI?.routeDistance,
            ),
            branchAndBound: normalizeData(
                'routeDistance',
                data.branchAndBound?.routeDistance,
            ),
            dynamicProgramming: normalizeData(
                'routeDistance',
                data.dynamicProgramming?.routeDistance,
            ),
        },
    ];

    return (
        <Box sx={{ width: '100%', height: 300, mt: 2 }}>
            <Typography variant="subtitle2">
                Algorithm Performance Comparison
            </Typography>
            <ResponsiveContainer>
                <RadarChart outerRadius={90} data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    {data.backtracking && (
                        <Radar
                            name="Backtracking"
                            dataKey="backtracking"
                            stroke="#8884d8"
                            fill="#8884d8"
                            fillOpacity={0.6}
                        />
                    )}
                    {data.branchAndBound && (
                        <Radar
                            name="Branch & Bound"
                            dataKey="branchAndBound"
                            stroke="#fc5c9c"
                            fill="#fc5c9c"
                            fillOpacity={0.6}
                        />
                    )}
                    {data.dynamicProgramming && (
                        <Radar
                            name="Dynamic Programming"
                            dataKey="dynamicProgramming"
                            stroke="#00b4d8"
                            fill="#00b4d8"
                            fillOpacity={0.6}
                        />
                    )}
                    {data.bitonicWE && (
                        <Radar
                            name="W→E"
                            dataKey="bitonicWE"
                            stroke="#82ca9d"
                            fill="#82ca9d"
                            fillOpacity={0.6}
                        />
                    )}
                    {data.bitonicEW && (
                        <Radar
                            name="E→W"
                            dataKey="bitonicEW"
                            stroke="#ffc658"
                            fill="#ffc658"
                            fillOpacity={0.6}
                        />
                    )}
                    {data.bitonicSN && (
                        <Radar
                            name="S→N"
                            dataKey="bitonicSN"
                            stroke="#ff8042"
                            fill="#ff8042"
                            fillOpacity={0.6}
                        />
                    )}
                    {data.bitonicNS && (
                        <Radar
                            name="N→S"
                            dataKey="bitonicNS"
                            stroke="#0088FE"
                            fill="#0088FE"
                            fillOpacity={0.6}
                        />
                    )}
                    {data.bitonicCW && (
                        <Radar
                            name="Clockwise"
                            dataKey="bitonicCW"
                            stroke="#9c27b0"
                            fill="#9c27b0"
                            fillOpacity={0.6}
                        />
                    )}
                    {data.bitonicCCW && (
                        <Radar
                            name="Counter-CW"
                            dataKey="bitonicCCW"
                            stroke="#673ab7"
                            fill="#673ab7"
                            fillOpacity={0.6}
                        />
                    )}
                    {data.bitonicIO && (
                        <Radar
                            name="Inside→Out"
                            dataKey="bitonicIO"
                            stroke="#3f51b5"
                            fill="#3f51b5"
                            fillOpacity={0.6}
                        />
                    )}
                    {data.bitonicOI && (
                        <Radar
                            name="Outside→In"
                            dataKey="bitonicOI"
                            stroke="#2196f3"
                            fill="#2196f3"
                            fillOpacity={0.6}
                        />
                    )}
                    <Legend />
                </RadarChart>
            </ResponsiveContainer>
        </Box>
    );
};
