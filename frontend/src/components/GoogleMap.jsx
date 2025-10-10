import React from 'react';

// Lightweight Google Map component.
// Loads the Maps JS SDK on demand and renders optional markers.
export default function GoogleMap({ center, markers = [], height = 300, zoom = 12 }) {
  const apiKey = (typeof window !== 'undefined' && localStorage.getItem('gmapsKey')) || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!apiKey || !center?.lat || !center?.lng) return;
    const ensure = () => new Promise((resolve, reject) => {
      if (window.google?.maps) return resolve();
      const s = document.createElement('script');
      s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      s.async = true; s.defer = true;
      s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
    ensure().then(() => {
      const map = new window.google.maps.Map(ref.current, {
        center,
        zoom,
        styles: [
          // Slightly desaturated theme to fit green/white UI
          { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
          { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
        ],
      });
      markers.forEach((m) => {
        if (!m.lat || !m.lng) return;
        const marker = new window.google.maps.Marker({
          position: { lat: Number(m.lat), lng: Number(m.lng) },
          map,
          title: m.title,
        });
        if (m.info) {
          const infoWindow = new window.google.maps.InfoWindow({ content: m.info });
          marker.addListener('click', () => infoWindow.open({ map, anchor: marker }));
        }
      });
    });
  }, [apiKey, center?.lat, center?.lng, JSON.stringify(markers)]);

  if (!apiKey || !center?.lat || !center?.lng) return null;
  return <div ref={ref} style={{ width: '100%', height, borderRadius: '0.5rem', border: '1px solid #e5e7eb' }} />;
}
