import React from 'react';

export const MapContainer = ({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) => (
  <div data-testid="leaflet-map" style={style}>{children}</div>
);
export const TileLayer = (_props: Record<string, unknown>) => null;
export const Marker = ({ children }: { children?: React.ReactNode }) => (
  <div data-testid="leaflet-marker">{children}</div>
);
export const Polyline = (_props: Record<string, unknown>) => null;
export const useMap = jest.fn(() => ({ fitBounds: jest.fn() }));
