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
                    const routeTime = metric.routeTotalTime || 0;
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
                <Typography variant="body2">{algorithmLabel}</Typography>
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
                    backgroundColor: index === 0 ? '#4caf50' : '#2196f3',
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
                <Typography variant="body2">{algorithmLabel}</Typography>
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
                    backgroundColor: index === 0 ? '#4caf50' : '#ff9800',
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
            maxExecutionTime > 0 ? (executionTime / maxExecutionTime) * 100 : 0;
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
                <Typography variant="body2">{algorithmLabel}</Typography>
                <Typography variant="body2">
                  {executionTime < 1000
                    ? `${executionTime.toFixed(2)} ms`
                    : `${(executionTime / 1000).toFixed(2)} s`}
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
                    backgroundColor: index === 0 ? '#4caf50' : '#9c27b0',
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

  const deduplicatedMetrics = useMemo(() => {
    const metricsMap = new Map<string, AlgorithmMetrics>();

    allMetrics.forEach((metric) => {
      const key = `${metric.algorithmName}_${
        metric.variant || 'default'
      }_${metric.nodeCount}`;
      const existingMetric = metricsMap.get(key);

      if (!existingMetric || metric.timestamp > existingMetric.timestamp) {
        metricsMap.set(key, metric);
      }
    });

    return Array.from(metricsMap.values());
  }, [allMetrics]);

  const algorithmGroups = useMemo(() => {
    const groups = {
      group15: [] as AlgorithmMetrics[],
      group30: [] as AlgorithmMetrics[],
      group90: [] as AlgorithmMetrics[],
    };

        groups.group15 = deduplicatedMetrics.filter(
            (m) =>
                m.nodeCount === 15 &&
                // m.algorithmName === 'BranchAndBound' ||
                (m.algorithmName === 'DynamicProgramming' ||
                    // m.algorithmName === 'Greedy' ||
                    // m.algorithmName === 'ACO' ||
                    m.algorithmName === 'Bitonic' ||
                    m.algorithmName === 'Arora PTAS'),
        );

        groups.group30 = deduplicatedMetrics.filter(
            (m) =>
                m.nodeCount === 30 &&
                (m.algorithmName === 'DynamicProgramming' ||
                    // m.algorithmName === 'Greedy' ||
                    // m.algorithmName === 'ACO' ||
                    m.algorithmName === 'Bitonic' ||
                    m.algorithmName === 'Arora PTAS'),
        );

        groups.group90 = deduplicatedMetrics.filter(
            (m) =>
                m.nodeCount === 90 &&
                // m.algorithmName === 'ACO' ||
                // m.algorithmName === 'Greedy' ||
                (m.algorithmName === 'Bitonic' ||
                    m.algorithmName === 'Arora PTAS'),
        );

    return groups;
  }, [deduplicatedMetrics]);

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

  const exportGroupComparisonToLatex = () => {
    const calculateStatistics = (metrics: AlgorithmMetrics[]) => {
      const executionTimes = metrics
        .map((m) => m.executionTimeMs)
        .filter((t) => t !== undefined) as number[];
      const routeDistances = metrics
        .map((m) => m.routeDistance)
        .filter((d) => d !== undefined) as number[];
      const routeDurations = metrics
        .map((m) => m.routeDuration)
        .filter((d) => d !== undefined) as number[];

      return {
        avgExecution:
          executionTimes.length > 0
            ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
            : 0,
        minExecution:
          executionTimes.length > 0 ? Math.min(...executionTimes) : 0,
        maxExecution:
          executionTimes.length > 0 ? Math.max(...executionTimes) : 0,
        avgDistance:
          routeDistances.length > 0
            ? routeDistances.reduce((a, b) => a + b, 0) / routeDistances.length
            : 0,
        minDistance:
          routeDistances.length > 0 ? Math.min(...routeDistances) : 0,
        maxDistance:
          routeDistances.length > 0 ? Math.max(...routeDistances) : 0,
        avgDuration:
          routeDurations.length > 0
            ? routeDurations.reduce((a, b) => a + b, 0) / routeDurations.length
            : 0,
        minDuration:
          routeDurations.length > 0 ? Math.min(...routeDurations) : 0,
        maxDuration:
          routeDurations.length > 0 ? Math.max(...routeDurations) : 0,
      };
    };

    const generateAlgorithmSection = (
      metrics: AlgorithmMetrics[],
      algorithmName: string,
      nodeCount: number,
    ) => {
      if (metrics.length === 0) return '';

      const stats = calculateStatistics(metrics);
      const convertMsToSec = (ms: number) => ms / 1000;

      let section = `\\section{${algorithmName} - ${nodeCount} POI}\n\n`;

      section += `\\begin{itemize}\n`;
      section += `\\item Futási idők \\textbf{átlaga}: $${convertMsToSec(
        stats.avgExecution,
      ).toFixed(4)}$ sec\n`;
      section += `\\item Futási idők \\textbf{minimuma}: $${convertMsToSec(
        stats.minExecution,
      ).toFixed(4)}$ sec\n`;
      section += `\\item Futási idők \\textbf{maximuma}: $${convertMsToSec(
        stats.maxExecution,
      ).toFixed(4)}$ sec\n`;
      section += `\\end{itemize}\n\n`;

      switch (algorithmName) {
        case 'Branch-and-Bound':
          section += `A Branch-and-Bound algoritmus optimális megoldást nyújt a TSP problémára, azonban jelentős számítási erőforrásokat igényel. Az algoritmus az optimális utat keresi meg a keresési fa szisztematikus bejárásával és pruning technikákkal.\n\n`;
          break;
        case 'Dynamic Programming':
          section += `A Dynamic Programming (Held-Karp) algoritmus szintén optimális megoldást ad, de exponenciális időbonyolultsága miatt csak kisebb problémaméretek esetén alkalmazható hatékonyan. Az algoritmus a részproblémák megoldásainak tárolásával kerüli az ismételt számításokat.\n\n`;
          break;
        case 'ACO':
          section += `Az Ant Colony Optimization (ACO) metaheurisztika kiváló skálázhatóságot mutat és nagy problémaméretek esetén is hatékony megoldásokat talál. Az algoritmus a hangyák viselkedését modellezi és feromonnyomok alapján iteratívan javítja a megoldást.\n\n`;
          break;
        case 'Bitonic Variants':
          section += `A Bitonic algoritmus különböző rendezési stratégiái (W→E, E→W, S→N, N→S, CW, CCW, I→O, O→I) gyors heurisztikus megoldásokat nyújtanak. Az algoritmus a pontok geometriai elrendezését használja ki az útvonal optimalizálásához.\n\n`;
          break;
        case 'Arora PTAS':
          section += `Az Arora PTAS (Polynomial-Time Approximation Scheme) egy (1+ε)-approximációs algoritmus az Euklideszi TSP problémára. Az algoritmus ε=0.2 paraméterrel polinom időben garantált közelítési arányú megoldást biztosít, grid dekompozíció és portál-alapú dinamikus programozás segítségével.\n\n`;
          break;
      }

      section += `\\begin{itemize}\n`;
      section += `\\item Útvonal távolságok \\textbf{átlaga}: $${(
        stats.avgDistance / 1000
      ).toFixed(2)}$ km\n`;
      section += `\\item Útvonal távolságok \\textbf{minimuma}: $${(
        stats.minDistance / 1000
      ).toFixed(2)}$ km\n`;
      section += `\\item Útvonal távolságok \\textbf{maximuma}: $${(
        stats.maxDistance / 1000
      ).toFixed(2)}$ km\n`;
      section += `\\end{itemize}\n\n`;

      section += `\\begin{itemize}\n`;
      section += `\\item Útvonal időtartamok \\textbf{átlaga}: $${stats.avgDuration.toFixed(
        2,
      )}$ perc\n`;
      section += `\\item Útvonal időtartamok \\textbf{minimuma}: $${stats.minDuration.toFixed(
        2,
      )}$ perc\n`;
      section += `\\item Útvonal időtartamok \\textbf{maximuma}: $${stats.maxDuration.toFixed(
        2,
      )}$ perc\n`;
      section += `\\end{itemize}\n\n`;

      return section;
    };

    const generateComparisonTable = (groups: {
      group15: AlgorithmMetrics[];
      group30: AlgorithmMetrics[];
      group90: AlgorithmMetrics[];
    }) => {
      let table = `\\section{Algoritmusok összehasonlítása}\n\n`;
      table += `Az előző alfejezetekben ismertettem a különböző útvonalkereső algoritmusokat és azok teljesítményét. Mindegyik esetében láthattunk futási időket és útvonal minőségi mutatókat, azonban nem láttuk ezeket egymás mellett. Ebben az alfejezetben összegezzük és összehasonlítjuk a kapott eredményeket.\n\n`;

      table += `Fontos, hogy minden algoritmust ugyanazon a hardveren és ugyanazokkal a valós POI adatokkal teszteljünk, mert csak így reálisak és összehasonlíthatóak a mérési adatok.\n\n`;

      if (groups.group15.length > 0) {
        const sortedGroup15 = [...groups.group15].sort((a, b) => {
          const aDuration = a.routeDuration || 0;
          const bDuration = b.routeDuration || 0;
          if (aDuration !== bDuration) {
            return aDuration - bDuration;
          }
          const order = [
            'BranchAndBound',
            'DynamicProgramming',
            'ACO',
            'Bitonic',
          ];
          return (
            order.indexOf(a.algorithmName) - order.indexOf(b.algorithmName)
          );
        });

        table += `\\begin{table}[h!]\n`;
        table += `\\centering\n`;
        table += `\\begin{tabular}{ | l | c | c | c | c |}\n`;
        table += `\\hline\n`;
        table += `\\textbf{Algoritmus} & \\textbf{Futási} & \\textbf{Útvonal} & \\textbf{Útvonal} & \\textbf{Variáns}\\\\\n`;
        table += ` & \\textbf{idő (s)} & \\textbf{távolság (km)} & \\textbf{időtartam (perc)} & \\\\\n`;
        table += `\\hline\n`;

        sortedGroup15.forEach((metric) => {
          const avgTime = (metric.executionTimeMs! / 1000).toFixed(4);
          const distance =
            metric.routeDistance !== undefined
              ? (metric.routeDistance / 1000).toFixed(2)
              : 'N/A';
          const duration =
            metric.routeDuration !== undefined
              ? metric.routeDuration.toFixed(2)
              : 'N/A';
          const variant = metric.variant || '-';

          table += `${metric.algorithmName} & $${avgTime}$ & $${distance}$ & $${duration}$ & ${variant}\\\\\n`;
          table += `\\hline\n`;
        });

        table += `\\end{tabular}\n`;
        table += `\\caption{Mérési eredmények $n = 15$ POI esetén.}\n`;
        table += `\\label{table:comparison-15}\n`;
        table += `\\end{table}\n\n`;
      }

      if (groups.group30.length > 0) {
        const sortedGroup30 = [...groups.group30].sort((a, b) => {
          const aDuration = a.routeDuration || 0;
          const bDuration = b.routeDuration || 0;
          if (aDuration !== bDuration) {
            return aDuration - bDuration;
          }
          const order = ['DynamicProgramming', 'ACO', 'Bitonic'];
          return (
            order.indexOf(a.algorithmName) - order.indexOf(b.algorithmName)
          );
        });

        table += `\\begin{table}[h!]\n`;
        table += `\\centering\n`;
        table += `\\begin{tabular}{ | l | c | c | c | c |}\n`;
        table += `\\hline\n`;
        table += `\\textbf{Algoritmus} & \\textbf{Futási} & \\textbf{Útvonal} & \\textbf{Útvonal} & \\textbf{Variáns}\\\\\n`;
        table += ` & \\textbf{idő (s)} & \\textbf{távolság (km)} & \\textbf{időtartam (perc)} & \\\\\n`;
        table += `\\hline\n`;

        sortedGroup30.forEach((metric) => {
          const avgTime = (metric.executionTimeMs! / 1000).toFixed(4);
          const distance =
            metric.routeDistance !== undefined
              ? (metric.routeDistance / 1000).toFixed(2)
              : 'N/A';
          const duration =
            metric.routeDuration !== undefined
              ? metric.routeDuration.toFixed(2)
              : 'N/A';
          const variant = metric.variant || '-';

          table += `${metric.algorithmName} & $${avgTime}$ & $${distance}$ & $${duration}$ & ${variant}\\\\\n`;
          table += `\\hline\n`;
        });

        table += `\\end{tabular}\n`;
        table += `\\caption{Mérési eredmények $n = 30$ POI esetén.}\n`;
        table += `\\label{table:comparison-30}\n`;
        table += `\\end{table}\n\n`;
      }

      if (groups.group90.length > 0) {
        const sortedGroup90 = [...groups.group90].sort((a, b) => {
          const aDuration = a.routeDuration || 0;
          const bDuration = b.routeDuration || 0;
          if (aDuration !== bDuration) {
            return aDuration - bDuration;
          }
          if (a.algorithmName !== b.algorithmName) {
            return a.algorithmName === 'ACO' ? -1 : 1;
          }
          return (a.variant || '').localeCompare(b.variant || '');
        });

        table += `\\begin{table}[h!]\n`;
        table += `\\centering\n`;
        table += `\\begin{tabular}{ | l | c | c | c | c |}\n`;
        table += `\\hline\n`;
        table += `\\textbf{Algoritmus} & \\textbf{Futási} & \\textbf{Útvonal} & \\textbf{Útvonal} & \\textbf{Variáns}\\\\\n`;
        table += ` & \\textbf{idő (s)} & \\textbf{távolság (km)} & \\textbf{időtartam (perc)} & \\\\\n`;
        table += `\\hline\n`;

        sortedGroup90.forEach((metric) => {
          const avgTime = (metric.executionTimeMs! / 1000).toFixed(4);
          const distance =
            metric.routeDistance !== undefined
              ? (metric.routeDistance / 1000).toFixed(2)
              : 'N/A';
          const duration =
            metric.routeDuration !== undefined
              ? metric.routeDuration.toFixed(2)
              : 'N/A';
          const variant = metric.variant || '-';

          table += `${metric.algorithmName} & $${avgTime}$ & $${distance}$ & $${duration}$ & ${variant}\\\\\n`;
          table += `\\hline\n`;
        });

        table += `\\end{tabular}\n`;
        table += `\\caption{Mérési eredmények $n = 90$ POI esetén.}\n`;
        table += `\\label{table:comparison-90}\n`;
        table += `\\end{table}\n\n`;
      }

      return table;
    };

    let fullLatex = `\\chapter{Mérések}\n\n`;
    fullLatex += `Az alábbiakban bemutatom a különböző útvonalkereső algoritmusok teljesítménymérésének eredményeit. A mérések során valós POI (Point of Interest) adatokat használtam, hogy minél reálisabb körülmények között értékeljem az algoritmusok hatékonyságát.\n\n`;

    if (algorithmGroups.group15.length > 0) {
      const group15ByAlgorithm = algorithmGroups.group15.reduce(
        (acc, metric) => {
          if (!acc[metric.algorithmName]) {
            acc[metric.algorithmName] = [];
          }
          acc[metric.algorithmName].push(metric);
          return acc;
        },
        {} as Record<string, AlgorithmMetrics[]>,
      );

      Object.entries(group15ByAlgorithm).forEach(([algorithmName, metrics]) => {
        fullLatex += generateAlgorithmSection(metrics, algorithmName, 15);
      });
    }

    if (algorithmGroups.group30.length > 0) {
      const group30ByAlgorithm = algorithmGroups.group30.reduce(
        (acc, metric) => {
          if (!acc[metric.algorithmName]) {
            acc[metric.algorithmName] = [];
          }
          acc[metric.algorithmName].push(metric);
          return acc;
        },
        {} as Record<string, AlgorithmMetrics[]>,
      );

      Object.entries(group30ByAlgorithm).forEach(([algorithmName, metrics]) => {
        fullLatex += generateAlgorithmSection(metrics, algorithmName, 30);
      });
    }

    if (algorithmGroups.group90.length > 0) {
      const group90ByAlgorithm = algorithmGroups.group90.reduce(
        (acc, metric) => {
          if (!acc[metric.algorithmName]) {
            acc[metric.algorithmName] = [];
          }
          acc[metric.algorithmName].push(metric);
          return acc;
        },
        {} as Record<string, AlgorithmMetrics[]>,
      );

      Object.entries(group90ByAlgorithm).forEach(([algorithmName, metrics]) => {
        if (algorithmName === 'Bitonic') {
          fullLatex += generateAlgorithmSection(
            metrics,
            'Bitonic Variants',
            90,
          );
        } else {
          fullLatex += generateAlgorithmSection(metrics, algorithmName, 90);
        }
      });
    }

    fullLatex += generateComparisonTable(algorithmGroups);

    const blob = new Blob([fullLatex], {
      type: 'text/plain; charset=utf-8',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `algorithm_metrics_hungarian_${
      new Date().toISOString().split('T')[0]
    }.tex`;
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
          No metrics available for {title}. Run performance tests to see data.
        </Alert>
      );
    }

    return (
      <TableContainer
        component={Paper}
        sx={{
          mt: 2,
          maxWidth: '100%',
          overflowX: 'auto',
          '&::-webkit-scrollbar': {
            height: 8,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#f1f1f1',
            borderRadius: 4,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#888',
            borderRadius: 4,
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#555',
          },
        }}
      >
        <Table sx={{ minWidth: 800 }} size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 100, px: 1, py: 1 }}>
                Algorithm
              </TableCell>
              <TableCell sx={{ minWidth: 70, px: 1, py: 1 }}>Variant</TableCell>
              <TableCell sx={{ minWidth: 50, px: 1, py: 1 }}>Nodes</TableCell>
              <TableCell sx={{ minWidth: 100, px: 1, py: 1 }}>
                Execution Time
              </TableCell>
              <TableCell sx={{ minWidth: 100, px: 1, py: 1 }}>
                Route Distance
              </TableCell>
              <TableCell sx={{ minWidth: 90, px: 1, py: 1 }}>
                Travel Time
              </TableCell>
              <TableCell sx={{ minWidth: 90, px: 1, py: 1 }}>
                Visit Time
              </TableCell>
              <TableCell sx={{ minWidth: 90, px: 1, py: 1 }}>
                Total Time
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {metrics.map((metric, index) => (
              <TableRow key={index}>
                <TableCell
                  sx={{
                    minWidth: 100,
                    px: 1,
                    py: 0.5,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  {metric.algorithmName}
                </TableCell>
                <TableCell sx={{ minWidth: 70, px: 1, py: 0.5 }}>
                  {metric.variant && (
                    <Chip
                      label={metric.variant}
                      size="small"
                      sx={{
                        fontSize: '0.75rem',
                        height: 20,
                        '& .MuiChip-label': {
                          px: 1,
                        },
                      }}
                    />
                  )}
                </TableCell>
                <TableCell
                  sx={{
                    minWidth: 50,
                    px: 1,
                    py: 0.5,
                    fontSize: '0.875rem',
                  }}
                >
                  {metric.nodeCount}
                </TableCell>
                <TableCell
                  sx={{
                    minWidth: 100,
                    px: 1,
                    py: 0.5,
                    fontSize: '0.875rem',
                  }}
                >
                  {formatTime(metric.executionTimeMs)}
                </TableCell>
                <TableCell
                  sx={{
                    minWidth: 100,
                    px: 1,
                    py: 0.5,
                    fontSize: '0.875rem',
                  }}
                >
                  {formatDistance(metric.routeDistance)}
                </TableCell>
                <TableCell
                  sx={{
                    minWidth: 90,
                    px: 1,
                    py: 0.5,
                    fontSize: '0.875rem',
                  }}
                >
                  {formatDuration(metric.routeDuration)}
                </TableCell>
                <TableCell
                  sx={{
                    minWidth: 90,
                    px: 1,
                    py: 0.5,
                    fontSize: '0.875rem',
                  }}
                >
                  {formatDuration(metric.routeVisitTime)}
                </TableCell>
                <TableCell
                  sx={{
                    minWidth: 90,
                    px: 1,
                    py: 0.5,
                    fontSize: '0.875rem',
                  }}
                >
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
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography variant="h5" gutterBottom>
            Algorithm Group Comparisons
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleExportCSV}
              disabled={deduplicatedMetrics.length === 0}
              size="small"
            >
              Export CSV
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={exportGroupComparisonToLatex}
              disabled={
                algorithmGroups.group15.length === 0 &&
                algorithmGroups.group30.length === 0 &&
                algorithmGroups.group90.length === 0
              }
              size="small"
              sx={{
                color: '#d32f2f',
                borderColor: '#d32f2f',
                '&:hover': {
                  borderColor: '#9a0007',
                  backgroundColor: 'rgba(211, 47, 47, 0.04)',
                },
              }}
            >
              Export LaTeX
            </Button>
          </Box>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Group 1: 15 Nodes" />
            <Tab label="Group 2: 30 Nodes" />
            <Tab label="Group 3: 90 Nodes" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <Typography variant="h6" gutterBottom>
            Branch-and-Bound vs Dynamic Programming vs ACO vs Bitonic vs Arora
            PTAS (15 Nodes)
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
          {renderMetricsTable(algorithmGroups.group15, '15-node comparison')}
        </TabPanel>

                <TabPanel value={activeTab} index={1}>
                    <Typography variant="h6" gutterBottom>
                        Dynamic Programming vs ACO vs Bitonic vs Arora PTAS (30 Nodes)
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
                </TabPanel>

                <TabPanel value={activeTab} index={2}>
                    <Typography variant="h6" gutterBottom>
                        ACO vs Bitonic vs Arora PTAS Strategy Comparison (90
                        Nodes)
                    </Typography>
                    <RouteDurationChart
                        metrics={algorithmGroups.group90}
                        title="Route Duration Comparison (90 Nodes)"
                    />
                    <RouteDistanceChart
                        metrics={algorithmGroups.group90}
                        title="Route Distance Comparison (90 Nodes)"
                    />
                    <ExecutionTimeChart
                        metrics={algorithmGroups.group90}
                        title="Algorithm Execution Time (90 Nodes)"
                    />
                    {renderMetricsTable(algorithmGroups.group90, '90-node')}
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
          No performance metrics available. Run the performance tests to collect
          data.
        </Alert>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Algorithm Group Comparisons */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <AlgorithmGroupComparison />
      </Paper>
    </Box>
  );
};
