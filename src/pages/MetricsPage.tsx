'use client';

import React, { useState } from 'react';
import { MetricsDisplay } from '../components/Metrics/MetricsDisplay';
import { BitonicService, SortStrategy } from '../services/BitonicService';
import Coordinate from '../models/Coordinate';
import { metricsService } from '../services/MetricsService';
import {
    Box,
    Button,
    Typography,
    LinearProgress,
    Paper,
    Divider,
} from '@mui/material';
import poiData100 from '../components/Selector/poiData100.json';

const MetricsPage: React.FC = () => {
    const [isRunningTests, setIsRunningTests] = useState(false);
    const [progress, setProgress] = useState(0);
    const [testResults, setTestResults] = useState<string>('');

    const runPerformanceTests = async () => {
        setIsRunningTests(true);
        setProgress(0);
        setTestResults(
            'Starting performance tests using real POI data from poiData100.json...\n',
        );

        const bitonicNodeCounts = [15, 30, 90];
        const branchAndBoundNodeCounts = [15];
        const dynamicProgrammingNodeCounts = [15, 30];
        const acoNodeCounts = [15, 30, 90];
        const greedyNodeCounts = [15, 30, 90];
        const backtrackingNodeCounts: number[] = [];
        const ptasNodeCounts = [15, 30, 90]; // Add PTAS testing

        const strategies = Object.values(SortStrategy);

        const getCoordinatesFromPOI = (count: number): Coordinate[] => {
            const actualCount = Math.min(count, poiData100.pois.length);
            const pois = poiData100.pois.slice(0, actualCount);
            return pois.map((poi) => ({
                latitude: poi.latitude,
                longitude: poi.longitude,
            }));
        };

        const getMetadataFromPOI = (count: number): any => {
            const actualCount = Math.min(count, poiData100.poiMetadata.length);
            const poiMetadata = poiData100.poiMetadata.slice(0, actualCount);
            return poiMetadata;
        };

        const processBitonicBatch = async (nodeCount: number) => {
            try {
                const coords = getCoordinatesFromPOI(nodeCount);
                const metadata = getMetadataFromPOI(nodeCount);
                const bitonicService = new BitonicService();

                let batchOutput = `\nTesting Bitonic variants with ${nodeCount} POI nodes from real data...\n`;

                for (let i = 0; i < strategies.length; i++) {
                    const strategy = strategies[i];
                    try {
                        batchOutput += `  Testing ${strategy}... `;
                        await bitonicService.findBitonicRoute(
                            coords,
                            metadata,
                            100,
                            strategy as SortStrategy,
                        );
                        batchOutput += `Success\n`;
                    } catch (error) {
                        batchOutput += `Failed: ${error}\n`;
                    }

                    if (i < strategies.length - 1) {
                        await new Promise((resolve) => setTimeout(resolve, 50));
                    }
                }

                return batchOutput;
            } catch (error) {
                return `\nError in test batch for ${nodeCount} nodes: ${error}\n`;
            }
        };

        const processOtherAlgorithmsBatch = async (
            nodeCount: number,
            algorithmType: string,
        ) => {
            try {
                const coords = getCoordinatesFromPOI(nodeCount);
                const metadata = getMetadataFromPOI(nodeCount);

                let batchOutput = `\nTesting ${algorithmType} with ${nodeCount} POI nodes from real data...\n`;

                try {
                    if (algorithmType === 'Backtracking') {
                        const { BacktrackingService } = await import(
                            '../services/BacktrackingService'
                        );
                        const backtrackingService = new BacktrackingService();
                        batchOutput += `  Testing Backtracking... `;
                        await backtrackingService.findMinimumRouteBt(
                            coords,
                            metadata,
                        );
                        batchOutput += `Success\n`;
                    } else if (algorithmType === 'BranchAndBound') {
                        const BranchAndBoundService = (
                            await import('../services/BranchAndBoundService')
                        ).default;
                        const branchAndBoundService =
                            new BranchAndBoundService();
                        batchOutput += `  Testing Branch and Bound... `;
                        await branchAndBoundService.findMinimumDistanceRoute(
                            coords,
                            metadata,
                        );
                        batchOutput += `Success\n`;
                    } else if (algorithmType === 'DynamicProgramming') {
                        const { DynamicProgrammingService } = await import(
                            '../services/DynamicProgrammingService'
                        );
                        const dynamicProgrammingService =
                            new DynamicProgrammingService();
                        batchOutput += `  Testing Dynamic Programming... `;
                        await dynamicProgrammingService.findMinimumTimeRoute(
                            coords,
                            metadata,
                        );
                        batchOutput += `Success\n`;
                    } else if (algorithmType === 'ACO') {
                        const AcoService = (
                            await import('../services/AcoService')
                        ).default;
                        const acoService = new AcoService();
                        batchOutput += `  Testing ACO... `;
                        await acoService.findOptimalRoute(coords, metadata);
                        batchOutput += `Success\n`;
                    } else if (algorithmType === 'Greedy') {
                        const GreedyService = (
                            await import('../services/GreedyService')
                        ).default;
                        const greedyService = new GreedyService();
                        batchOutput += `  Testing Greedy... `;
                        await greedyService.findMinimumDistanceRoute(
                            coords,
                            metadata,
                        );
                        batchOutput += `Success\n`;
                    } else if (algorithmType === 'AroraPTAS') {
                        const { AroraPTASService } = await import(
                            '../services/AroraPTASService'
                        );
                        const ptasService = new AroraPTASService(0.2); // ε = 0.2
                        batchOutput += `  Testing Arora PTAS (ε=0.2)... `;
                        await ptasService.findOptimalRoute(coords, metadata);
                        batchOutput += `Success\n`;
                    }
                } catch (error) {
                    batchOutput += `Failed: ${error}\n`;
                }

                return batchOutput;
            } catch (error) {
                return `\nError in test batch for ${algorithmType} with ${nodeCount} nodes: ${error}\n`;
            }
        };

        try {
            metricsService.clearMetrics();

            const strategiesCount = Object.values(SortStrategy).length;
            const totalBitonicTests = bitonicNodeCounts.reduce(
                (sum, nodeCount) => sum + strategiesCount,
                0,
            );
            const totalTests =
                totalBitonicTests +
                branchAndBoundNodeCounts.length +
                dynamicProgrammingNodeCounts.length +
                acoNodeCounts.length +
                greedyNodeCounts.length +
                backtrackingNodeCounts.length +
                ptasNodeCounts.length; // Add PTAS to total count
            let testsCompleted = 0;

            setTestResults(
                (prev) =>
                    prev +
                    '\nRunning tests for these specific comparison groups using real POI data:\n' +
                    '- Branch-and-Bound, Dynamic Programming, ACO, Greedy, Arora PTAS, and Bitonic at 15 nodes\n' +
                    '- Dynamic Programming, ACO, Greedy, Arora PTAS, and Bitonic at 30 nodes\n' +
                    '- ACO, Greedy, Arora PTAS, and Bitonic variations at 90 nodes\n',
            );

            for (let i = 0; i < bitonicNodeCounts.length; i++) {
                const batchResults = await processBitonicBatch(
                    bitonicNodeCounts[i],
                );
                setTestResults((prev) => prev + batchResults);

                testsCompleted += strategiesCount;
                const currentProgress = Math.min(
                    98,
                    Math.round((testsCompleted / totalTests) * 100),
                );
                setProgress(currentProgress);

                await new Promise((resolve) => setTimeout(resolve, 200));
            }

            for (let i = 0; i < branchAndBoundNodeCounts.length; i++) {
                const batchResults = await processOtherAlgorithmsBatch(
                    branchAndBoundNodeCounts[i],
                    'BranchAndBound',
                );
                setTestResults((prev) => prev + batchResults);

                testsCompleted++;
                const currentProgress = Math.min(
                    98,
                    Math.round((testsCompleted / totalTests) * 100),
                );
                setProgress(currentProgress);
                await new Promise((resolve) => setTimeout(resolve, 100));
            }

            for (let i = 0; i < dynamicProgrammingNodeCounts.length; i++) {
                const batchResults = await processOtherAlgorithmsBatch(
                    dynamicProgrammingNodeCounts[i],
                    'DynamicProgramming',
                );
                setTestResults((prev) => prev + batchResults);

                testsCompleted++;
                const currentProgress = Math.min(
                    98,
                    Math.round((testsCompleted / totalTests) * 100),
                );
                setProgress(currentProgress);
                await new Promise((resolve) => setTimeout(resolve, 100));
            }

            for (let i = 0; i < acoNodeCounts.length; i++) {
                const batchResults = await processOtherAlgorithmsBatch(
                    acoNodeCounts[i],
                    'ACO',
                );
                setTestResults((prev) => prev + batchResults);

                testsCompleted++;
                const currentProgress = Math.min(
                    98,
                    Math.round((testsCompleted / totalTests) * 100),
                );
                setProgress(currentProgress);
                await new Promise((resolve) => setTimeout(resolve, 100));
            }

            for (let i = 0; i < greedyNodeCounts.length; i++) {
                const batchResults = await processOtherAlgorithmsBatch(
                    greedyNodeCounts[i],
                    'Greedy',
                );
                setTestResults((prev) => prev + batchResults);

                testsCompleted++;
                const currentProgress = Math.min(
                    98,
                    Math.round((testsCompleted / totalTests) * 100),
                );
                setProgress(currentProgress);
                await new Promise((resolve) => setTimeout(resolve, 100));
            }

            for (let i = 0; i < ptasNodeCounts.length; i++) {
                const batchResults = await processOtherAlgorithmsBatch(
                    ptasNodeCounts[i],
                    'AroraPTAS',
                );
                setTestResults((prev) => prev + batchResults);

                testsCompleted++;
                const currentProgress = Math.min(
                    98,
                    Math.round((testsCompleted / totalTests) * 100),
                );
                setProgress(currentProgress);
                await new Promise((resolve) => setTimeout(resolve, 100));
            }

            for (let i = 0; i < backtrackingNodeCounts.length; i++) {
                const batchResults = await processOtherAlgorithmsBatch(
                    backtrackingNodeCounts[i],
                    'Backtracking',
                );
                setTestResults((prev) => prev + batchResults);

                testsCompleted++;
                const currentProgress = Math.min(
                    98,
                    Math.round((testsCompleted / totalTests) * 100),
                );
                setProgress(currentProgress);
                await new Promise((resolve) => setTimeout(resolve, 100));
            }

            setTestResults(
                (prev) =>
                    prev +
                    '\nTests completed! Check the metrics tables for results.',
            );
            setProgress(100);
        } catch (error) {
            setTestResults((prev) => prev + `\nError running tests: ${error}`);
        } finally {
            setIsRunningTests(false);
        }
    };

    return (
        <Box className="metrics-page" sx={{ p: 3 }}>
            <Typography variant="h3" gutterBottom>
                Algorithm Performance Metrics - Real POI Data
            </Typography>

            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                    Run Performance Tests
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                    This will test algorithm performance using real POI data
                    from poiData100.json with the following groups:
                </Typography>
                <Box component="ul" sx={{ mb: 2 }}>
                    <Typography component="li">
                        15 POIs: Branch-and-Bound, Dynamic Programming, ACO,
                        Greedy, Arora PTAS, and Bitonic
                    </Typography>
                    <Typography component="li">
                        30 POIs: Dynamic Programming, ACO, Greedy, Arora PTAS, and Bitonic
                    </Typography>
                    <Typography component="li">
                        90 POIs: ACO, Greedy, Arora PTAS, and All Bitonic variants
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    color="primary"
                    onClick={runPerformanceTests}
                    disabled={isRunningTests}
                    sx={{ mb: 2 }}
                >
                    Run Performance Tests on Real POI Data
                </Button>

                {isRunningTests && (
                    <Box sx={{ width: '100%', mt: 2 }}>
                        <LinearProgress
                            variant="determinate"
                            value={progress}
                        />
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            align="center"
                        >
                            {`${Math.round(progress)}%`}
                        </Typography>
                    </Box>
                )}

                {testResults && (
                    <Box
                        className="test-results"
                        sx={{
                            mt: 2,
                            p: 2,
                            bgcolor: '#f5f5f5',
                            borderRadius: 1,
                        }}
                    >
                        <Typography variant="h6">Test Results:</Typography>
                        <Box
                            component="pre"
                            sx={{
                                whiteSpace: 'pre-wrap',
                                fontFamily: 'monospace',
                            }}
                        >
                            {testResults}
                        </Box>
                    </Box>
                )}
            </Paper>

            <Divider sx={{ my: 4 }} />

            <MetricsDisplay />
        </Box>
    );
};

export default MetricsPage;
