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
    setMainContentStyle,
  } = useMapContext();

  const panelHeight = '80px';

  useEffect(() => {
    if (setMainContentStyle) {
      if (instructionsVisible) {
        setMainContentStyle({
          height: `calc(100% - ${panelHeight})`,
          transition: 'height 0.2s ease-out',
        });
      } else {
        setMainContentStyle({
          height: '100%',
          transition: 'height 0.2s ease-out',
        });
      }
    }
  }, [instructionsVisible, setMainContentStyle]);

  const instructionSet = instructions?.[0]?.instructions;
  const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0);

  const handleNextInstruction = () => {
    setCurrentInstructionIndex((prevIndex) => {
      if (prevIndex < instructionSet?.length - 1) {
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
    text: 'Finished',
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          '& .MuiDrawer-paper': {
            height: panelHeight,
            position: 'relative',
            bottom: 0,
            zIndex: 1000,
          },
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 'auto',
          overflow: 'hidden',
        }}
        variant="persistent"
        transitionDuration={300}
      >
        {/* <Button
                    onClick={() => setInstructionsVisible(false)}
                    variant="contained"
                    size="small"
                    sx={{
                        position: 'absolute',
                        padding: 0,
                        top: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 10001,
                        backgroundColor: '#1976d2',
                        color: 'white',
                        borderTopLeftRadius: 0,
                        borderTopRightRadius: 0,
                        borderBottomLeftRadius: 10,
                        borderBottomRightRadius: 10,
                    }}
                >
                    Hide
                </Button> */}

        <Paper
          elevation={3}
          sx={{
            height: panelHeight,
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
              disabled={currentInstructionIndex >= instructionSet?.length - 1}
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

      {/* {!instructionsVisible && (
                <Button
                    onClick={() => setInstructionsVisible(true)}
                    variant="contained"
                    sx={{
                        position: 'fixed',
                        bottom: '170px',
                        right: '10px',
                        // left: '50%',
                        borderTopLeftRadius: 10,
                        borderTopRightRadius: 10,
                        // transform: 'translateX(-50%)',
                        zIndex: 1000,
                        backgroundColor: '#1976d2',
                        color: 'white',
                        fontSize: 15,
                        justifyContent: 'center',
                        alignItems: 'center',
                        display: 'flex',
                    }}
                    // disabled={!instructions?.length}
                    disabled={instructions?.length !== 0}
                >
                    Instructions
                </Button>
            )} */}
    </>
  );
};

export default InstructionsPanel;
