import React, { useEffect, useRef, useState } from 'react';

function loadGoogle({ apiKey }) {
  if (typeof window !== 'undefined' && window.google && window.google.maps) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const exists = document.querySelector('script[data-gmaps-loader]');
    if (exists) {
      exists.addEventListener('load', () => resolve());
      exists.addEventListener('error', reject);
      return;
    }
    const src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.defer = true;
    s.setAttribute('data-gmaps-loader', 'true');
    s.onload = () => resolve();
    s.onerror = (e) => reject(e);
    document.head.appendChild(s);
  });
}

export default function LocationPicker({ value, onChange, height = 280, defaultCenter = { lat: -37.787, lng: 175.279 } }) {
  const apiKey = (typeof window !== 'undefined' && localStorage.getItem('gmapsKey')) || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [ready, setReady] = useState(false);
  const inputRef = useRef(null);
  const mapRef = useRef(null);
  const gmap = useRef(null);
  const marker = useRef(null);
  const geocoder = useRef(null);

  useEffect(() => {
    if (!apiKey) return; // show plain input fallback
    loadGoogle({ apiKey })
      .then(() => setReady(true))
      .catch(() => setReady(false));
  }, [apiKey]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const center = value?.lat && value?.lng ? { lat: Number(value.lat), lng: Number(value.lng) } : defaultCenter;
    gmap.current = new window.google.maps.Map(mapRef.current, { center, zoom: 13 });
    marker.current = new window.google.maps.Marker({ position: center, map: gmap.current, draggable: true });
    geocoder.current = new window.google.maps.Geocoder();

    const ac = new window.google.maps.places.Autocomplete(inputRef.current, { fields: ['formatted_address', 'geometry', 'name'] });
    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      const loc = place.geometry?.location;
      if (!loc) return;
      const lat = loc.lat();
      const lng = loc.lng();
      gmap.current.setCenter({ lat, lng });
      marker.current.setPosition({ lat, lng });
      onChange?.({ address: place.formatted_address || place.name || '', lat, lng });
    });

    gmap.current.addListener('click', (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      marker.current.setPosition({ lat, lng });
      geocoder.current.geocode({ location: { lat, lng } }, (results, status) => {
        const address = status === 'OK' && results?.[0]?.formatted_address ? results[0].formatted_address : value?.address || '';
        onChange?.({ address, lat, lng });
        if (inputRef.current && address) inputRef.current.value = address;
      });
    });

    marker.current.addListener('dragend', () => {
      const pos = marker.current.getPosition();
      const lat = pos.lat();
      const lng = pos.lng();
      geocoder.current.geocode({ location: { lat, lng } }, (results, status) => {
        const address = status === 'OK' && results?.[0]?.formatted_address ? results[0].formatted_address : value?.address || '';
        onChange?.({ address, lat, lng });
        if (inputRef.current && address) inputRef.current.value = address;
      });
    });
  }, [ready]);

  useEffect(() => {
    if (!gmap.current || !marker.current) return;
    if (value?.lat && value?.lng) {
      const pos = { lat: Number(value.lat), lng: Number(value.lng) };
      gmap.current.setCenter(pos);
      marker.current.setPosition(pos);
    }
  }, [value?.lat, value?.lng]);

  const containerStyle = { width: '100%', height: `${height}px` };

  if (!apiKey) {
    return (
      <div className="space-y-2">
        <input
          ref={inputRef}
          defaultValue={value?.address || ''}
          onChange={(e) => onChange?.({ address: e.target.value, lat: value?.lat, lng: value?.lng })}
          placeholder="Address"
          className="mt-1 block w-full rounded-lg border-gray-300 focus:border-brand focus:ring-brand"
        />
        <div className="text-xs text-subtle">Add VITE_GOOGLE_MAPS_API_KEY to enable map.</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        defaultValue={value?.address || ''}
        placeholder="Search address"
        className="mt-1 block w-full rounded-lg border-gray-300 focus:border-brand focus:ring-brand"
      />
      <div ref={mapRef} style={containerStyle} className="rounded-lg border border-gray-200" />
    </div>
  );
}
