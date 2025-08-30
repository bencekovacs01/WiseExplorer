import React, { ReactNode, useState } from 'react';
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Slider,
} from '@mui/material';
import { useMap } from 'react-leaflet';
import { NavigationType, useMapContext } from '@/src/contexts/MapContext';

const Parameters = () => {
  const map = useMap();

  const {
    navigationType,
    setNavigationType,
    evaporationRate,
    setEvaporationRate,
    iterations,
    setIterations,
  } = useMapContext();

  const handleChange = (event: Event, value: number | number[]) => {
    setEvaporationRate(value as number);
  };

  const handleIterationsChange = (event: Event, value: number | number[]) => {
    setIterations(value as number);
  };

  return (
    <div>
      <FormControl
        variant="filled"
        style={{
          position: 'absolute',
          top: '80px',
          right: '100px',
          zIndex: 998,
          width: '150px',
          height: '50px',
          backgroundColor: 'white',
        }}
      >
        <InputLabel id="">Evaporation rate</InputLabel>
        <Slider
          value={evaporationRate}
          onChange={handleChange}
          style={{
            width: '100%',
          }}
          aria-labelledby="rate-slider-label"
          min={0}
          max={1}
          step={0.1}
        />
      </FormControl>

      <FormControl
        variant="filled"
        style={{
          position: 'absolute',
          top: '140px',
          right: '100px',
          zIndex: 998,
          width: '150px',
          height: '50px',
          backgroundColor: 'white',
        }}
      >
        <InputLabel id="">Iterations</InputLabel>
        <Slider
          value={iterations}
          onChange={handleIterationsChange}
          style={{
            width: '100%',
          }}
          aria-labelledby="rate-slider-label"
          min={0}
          max={100}
          step={1}
        />
      </FormControl>
    </div>
  );
};

export default Parameters;
