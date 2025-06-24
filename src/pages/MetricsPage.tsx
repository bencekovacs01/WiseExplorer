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

    // Function to run automated tests of different algorithms
    const runPerformanceTests = async () => {
        // Initialize
        setIsRunningTests(true);
        setProgress(0);
        setTestResults(
            'Starting performance tests using real POI data from poiData100.json...\n',
        );

        // Define test parameters for the specific group comparisons:
        // Group 1: Branch-and-Bound, Dynamic Programming, and Bitonic at 15 nodes
        // Group 2: Dynamic Programming and Bitonic at 30 nodes
        // Group 3: Bitonic variations at 90 nodes

        // Bitonic node counts - test at 15, 30, and 90 nodes
        const bitonicNodeCounts = [15, 30, 90];

        // Branch and Bound - only test at 15 nodes
        const branchAndBoundNodeCounts = [15];

        // Dynamic Programming - test at 15 and 30 nodes
        const dynamicProgrammingNodeCounts = [15, 30];

        // Backtracking - not needed for comparisons
        const backtrackingNodeCounts: number[] = [];

        const strategies = Object.values(SortStrategy);

        // Function to get coordinates from POI data
        const getCoordinatesFromPOI = (count: number): Coordinate[] => {
            // Make sure we don't try to get more POIs than are available
            const actualCount = Math.min(count, poiData100.pois.length);

            // Get a slice of the POI data based on the requested count
            const pois = poiData100.pois.slice(0, actualCount);

            // Map the POIs to Coordinate objects
            return pois.map((poi) => ({
                latitude: poi.latitude,
                longitude: poi.longitude,
            }));
        };

        const getMetadataFromPOI = (count: number): any => {
            // Make sure we don't try to get more POIs than are available
            const actualCount = Math.min(count, poiData100.poiMetadata.length);

            // Get a slice of the POI data based on the requested count
            const poiMetadata = poiData100.poiMetadata.slice(0, actualCount);
            console.log('poiMetadata', poiMetadata);

            return poiMetadata;

            // Map the POIs to Coordinate objects
            // return pois.map((poi) => ({
            //     latitude: poi.latitude,
            //     longitude: poi.longitude,
            // }));
        };

        // Batch updating function to prevent state update cascades
        const processBitonicBatch = async (nodeCount: number) => {
            try {
                // Get coordinates from POI data once per node count
                const coords = getCoordinatesFromPOI(nodeCount);
                const metadata = getMetadataFromPOI(nodeCount);
                const bitonicService = new BitonicService();

                // Process each strategy
                let batchOutput = `\nTesting Bitonic variants with ${nodeCount} POI nodes from real data...\n`;

                // Process strategies individually to avoid freezing
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

                    // Brief pause after each strategy
                    if (i < strategies.length - 1) {
                        await new Promise((resolve) => setTimeout(resolve, 50));
                    }
                }

                // Return the results for this node count
                return batchOutput;
            } catch (error) {
                return `\nError in test batch for ${nodeCount} nodes: ${error}\n`;
            }
        };

        // Batch function for other algorithms
        const processOtherAlgorithmsBatch = async (
            nodeCount: number,
            algorithmType: string,
        ) => {
            try {
                // Get coordinates from POI data once per node count
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
            // Clear previous metrics once at the beginning
            metricsService.clearMetrics();

            // Calculate total test count for progress tracking
            const strategiesCount = Object.values(SortStrategy).length;
            const totalBitonicTests = bitonicNodeCounts.reduce(
                (sum, nodeCount) => sum + strategiesCount,
                0,
            );
            const totalTests =
                totalBitonicTests +
                branchAndBoundNodeCounts.length +
                dynamicProgrammingNodeCounts.length +
                backtrackingNodeCounts.length;
            let testsCompleted = 0;

            setTestResults(
                (prev) =>
                    prev +
                    '\nRunning tests for these specific comparison groups using real POI data:\n' +
                    '- Branch-and-Bound, Dynamic Programming, and Bitonic at 15 nodes\n' +
                    '- Dynamic Programming and Bitonic at 30 nodes\n' +
                    '- Bitonic variations at 90 nodes\n',
            );

            // Process Bitonic tests
            for (let i = 0; i < bitonicNodeCounts.length; i++) {
                // Process this batch and append its results
                const batchResults = await processBitonicBatch(
                    bitonicNodeCounts[i],
                );
                setTestResults((prev) => prev + batchResults);

                // Update progress - count all strategies for this node count as completed
                testsCompleted += strategiesCount;
                const currentProgress = Math.min(
                    98,
                    Math.round((testsCompleted / totalTests) * 100),
                );
                setProgress(currentProgress);

                // Small delay to let React update the UI
                await new Promise((resolve) => setTimeout(resolve, 200));
            }

            // Process Branch and Bound tests with small node counts
            for (let i = 0; i < branchAndBoundNodeCounts.length; i++) {
                const batchResults = await processOtherAlgorithmsBatch(
                    branchAndBoundNodeCounts[i],
                    'BranchAndBound',
                );
                setTestResults((prev) => prev + batchResults);

                // Update progress and ensure it doesn't exceed 100%
                testsCompleted++;
                const currentProgress = Math.min(
                    98,
                    Math.round((testsCompleted / totalTests) * 100),
                );
                setProgress(currentProgress);
                await new Promise((resolve) => setTimeout(resolve, 100));
            }

            // Process Dynamic Programming tests
            for (let i = 0; i < dynamicProgrammingNodeCounts.length; i++) {
                const batchResults = await processOtherAlgorithmsBatch(
                    dynamicProgrammingNodeCounts[i],
                    'DynamicProgramming',
                );
                setTestResults((prev) => prev + batchResults);

                // Update progress and ensure it doesn't exceed 100%
                testsCompleted++;
                const currentProgress = Math.min(
                    98,
                    Math.round((testsCompleted / totalTests) * 100),
                );
                setProgress(currentProgress);
                await new Promise((resolve) => setTimeout(resolve, 100));
            }

            // Process Backtracking tests
            for (let i = 0; i < backtrackingNodeCounts.length; i++) {
                const batchResults = await processOtherAlgorithmsBatch(
                    backtrackingNodeCounts[i],
                    'Backtracking',
                );
                setTestResults((prev) => prev + batchResults);

                // Update progress and ensure it doesn't exceed 100%
                testsCompleted++;
                const currentProgress = Math.min(
                    98,
                    Math.round((testsCompleted / totalTests) * 100),
                );
                setProgress(currentProgress);
                await new Promise((resolve) => setTimeout(resolve, 100));
            }

            // Final update
            setTestResults(
                (prev) =>
                    prev +
                    '\nTests completed! Check the metrics tables for results.',
            );
            setProgress(100); // Ensure progress bar shows completion
        } catch (error) {
            // Handle any overall errors
            setTestResults((prev) => prev + `\nError running tests: ${error}`);
        } finally {
            // Always mark as completed
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
                        15 POIs: Branch-and-Bound, Dynamic Programming, and
                        Bitonic
                    </Typography>
                    <Typography component="li">
                        30 POIs: Dynamic Programming and Bitonic
                    </Typography>
                    <Typography component="li">
                        90 POIs: All Bitonic variants
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

            <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
                <Typography variant="h5" gutterBottom>
                    Specific Group Comparisons Using Real POI Data
                </Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                    <Typography component="li">
                        <strong>Group 1 (15 POIs):</strong> Comparing
                        Branch-and-Bound, Dynamic Programming, and Bitonic at 15
                        real-world POIs demonstrates the trade-offs between
                        optimality and performance in real scenarios.
                        Branch-and-Bound and Dynamic Programming provide optimal
                        solutions but with significantly longer execution times.
                    </Typography>
                    <Typography component="li">
                        <strong>Group 2 (30 POIs):</strong> At 30 real-world
                        POIs, we compare Dynamic Programming and Bitonic. This
                        shows the practical limits of Dynamic Programming with
                        actual geographical data and highlights how Bitonic
                        maintains reasonable performance even as the POI count
                        increases.
                    </Typography>
                    <Typography component="li">
                        <strong>Group 3 (90 POIs):</strong> Comparing all
                        Bitonic variants at 90 real-world POIs reveals how
                        different sort strategies (W→E, E→W, S→N, N→S, CW, CCW,
                        I→O, O→I) affect route quality and execution times at
                        scale with real geographical data. This demonstrates
                        Bitonic&apos;s excellent scalability for large datasets.
                    </Typography>
                    <Typography component="li">
                        <strong>Overall:</strong> These comparisons using real
                        POI data illustrate why Bitonic approaches are preferred
                        for large-scale routing problems despite producing
                        sub-optimal solutions, while exact algorithms like
                        Branch-and-Bound and Dynamic Programming are limited to
                        smaller problem sizes in real-world applications.
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
};

export default MetricsPage;
