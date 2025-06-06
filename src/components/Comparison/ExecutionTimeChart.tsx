import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
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
        branchAndBound: BitonicMetric | null;
        dynamicProgramming: BitonicMetric | null;
    };
}

export const ExecutionTimeChart: React.FC<ChartProps> = ({ data }) => {
    console.log('data', data);
    const chartData = Object.entries(data)
        .filter(([_, value]) => value !== null)
        .map(([key, value]) => {
            let name;
            switch (key) {
                case 'bitonicWE':
                    name = 'W→E';
                    break;
                case 'bitonicEW':
                    name = 'E→W';
                    break;
                case 'bitonicSN':
                    name = 'S→N';
                    break;
                case 'bitonicNS':
                    name = 'N→S';
                    break;
                case 'backtracking':
                    name = 'BT';
                    break;
                case 'branchAndBound':
                    name = 'B&B';
                    break;
                case 'dynamicProgramming':
                    name = 'DP';
                    break;
                default:
                    name = key.charAt(0).toUpperCase() + key.slice(1);
            }
            return {
                name,
                executionTime: value?.executionTimeMs,
                memoryUsage: value?.memoryUsageMB,
            };
        });

    const distanceData = Object.entries(data)
        .filter(([_, value]) => value !== null)
        .map(([key, value]) => {
            let name;
            switch (key) {
                case 'bitonicWE':
                    name = 'W→E';
                    break;
                case 'bitonicEW':
                    name = 'E→W';
                    break;
                case 'bitonicSN':
                    name = 'S→N';
                    break;
                case 'bitonicNS':
                    name = 'N→S';
                    break;
                case 'backtracking':
                    name = 'BT';
                    break;
                default:
                    name = key.charAt(0).toUpperCase() + key.slice(1);
            }
            return {
                name,
                distance: value?.routeDistance || value?.totalDistance,
            };
        });

    const durationData = Object.entries(data)
        .filter(([_, value]) => value !== null)
        .map(([key, value]) => {
            let name;
            switch (key) {
                case 'bitonicWE':
                    name = 'W→E';
                    break;
                case 'bitonicEW':
                    name = 'E→W';
                    break;
                case 'bitonicSN':
                    name = 'S→N';
                    break;
                case 'bitonicNS':
                    name = 'N→S';
                    break;
                case 'backtracking':
                    name = 'BT';
                    break;
                default:
                    name = key.charAt(0).toUpperCase() + key.slice(1);
            }
            return {
                name,
                distance:
                    value?.routeTotalTime ||
                    value?.totalTime ||
                    value?.routeDuration,
            };
        });
    console.log('durationData', durationData);

    return (
        <Box
            sx={{
                width: '800px',
                height: 300,
                mt: 2,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Typography variant="subtitle2">
                    Execution Time Comparison
                </Typography>

                <ResponsiveContainer>
                    <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, bottom: 5 }}
                    >
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                            formatter={(value) => [
                                `${Number(value).toFixed(2)} ms`,
                                'Execution Time',
                            ]}
                        />
                        <Bar dataKey="executionTime" fill="#8884d8" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div
                style={{
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Typography variant="subtitle2">
                    Route Distance Comparison
                </Typography>

                <ResponsiveContainer>
                    <BarChart
                        data={distanceData}
                        margin={{ top: 20, right: 30, bottom: 5 }}
                    >
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                            formatter={(value) => [
                                `${Number(value).toFixed(2)} m`,
                                'Distance',
                            ]}
                        />
                        <Bar dataKey="distance" fill="#8884d8" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div
                style={{
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Typography variant="subtitle2">
                    Route Duration Comparison
                </Typography>

                <ResponsiveContainer>
                    <BarChart
                        data={durationData}
                        margin={{ top: 20, right: 30, bottom: 5 }}
                    >
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                            formatter={(value) => [
                                `${Number(value).toFixed(2)} s`,
                                'Duration',
                            ]}
                        />
                        <Bar dataKey="distance" fill="#8884d8" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Box>
    );
};
