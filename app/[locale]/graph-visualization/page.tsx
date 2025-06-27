import React from 'react';
import Head from 'next/head';
import GraphVisualizationPage from '@/src/pages/GraphVisualizationPage';

const GraphVisualization = () => {
    return (
        <div>
            <Head>
                <title>WiseExplorer - Gráf Vizualizáció</title>
                <meta name="description" content="Algoritmus útvonal vizualizáció" />
            </Head>
            <GraphVisualizationPage />
        </div>
    );
};

export default GraphVisualization;
