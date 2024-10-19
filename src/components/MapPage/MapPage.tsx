import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { IMainInstruction } from '@/src/models/models';
import { MapProvider } from '@/src/contexts/MapContext';
import InstructionsPanel from '../InstructionsPanel/InstructionsPanel';

import { Box } from '@mui/material';

const MapPage = () => {
    const Map = useMemo(
        () =>
            dynamic(() => import('../OpenStreetMap/OpenStreetMap'), {
                loading: () => <p>A map is loading</p>,
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
