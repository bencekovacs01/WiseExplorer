import { performance } from 'perf_hooks';
import v8 from 'v8';

export interface PerformanceMetrics {
  executionTimeMs: number;
  memoryUsageMB: number;
  algorithm: string;
  pointCount: number;
  timestamp: string;
  clientTotalTime: number;
  strategy?: string;
}

export async function measurePerformance<T>(
  fn: () => Promise<T>,
  algorithm: string,
  pointCount: number
): Promise<{ result: T; metrics: PerformanceMetrics }> {
  if (global.gc) {
    global.gc();
  }
  
  const memBefore = process.memoryUsage();
  const heapBefore = v8.getHeapStatistics();
  
  const startTime = performance.now();
  
  const result = await fn();
  
  const endTime = performance.now();
  const executionTimeMs = endTime - startTime;
  
  const memAfter = process.memoryUsage();
  const heapAfter = v8.getHeapStatistics();
  
  const memoryUsageMB = Math.round(
    (memAfter.heapUsed - memBefore.heapUsed) / (1024 * 1024) * 100
  ) / 100;
  
  return {
    result,
    metrics: {
      executionTimeMs,
      memoryUsageMB,
      algorithm,
      pointCount,
      timestamp: new Date().toISOString(),
      clientTotalTime: 0
    }
  };
}