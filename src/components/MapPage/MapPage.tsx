'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { MapProvider } from '@/src/contexts/MapContext';
import InstructionsPanel from '../InstructionsPanel/InstructionsPanel';
import { Box } from '@mui/material';
import Loader from '../Loader/Loader';

const MapPage = () => {
    const Map = useMemo(
        () =>
            dynamic(() => import('../OpenStreetMap/OpenStreetMap'), {
                loading: () => <Loader loading />,
                ssr: false,
            }),
        [],
    );

    return (
        <MapProvider>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                }}
            >
                <Box
                    sx={{
                        flex: 1,
                        position: 'relative',
                    }}
                >
                    <Map />
                </Box>

                <InstructionsPanel />
            </Box>
        </MapProvider>
    );
};

export default MapPage;
