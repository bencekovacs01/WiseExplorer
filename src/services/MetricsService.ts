export interface AlgorithmMetrics {
    algorithmName: string;
    variant?: string;
    nodeCount: number;
    executionTimeMs: number;
    memoryUsageMB?: number;
    routeDistance?: number;
    routeDuration?: number;
    routeVisitTime?: number;
    routeTotalTime?: number;
    iterations?: number;
    optimality?: number;
    timestamp: number;
}

class MetricsService {
    private metrics: AlgorithmMetrics[] = [];

    recordMetric(metric: AlgorithmMetrics): void {
        this.metrics.push({
            ...metric,
            timestamp: Date.now(),
        });
    }

    getAllMetrics(): AlgorithmMetrics[] {
        return [...this.metrics];
    }

    getMetricsByAlgorithm(algorithmName: string): AlgorithmMetrics[] {
        return this.metrics.filter((m) => m.algorithmName === algorithmName);
    }

    getMetricsByNodeCount(nodeCount: number): AlgorithmMetrics[] {
        return this.metrics.filter((m) => m.nodeCount === nodeCount);
    }

    getComparisonMetrics(
        nodeCount: number,
        algorithms: string[],
    ): AlgorithmMetrics[] {
        return this.metrics.filter(
            (m) =>
                m.nodeCount === nodeCount &&
                algorithms.includes(m.algorithmName),
        );
    }

    getBitonicVariantMetrics(nodeCount: number): AlgorithmMetrics[] {
        return this.metrics.filter(
            (m) => m.algorithmName === 'Bitonic' && m.nodeCount === nodeCount,
        );
    }

    // Clear all metrics
    clearMetrics(): void {
        this.metrics = [];
    }

    // Remove duplicate metrics - keep only the latest entry for each algorithm/variant/nodeCount combination
    deduplicateMetrics(): void {
        const metricsMap = new Map<string, AlgorithmMetrics>();

        this.metrics.forEach((metric) => {
            const key = `${metric.algorithmName}_${
                metric.variant || 'default'
            }_${metric.nodeCount}`;
            const existingMetric = metricsMap.get(key);

            // Keep the metric with the latest timestamp
            if (!existingMetric || metric.timestamp > existingMetric.timestamp) {
                metricsMap.set(key, metric);
            }
        });

        this.metrics = Array.from(metricsMap.values());
    }

    exportToCSV(): string {
        if (this.metrics.length === 0) {
            return 'No metrics available for export';
        }

        const headers = [
            'Algorithm',
            'Variant',
            'Node Count',
            'Execution Time (ms)',
            'Memory Usage (MB)',
            'Route Distance',
            'Route Duration',
            'Route Visit Time',
            'Route Total Time',
            'Iterations',
            'Optimality',
            'Timestamp',
        ];

        const csvRows = [
            headers.join(','),
            ...this.metrics.map((metric) =>
                [
                    metric.algorithmName,
                    metric.variant || '',
                    metric.nodeCount,
                    metric.executionTimeMs,
                    metric.memoryUsageMB || '',
                    metric.routeDistance || '',
                    metric.routeDuration || '',
                    metric.routeVisitTime || '',
                    metric.routeTotalTime || '',
                    metric.iterations || '',
                    metric.optimality || '',
                    new Date(metric.timestamp).toISOString(),
                ].join(','),
            ),
        ];

        return csvRows.join('\n');
    }

    getSummaryStats(): {
        totalTests: number;
        algorithmCounts: Record<string, number>;
        avgExecutionTimeByAlgorithm: Record<string, number>;
    } {
        const totalTests = this.metrics.length;
        const algorithmCounts: Record<string, number> = {};
        const executionTimeSums: Record<string, number> = {};

        this.metrics.forEach((metric) => {
            const key = metric.variant
                ? `${metric.algorithmName}_${metric.variant}`
                : metric.algorithmName;

            algorithmCounts[key] = (algorithmCounts[key] || 0) + 1;
            executionTimeSums[key] =
                (executionTimeSums[key] || 0) + metric.executionTimeMs;
        });

        const avgExecutionTimeByAlgorithm: Record<string, number> = {};
        Object.keys(algorithmCounts).forEach((key) => {
            avgExecutionTimeByAlgorithm[key] =
                executionTimeSums[key] / algorithmCounts[key];
        });

        return {
            totalTests,
            algorithmCounts,
            avgExecutionTimeByAlgorithm,
        };
    }
}

export const metricsService = new MetricsService();
