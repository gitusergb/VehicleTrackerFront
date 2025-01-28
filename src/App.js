import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import './style.css'; 

const vehicleIcon = new L.Icon({
  iconUrl: 'https://i.ibb.co/wWtv6hY/car.jpg',
  iconSize: [33, 33],
  iconAnchor: [16, 16],
});

const App = () => {
  const [route, setRoute] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [path, setPath] = useState([]);
  const [petrol, setPetrol] = useState(500);
  const [carName] = useState('Tesla Model S');
  const [rotation, setRotation] = useState(0); 

  useEffect(() => {
    const fetchRouteData = async () => {
      try {
        const response = await axios.get('https://vehicletrackerb.onrender.com/api/route');
        if (response.data && response.data.length > 0) {
          setRoute(response.data);
          setCurrentLocation(response.data[0]);
        }
      } catch (error) {
        console.error('Error fetching route data:', error);
      }
    };

    fetchRouteData();
  }, []);

  useEffect(() => {
    if (route.length > 1) {
      const moveVehicle = async () => {
        let index = 0;
        const steps = 50;
        const travelInterval = 200;

        while (index < route.length - 1) {
          const startPoint = route[index];
          const endPoint = route[index + 1];

          const latDiff = (endPoint.latitude - startPoint.latitude) / steps;
          const lngDiff = (endPoint.longitude - startPoint.longitude) / steps;

          for (let step = 1; step <= steps; step++) {
            const interpolatedPoint = {
              latitude: startPoint.latitude + latDiff * step,
              longitude: startPoint.longitude + lngDiff * step,
            };

            // Calculate rotation angle based on movement direction
            const angle = Math.atan2(
              endPoint.latitude - startPoint.latitude,
              endPoint.longitude - startPoint.longitude
            );
            setRotation((angle * 180) / Math.PI);

            setCurrentLocation(interpolatedPoint);
            setPath((prevPath) => [...prevPath, interpolatedPoint]);
            setPetrol((prevPetrol) => Math.max(prevPetrol - 0.5, 0));
            await new Promise((resolve) => setTimeout(resolve, travelInterval));
          }
          index++;
        }
      };

      moveVehicle();
    }
  }, [route]);

  if (!currentLocation) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container">
        <h3>Vehicle Tracker</h3>
      <MapContainer
        center={[currentLocation.latitude, currentLocation.longitude]}
        zoom={6}
        className="map-container"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution="&copy;(GB)"
        />
        <Marker
          position={[currentLocation.latitude, currentLocation.longitude]}
          icon={vehicleIcon}
        >
          <div
            className="vehicle-icon"
            style={{
              transform: `rotate(${rotation}deg)`,
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
              <div>
                <strong>Car Name:</strong> {carName} <br />
                <strong>Petrol Level:</strong> {petrol.toFixed(1)} liters <br />
                <strong>Location:</strong>{' '}
                {`Lat: ${currentLocation.latitude.toFixed(4)}, Lng: ${currentLocation.longitude.toFixed(4)}`}
              </div>
            </Tooltip>
          </div>
        </Marker>
        {route.length > 1 && (
          <Polyline
            positions={route.map((point) => [point.latitude, point.longitude])}
            color="blue"
          />
        )}
        {path.length > 1 && (
          <Polyline
            positions={path.map((point) => [point.latitude, point.longitude])}
            color="green"
          />
        )}
      </MapContainer>
    </div>
  );
};

export default App;
