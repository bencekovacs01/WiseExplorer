import React, { ReactNode, useState } from 'react';
import {
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    SelectChangeEvent,
} from '@mui/material';
import { useMap } from 'react-leaflet';
import { NavigationType, useMapContext } from '@/src/contexts/MapContext';

const NavigationSelector = () => {
    const map = useMap();

    const { navigationType, setNavigationType } = useMapContext();
    console.log('navigationType', navigationType);

    const handleChange = (event: SelectChangeEvent<string>) => {
        setNavigationType(event?.target?.value as NavigationType);
    };

    return (
        <FormControl
            variant="filled"
            style={{
                position: 'absolute',
                top: '20px',
                right: '100px',
                zIndex: 998,
                width: '150px',
                backgroundColor: 'white',
            }}
        >
            <InputLabel id="navigation-selector-label">
                Navigation mode
            </InputLabel>
            <Select
                labelId="navigation-selector-label"
                value={navigationType}
                onChange={handleChange}
                label="Navigation mode"
            >
                <MenuItem value="car">Car</MenuItem>
                <MenuItem value="foot">Foot</MenuItem>
            </Select>
        </FormControl>
    );
};

export default NavigationSelector;
