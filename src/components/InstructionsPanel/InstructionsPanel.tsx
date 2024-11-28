import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useMapContext } from '@/src/contexts/MapContext';
import {
    Box,
    Button,
    Paper,
    ListItemText,
    IconButton,
    SwipeableDrawer,
} from '@mui/material';
import { SkipNext, SkipPrevious } from '@mui/icons-material';
import { IPosition } from '@/src/models/models';

const InstructionsPanel: React.FC = () => {
    const {
        instructions,
        instructionsVisible,
        setInstructionsVisible,
        handleInstructionClicked,
        currentPosition,
        instructionWaypointsRef,
    } = useMapContext();

    const instructionSet = instructions?.[0]?.instructions;

    const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0);

    const handleNextInstruction = () => {
        setCurrentInstructionIndex((prevIndex) => {
            if (prevIndex < instructionSet.length - 1) {
                handleInstructionClicked(currentInstructionIndex + 1);

                return prevIndex + 1;
            }
            return prevIndex;
        });
    };

    const handlePreviousInstruction = () => {
        setCurrentInstructionIndex((prevIndex) => {
            if (prevIndex > 0) {
                handleInstructionClicked(currentInstructionIndex - 1);

                return prevIndex - 1;
            }
            return prevIndex;
        });
    };

    const getDistance = (
        pos1: IPosition | null,
        pos2: IPosition | null,
    ): number => {
        if (!pos1 || !pos2) return 0;

        return Math.sqrt(
            Math.pow(pos1.coords.lat - pos2.coords.lat, 2) +
                Math.pow(pos1.coords.lng - pos2.coords.lng, 2),
        );
    };

    const array = (instructionWaypointsRef.current || []).map((latlng) => ({
        coords: { lat: latlng.lat, lng: latlng.lng },
        text: undefined,
    }));

    useEffect(() => {
        const checkAndUpdateInstruction = (): void => {
            if (!array.length || !instructionSet) return;

            const top = array?.[currentInstructionIndex];

            if (!top) return;

            const distance = getDistance(currentPosition, top) * 100;
            const threshold = 0.01;

            if (distance < threshold) {
                setCurrentInstructionIndex((prevIndex) => prevIndex + 1);
            }
        };

        checkAndUpdateInstruction();
    }, [currentPosition]);

    return (
        <>
            <SwipeableDrawer
                anchor="bottom"
                open={instructionsVisible}
                onClose={() => setInstructionsVisible(false)}
                onOpen={() => setInstructionsVisible(true)}
                ModalProps={{
                    hideBackdrop: true,
                    keepMounted: true,
                }}
                sx={{
                    height: '0',

                    '& .MuiDrawer-paper': {
                        height: '15%',
                    },
                }}
                transitionDuration={200}
            >
                <Paper
                    elevation={3}
                    sx={{
                        height: '100%',
                        overflow: 'scroll',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <Box
                        sx={{
                            width: '20%',
                            height: '100%',
                            alignItems: 'center',
                            justifyContent: 'center',
                            display: 'flex',
                        }}
                        onClick={handlePreviousInstruction}
                    >
                        <IconButton
                            disabled={currentInstructionIndex <= 0}
                            sx={{
                                position: 'absolute',
                                borderColor: 'black',
                                color: 'black',
                            }}
                        >
                            <SkipPrevious />
                        </IconButton>
                    </Box>

                    <Box
                        sx={{
                            width: '60%',
                            height: '50%',
                            alignItems: 'center',
                            display: 'flex',
                            borderLeft: '1px solid black',
                            borderRight: '1px solid black',
                            padding: '10px',
                        }}
                    >
                        <ListItemText
                            primary={`${instructionSet?.[currentInstructionIndex]?.text?.text}`}
                            sx={{ cursor: 'pointer', textAlign: 'center' }}
                        />
                    </Box>
                    <Box
                        sx={{
                            width: '20%',
                            height: '100%',
                            alignItems: 'center',
                            justifyContent: 'center',
                            display: 'flex',
                        }}
                        onClick={handleNextInstruction}
                    >
                        <IconButton
                            disabled={
                                currentInstructionIndex >=
                                instructionSet?.length - 1
                            }
                            sx={{
                                position: 'absolute',
                                borderColor: 'black',
                                color: 'black',
                            }}
                        >
                            <SkipNext />
                        </IconButton>
                    </Box>
                </Paper>
            </SwipeableDrawer>

            {!instructionsVisible && (
                <Button
                    onClick={() => setInstructionsVisible(true)}
                    variant="contained"
                    sx={{
                        position: 'fixed',
                        bottom: 20,
                        right: 20,
                        zIndex: 1000,
                        backgroundColor: '#1976d2',
                        color: 'white',
                        '&:hover': {
                            backgroundColor: '#115293',
                        },
                    }}
                >
                    Show Instructions
                </Button>
            )}
        </>
    );
};

export default InstructionsPanel;
