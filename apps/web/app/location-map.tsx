'use client';

import 'leaflet/dist/leaflet.css';

import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';

const PUNE_CENTER: [number, number] = [18.5204, 73.8567];
const PUNE_ZOOM = 11;

type LocationMapProps = {
  latitude: number;
  longitude: number;
  onChange: (latitude: number, longitude: number) => void;
};

const locationIcon = L.divIcon({
  className: 'location-pin',
  html: '<span aria-hidden="true"></span>',
  iconSize: [28, 36],
  iconAnchor: [14, 34],
});

function MapInteractions({
  onChange,
}: Pick<LocationMapProps, 'onChange'>) {
  useMapEvents({
    click(event) {
      onChange(Number(event.latlng.lat.toFixed(6)), Number(event.latlng.lng.toFixed(6)));
    },
  });

  return null;
}

function MapViewport({
  latitude,
  longitude,
}: Pick<LocationMapProps, 'latitude' | 'longitude'>) {
  const map = useMap();

  useEffect(() => {
    if (latitude !== 0 && longitude !== 0) {
      map.flyTo([latitude, longitude], Math.max(map.getZoom(), 14), {
        duration: 0.6,
      });
    }
  }, [latitude, longitude, map]);

  return null;
}

export function LocationMap({ latitude, longitude, onChange }: LocationMapProps) {
  const hasLocation = latitude !== 0 && longitude !== 0;
  const center: [number, number] = hasLocation
    ? [latitude, longitude]
    : PUNE_CENTER;

  return (
    <div className="location-map-shell">
      <MapContainer
        center={center}
        zoom={hasLocation ? 14 : PUNE_ZOOM}
        scrollWheelZoom
        className="location-map"
        aria-label="Map for choosing your approximate home location"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapInteractions onChange={onChange} />
        <MapViewport latitude={latitude} longitude={longitude} />
        {hasLocation && (
          <Marker
            position={[latitude, longitude]}
            icon={locationIcon}
            draggable
            eventHandlers={{
              dragend(event) {
                const marker = event.target as L.Marker;
                const position = marker.getLatLng();
                onChange(Number(position.lat.toFixed(6)), Number(position.lng.toFixed(6)));
              },
            }}
          />
        )}
      </MapContainer>
      <p className="map-caption">
        {hasLocation
          ? 'Pinned location saved. Drag the pin to fine-tune it.'
          : 'Click the map to drop a pin near your home or residential gate.'}
      </p>
    </div>
  );
}
