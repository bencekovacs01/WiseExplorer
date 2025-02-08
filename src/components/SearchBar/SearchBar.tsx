import { useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import ReactDOMServer from 'react-dom/server';
import { Button, CircularProgress, TextField } from '@mui/material';
import { SelectAll, Deselect, PushPin, Pin } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import usePOIStore from '@/src/store/poiStore';

import InterestsIcon from '@mui/icons-material/Interests';
import { useMapContext } from '@/src/contexts/MapContext';

const SearchBar = () => {
    const map = useMap();

    const [search] = usePOIStore(useShallow((state) => [state.search]));

    const [searchTerm, setSearchTerm] = useState('');

    const [loading, setLoading] = useState<boolean>(false);

    const renderResults = (features: any[]) => {
        features?.forEach?.((feature: any) => {
            const [lng, lat] = feature.geometry.coordinates;
            L.marker([lat, lng], {
                icon: new L.Icon({
                    iconUrl:
                        'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                }),
            }).addTo(map);
        });
    };

    const handleSearch = () => {
        setLoading(true);
        search(searchTerm)
            .then((asd: any) => {
                console.log('searched', asd?.features);

                renderResults(asd?.features);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <div
            style={{
                position: 'absolute',
                left: 60,
                top: 13,
                zIndex: 1000,
                width: '100%',
                maxWidth: '400px',
                display: 'flex',
                flexDirection: 'row',
            }}
        >
            <TextField
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                style={{
                    marginRight: '10px',
                    width: '100%',
                    height: '40px',
                    backgroundColor: 'white',
                }}
            />

            <Button
                variant="contained"
                color="primary"
                onClick={handleSearch}
                style={{
                    height: '40px',
                    width: '100px',
                }}
                disabled={loading}
            >
                {loading ? (
                    <CircularProgress color="inherit" size={20} />
                ) : (
                    'Search'
                )}
            </Button>
        </div>
    );
};

export default SearchBar;
