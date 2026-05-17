/*
 * Tamlyn Khan
 * u24675815
 * Jamie King
 * u24916031
 * Isabella Engelbrecht
 * u25090501
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { WebSocketService } from '../../services/websocket.service';
import { FlightDetail } from '../../models/flight.model';
import { Airport } from '../../models/airport.model';
import { MapComponent } from '../map/map.component';

@Component({
  selector: 'app-atc',
  standalone: true,
  imports: [CommonModule, MapComponent, LucideAngularModule],
  templateUrl: './atc.component.html',
  styleUrl: './atc.component.css'
})
export class AtcComponent implements OnInit, OnDestroy
{
  flights: FlightDetail[] = [];
  airports: Airport[] = [];
  selectedFlight: FlightDetail | null = null;
  trackedFlightId: number | null = null;

  noShowAlerts: string[] = [];
  boardingAlerts: string[] = [];
  currentProgress = 0;
  errorMessage = '';
  wsError = '';
  disconnected = false;
  serverShutdown = false;
  loading = true;
  dispatching = false;

  private subs: Subscription[] = [];

  constructor(
    private auth: AuthService,
    private api: ApiService,
    private ws: WebSocketService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void>
  {
    const user = this.auth.getUser();
    if (!user)
    {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.ws.isConnected())
    {
      this.ws.connect(this.ws.getStoredPort(), user.type, user.username, user.apikey);
    }

    this.subscribeToSocket();

    try
    {
      const [basicFlights, airports] = await Promise.all([
        this.api.getAllFlights(user.apikey),
        this.api.getAirports(user.apikey)
      ]);
      this.airports = airports;
      const enriched = await Promise.all(
        basicFlights.map(f => this.api.getFlight(f.id, user.apikey))
      );
      this.flights = enriched;
    }
    catch (err: any)
    {
      this.errorMessage = err.message || 'Failed to load data.';
    }
    finally
    {
      this.loading = false;
    }
  }

  private subscribeToSocket(): void
  {
    const user = this.auth.getUser()!;

    this.subs.push(
      this.ws.onPosition.subscribe(pos =>
      {
        if (pos.flightId !== undefined && pos.flightId !== this.trackedFlightId) return;
        this.currentProgress = pos.progress ?? 0;
        if (this.trackedFlightId)
        {
          const f = this.flights.find(fl => fl.id === this.trackedFlightId);
          if (f) f.status = pos.status as any;
          if (this.selectedFlight?.id === this.trackedFlightId)
            this.selectedFlight.status = pos.status as any;
        }
      })
    );

    this.subs.push(
      this.ws.onNoShow.subscribe(async (data: any) =>
      {
        const msg = data?.username
          ? `No-show: ${data.username} missed boarding for flight #${data.flightId}`
          : 'A passenger missed their boarding window.';
        this.noShowAlerts.push(msg);
        if (this.selectedFlight)
        {
          this.refreshSelectedFlight(user.apikey);
        }
      })
    );

    this.subs.push(
      this.ws.onBoardingConfirmed.subscribe(async (data: any) =>
      {
        const msg = data?.username
          ? `${data.username} confirmed boarding for flight #${data.flightId}`
          : 'A passenger confirmed boarding.';
        this.boardingAlerts.push(msg);
        if (this.selectedFlight)
        {
          this.refreshSelectedFlight(user.apikey);
        }
      })
    );

    this.subs.push(
      this.ws.onQuit.subscribe(() =>
      {
        this.serverShutdown = true;
        this.wsError = 'Server has shut down.';
      })
    );

    this.subs.push(
      this.ws.onError.subscribe(msg =>
      {
        this.wsError = msg;
      })
    );

    this.subs.push(
      this.ws.onDisconnect.subscribe(reason =>
      {
        if (reason !== 'io client disconnect')
        {
          this.disconnected = true;
          this.wsError = 'Disconnected from server. Please refresh the page.';
        }
      })
    );
  }

  private async refreshSelectedFlight(apiKey: string): Promise<void>
  {
    if (!this.selectedFlight) return;
    try
    {
      const updated = await this.api.getFlight(this.selectedFlight.id, apiKey);
      this.selectedFlight = updated;
      const idx = this.flights.findIndex(f => f.id === updated.id);
      if (idx >= 0) this.flights[idx] = updated;
    }
    catch { }
  }

  selectFlight(flight: FlightDetail): void
  {
    this.selectedFlight = flight;
  }

  async dispatchFlight(flight: FlightDetail): Promise<void>
  {
    if (this.dispatching) return;
    this.dispatching = true;
    this.ws.dispatch(flight.id);
    flight.status = 'Boarding';
    if (this.selectedFlight?.id === flight.id)
    {
      this.selectedFlight.status = 'Boarding';
    }
    this.dispatching = false;

    setTimeout(async () =>
    {
      const user = this.auth.getUser();
      if (user) await this.refreshSelectedFlight(user.apikey);
    }, 2000);
  }

  trackFlight(flight: FlightDetail): void
  {
    this.trackedFlightId = flight.id;
    this.selectedFlight = flight;
  }

  dismissNoShow(i: number): void
  {
    this.noShowAlerts.splice(i, 1);
  }

  dismissBoarding(i: number): void
  {
    this.boardingAlerts.splice(i, 1);
  }

  logout(): void
  {
    this.ws.disconnect();
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  getStatusClass(status: string): string
  {
    return 'status-' + status.toLowerCase().replace(' ', '-');
  }

  ngOnDestroy(): void
  {
    this.subs.forEach(s => s.unsubscribe());
  }
}
