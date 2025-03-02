import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { Button, CircularProgress, TextField } from '@mui/material';
import { useState } from 'react';
import { useShallow } from 'zustand/shallow';
import usePOIStore from '@/src/store/poiStore';
import { useMapContext } from '@/src/contexts/MapContext';

const SearchBar = () => {
    const map = useMap();

    const { setPois } = useMapContext();

    const [search] = usePOIStore(useShallow((state) => [state.search]));

    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState<boolean>(false);
    const [isFocused, setIsFocused] = useState(false);

    const renderResults = (features: any[]) => {
        features?.forEach?.((feature: any) => {
            const [lng, lat] = feature.geometry.coordinates;

            setPois((prev) => [
                ...prev,
                {
                    coords: {
                        lat,
                        lng,
                    },
                    categories: feature.properties.category_ids,
                    tags: feature.properties.osm_tags || feature.properties,
                },
            ]);

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
                top: 11,
                zIndex: 10000000,
                width: 'calc(100% - 70px)',
                display: 'flex',
                flexDirection: 'row',
                overflow: 'hidden',
                opacity: 1,
                pointerEvents: 'auto',
            }}
        >
            <TextField
                id="search-field"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                style={{
                    width:
                        isFocused || searchTerm
                            ? searchTerm
                                ? 'calc(100% - 90px)'
                                : '100%'
                            : '30%',
                    height: '40px',
                    backgroundColor: 'white',
                    transition: 'width 0.2s ease-in-out',
                    borderRadius: '10%',
                }}
                slotProps={{
                    input: {
                        style: {
                            pointerEvents: 'auto',
                        },
                    },
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                    setIsFocused(false);
                }}
            />

            {searchTerm && (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSearch}
                    style={{
                        height: '40px',
                        marginLeft: '10px',
                        opacity: 1,
                        pointerEvents: 'auto',
                    }}
                    disabled={loading}
                >
                    {loading ? (
                        <CircularProgress color="inherit" size={20} />
                    ) : (
                        'Search'
                    )}
                </Button>
            )}
        </div>
    );
};

export default SearchBar;
