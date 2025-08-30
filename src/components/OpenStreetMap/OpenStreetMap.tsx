'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, ImageOverlay } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-routing-machine';
import { IPosition } from '@/src/models/models';
import RoutingControl from '../RoutingControl/RoutingControl';
import PositionTracker from '../PositionTracker/PositionTracker';
import { useMapContext } from '@/src/contexts/MapContext';
import { Button } from '@mui/material';
import { GpsFixed, GpsNotFixed, GpsOff } from '@mui/icons-material';
import Loader from '../Loader/Loader';
import Selector from '../Selector/Selector';
import { useShallow } from 'zustand/shallow';
import usePOIStore from '@/src/store/poiStore';
import SearchBar from '../SearchBar/SearchBar';
import NavigationSelector from '../NavigationSelector/NavigationSelector';
import CategorySelector from '../CategorySelector/CategorySelector';
import Parameters from '../Parameters/Parameters';
import AcoComponent from '../Aco/Aco';

interface IRouteResponse {
  route: IRoute[];
  totalDistance: number;
}

interface IRoute {
  latitude: number;
  longitude: number;
}

const OpenStreetMap = () => {
  const [routeResponse, setRouteResponse] = useState<IRouteResponse>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [findRouteGreedy, categories] = usePOIStore(
    useShallow((state) => [state.findRouteGreedy, state.categories]),
  );

  const [positions, setPositions] = useState<IPosition[]>([]);
  const [currentPositionVisible, setcurrentPositionVisible] =
    useState<boolean>(false);

  const { currentPosition, mapRef, pois, mainContentStyle } = useMapContext();

  const mapContainerRef = useRef<L.Map[] | null>([]);

  const flyToCurrentPosition = () => {
    if (currentPosition) {
      if (mapRef?.current) {
        mapRef?.current?.[0]?.flyTo?.(
          currentPosition.coords,
          mapRef?.current?.[0]?.getZoom(),
          {
            animate: true,
            duration: 0.5,
          },
        );
      }
    } else {
      alert('Current location is not available.');
    }
  };

  const isInViewport = useCallback(() => {
    const map = mapRef.current?.[0];
    if (map && currentPosition) {
      const bounds = map?.getBounds();
      return bounds.contains(
        L.latLng(currentPosition.coords.lat, currentPosition.coords.lng),
      );
    }
    return false;
  }, [currentPosition, mapRef]);

  // useEffect(() => {
  //     findRouteGreedy(greedyPois).then((response) => {
  //         setRouteResponse(response?.[0]);
  //     });
  // }, [findRouteGreedy]);

  useEffect(() => {
    const map = mapRef?.current?.[0];
    if (map) {
      map.on('moveend', () => {
        const inViewport = isInViewport();
        setcurrentPositionVisible(inViewport);
      });
    }

    return () => {
      if (map) {
        map.off('moveend', () => {
          const inViewport = isInViewport();
          setcurrentPositionVisible(inViewport);
        });
      }
    };
  }, [isInViewport, mapRef]);

  useEffect(() => {
    if (routeResponse) {
      const newPositions = routeResponse.route.map((route) => ({
        coords: { lat: route.longitude, lng: route.latitude },
        text: 'POI Description!',
      }));
      setPositions((currentPositions) => [
        ...currentPositions,
        ...newPositions,
      ]);
    }
  }, [routeResponse]);

  const renderGpsIcon = () => {
    if (!currentPosition) return <GpsOff />;

    return currentPositionVisible ? <GpsFixed /> : <GpsNotFixed />;
  };

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'black',
        ...mainContentStyle,
      }}
    >
      <MapContainer
        ref={mapContainerRef as any}
        style={{
          height: '100%',
          width: '100%',
          borderColor: 'black',
        }}
        center={[46.5417, 24.5617]}
        zoom={13}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {positions?.length > 1 && <RoutingControl positions={positions} />}

        {pois?.length > 1 && <RoutingControl positions={pois} />}

        <Selector />

        <SearchBar />

        <NavigationSelector />

        {/* <Parameters /> */}

        <AcoComponent />

        <PositionTracker />

        <Button
          variant="contained"
          color="primary"
          onClick={flyToCurrentPosition}
          style={{
            position: 'absolute',
            bottom: '40px',
            right: '10px',
            zIndex: 1000,
            height: '50px',
            width: '50px',
            borderRadius: '50%',
            padding: 0,
            minWidth: 0,
          }}
        >
          {renderGpsIcon()}
        </Button>
      </MapContainer>

      <CategorySelector />

      {loading && <Loader loading />}
    </div>
  );
};

export default OpenStreetMap;
