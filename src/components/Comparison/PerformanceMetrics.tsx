import React from 'react';
import {
    Paper,
    Typography,
    Box,
    Divider,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ExecutionTimeChart } from './ExecutionTimeChart';
import { RouteTimeBreakdown } from './RouteTimeBreakdown';
import { AlgorithmComparisonRadar } from './AlgorithmComparisonRadar';

export interface BitonicMetric {
    executionTimeMs: number;
    memoryUsageMB: number;
    algorithm: string;
    pointCount: number;
    timestamp: string;
    clientTotalTime: number;
    strategy?: string;
    routeDistance?: number;
    routeDuration?: number;
    routeVisitTime?: number;
    routeTotalTime?: number;
    totalDistance?: number;
    totalTime?: number;
    totalVisitTime?: number;
}

interface MetricsProps {
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
        aroraPTAS: BitonicMetric | null; // Add Arora PTAS
    };
}

const PerformanceMetrics: React.FC<MetricsProps> = ({ data }) => {
    const hasBitonicVariations =
        data.bitonicWE ||
        data.bitonicEW ||
        data.bitonicSN ||
        data.bitonicNS ||
        data.bitonicCW ||
        data.bitonicCCW ||
        data.bitonicIO ||
        data.bitonicOI;

    if (!data.backtracking && !data.bitonic && !hasBitonicVariations && !data.aroraPTAS) {
        return null;
    }

    const formatTime = (ms: number) => {
        if (ms < 1000) return `${ms.toFixed(2)}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    // Format distance in km if > 1000m
    const formatDistance = (meters?: number) => {
        if (!meters) return '0m';
        return meters >= 1000
            ? `${(meters / 1000).toFixed(2)}km`
            : `${Math.round(meters)}m`;
    };

    // Format duration in hours/minutes/seconds
    const formatDuration = (seconds?: number) => {
        if (!seconds) return '0s';
        return `${seconds} seconds`;
    };

    const getBestBitonicStrategy = () => {
        const strategies = [
            { name: 'West-East', data: data.bitonicWE },
            { name: 'East-West', data: data.bitonicEW },
            { name: 'South-North', data: data.bitonicSN },
            { name: 'North-South', data: data.bitonicNS },
            { name: 'Clockwise', data: data.bitonicCW },
            { name: 'Counter-Clockwise', data: data.bitonicCCW },
            { name: 'Inside-Out', data: data.bitonicIO },
            { name: 'Outside-In', data: data.bitonicOI },
        ].filter((s) => s.data);

        if (strategies.length === 0) return null;

        return strategies.reduce((best, current) =>
            current.data &&
            best.data &&
            (current.data.routeTotalTime || 0) < (best.data.routeTotalTime || 0)
                ? current
                : best,
        );
    };

    const bestStrategy = getBestBitonicStrategy();

    return (
        <Paper
            elevation={3}
            sx={{
                position: 'absolute',
                bottom: '60px',
                right: '260px',
                padding: 2,
                // width: '350px',
                zIndex: 1000,
                maxHeight: '70vh',
                overflow: 'auto',
            }}
        >
            <Typography variant="h6" gutterBottom>
                Performance Metrics
            </Typography>

            <Box mt={3} style={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" gutterBottom>
                    Visualizations
                </Typography>
                <ExecutionTimeChart data={data} />
                {bestStrategy?.data && (
                    <RouteTimeBreakdown routeData={bestStrategy.data} />
                )}
                <AlgorithmComparisonRadar data={data} />
            </Box>

            {data.backtracking && (
                <Box mb={2}>
                    <Typography variant="subtitle1">
                        Backtracking Algorithm
                    </Typography>
                    <Typography variant="body2">
                        Points: {data.backtracking.pointCount}
                    </Typography>
                    <Typography variant="body2">
                        Server execution:{' '}
                        {formatTime(data.backtracking.executionTimeMs)}
                    </Typography>
                    <Typography variant="body2">
                        Total time:{' '}
                        {formatTime(data.backtracking.clientTotalTime)}
                    </Typography>
                    <Typography variant="body2">
                        Memory used: {data.backtracking.memoryUsageMB} MB
                    </Typography>

                    {data?.backtracking?.totalTime && (
                        <>
                            <Divider sx={{ my: 0.5 }} />
                            <Typography variant="body2">
                                Total distance:{' '}
                                {formatDistance(data?.backtracking?.totalTime)}
                            </Typography>
                            <Typography variant="body2">
                                Travel time:{' '}
                                {formatDuration(data.backtracking.totalTime)}
                            </Typography>
                            <Typography variant="body2">
                                Visit time:{' '}
                                {formatDuration(
                                    data.backtracking.routeVisitTime,
                                )}
                            </Typography>
                            <Typography variant="body2">
                                Route total time:{' '}
                                {formatDuration(
                                    data.backtracking.routeTotalTime,
                                )}
                            </Typography>
                        </>
                    )}
                </Box>
            )}

            {data.backtracking && (data.bitonic || hasBitonicVariations) && (
                <Divider sx={{ my: 1 }} />
            )}

            {data.branchAndBound && (
                <Box mb={2}>
                    <Typography variant="subtitle1">
                        Branch & Bound Algorithm
                    </Typography>
                    <Typography variant="body2">
                        Points: {data.branchAndBound.pointCount}
                    </Typography>
                    <Typography variant="body2">
                        Server execution:{' '}
                        {formatTime(data.branchAndBound.executionTimeMs)}
                    </Typography>
                    <Typography variant="body2">
                        Total time:{' '}
                        {formatTime(data.branchAndBound.clientTotalTime)}
                    </Typography>
                    <Typography variant="body2">
                        Memory used: {data.branchAndBound.memoryUsageMB} MB
                    </Typography>

                    {data?.branchAndBound?.routeDistance && (
                        <>
                            <Divider sx={{ my: 0.5 }} />
                            <Typography variant="body2">
                                Total distance:{' '}
                                {formatDistance(
                                    data?.branchAndBound?.routeDistance,
                                )}
                            </Typography>
                            <Typography variant="body2">
                                Travel time:{' '}
                                {formatDuration(
                                    data.branchAndBound.routeDuration,
                                )}
                            </Typography>
                            <Typography variant="body2">
                                Visit time:{' '}
                                {formatDuration(
                                    data.branchAndBound.routeVisitTime,
                                )}
                            </Typography>
                            <Typography variant="body2">
                                Route total time:{' '}
                                {formatDuration(
                                    data.branchAndBound.routeTotalTime,
                                )}
                            </Typography>
                        </>
                    )}
                </Box>
            )}

            {/* {data.branchAndBound && (data.bitonic || hasBitonicVariations || data.dynamicProgramming) && (
                <Divider sx={{ my: 1 }} />
            )} */}

            {data.dynamicProgramming && (
                <Box mb={2}>
                    <Typography variant="subtitle1">
                        Dynamic Programming Algorithm
                    </Typography>
                    <Typography variant="body2">
                        Points: {data.dynamicProgramming.pointCount}
                    </Typography>
                    <Typography variant="body2">
                        Server execution:{' '}
                        {formatTime(data.dynamicProgramming.executionTimeMs)}
                    </Typography>
                    <Typography variant="body2">
                        Total time:{' '}
                        {formatTime(data.dynamicProgramming.clientTotalTime)}
                    </Typography>
                    <Typography variant="body2">
                        Memory used: {data.dynamicProgramming.memoryUsageMB} MB
                    </Typography>

                    {data?.dynamicProgramming?.routeDistance && (
                        <>
                            <Divider sx={{ my: 0.5 }} />
                            <Typography variant="body2">
                                Total distance:{' '}
                                {formatDistance(
                                    data?.dynamicProgramming?.routeDistance,
                                )}
                            </Typography>
                            <Typography variant="body2">
                                Travel time:{' '}
                                {formatDuration(
                                    data.dynamicProgramming.routeDuration,
                                )}
                            </Typography>
                            <Typography variant="body2">
                                Visit time:{' '}
                                {formatDuration(
                                    data.dynamicProgramming.routeVisitTime,
                                )}
                            </Typography>
                            <Typography variant="body2">
                                Route total time:{' '}
                                {formatDuration(
                                    data.dynamicProgramming.routeTotalTime,
                                )}
                            </Typography>
                        </>
                    )}
                </Box>
            )}

            {data.dynamicProgramming &&
                (data.bitonic || hasBitonicVariations || data.aroraPTAS) && (
                    <Divider sx={{ my: 1 }} />
                )}

            {data.aroraPTAS && (
                <Box mb={2}>
                    <Typography variant="subtitle1">
                        Arora PTAS Algorithm
                    </Typography>
                    <Typography variant="body2">
                        Points: {data.aroraPTAS.pointCount}
                    </Typography>
                    <Typography variant="body2">
                        Server execution:{' '}
                        {formatTime(data.aroraPTAS.executionTimeMs)}
                    </Typography>
                    <Typography variant="body2">
                        Total time:{' '}
                        {formatTime(data.aroraPTAS.clientTotalTime)}
                    </Typography>
                    <Typography variant="body2">
                        Memory used: {data.aroraPTAS.memoryUsageMB} MB
                    </Typography>
                    {data.aroraPTAS.strategy && (
                        <Typography variant="body2">
                            Variant: {data.aroraPTAS.strategy}
                        </Typography>
                    )}

                    {data?.aroraPTAS?.routeDistance && (
                        <>
                            <Divider sx={{ my: 0.5 }} />
                            <Typography variant="body2">
                                Total distance:{' '}
                                {formatDistance(
                                    data?.aroraPTAS?.routeDistance,
                                )}
                            </Typography>
                            <Typography variant="body2">
                                Travel time:{' '}
                                {formatDuration(
                                    data.aroraPTAS.routeDuration,
                                )}
                            </Typography>
                            <Typography variant="body2">
                                Visit time:{' '}
                                {formatDuration(
                                    data.aroraPTAS.routeVisitTime,
                                )}
                            </Typography>
                            <Typography variant="body2">
                                Route total time:{' '}
                                {formatDuration(
                                    data.aroraPTAS.routeTotalTime,
                                )}
                            </Typography>
                        </>
                    )}
                </Box>
            )}

            {(data.aroraPTAS || data.dynamicProgramming) &&
                (data.bitonic || hasBitonicVariations) && (
                    <Divider sx={{ my: 1 }} />
                )}

            {(data.bitonic || hasBitonicVariations) && (
                <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle1">
                            Bitonic Algorithm
                        </Typography>
                        {bestStrategy && (
                            <Typography
                                variant="body2"
                                color="primary"
                                sx={{ ml: 1 }}
                            >
                                (Best: {bestStrategy.name})
                            </Typography>
                        )}
                    </AccordionSummary>
                    <AccordionDetails>
                        {data.bitonicWE && (
                            <Box mb={1}>
                                <Typography
                                    variant="subtitle2"
                                    color={
                                        bestStrategy?.name === 'West-East'
                                            ? 'primary'
                                            : 'inherit'
                                    }
                                >
                                    West → East Strategy
                                </Typography>
                                <Typography variant="body2">
                                    Server execution:{' '}
                                    {formatTime(data.bitonicWE.executionTimeMs)}
                                </Typography>
                                <Typography variant="body2">
                                    Total time:{' '}
                                    {formatTime(data.bitonicWE.clientTotalTime)}
                                </Typography>
                                <Typography variant="body2">
                                    Memory used: {data.bitonicWE.memoryUsageMB}{' '}
                                    MB
                                </Typography>

                                {data.bitonicWE.routeDistance && (
                                    <>
                                        <Divider sx={{ my: 0.5 }} />
                                        <Typography variant="body2">
                                            Total distance:{' '}
                                            {formatDistance(
                                                data.bitonicWE.routeDistance,
                                            )}
                                        </Typography>
                                        <Typography variant="body2">
                                            Travel time:{' '}
                                            {formatDuration(
                                                data.bitonicWE.routeDuration,
                                            )}
                                        </Typography>
                                        <Typography variant="body2">
                                            Visit time:{' '}
                                            {formatDuration(
                                                data.bitonicWE.routeVisitTime,
                                            )}
                                        </Typography>
                                        <Typography variant="body2">
                                            Route total time:{' '}
                                            {formatDuration(
                                                data.bitonicWE.routeTotalTime,
                                            )}
                                        </Typography>
                                    </>
                                )}
                            </Box>
                        )}

                        {data.bitonicEW && (
                            <Box mb={1}>
                                <Typography
                                    variant="subtitle2"
                                    color={
                                        bestStrategy?.name === 'East-West'
                                            ? 'primary'
                                            : 'inherit'
                                    }
                                >
                                    East → West Strategy
                                </Typography>
                                <Typography variant="body2">
                                    Server execution:{' '}
                                    {formatTime(data.bitonicEW.executionTimeMs)}
                                </Typography>
                                <Typography variant="body2">
                                    Total time:{' '}
                                    {formatTime(data.bitonicEW.clientTotalTime)}
                                </Typography>
                                <Typography variant="body2">
                                    Memory used: {data.bitonicEW.memoryUsageMB}{' '}
                                    MB
                                </Typography>

                                {data.bitonicEW.routeDistance && (
                                    <>
                                        <Divider sx={{ my: 0.5 }} />
                                        <Typography variant="body2">
                                            Total distance:{' '}
                                            {formatDistance(
                                                data.bitonicEW.routeDistance,
                                            )}
                                        </Typography>
                                        <Typography variant="body2">
                                            Travel time:{' '}
                                            {formatDuration(
                                                data.bitonicEW.routeDuration,
                                            )}
                                        </Typography>
                                        <Typography variant="body2">
                                            Visit time:{' '}
                                            {formatDuration(
                                                data.bitonicEW.routeVisitTime,
                                            )}
                                        </Typography>
                                        <Typography variant="body2">
                                            Route total time:{' '}
                                            {formatDuration(
                                                data.bitonicEW.routeTotalTime,
                                            )}
                                        </Typography>
                                    </>
                                )}
                            </Box>
                        )}

                        {data.bitonicSN && (
                            <Box mb={1}>
                                <Typography
                                    variant="subtitle2"
                                    color={
                                        bestStrategy?.name === 'South-North'
                                            ? 'primary'
                                            : 'inherit'
                                    }
                                >
                                    South → North Strategy
                                </Typography>
                                <Typography variant="body2">
                                    Server execution:{' '}
                                    {formatTime(data.bitonicSN.executionTimeMs)}
                                </Typography>
                                <Typography variant="body2">
                                    Total time:{' '}
                                    {formatTime(data.bitonicSN.clientTotalTime)}
                                </Typography>
                                <Typography variant="body2">
                                    Memory used: {data.bitonicSN.memoryUsageMB}{' '}
                                    MB
                                </Typography>

                                {data.bitonicSN.routeDistance && (
                                    <>
                                        <Divider sx={{ my: 0.5 }} />
                                        <Typography variant="body2">
                                            Total distance:{' '}
                                            {formatDistance(
                                                data.bitonicSN.routeDistance,
                                            )}
                                        </Typography>
                                        <Typography variant="body2">
                                            Travel time:{' '}
                                            {formatDuration(
                                                data.bitonicSN.routeDuration,
                                            )}
                                        </Typography>
                                        <Typography variant="body2">
                                            Visit time:{' '}
                                            {formatDuration(
                                                data.bitonicSN.routeVisitTime,
                                            )}
                                        </Typography>
                                        <Typography variant="body2">
                                            Route total time:{' '}
                                            {formatDuration(
                                                data.bitonicSN.routeTotalTime,
                                            )}
                                        </Typography>
                                    </>
                                )}
                            </Box>
                        )}

                        {data.bitonicNS && (
                            <Box mb={1}>
                                <Typography
                                    variant="subtitle2"
                                    color={
                                        bestStrategy?.name === 'North-South'
                                            ? 'primary'
                                            : 'inherit'
                                    }
                                >
                                    North → South Strategy
                                </Typography>
                                <Typography variant="body2">
                                    Server execution:{' '}
                                    {formatTime(data.bitonicNS.executionTimeMs)}
                                </Typography>
                                <Typography variant="body2">
                                    Total time:{' '}
                                    {formatTime(data.bitonicNS.clientTotalTime)}
                                </Typography>
                                <Typography variant="body2">
                                    Memory used: {data.bitonicNS.memoryUsageMB}{' '}
                                    MB
                                </Typography>

                                {data.bitonicNS.routeDistance && (
                                    <>
                                        <Divider sx={{ my: 0.5 }} />
                                        <Typography variant="body2">
                                            Total distance:{' '}
                                            {formatDistance(
                                                data.bitonicNS.routeDistance,
                                            )}
                                        </Typography>
                                        <Typography variant="body2">
                                            Travel time:{' '}
                                            {formatDuration(
                                                data.bitonicNS.routeDuration,
                                            )}
                                        </Typography>
                                        <Typography variant="body2">
                                            Visit time:{' '}
                                            {formatDuration(
                                                data.bitonicNS.routeVisitTime,
                                            )}
                                        </Typography>
                                        <Typography variant="body2">
                                            Route total time:{' '}
                                            {formatDuration(
                                                data.bitonicNS.routeTotalTime,
                                            )}
                                        </Typography>
                                    </>
                                )}
                            </Box>
                        )}

                        {data.bitonicCW && (
                            <Box mb={1}>
                                <Typography
                                    variant="subtitle2"
                                    color={
                                        bestStrategy?.name === 'Clockwise'
                                            ? 'primary'
                                            : 'inherit'
                                    }
                                >
                                    Clockwise Strategy
                                </Typography>
                                <Typography variant="body2">
                                    Server execution:{' '}
                                    {formatTime(data.bitonicCW.executionTimeMs)}
                                </Typography>
                                <Typography variant="body2">
                                    Total time:{' '}
                                    {formatTime(data.bitonicCW.clientTotalTime)}
                                </Typography>
                                <Typography variant="body2">
                                    Memory used: {data.bitonicCW.memoryUsageMB}{' '}
                                    MB
                                </Typography>

                                {data.bitonicCW.routeDistance && (
                                    <>
                                        <Divider sx={{ my: 0.5 }} />
                                        <Typography variant="body2">
                                            Total distance:{' '}
                                            {formatDistance(
                                                data.bitonicCW.routeDistance,
                                            )}
                                        </Typography>
                                        <Typography variant="body2">
                                            Travel time:{' '}
                                            {formatDuration(
                                                data.bitonicCW.routeDuration,
                                            )}
                                        </Typography>
                                        <Typography variant="body2">
                                            Visit time:{' '}
                                            {formatDuration(
                                                data.bitonicCW.routeVisitTime,
                                            )}
                                        </Typography>
                                        <Typography variant="body2">
                                            Route total time:{' '}
                                            {formatDuration(
                                                data.bitonicCW.routeTotalTime,
                                            )}
                                        </Typography>
                                    </>
                                )}
                            </Box>
                        )}

                        {data.bitonicCCW && (
                            <Box mb={1}>
                                <Typography
                                    variant="subtitle2"
                                    color={
                                        bestStrategy?.name ===
                                        'Counter-Clockwise'
                                            ? 'primary'
                                            : 'inherit'
                                    }
                                >
                                    Counter-Clockwise Strategy
                                </Typography>
                                <Typography variant="body2">
                                    Server execution:{' '}
                                    {formatTime(
                                        data.bitonicCCW.executionTimeMs,
                                    )}
                                </Typography>
                                <Typography variant="body2">
                                    Total time:{' '}
                                    {formatTime(
                                        data.bitonicCCW.clientTotalTime,
                                    )}
                                </Typography>
                                <Typography variant="body2">
                                    Memory used: {data.bitonicCCW.memoryUsageMB}{' '}
                                    MB
                                </Typography>

                                {data.bitonicCCW.routeDistance && (
                                    <>
                                        <Divider sx={{ my: 0.5 }} />
                                        <Typography variant="body2">
                                            Total distance:{' '}
                                            {formatDistance(
                                                data.bitonicCCW.routeDistance,
                                            )}
                                        </Typography>
                                        <Typography variant="body2">
                                            Travel time:{' '}
                                            {formatDuration(
                                                data.bitonicCCW.routeDuration,
                                            )}
                                        </Typography>
                                        <Typography variant="body2">
                                            Visit time:{' '}
                                            {formatDuration(
                                                data.bitonicCCW.routeVisitTime,
                                            )}
                                        </Typography>
                                        <Typography variant="body2">
                                            Route total time:{' '}
                                            {formatDuration(
                                                data.bitonicCCW.routeTotalTime,
                                            )}
                                        </Typography>
                                    </>
                                )}
                            </Box>
                        )}

                        {data.bitonicIO && (
                            <Box mb={1}>
                                <Typography
                                    variant="subtitle2"
                                    color={
                                        bestStrategy?.name === 'Inside-Out'
                                            ? 'primary'
                                            : 'inherit'
                                    }
                                >
                                    Inside-Out Strategy
                                </Typography>
                                <Typography variant="body2">
                                    Server execution:{' '}
                                    {formatTime(data.bitonicIO.executionTimeMs)}
                                </Typography>
                                <Typography variant="body2">
                                    Total time:{' '}
                                    {formatTime(data.bitonicIO.clientTotalTime)}
                                </Typography>
                                <Typography variant="body2">
                                    Memory used: {data.bitonicIO.memoryUsageMB}{' '}
                                    MB
                                </Typography>

                                {data.bitonicIO.routeDistance && (
                                    <>
                                        <Divider sx={{ my: 0.5 }} />
                                        <Typography variant="body2">
                                            Total distance:{' '}
                                            {formatDistance(
                                                data.bitonicIO.routeDistance,
                                            )}
                                        </Typography>
                                        <Typography variant="body2">
                                            Travel time:{' '}
                                            {formatDuration(
                                                data.bitonicIO.routeDuration,
                                            )}
                                        </Typography>
                                        <Typography variant="body2">
                                            Visit time:{' '}
                                            {formatDuration(
                                                data.bitonicIO.routeVisitTime,
                                            )}
                                        </Typography>
                                        <Typography variant="body2">
                                            Route total time:{' '}
                                            {formatDuration(
                                                data.bitonicIO.routeTotalTime,
                                            )}
                                        </Typography>
                                    </>
                                )}
                            </Box>
                        )}

                        {data.bitonicOI && (
                            <Box mb={1}>
                                <Typography
                                    variant="subtitle2"
                                    color={
                                        bestStrategy?.name === 'Outside-In'
                                            ? 'primary'
                                            : 'inherit'
                                    }
                                >
                                    Outside-In Strategy
                                </Typography>
                                <Typography variant="body2">
                                    Server execution:{' '}
                                    {formatTime(data.bitonicOI.executionTimeMs)}
                                </Typography>
                                <Typography variant="body2">
                                    Total time:{' '}
                                    {formatTime(data.bitonicOI.clientTotalTime)}
                                </Typography>
                                <Typography variant="body2">
                                    Memory used: {data.bitonicOI.memoryUsageMB}{' '}
                                    MB
                                </Typography>

                                {data.bitonicOI.routeDistance && (
                                    <>
                                        <Divider sx={{ my: 0.5 }} />
                                        <Typography variant="body2">
                                            Total distance:{' '}
                                            {formatDistance(
                                                data.bitonicOI.routeDistance,
                                            )}
                                        </Typography>
                                        <Typography variant="body2">
                                            Travel time:{' '}
                                            {formatDuration(
                                                data.bitonicOI.routeDuration,
                                            )}
                                        </Typography>
                                        <Typography variant="body2">
                                            Visit time:{' '}
                                            {formatDuration(
                                                data.bitonicOI.routeVisitTime,
                                            )}
                                        </Typography>
                                        <Typography variant="body2">
                                            Route total time:{' '}
                                            {formatDuration(
                                                data.bitonicOI.routeTotalTime,
                                            )}
                                        </Typography>
                                    </>
                                )}
                            </Box>
                        )}

                        {data.backtracking && bestStrategy?.data && (
                            <Box mt={2}>
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="subtitle2">
                                    Comparison with Backtracking:
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color={
                                        data.backtracking.executionTimeMs <
                                        bestStrategy.data.executionTimeMs
                                            ? 'success.main'
                                            : 'error.main'
                                    }
                                >
                                    Backtracking is{' '}
                                    {Math.abs(
                                        1 -
                                            data.backtracking.executionTimeMs /
                                                bestStrategy.data
                                                    .executionTimeMs,
                                    ).toFixed(2)}
                                    x
                                    {data.backtracking.executionTimeMs <
                                    bestStrategy.data.executionTimeMs
                                        ? ' faster'
                                        : ' slower'}
                                </Typography>

                                {data?.backtracking?.totalTime &&
                                    bestStrategy.data.routeDistance && (
                                        <Typography
                                            variant="body2"
                                            color={
                                                (data?.backtracking
                                                    ?.routeDistance ?? 0) <
                                                bestStrategy.data.routeDistance
                                                    ? 'success.main'
                                                    : 'error.main'
                                            }
                                        >
                                            Backtracking route is{' '}
                                            {Math.abs(
                                                1 -
                                                    (data?.backtracking
                                                        ?.routeDistance ?? 0) /
                                                        bestStrategy.data
                                                            .routeDistance,
                                            ).toFixed(2)}
                                            x
                                            {data?.backtracking?.totalTime <
                                            bestStrategy.data.routeDistance
                                                ? ' shorter'
                                                : ' longer'}
                                        </Typography>
                                    )}

                                {data.backtracking.routeTotalTime &&
                                    bestStrategy.data.routeTotalTime && (
                                        <Typography
                                            variant="body2"
                                            color={
                                                data.backtracking
                                                    .routeTotalTime <
                                                bestStrategy.data.routeTotalTime
                                                    ? 'success.main'
                                                    : 'error.main'
                                            }
                                        >
                                            Backtracking route takes{' '}
                                            {Math.abs(
                                                1 -
                                                    data.backtracking
                                                        .routeTotalTime /
                                                        bestStrategy.data
                                                            .routeTotalTime,
                                            ).toFixed(2)}
                                            x
                                            {data.backtracking.routeTotalTime <
                                            bestStrategy.data.routeTotalTime
                                                ? ' less'
                                                : ' more'}{' '}
                                            time
                                        </Typography>
                                    )}
                            </Box>
                        )}
                    </AccordionDetails>
                </Accordion>
            )}
        </Paper>
    );
};

export default PerformanceMetrics;
