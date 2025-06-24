import React, { useState, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tabs,
    Tab,
    Alert,
    Chip,
} from '@mui/material';
import { Download } from '@mui/icons-material';
import {
    metricsService,
    AlgorithmMetrics,
} from '../../services/MetricsService';

interface ChartProps {
    metrics: AlgorithmMetrics[];
    title?: string;
}

const RouteDurationChart: React.FC<ChartProps> = ({
    metrics,
    title = 'Route Duration Comparison',
}) => {
    if (metrics.length === 0) {
        return (
            <Alert severity="info" sx={{ mt: 2 }}>
                No data available for {title}
            </Alert>
        );
    }

    const metricsWithDuration = metrics.filter(
        (m) => m.routeDuration !== undefined && m.routeDuration > 0,
    );

    if (metricsWithDuration.length === 0) {
        return (
            <Alert severity="warning" sx={{ mt: 2 }}>
                No route duration data available for {title}
            </Alert>
        );
    }

    const sortedMetrics = [...metricsWithDuration].sort(
        (a, b) => (a.routeDuration || 0) - (b.routeDuration || 0),
    );
    const maxTime = Math.max(
        ...metricsWithDuration.map((m) => m.routeDuration || 0),
    );

    return (
        <Paper sx={{ p: 3, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
                {title}
            </Typography>
            <Box sx={{ mt: 2 }}>
                {sortedMetrics.map((metric, index) => {
                    const routeTime = metric.routeDuration || 0;
                    const percentage =
                        maxTime > 0 ? (routeTime / maxTime) * 100 : 0;
                    const algorithmLabel = metric.variant
                        ? `${metric.algorithmName} (${metric.variant})`
                        : metric.algorithmName;

                    return (
                        <Box key={index} sx={{ mb: 2 }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    mb: 1,
                                }}
                            >
                                <Typography variant="body2">
                                    {algorithmLabel}
                                </Typography>
                                <Typography variant="body2">
                                    {`${routeTime.toFixed(2)} min`}
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    width: '100%',
                                    height: 20,
                                    backgroundColor: '#e0e0e0',
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                }}
                            >
                                <Box
                                    sx={{
                                        width: `${percentage}%`,
                                        height: '100%',
                                        backgroundColor:
                                            index === 0 ? '#4caf50' : '#2196f3',
                                        transition: 'width 0.3s ease',
                                    }}
                                />
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </Paper>
    );
};

const RouteDistanceChart: React.FC<ChartProps> = ({
    metrics,
    title = 'Route Distance Comparison',
}) => {
    if (metrics.length === 0) {
        return (
            <Alert severity="info" sx={{ mt: 2 }}>
                No data available for {title}
            </Alert>
        );
    }

    const metricsWithDistance = metrics.filter(
        (m) => m.routeDistance !== undefined && m.routeDistance > 0,
    );

    if (metricsWithDistance.length === 0) {
        return (
            <Alert severity="warning" sx={{ mt: 2 }}>
                No route distance data available for {title}
            </Alert>
        );
    }

    const sortedMetrics = [...metricsWithDistance].sort(
        (a, b) => (a.routeDistance || 0) - (b.routeDistance || 0),
    );
    const maxDistance = Math.max(
        ...metricsWithDistance.map((m) => m.routeDistance || 0),
    );

    return (
        <Paper sx={{ p: 3, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
                {title}
            </Typography>
            <Box sx={{ mt: 2 }}>
                {sortedMetrics.map((metric, index) => {
                    const distance = metric.routeDistance || 0;
                    const percentage =
                        maxDistance > 0 ? (distance / maxDistance) * 100 : 0;
                    const algorithmLabel = metric.variant
                        ? `${metric.algorithmName} (${metric.variant})`
                        : metric.algorithmName;

                    return (
                        <Box key={index} sx={{ mb: 2 }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    mb: 1,
                                }}
                            >
                                <Typography variant="body2">
                                    {algorithmLabel}
                                </Typography>
                                <Typography variant="body2">
                                    {distance >= 1000
                                        ? `${(distance / 1000).toFixed(2)} km`
                                        : `${distance.toFixed(0)} m`}
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    width: '100%',
                                    height: 20,
                                    backgroundColor: '#e0e0e0',
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                }}
                            >
                                <Box
                                    sx={{
                                        width: `${percentage}%`,
                                        height: '100%',
                                        backgroundColor:
                                            index === 0 ? '#4caf50' : '#ff9800',
                                        transition: 'width 0.3s ease',
                                    }}
                                />
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </Paper>
    );
};

// Execution Time Chart Component
const ExecutionTimeChart: React.FC<ChartProps> = ({
    metrics,
    title = 'Execution Time Comparison',
}) => {
    if (metrics.length === 0) {
        return (
            <Alert severity="info" sx={{ mt: 2 }}>
                No data available for {title}
            </Alert>
        );
    }

    const metricsWithExecutionTime = metrics.filter(
        (m) => m.executionTimeMs !== undefined && m.executionTimeMs > 0,
    );

    if (metricsWithExecutionTime.length === 0) {
        return (
            <Alert severity="warning" sx={{ mt: 2 }}>
                No execution time data available for {title}
            </Alert>
        );
    }

    const sortedMetrics = [...metricsWithExecutionTime].sort(
        (a, b) => (a.executionTimeMs || 0) - (b.executionTimeMs || 0),
    );
    const maxExecutionTime = Math.max(
        ...metricsWithExecutionTime.map((m) => m.executionTimeMs || 0),
    );

    return (
        <Paper sx={{ p: 3, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
                {title}
            </Typography>
            <Box sx={{ mt: 2 }}>
                {sortedMetrics.map((metric, index) => {
                    const executionTime = metric.executionTimeMs || 0;
                    const percentage =
                        maxExecutionTime > 0
                            ? (executionTime / maxExecutionTime) * 100
                            : 0;
                    const algorithmLabel = metric.variant
                        ? `${metric.algorithmName} (${metric.variant})`
                        : metric.algorithmName;

                    return (
                        <Box key={index} sx={{ mb: 2 }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    mb: 1,
                                }}
                            >
                                <Typography variant="body2">
                                    {algorithmLabel}
                                </Typography>
                                <Typography variant="body2">
                                    {executionTime < 1000
                                        ? `${executionTime.toFixed(2)} ms`
                                        : `${(executionTime / 1000).toFixed(
                                              2,
                                          )} s`}
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    width: '100%',
                                    height: 20,
                                    backgroundColor: '#e0e0e0',
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                }}
                            >
                                <Box
                                    sx={{
                                        width: `${percentage}%`,
                                        height: '100%',
                                        backgroundColor:
                                            index === 0 ? '#4caf50' : '#9c27b0',
                                        transition: 'width 0.3s ease',
                                    }}
                                />
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </Paper>
    );
};

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`metrics-tabpanel-${index}`}
            aria-labelledby={`metrics-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

export const MetricsDisplay: React.FC = () => {
    const [selectedNodeCount, setSelectedNodeCount] = useState<number>(20);
    const [activeTab, setActiveTab] = useState(0);

    const allMetrics = metricsService.getAllMetrics();

    // Deduplicate metrics - keep only the latest entry for each algorithm/variant/nodeCount combination
    const deduplicatedMetrics = useMemo(() => {
        const metricsMap = new Map<string, AlgorithmMetrics>();
        
        allMetrics.forEach(metric => {
            const key = `${metric.algorithmName}_${metric.variant || 'default'}_${metric.nodeCount}`;
            const existingMetric = metricsMap.get(key);
            
            // Keep the metric with the latest timestamp
            if (!existingMetric || metric.timestamp > existingMetric.timestamp) {
                metricsMap.set(key, metric);
            }
        });
        
        return Array.from(metricsMap.values());
    }, [allMetrics]);

    const availableNodeCounts = useMemo(() => {
        const counts = [...new Set(deduplicatedMetrics.map((m) => m.nodeCount))].sort(
            (a, b) => a - b,
        );
        return counts;
    }, [deduplicatedMetrics]);

    const filteredMetrics = useMemo(() => {
        return deduplicatedMetrics.filter((m) => m.nodeCount === selectedNodeCount);
    }, [deduplicatedMetrics, selectedNodeCount]);

    const groupedMetrics = useMemo(() => {
        const groups: Record<string, AlgorithmMetrics[]> = {};
        filteredMetrics.forEach((metric) => {
            const key = metric.variant
                ? `${metric.algorithmName}_${metric.variant}`
                : metric.algorithmName;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(metric);
        });
        return groups;
    }, [filteredMetrics]);

    const algorithmGroups = useMemo(() => {
        const groups = {
            group15: [] as AlgorithmMetrics[],
            group30: [] as AlgorithmMetrics[],
            group90: [] as AlgorithmMetrics[],
        };

        console.log('deduplicatedMetrics', deduplicatedMetrics);
        groups.group15 = deduplicatedMetrics.filter(
            (m) =>
                m.nodeCount === 15 &&
                (m.algorithmName === 'BranchAndBound' ||
                    m.algorithmName === 'DynamicProgramming' ||
                    m.algorithmName === 'Bitonic'),
        );

        groups.group30 = deduplicatedMetrics.filter(
            (m) =>
                m.nodeCount === 30 &&
                (m.algorithmName === 'DynamicProgramming' ||
                    m.algorithmName === 'Bitonic'),
        );

        groups.group90 = deduplicatedMetrics.filter(
            (m) => m.nodeCount === 90 && m.algorithmName === 'Bitonic',
        );

        return groups;
    }, [deduplicatedMetrics]);

    const bitonicVariants = useMemo(() => {
        return deduplicatedMetrics.filter(
            (m) =>
                m.algorithmName === 'Bitonic' &&
                m.nodeCount === selectedNodeCount,
        );
    }, [deduplicatedMetrics, selectedNodeCount]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const handleExportCSV = () => {
        const csvData = metricsService.exportToCSV();
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `algorithm_metrics_${
            new Date().toISOString().split('T')[0]
        }.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const formatTime = (timeMs?: number) => {
        if (timeMs === undefined) return 'N/A';
        if (timeMs < 1000) return `${timeMs.toFixed(2)}ms`;
        return `${(timeMs / 1000).toFixed(2)}s`;
    };

    const formatDistance = (distance?: number) => {
        if (distance === undefined) return 'N/A';
        return `${distance.toFixed(2)}m`;
    };

    const formatDuration = (duration?: number) => {
        if (duration === undefined) return 'N/A';
        return `${duration.toFixed(2)}min`;
    };

    const renderMetricsTable = (metrics: AlgorithmMetrics[], title: string) => {
        if (metrics.length === 0) {
            return (
                <Alert severity="info" sx={{ mt: 2 }}>
                    No metrics available for {title}. Run performance tests to
                    see data.
                </Alert>
            );
        }

        return (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Algorithm</TableCell>
                            <TableCell>Variant</TableCell>
                            <TableCell>Nodes</TableCell>
                            <TableCell>Execution Time</TableCell>
                            <TableCell>Route Distance</TableCell>
                            <TableCell>Travel Time</TableCell>
                            <TableCell>Visit Time</TableCell>
                            <TableCell>Total Time</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {metrics.map((metric, index) => (
                            <TableRow key={index}>
                                <TableCell>{metric.algorithmName}</TableCell>
                                <TableCell>
                                    {metric.variant && (
                                        <Chip
                                            label={metric.variant}
                                            size="small"
                                        />
                                    )}
                                </TableCell>
                                <TableCell>{metric.nodeCount}</TableCell>
                                <TableCell>
                                    {formatTime(metric.executionTimeMs)}
                                </TableCell>
                                <TableCell>
                                    {formatDistance(metric.routeDistance)}
                                </TableCell>
                                <TableCell>
                                    {formatDuration(metric.routeDuration)}
                                </TableCell>
                                <TableCell>
                                    {formatDuration(metric.routeVisitTime)}
                                </TableCell>
                                <TableCell>
                                    {formatDuration(metric.routeDuration)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    const AlgorithmGroupComparison = () => {
        return (
            <Box>
                <Typography variant="h5" gutterBottom>
                    Algorithm Group Comparisons
                </Typography>

                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={activeTab} onChange={handleTabChange}>
                        <Tab label="Group 1: 15 Nodes" />
                        <Tab label="Group 2: 30 Nodes" />
                        <Tab label="Group 3: 90 Nodes" />
                    </Tabs>
                </Box>

                <TabPanel value={activeTab} index={0}>
                    <Typography variant="h6" gutterBottom>
                        Branch-and-Bound vs Dynamic Programming vs Bitonic (15 Nodes)
                    </Typography>
                    <RouteDurationChart
                        metrics={algorithmGroups.group15}
                        title="Route Duration Comparison - 15 Nodes"
                    />
                    <RouteDistanceChart
                        metrics={algorithmGroups.group15}
                        title="Route Distance Comparison - 15 Nodes"
                    />
                    <ExecutionTimeChart
                        metrics={algorithmGroups.group15}
                        title="Algorithm Execution Time - 15 Nodes"
                    />
                    {renderMetricsTable(
                        algorithmGroups.group15,
                        '15-node comparison',
                    )}
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 2 }}
                    >
                        This comparison shows the trade-offs between optimal
                        algorithms (Branch-and-Bound, Dynamic Programming)
                        and the heuristic Bitonic algorithm at a
                        manageable problem size. Note the execution time
                        differences and how they relate to route quality.
                    </Typography>
                </TabPanel>

                <TabPanel value={activeTab} index={1}>
                    <Typography variant="h6" gutterBottom>
                        Dynamic Programming vs Bitonic (30 Nodes)
                    </Typography>
                    <RouteDurationChart
                        metrics={algorithmGroups.group30}
                        title="Route Duration Comparison - 30 Nodes"
                    />
                    <RouteDistanceChart
                        metrics={algorithmGroups.group30}
                        title="Route Distance Comparison - 30 Nodes"
                    />
                    <ExecutionTimeChart
                        metrics={algorithmGroups.group30}
                        title="Algorithm Execution Time - 30 Nodes"
                    />
                    {renderMetricsTable(
                        algorithmGroups.group30,
                        '30-node comparison',
                    )}
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 2 }}
                    >
                        At 30 nodes, we can observe the practical limits of
                        Dynamic Programming compared to Bitonic&apos;s
                        scalability. The execution time difference becomes more
                        pronounced while route quality trade-offs become
                        evident.
                    </Typography>
                </TabPanel>

                <TabPanel value={activeTab} index={2}>
                    <Typography variant="h6" gutterBottom>
                        Bitonic Strategy Comparison (90 Nodes)
                    </Typography>
                    <RouteDurationChart
                        metrics={algorithmGroups.group90}
                        title="Route Duration Comparison - Bitonic Variants (90 Nodes)"
                    />
                    <RouteDistanceChart
                        metrics={algorithmGroups.group90}
                        title="Route Distance Comparison - Bitonic Variants (90 Nodes)"
                    />
                    <ExecutionTimeChart
                        metrics={algorithmGroups.group90}
                        title="Algorithm Execution Time - Bitonic Variants (90 Nodes)"
                    />
                    {renderMetricsTable(
                        algorithmGroups.group90,
                        '90-node Bitonic variants',
                    )}
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 2 }}
                    >
                        Large-scale comparison of different Bitonic sorting
                        strategies demonstrates the algorithm&apos;s excellent
                        scalability and how different approaches affect route
                        quality, distance, and execution time.
                    </Typography>
                </TabPanel>
            </Box>
        );
    };

    if (deduplicatedMetrics.length === 0) {
        return (
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Algorithm Performance Metrics
                </Typography>
                <Alert severity="info">
                    No performance metrics available. Run the performance tests
                    to collect data.
                </Alert>
            </Paper>
        );
    }

    return (
        <Box>
            {/* <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={3}
                >
                    <Typography variant="h5" gutterBottom>
                        Algorithm Performance Metrics
                    </Typography>
                    <Button
                        variant="outlined"
                        startIcon={<Download />}
                        onClick={handleExportCSV}
                        disabled={deduplicatedMetrics.length === 0}
                    >
                        Export CSV
                    </Button>
                </Box> */}

                {/* {availableNodeCounts.length > 0 && (
                    <FormControl sx={{ minWidth: 200, mb: 3 }}>
                        <InputLabel>Node Count</InputLabel>
                        <Select
                            value={selectedNodeCount}
                            label="Node Count"
                            onChange={(e) =>
                                setSelectedNodeCount(e.target.value as number)
                            }
                        >
                            {availableNodeCounts.map((count) => (
                                <MenuItem key={count} value={count}>
                                    {count} nodes
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )} */}

                {/* Individual Algorithm Metrics */}
                {/* <Typography variant="h6" gutterBottom>
                    Metrics for {selectedNodeCount} Nodes
                </Typography>
                {renderMetricsTable(
                    filteredMetrics,
                    `${selectedNodeCount} nodes`,
                )} */}

                {/* Bitonic Variants Comparison */}
                {/* {bitonicVariants.length > 1 && (
                    <Box sx={{ mt: 4 }}>
                        <Typography variant="h6" gutterBottom>
                            Bitonic Strategy Comparison ({selectedNodeCount}{' '}
                            Nodes)
                        </Typography>
                        <RouteDurationChart
                            metrics={bitonicVariants}
                            title={`Bitonic Variants Route Duration (${selectedNodeCount} Nodes)`}
                        />
                        <RouteDistanceChart
                            metrics={bitonicVariants}
                            title={`Bitonic Variants Route Distance (${selectedNodeCount} Nodes)`}
                        />
                        <ExecutionTimeChart
                            metrics={bitonicVariants}
                            title={`Bitonic Variants Execution Time (${selectedNodeCount} Nodes)`}
                        />
                        {renderMetricsTable(
                            bitonicVariants,
                            `Bitonic variants at ${selectedNodeCount} nodes`,
                        )}
                    </Box>
                )} */}

                {/* Execution Time Chart */}
                {/* <RouteDurationChart
                    metrics={filteredMetrics}
                    title={`Route Duration for ${selectedNodeCount} Nodes`}
                />
                <RouteDistanceChart
                    metrics={filteredMetrics}
                    title={`Route Distance for ${selectedNodeCount} Nodes`}
                />
                <ExecutionTimeChart
                    metrics={filteredMetrics}
                    title={`Algorithm Execution Time for ${selectedNodeCount} Nodes`}
                /> */}
            {/* </Paper> */}

            {/* Algorithm Group Comparisons */}
            <Paper elevation={3} sx={{ p: 3 }}>
                <AlgorithmGroupComparison />
            </Paper>
        </Box>
    );
};
