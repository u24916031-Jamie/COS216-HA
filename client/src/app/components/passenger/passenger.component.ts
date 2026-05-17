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
import { Flight } from '../../models/flight.model';
import { Airport } from '../../models/airport.model';
import { MapComponent } from '../map/map.component';

@Component({
  selector: 'app-passenger',
  standalone: true,
  imports: [CommonModule, MapComponent, LucideAngularModule],
  templateUrl: './passenger.component.html',
  styleUrl: './passenger.component.css'
})
export class PassengerComponent implements OnInit, OnDestroy
{
  flights: Flight[] = [];
  airports: Airport[] = [];
  selectedFlight: Flight | null = null;
  trackedFlightId: number | null = null;

  boarding: { flightId: number; flightNumber: string; countdown: number } | null = null;
  private boardingTimer: any = null;

  currentProgress = 0;
  errorMessage = '';
  wsError = '';
  disconnected = false;
  serverShutdown = false;
  loading = true;

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
      const [flights, airports] = await Promise.all([
        this.api.getAllFlights(user.apikey),
        this.api.getAirports(user.apikey)
      ]);
      this.flights = flights;
      this.airports = airports;
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
          this.updateFlightStatus(this.trackedFlightId, pos.status);
      })
    );

    this.subs.push(
      this.ws.onBoardingCall.subscribe(async (data: any) =>
      {
        let flightId: number | null = data?.flightId ?? null;
        let flightNumber = data?.flightNumber ?? '';

        if (flightId)
        {
          const match = this.flights.find(fl => fl.id === flightId);
          if (match) flightNumber = flightNumber || match.flight_number;
          this.updateFlightStatus(flightId, 'Boarding');
        }
        else
        {
          try
          {
            this.flights = await this.api.getAllFlights(user.apikey);
            const bf = this.flights.find(f => f.status === 'Boarding');
            if (bf) { flightId = bf.id; flightNumber = bf.flight_number; }
          }
          catch { }
        }

        if (flightId)
        {
          this.startBoardingCountdown(flightId, flightNumber);
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

  private startBoardingCountdown(flightId: number, flightNumber: string): void
  {
    this.clearBoardingTimer();
    this.boarding = { flightId, flightNumber, countdown: 60 };

    this.boardingTimer = setInterval(() =>
    {
      if (this.boarding)
      {
        this.boarding.countdown--;
        if (this.boarding.countdown <= 0)
        {
          const fid = this.boarding.flightId;
          this.clearBoardingTimer();
          this.boarding = null;
          const f = this.flights.find(fl => fl.id === fid);
          this.updateFlightStatus(fid, 'In Flight');
          this.trackedFlightId = fid;
        }
      }
    }, 1000);
  }

  private updateFlightStatus(flightId: number, status: string): void
  {
    this.flights = this.flights.map(f =>
      f.id === flightId ? { ...f, status: status as any } : f
    );
    if (this.selectedFlight?.id === flightId)
      this.selectedFlight = { ...this.selectedFlight, status: status as any };
  }

  private clearBoardingTimer(): void
  {
    if (this.boardingTimer)
    {
      clearInterval(this.boardingTimer);
      this.boardingTimer = null;
    }
  }

  confirmBoarding(): void
  {
    if (!this.boarding) return;
    const fid = this.boarding.flightId;
    this.ws.board(fid);
    this.clearBoardingTimer();
    this.boarding = null;
    this.flights = this.flights.map(f => f.id === fid ? { ...f, boarding_confirmed: 1 } : f);
    if (this.selectedFlight?.id === fid)
      this.selectedFlight = { ...this.selectedFlight, boarding_confirmed: 1 };
  }

  selectFlight(flight: Flight): void
  {
    this.selectedFlight = flight;
    if (flight.status === 'In Flight' || flight.status === 'Boarding')
      this.trackedFlightId = flight.id;
    else
      this.trackedFlightId = null;
  }

  trackFlight(flight: Flight): void
  {
    this.trackedFlightId = flight.id;
    this.selectedFlight = flight;
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
    this.clearBoardingTimer();
    this.subs.forEach(s => s.unsubscribe());
  }
}
