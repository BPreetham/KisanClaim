import React, { useState, useRef, useEffect, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  Crosshair,
  Layers,
  Sparkles,
  Info,
  Maximize2,
  LocateFixed,
  Compass
} from 'lucide-react';
import { encodeDigipin } from '../../utils/digipin';
import {
  calculatePolygonAreaAcres,
  calculatePolygonCentroid,
  calculateEdgeDistances,
  generateDefaultParcelCoordinates,
  haversineDistanceMeters
} from '../../utils/geo';

interface LandPlotMapSelectorProps {
  initialCenterLat?: number;
  initialCenterLon?: number;
  initialCoords?: [number, number][];
  surveyNumber?: string;
  onPlotChange?: (data: {
    coords: [number, number][];
    areaAcres: number;
    centroidLat: number;
    centroidLon: number;
    digipin: string;
  }) => void;
}

export const LandPlotMapSelector: React.FC<LandPlotMapSelectorProps> = ({
  initialCenterLat = 13.2456,
  initialCenterLon = 77.7123,
  initialCoords,
  surveyNumber = '125/2',
  onPlotChange
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const digipinSquareRef = useRef<L.Rectangle | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const edgeDistanceMarkersRef = useRef<L.Marker[]>([]);
  const centroidMarkerRef = useRef<L.Marker | null>(null);

  // Active satellite tile provider
  const [satelliteProvider, setSatelliteProvider] = useState<'esri' | 'google'>('esri');
  const [activeCornerIdx, setActiveCornerIdx] = useState<number | null>(null);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);

  // Polygon coordinates [[lat, lon], ...]
  const [coords, setCoords] = useState<[number, number][]>(() => {
    if (initialCoords && initialCoords.length >= 3) {
      return initialCoords;
    }
    return generateDefaultParcelCoordinates(initialCenterLat, initialCenterLon);
  });

  // Derived geospatial calculations
  const centroid = calculatePolygonCentroid(coords);
  const areaAcres = calculatePolygonAreaAcres(coords);
  const digipin = encodeDigipin(centroid[0], centroid[1]);
  const edgeDistances = calculateEdgeDistances(coords);
  const totalPerimeterMeters = edgeDistances.reduce((a, b) => a + b, 0);

  // Notify parent component on state changes
  useEffect(() => {
    if (onPlotChange) {
      onPlotChange({
        coords,
        areaAcres,
        centroidLat: centroid[0],
        centroidLon: centroid[1],
        digipin
      });
    }
  }, [coords, areaAcres, centroid, digipin, onPlotChange]);

  // Create custom Leaflet DIV Icon for corner pins
  const createPinIcon = (index: number, isActive: boolean = false) => {
    return L.divIcon({
      className: 'leaflet-custom-marker',
      html: `
        <div style="
          width: 30px;
          height: 30px;
          background: ${isActive ? '#38bdf8' : '#10b981'};
          color: #020617;
          border: 2.5px solid #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 11px;
          font-family: ui-monospace, monospace;
          box-shadow: 0 4px 14px rgba(0,0,0,0.7), 0 0 ${isActive ? '15px #38bdf8' : '8px #10b981'};
          cursor: grab;
          transition: transform 0.15s ease, background 0.15s ease;
          transform: ${isActive ? 'scale(1.2)' : 'scale(1)'};
        ">
          P${index + 1}
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
  };

  // Create edge distance midpoint label icon
  const createDistanceIcon = (meters: number) => {
    return L.divIcon({
      className: 'leaflet-dist-badge',
      html: `
        <div style="
          background: rgba(2, 6, 23, 0.92);
          backdrop-filter: blur(4px);
          color: #6ee7b7;
          border: 1px solid rgba(16, 185, 129, 0.6);
          border-radius: 6px;
          padding: 1.5px 5px;
          font-size: 9px;
          font-weight: 700;
          font-family: ui-monospace, monospace;
          white-space: nowrap;
          box-shadow: 0 2px 6px rgba(0,0,0,0.5);
          transform: translate(-50%, -50%);
          pointer-events: none;
        ">
          ${meters}m
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });
  };

  // Create Centroid DIGIPIN Reticle Icon
  const createDigipinReticleIcon = (code: string) => {
    return L.divIcon({
      className: 'leaflet-digipin-reticle',
      html: `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          transform: translate(-50%, -50%);
          pointer-events: none;
        ">
          <div style="
            width: 32px;
            height: 32px;
            border: 2px dashed #22d3ee;
            background: rgba(6, 182, 212, 0.25);
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 15px rgba(6, 182, 212, 0.7);
            animation: pulse 2s infinite;
          ">
            <div style="width: 6px; height: 6px; background: #ffffff; border-radius: 50%;"></div>
          </div>
          <div style="
            margin-top: 4px;
            background: rgba(2, 6, 23, 0.95);
            border: 1px solid rgba(6, 182, 212, 0.7);
            border-radius: 6px;
            padding: 2px 6px;
            color: #67e8f9;
            font-size: 9px;
            font-weight: 800;
            font-family: ui-monospace, monospace;
            white-space: nowrap;
            box-shadow: 0 4px 10px rgba(0,0,0,0.6);
          ">
            DIGIPIN: ${code}
          </div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on initial coordinates at zoom level 18 (parcel resolution)
    const map = L.map(mapContainerRef.current, {
      center: [initialCenterLat, initialCenterLon],
      zoom: 18,
      maxZoom: 19,
      minZoom: 13,
      zoomControl: false,
      attributionControl: false
    });

    // Add Zoom control at top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Initial Satellite Tile Layer: Esri World Imagery (High-Res True Color Satellite)
    const tileUrl =
      satelliteProvider === 'esri'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';

    const tiles = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: 'Esri World Imagery / Google Satellite'
    }).addTo(map);

    tileLayerRef.current = tiles;
    mapInstanceRef.current = map;
    setIsMapReady(true);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch Satellite Tile Layer when provider toggled
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    const tileUrl =
      satelliteProvider === 'esri'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';

    tileLayerRef.current.setUrl(tileUrl);
  }, [satelliteProvider]);

  // Recenter map when initialCenterLat or initialCenterLon changes significantly
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const currentCenter = mapInstanceRef.current.getCenter();
    const dist = haversineDistanceMeters(
      currentCenter.lat,
      currentCenter.lng,
      initialCenterLat,
      initialCenterLon
    );

    // If moved by more than 20 meters, fly smoothly to new location
    if (dist > 20) {
      mapInstanceRef.current.flyTo([initialCenterLat, initialCenterLon], 18, {
        duration: 1.2
      });

      // Also reset plot points around the new centroid
      const newPts = generateDefaultParcelCoordinates(initialCenterLat, initialCenterLon);
      setCoords(newPts);
    }
  }, [initialCenterLat, initialCenterLon]);

  // Render or Update Polygon, Draggable Markers & DIGIPIN 4x4m Square on the Map
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady) return;
    const map = mapInstanceRef.current;

    // 1. Update / Create Polygon Layer
    if (!polygonLayerRef.current) {
      polygonLayerRef.current = L.polygon(coords, {
        color: '#10b981',
        weight: 2.5,
        fillColor: '#10b981',
        fillOpacity: 0.24,
        dashArray: '6, 4'
      }).addTo(map);
    } else {
      polygonLayerRef.current.setLatLngs(coords);
    }

    // 2. Clear old markers and distance labels
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    edgeDistanceMarkersRef.current.forEach(m => m.remove());
    edgeDistanceMarkersRef.current = [];

    // 3. Create Draggable Corner Markers
    coords.forEach((pt, idx) => {
      const marker = L.marker(pt, {
        draggable: true,
        icon: createPinIcon(idx, activeCornerIdx === idx)
      }).addTo(map);

      // On dragging pin: update polygon in real time
      marker.on('drag', () => {
        const newLatLng = marker.getLatLng();
        setCoords(prev => {
          const updated = [...prev];
          updated[idx] = [
            Number(newLatLng.lat.toFixed(6)),
            Number(newLatLng.lng.toFixed(6))
          ];
          return updated;
        });
      });

      marker.on('dragstart', () => {
        setActiveCornerIdx(idx);
      });

      marker.on('dragend', () => {
        setActiveCornerIdx(null);
      });

      markersRef.current.push(marker);
    });

    // 4. Create Edge Distance Midpoint Badges
    const n = coords.length;
    for (let i = 0; i < n; i++) {
      const nextIdx = (i + 1) % n;
      const p1 = coords[i];
      const p2 = coords[nextIdx];
      const midLat = (p1[0] + p2[0]) / 2;
      const midLon = (p1[1] + p2[1]) / 2;
      const dist = Math.round(haversineDistanceMeters(p1[0], p1[1], p2[0], p2[1]));

      const distMarker = L.marker([midLat, midLon], {
        icon: createDistanceIcon(dist),
        interactive: false
      }).addTo(map);

      edgeDistanceMarkersRef.current.push(distMarker);
    }

    // 5. DIGIPIN 4x4m Square & Centroid Reticle
    const [cLat, cLon] = centroid;
    // 4 meters in latitude & longitude degrees
    const dLat = 4.0 / 110574.0;
    const dLon = 4.0 / (111320.0 * Math.cos((cLat * Math.PI) / 180.0));
    const bounds: L.LatLngBoundsExpression = [
      [cLat - dLat / 2, cLon - dLon / 2],
      [cLat + dLat / 2, cLon + dLon / 2]
    ];

    if (!digipinSquareRef.current) {
      digipinSquareRef.current = L.rectangle(bounds, {
        color: '#06b6d4',
        weight: 2,
        fillColor: '#06b6d4',
        fillOpacity: 0.35,
        dashArray: '3, 3'
      }).addTo(map);
    } else {
      digipinSquareRef.current.setBounds(bounds);
    }

    // Centroid Reticle Marker
    if (!centroidMarkerRef.current) {
      centroidMarkerRef.current = L.marker([cLat, cLon], {
        icon: createDigipinReticleIcon(digipin),
        interactive: false
      }).addTo(map);
    } else {
      centroidMarkerRef.current.setLatLng([cLat, cLon]);
      centroidMarkerRef.current.setIcon(createDigipinReticleIcon(digipin));
    }
  }, [coords, isMapReady, activeCornerIdx]);

  // Recenter on plot
  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([centroid[0], centroid[1]], 18, {
      duration: 0.8
    });
  };

  // Reset to default standard boundary
  const handleReset = () => {
    const defaultPoints = generateDefaultParcelCoordinates(centroid[0], centroid[1]);
    setCoords(defaultPoints);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([centroid[0], centroid[1]], 18, {
        duration: 0.6
      });
    }
  };

  // Add a corner point
  const handleAddPoint = () => {
    if (coords.length >= 8) return;
    const p1 = coords[0];
    const p2 = coords[1];
    const midLat = Number(((p1[0] + p2[0]) / 2 + 0.0002).toFixed(6));
    const midLon = Number(((p1[1] + p2[1]) / 2 + 0.0001).toFixed(6));
    setCoords([coords[0], [midLat, midLon], ...coords.slice(1)]);
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Header & Map Controls */}
      <div className="p-3.5 bg-slate-850 border-b border-slate-700 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Live Satellite Plot Boundary Selector
              </span>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-mono px-2 py-0.5 rounded-full border border-cyan-500/30">
                LIVE SATELLITE TILES • ZOOM LEVEL 18
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Drag green pins (P1–P4) directly onto your real farm parcel visible from space.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleAddPoint}
            disabled={coords.length >= 8}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-[11px] font-semibold rounded-lg flex items-center gap-1 border border-slate-700 transition cursor-pointer"
            title="Add boundary corner point"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Add Corner</span>
          </button>

          <button
            type="button"
            onClick={handleRecenter}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded-lg flex items-center gap-1 border border-slate-700 transition cursor-pointer"
            title="Recenter view on plot"
          >
            <LocateFixed className="w-3.5 h-3.5 text-cyan-400" />
            <span>Recenter</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded-lg flex items-center gap-1 border border-slate-700 transition cursor-pointer"
            title="Reset to survey standard boundary"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset</span>
          </button>

          {/* Satellite Layer Provider Switcher */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-700 text-[11px]">
            <button
              type="button"
              onClick={() => setSatelliteProvider('esri')}
              className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                satelliteProvider === 'esri'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Esri Satellite
            </button>
            <button
              type="button"
              onClick={() => setSatelliteProvider('google')}
              className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                satelliteProvider === 'google'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Google Hybrid
            </button>
          </div>
        </div>
      </div>

      {/* Real Dynamic Satellite Map Canvas (Leaflet with Real Farmland Satellite Imagery) */}
      <div className="relative w-full h-[380px] sm:h-[420px] select-none bg-slate-950 overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Top-Left Cadastral HUD Overlay */}
        <div className="absolute top-2.5 left-2.5 bg-slate-950/90 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl z-10 text-[10px] space-y-0.5 shadow-xl pointer-events-none">
          <div className="flex items-center gap-1.5 font-bold text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Cadastral Survey #{surveyNumber}</span>
            <span className="text-emerald-300 font-mono">({areaAcres} ac)</span>
          </div>
          <div className="text-slate-400 font-mono text-[9px]">
            GPS: {centroid[0].toFixed(5)}°N, {centroid[1].toFixed(5)}°E
          </div>
        </div>

        {/* Top-Right Drag Status Pill */}
        <div className="absolute top-2.5 right-12 bg-slate-950/90 backdrop-blur-md border border-slate-800 px-2.5 py-1 rounded-xl z-10 text-[10px] flex items-center gap-1.5 shadow-xl pointer-events-none">
          <span className="text-cyan-300 font-medium">
            {activeCornerIdx !== null
              ? `Dragging Corner P${activeCornerIdx + 1}...`
              : 'Drag pins P1–P4 to align with bunds'}
          </span>
        </div>

        {/* Bottom Real-Time Telemetry Bar */}
        <div className="absolute bottom-2 left-2 right-2 bg-slate-950/92 backdrop-blur-md border border-slate-800 px-3 py-2 rounded-xl z-10 flex flex-wrap items-center justify-between gap-2 text-xs shadow-2xl">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Marked Land Area</span>
              <span className="font-extrabold text-emerald-400 font-mono text-sm">
                {areaAcres} Acres
              </span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Perimeter Bunds</span>
              <span className="font-mono text-slate-200 text-[11px]">
                {totalPerimeterMeters}m ({coords.length} corners)
              </span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">National DIGIPIN</span>
              <span className="font-mono text-cyan-300 font-bold text-[11px]">
                {digipin}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold bg-emerald-950/70 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>4m×4m National Grid Cell Locked</span>
          </div>
        </div>
      </div>

      {/* Helpful Guidance Footer */}
      <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span>
            This satellite view is dynamically fetched for your exact GPS coordinates. Drag pins P1–P4 along the visible physical field bunds to define your claim boundary.
          </span>
        </div>
      </div>
    </div>
  );
};
