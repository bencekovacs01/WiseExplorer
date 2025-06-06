import React from 'react';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Box, Typography } from '@mui/material';
import { BitonicMetric } from './PerformanceMetrics';

export const RouteTimeBreakdown: React.FC<{
    routeData: BitonicMetric | null;
}> = ({ routeData }) => {
    if (!routeData?.routeDuration || !routeData?.routeVisitTime) return null;

    const data = [
        { name: 'Travel Time', value: routeData.routeDuration },
        { name: 'Visit Time', value: routeData.routeVisitTime },
    ];

    const COLORS = ['#0088FE', '#00C49F'];

    return (
        <Box sx={{ width: '100%', height: 250, mt: 2 }}>
            <Typography variant="subtitle2">Route Time Breakdown</Typography>
            <ResponsiveContainer>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) =>
                            `${name}: ${Math.round(value)}s`
                        }
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value) => [`${Math.round(Number(value))}s`]}
                    />
                </PieChart>
            </ResponsiveContainer>
        </Box>
    );
};
