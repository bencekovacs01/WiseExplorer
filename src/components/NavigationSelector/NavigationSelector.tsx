import React, { ReactNode, useState } from 'react';
import {
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    SelectChangeEvent,
} from '@mui/material';
import { NavigationType, useMapContext } from '@/src/contexts/MapContext';

const NavigationSelector = () => {
    const { navigationType, setNavigationType } = useMapContext();

    const handleChange = (event: SelectChangeEvent<string>) => {
        setNavigationType(event?.target?.value as NavigationType);
    };

    return (
        <FormControl
            variant="filled"
            style={{
                position: 'absolute',
                bottom: '20px',
                left: '10px',
                zIndex: 998,
                width: '150px',
                backgroundColor: 'white',
            }}
            aria-orientation="vertical"
        >
            <InputLabel id="navigation-selector-label">
                Navigation mode
            </InputLabel>
            <Select
                labelId="navigation-selector-label"
                value={navigationType}
                onChange={handleChange}
                label="Navigation mode"
                disableUnderline
            >
                <MenuItem value="car">Car</MenuItem>
                <MenuItem value="foot">Foot</MenuItem>
            </Select>
        </FormControl>
    );
};

export default NavigationSelector;
