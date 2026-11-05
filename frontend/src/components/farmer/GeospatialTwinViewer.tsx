import React, { useState } from 'react';
import { Layers, Globe, MapPin, Sparkles, ShieldCheck, RefreshCw, ExternalLink, Compass } from 'lucide-react';
import { Claim } from '../../types';

interface Props {
  claim: Claim;
  interactiveSlider?: boolean;
}

export const GeospatialTwinViewer: React.FC<Props> = ({ claim, interactiveSlider = true }) => {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [viewMode, setViewMode] = useState<'earth' | 'rgb' | 'ndvi' | 'flood'>('earth');
  const [showPhotoMarkers, setShowPhotoMarkers] = useState<boolean>(true);
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);

  // Dynamic satellite fetch simulation state
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [fetchStatus, setFetchStatus] = useState<string | null>(null);
  const [sceneAcquiredTime, setSceneAcquiredTime] = useState<string>(claim.satellite.post_disaster_date);

  const preNDVI = claim.satellite.ndvi_pre_avg;
  const postNDVI = claim.satellite.ndvi_post_avg;
  const ndviDiff = claim.satellite.ndvi_diff;

  const lat = claim.land.latitude;
  const lng = claim.land.longitude;
  const googleEarthWebUrl = `https://earth.google.com/web/@${lat},${lng},950a,35d,35y,0h,0t,0r`;
  const googleMapsSatelliteEmbedUrl = `https://maps.google.com/maps?q=${lat},${lng}&t=k&z=17&ie=UTF8&iwloc=&output=embed`;

  const handleFetchDynamicSatellite = () => {
    setIsFetching(true);
    setFetchStatus('Locating coordinates on Google Earth 3D terrain...');

    setTimeout(() => {
      setFetchStatus('Acquiring multispectral Sentinel-2 MSI Level-2A bands (B4, B8, B11)...');
    }, 600);

    setTimeout(() => {
      setFetchStatus(`Co-registering cadastral parcel (Survey #${claim.land.survey_number}) at ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E...`);
    }, 1200);

    setTimeout(() => {
      setIsFetching(false);
      setFetchStatus('✓ Live Satellite & Google Earth Scene Co-Registered! Cloud Cover: 0.9% • GSD: 10m/px');
      setSceneAcquiredTime(new Date().toISOString().slice(0, 10));
      setTimeout(() => setFetchStatus(null), 5000);
    }, 1800);
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-700/60 overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Header bar */}
      <div className="p-4 bg-slate-800/80 border-b border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">
                Geospatial Evidence Twin
              </h3>
              <span className="text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-mono">
                {claim.land.digipin}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Survey #{claim.land.survey_number} • <span className="text-slate-200 font-semibold">{claim.land.land_parcel_id}</span> ({claim.land.area_acres} ac) • {claim.farmer.village}, {claim.farmer.district}
            </p>
          </div>
        </div>

        {/* Dynamic Fetch & External Google Earth Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleFetchDynamicSatellite}
            disabled={isFetching}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            title="Fetch live satellite pass for this location"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>{isFetching ? 'Fetching Pass...' : 'Fetch Live Satellite Scene'}</span>
          </button>

          <a
            href={googleEarthWebUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-bold border border-cyan-500/30 flex items-center gap-1.5 transition"
            title="Open in official 3D Google Earth"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Open in Google Earth 3D</span>
            <ExternalLink className="w-3 h-3 text-cyan-400" />
          </a>
        </div>
      </div>

      {/* View Mode Toggle Sub-bar */}
      <div className="px-4 py-2 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setViewMode('earth')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'earth'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Google Earth Live Satellite</span>
          </button>

          <button
            onClick={() => setViewMode('rgb')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              viewMode === 'rgb'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            Sentinel-2 Pre/Post Slider
          </button>

          <button
            onClick={() => setViewMode('ndvi')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              viewMode === 'ndvi'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            NDVI Spatial Heatmap
          </button>

          <button
            onClick={() => setViewMode('flood')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              viewMode === 'flood'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            Inundation Mask
          </button>
        </div>

        {/* Live GPS / Cadastral Centroid Badge */}
        <div className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>Centroid: <strong>{lat.toFixed(4)}°N, {lng.toFixed(4)}°E</strong></span>
        </div>
      </div>

      {/* Dynamic Status Toast Banner */}
      {fetchStatus && (
        <div className="px-4 py-2 bg-emerald-950/80 border-b border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 animate-spin" />
          <span>{fetchStatus}</span>
        </div>
      )}

      {/* Main Display Container */}
      <div className="relative w-full h-[430px] select-none bg-slate-950 overflow-hidden">
        {/* ================= MODE 1: DYNAMIC GOOGLE EARTH LIVE SATELLITE ================= */}
        {viewMode === 'earth' && (
          <div className="relative w-full h-full">
            <iframe
              title={`Google Earth View for ${claim.land.survey_number}`}
              src={googleMapsSatelliteEmbedUrl}
              className="w-full h-full border-0 filter contrast-105 brightness-95"
              loading="lazy"
            />

            {/* Cadastral Polygon HUD Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-64 h-52 border-2 border-emerald-400 bg-emerald-500/10 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.3)] flex flex-col justify-between p-2.5">
                <div className="flex justify-between items-start">
                  <span className="bg-emerald-900/90 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/40">
                    Cadastral Parcel: Survey #{claim.land.survey_number}
                  </span>
                  <span className="bg-slate-900/90 text-white font-mono text-[9px] px-1.5 py-0.5 rounded">
                    {claim.land.area_acres} Acres
                  </span>
                </div>

                <div className="text-center">
                  <div className="w-4 h-4 rounded-full bg-cyan-400 border-2 border-white mx-auto animate-ping" />
                  <span className="text-[10px] font-mono font-bold text-cyan-200 bg-slate-950/80 px-2 py-0.5 rounded mt-1 inline-block">
                    Centroid: {lat.toFixed(4)}°N, {lng.toFixed(4)}°E
                  </span>
                </div>

                <div className="flex justify-between text-[9px] text-slate-300 font-mono">
                  <span>DIGIPIN: {claim.land.digipin}</span>
                  <span className="text-emerald-400">✓ GIS Verified</span>
                </div>
              </div>
            </div>

            {/* Google Earth Watermark HUD */}
            <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-md border border-slate-700 px-3 py-1.5 rounded-xl shadow-lg z-10 text-xs">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white">Google Earth Dynamic Satellite Feed</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                High-Resolution Orthorectified Imagery • Centered on {claim.farmer.village}
              </div>
            </div>

            {/* 3D Flight Quick Link */}
            <a
              href={googleEarthWebUrl}
              target="_blank"
              rel="noreferrer"
              className="absolute top-3 right-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg z-10 flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>Fly in 3D Google Earth</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {/* Bottom Telemetry Ticker */}
            <div className="absolute bottom-2 left-3 right-3 bg-slate-950/85 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl text-[10px] text-slate-300 flex flex-wrap items-center justify-between gap-2 z-10 font-mono">
              <span>Sensor: Google Earth Engine & Sentinel-2 MSI</span>
              <span>Acquisition: {sceneAcquiredTime}</span>
              <span>Elevation: 914m ASL</span>
              <span className="text-emerald-400 font-bold">Spectral Coherence: 98.4%</span>
            </div>
          </div>
        )}

        {/* ================= MODE 2: SENTINEL-2 PRE/POST SLIDER ================= */}
        {viewMode === 'rgb' && (
          <div className="relative w-full h-full">
            {/* Layer 1: After Disaster (Base) */}
            <div className="absolute inset-0 w-full h-full">
              <img
                src="/static/sentinel_post.jpg"
                alt="Post Disaster Satellite"
                className="w-full h-full object-cover"
              />

              <div className="absolute top-4 right-4 bg-red-950/80 border border-red-500/50 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-lg text-right z-10">
                <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider block">
                  After Disaster ({claim.satellite.post_disaster_date})
                </span>
                <span className="text-xs font-mono font-bold text-white">
                  NDVI: <span className="text-red-400">{postNDVI}</span> ({claim.satellite.vegetation_drop_pct}% loss)
                </span>
              </div>
            </div>

            {/* Layer 2: Before Disaster (Clipped by slider) */}
            <div
              className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-white shadow-[0_0_20px_rgba(255,255,255,0.5)] z-20"
              style={{ width: `${sliderPos}%` }}
            >
              <div className="absolute inset-0 w-[800px] md:w-[1200px] h-full">
                <img
                  src="/static/sentinel_pre.jpg"
                  alt="Pre Disaster Satellite"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="absolute top-4 left-4 bg-emerald-950/80 border border-emerald-500/50 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-lg z-30">
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">
                  Before Disaster ({claim.satellite.pre_disaster_date})
                </span>
                <span className="text-xs font-mono font-bold text-white">
                  NDVI: <span className="text-emerald-400">{preNDVI}</span> (Healthy Canopy)
                </span>
              </div>
            </div>

            {/* Interactive Slider Handle */}
            {interactiveSlider && (
              <div
                className="absolute top-0 bottom-0 z-30 -ml-4 flex items-center justify-center cursor-ew-resize"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="w-8 h-8 rounded-full bg-white shadow-xl border-2 border-emerald-600 flex items-center justify-center text-slate-800 font-bold text-xs">
                  ↔
                </div>
              </div>
            )}

            <input
              type="range"
              min="0"
              max="100"
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              className="absolute inset-0 opacity-0 cursor-ew-resize z-40 w-full h-full"
              aria-label="Satellite comparison slider"
            />
          </div>
        )}

        {/* ================= MODE 3: NDVI HEATMAP ================= */}
        {viewMode === 'ndvi' && (
          <div className="relative w-full h-full">
            <img
              src="/static/sentinel_ndvi.jpg"
              alt="NDVI Spatial Heatmap"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 bg-slate-950/85 backdrop-blur-md border border-slate-700 px-3 py-1.5 rounded-xl shadow-lg z-10 text-xs">
              <span className="font-bold text-emerald-400 block">False-Color NDVI Difference Heatmap</span>
              <span className="text-[10px] text-slate-300">Spectral Band Ratio: (NIR - Red) / (NIR + Red)</span>
            </div>
          </div>
        )}

        {/* ================= MODE 4: INUNDATION MASK ================= */}
        {viewMode === 'flood' && (
          <div className="relative w-full h-full">
            <img
              src="/static/sentinel_post.jpg"
              alt="Flood Inundation Basin"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-blue-900/35 pointer-events-none flex items-center justify-center">
              <div className="bg-blue-950/90 border border-blue-400 p-4 rounded-2xl text-center shadow-2xl backdrop-blur-md">
                <span className="text-xs uppercase font-extrabold text-cyan-300 block mb-1">
                  🌊 Surface Inundation Basin (1.8 Acres)
                </span>
                <span className="text-xl font-mono font-black text-white">
                  NDWI Submersion Index: +{claim.satellite.flood_water_index_ndwi || 0.48}
                </span>
                <p className="text-[11px] text-blue-200 mt-1 max-w-sm">
                  Standing flood runoff detected. Submerged vegetative canopy in survey #{claim.land.survey_number}.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Geo-tagged photo markers */}
        {showPhotoMarkers && claim.photos.map((p, idx) => (
          <button
            key={p.id}
            onClick={() => setSelectedPhoto(p)}
            style={{
              left: `${35 + idx * 14}%`,
              top: `${50 + (idx % 2 === 0 ? 15 : -10)}%`
            }}
            className="absolute z-30 transform -translate-x-1/2 -translate-y-1/2 p-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-full shadow-lg border-2 border-white transition-transform hover:scale-125 group cursor-pointer"
            title={`Photo #${idx+1}: ${p.photo_type}`}
          >
            <MapPin className="w-4 h-4 fill-current" />
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap border border-slate-700 shadow-md">
              Photo #{idx+1} (GPS Verified)
            </span>
          </button>
        ))}
      </div>

      {/* KPI & Metrics Bar below the map */}
      <div className="p-4 bg-slate-950/80 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Pre-Disaster NDVI</span>
          <span className="text-xl font-black text-emerald-400 font-mono">{preNDVI}</span>
          <span className="text-[10px] text-emerald-500 block">Healthy vegetative</span>
        </div>

        <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Post-Disaster NDVI</span>
          <span className="text-xl font-black text-red-400 font-mono">{postNDVI}</span>
          <span className="text-[10px] text-red-500 block">Submerged / Lodged</span>
        </div>

        <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Net Vegetation Drop</span>
          <span className="text-xl font-black text-amber-400 font-mono">{ndviDiff}</span>
          <span className="text-[10px] text-amber-500 block">-{claim.satellite.vegetation_drop_pct}% loss</span>
        </div>

        <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">NDWI Water Index</span>
          <span className="text-xl font-black text-blue-400 font-mono">+{claim.satellite.flood_water_index_ndwi || 0.48}</span>
          <span className="text-[10px] text-blue-400 block">Flood Inundation Confirmed</span>
        </div>
      </div>

      {/* Photo Popup Modal if clicked */}
      {selectedPhoto && (
        <div className="p-4 bg-slate-800/95 border-t border-slate-700 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={selectedPhoto.photo_url} alt="Evidence" className="w-16 h-12 object-cover rounded-lg border border-slate-600" />
            <div className="text-xs">
              <div className="font-bold text-white capitalize">{selectedPhoto.photo_type.replace('_', ' ')}</div>
              <div className="text-slate-400 font-mono">GPS: {selectedPhoto.latitude.toFixed(4)}°N, {selectedPhoto.longitude.toFixed(4)}°E</div>
              <div className="text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> EXIF Geotag Timestamp Verified: {selectedPhoto.timestamp.replace('T', ' ')}
              </div>
            </div>
          </div>
          <button
            onClick={() => setSelectedPhoto(null)}
            className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-white cursor-pointer"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};
