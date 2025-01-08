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
    } = useMapContext();

    const handleChange = (event: Event, value: number | number[]) => {
        setEvaporationRate(value as number);
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
        </div>
    );
};

export default Parameters;
