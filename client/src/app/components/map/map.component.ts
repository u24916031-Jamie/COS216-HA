/*
 * Tamlyn Khan
 * u24675815
 * Jamie King
 * u24916031
 * Isabella Engelbrecht
 * u25090501
 */

import {Component, Input, OnChanges, AfterViewInit, OnDestroy, SimpleChanges} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { Airport } from '../../models/airport.model';
import { WebSocketService } from '../../services/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css'
})
export class MapComponent implements AfterViewInit, OnChanges, OnDestroy
{
  @Input() airports: Airport[] = [];
  @Input() trackedFlightId: number | null = null;

  private map!: L.Map;
  private airportMarkers: Map<number, L.Marker> = new Map();
  private aircraftMarker: L.Marker | null = null;
  private trailLine: L.Polyline | null = null;
  private trailPoints: L.LatLngTuple[] = [];
  private savedTrails: Map<number, L.LatLngTuple[]> = new Map();
  private positionSub?: Subscription;
  private prevLat: number | null = null;
  private prevLng: number | null = null;
  private bearing = 0;

  currentStatus = '';
  currentProgress = 0;
  currentLat: number | null = null;
  currentLng: number | null = null;

  constructor(private ws: WebSocketService) {}

  ngAfterViewInit(): void
  {
    this.initMap();
    this.subscribeToPosition();
  }

  ngOnChanges(changes: SimpleChanges): void
  {
    if (changes['airports'] && this.map)
    {
      this.renderAirports();
    }
    const fc = changes['trackedFlightId'];
    if (fc && this.map && fc.previousValue !== this.trackedFlightId)
    {
      const prevId: number | null = fc.previousValue;
      if (prevId !== null && this.trailPoints.length > 0)
        this.savedTrails.set(prevId, [...this.trailPoints]);

      this.clearAircraft();

      if (this.trackedFlightId !== null)
      {
        const saved = this.savedTrails.get(this.trackedFlightId);
        if (saved && saved.length > 0)
        {
          this.trailPoints = [...saved];
          this.prevLat = saved[saved.length - 1][0];
          this.prevLng = saved[saved.length - 1][1];
          this.trailLine = L.polyline(this.trailPoints, {
            color: '#c0392b', weight: 2, opacity: 0.7, dashArray: '6 4', interactive: false
          }).addTo(this.map);
        }
        this.ws.track(this.trackedFlightId);
      }
    }
  }

  private initMap(): void
  {
    this.map = L.map('leaflet-map', { center: [20, 0], zoom: 2 });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(this.map);

    setTimeout(() => this.map.invalidateSize(), 0);

    if (this.airports.length)
      this.renderAirports();
  }

  private renderAirports(): void
  {
    this.airportMarkers.forEach(m => m.remove());
    this.airportMarkers.clear();

    for (const airport of this.airports)
    {
      const icon = L.divIcon({
        html: `<div class="airport-marker-icon">${airport.iata_code}</div>`,
        className: '',
        iconSize: [42, 20],
        iconAnchor: [21, 10]
      });

      const marker = L.marker([airport.latitude, airport.longitude], { icon })
        .addTo(this.map)
        .bindPopup(`<b>${airport.name}</b><br>${airport.city}, ${airport.country}`);

      this.airportMarkers.set(airport.id, marker);
    }
  }

  private subscribeToPosition(): void
  {
    this.positionSub = this.ws.onPosition.subscribe(pos =>
    {
      if (pos.flightId !== undefined && pos.flightId !== this.trackedFlightId) return;
      this.currentStatus = pos.status;
      this.currentProgress = pos.progress ?? this.currentProgress;
      this.currentLat = pos.latitude;
      this.currentLng = pos.longitude;
      this.moveAircraft(pos.latitude, pos.longitude);
    });
  }

  private getBearing(lat1: number, lng1: number, lat2: number, lng2: number): number
  {
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const lat1R = lat1 * Math.PI / 180;
    const lat2R = lat2 * Math.PI / 180;
    const y = Math.sin(dLng) * Math.cos(lat2R);
    const x = Math.cos(lat1R) * Math.sin(lat2R) - Math.sin(lat1R) * Math.cos(lat2R) * Math.cos(dLng);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }

  private planeIcon(bearing: number): L.DivIcon
  {
    const p = `M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z`;
    const rot = bearing - 45;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(${rot}deg);display:block"><path stroke="#000" stroke-width="4" d="${p}"/><path stroke="#c0392b" stroke-width="2" d="${p}"/></svg>`;
    return L.divIcon({
      html: `<div class="aircraft-marker-icon">${svg}</div>`,
      className: '',
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });
  }

  private moveAircraft(lat: number, lng: number): void
  {
    if (this.prevLat !== null && this.prevLng !== null)
    {
      const b = this.getBearing(this.prevLat, this.prevLng, lat, lng);
      if (Math.abs(b - this.bearing) > 0.1) this.bearing = b;
    }
    this.prevLat = lat;
    this.prevLng = lng;

    this.trailPoints.push([lat, lng]);
    if (!this.trailLine)
    {
      this.trailLine = L.polyline(this.trailPoints, {
        color: '#c0392b', weight: 2, opacity: 0.7, dashArray: '6 4', interactive: false
      }).addTo(this.map);
    }
    else
    {
      this.trailLine.setLatLngs(this.trailPoints);
    }

    if (!this.aircraftMarker)
    {
      this.aircraftMarker = L.marker([lat, lng], {
        icon: this.planeIcon(this.bearing), interactive: false
      }).addTo(this.map);
    }
    else
    {
      this.aircraftMarker.setLatLng([lat, lng]);
      this.aircraftMarker.setIcon(this.planeIcon(this.bearing));
    }
  }

  clearAircraft(): void
  {
    this.aircraftMarker?.remove();
    this.aircraftMarker = null;
    this.trailLine?.remove();
    this.trailLine = null;
    this.trailPoints = [];
    this.currentStatus = '';
    this.currentProgress = 0;
    this.prevLat = null;
    this.prevLng = null;
    this.bearing = 0;
  }

  ngOnDestroy(): void
  {
    this.positionSub?.unsubscribe();
    if (this.map)
      this.map.remove();
  }
}
