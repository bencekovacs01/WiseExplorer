import React, { useEffect, useState } from 'react';
import { useMapContext } from '@/src/contexts/MapContext';
import {
    Box,
    Button,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemText,
    IconButton,
    SwipeableDrawer,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { SkipNext, SkipPrevious } from '@mui/icons-material';
import { translateText } from '@/src/utils/deepl.utils';

const InstructionsPanel = () => {
    const {
        instructions,
        instructionsVisible,
        setInstructionsVisible,
        handleInstructionClicked,
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

    // useEffect(() => {
    //     translateText(
    //         instructionSet?.[currentInstructionIndex]?.text?.text,
    //         'hu',
    //     );
    // }, [instructionSet, currentInstructionIndex]);

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
                        }}
                    >
                        <ListItemText
                            primary={`${instructionSet?.[currentInstructionIndex]?.text?.text}`}
                            sx={{ cursor: 'pointer', textAlign: 'center' }}
                        />
                    </Box>

                    {/* {instructions.length > 0 ? (
                        <List
                            sx={{
                                width: '60%',
                                height: '100%',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {instructions.map(
                                ({ routeNumber, instructions }) => (
                                    <Box key={routeNumber} mb={2}>
                                        {instructions.map(({ text, index }) => (
                                            <ListItem
                                                component={'button'}
                                                key={index}
                                                onClick={() =>
                                                    handleInstructionClicked(
                                                        index,
                                                    )
                                                }
                                                sx={{
                                                    '&:hover': {
                                                        backgroundColor:
                                                            '#f0f0f0',
                                                    },
                                                }}
                                            >
                                                <ListItemText
                                                    primary={`${text?.text}`}
                                                    sx={{ cursor: 'pointer' }}
                                                />
                                            </ListItem>
                                        ))}
                                    </Box>
                                ),
                            )}
                        </List>
                    ) : (
                        <Typography>
                            No routes found. Please adjust your waypoints.
                        </Typography>
                    )} */}

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
