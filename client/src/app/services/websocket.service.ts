/*
 * Tamlyn Khan
 * u24675815
 * Jamie King
 * u24916031
 * Isabella Engelbrecht
 * u25090501
 */

import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

export interface PositionUpdate
{
  latitude: number;
  longitude: number;
  status: string;
  progress?: number;
  flightId?: number;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService
{
  private socket: Socket | null = null;

  private boardingCall$ = new Subject<any>();
  private position$ = new Subject<PositionUpdate>();
  private quit$ = new Subject<void>();
  private error$ = new Subject<string>();
  private boardingConfirmed$ = new Subject<any>();
  private noShow$ = new Subject<any>();
  private disconnect$ = new Subject<string>();
  private connected$ = new Subject<boolean>();

  constructor(private ngZone: NgZone) {}

  connect(port: number, userType: string, username: string, apikey: string): void
  {
    sessionStorage.setItem('ft_port', String(port));
    if (this.socket?.connected)
    {
      this.socket.disconnect();
    }

    this.socket = io(`http://localhost:${port}`, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () =>
    {
      this.ngZone.run(() =>
      {
        const type = userType === 'Passenger' ? 'passenger' : 'ATC';
        this.socket!.emit('INIT', type, username, apikey);
        this.connected$.next(true);
      });
    });

    this.socket.on('BOARDING_CALL', (data?: any) =>
    {
      this.ngZone.run(() => this.boardingCall$.next(data ?? null));
    });

    this.socket.on('POSITION', (latitude: number, longitude: number, status: string, progress?: number, flightId?: number) =>
    {
      this.ngZone.run(() => this.position$.next({ latitude, longitude, status, progress, flightId }));
    });

    this.socket.on('QUIT', () =>
    {
      this.ngZone.run(() => this.quit$.next());
    });

    this.socket.on('ERROR', (message: string) =>
    {
      this.ngZone.run(() => this.error$.next(message));
    });

    this.socket.on('BOARDING_CONFIRMED', (data: any) =>
    {
      this.ngZone.run(() => this.boardingConfirmed$.next(data));
    });

    this.socket.on('NO_SHOW', (data: any) =>
    {
      this.ngZone.run(() => this.noShow$.next(data));
    });

    this.socket.on('disconnect', (reason: string) =>
    {
      this.ngZone.run(() => this.disconnect$.next(reason));
    });

    this.socket.on('connect_error', (err: Error) =>
    {
      this.ngZone.run(() => this.error$.next(`Connection error: ${err.message}`));
    });
  }

  dispatch(flightId: number): void
  {
    this.socket?.emit('DISPATCH', flightId);
  }

  board(flightId: number): void
  {
    this.socket?.emit('BOARD', flightId);
  }

  track(flightId: number): void
  {
    this.socket?.emit('TRACK', flightId);
  }

  get onBoardingCall(): Observable<any> { return this.boardingCall$.asObservable(); }
  get onPosition(): Observable<PositionUpdate> { return this.position$.asObservable(); }
  get onQuit(): Observable<void> { return this.quit$.asObservable(); }
  get onError(): Observable<string> { return this.error$.asObservable(); }
  get onBoardingConfirmed(): Observable<any> { return this.boardingConfirmed$.asObservable(); }
  get onNoShow(): Observable<any> { return this.noShow$.asObservable(); }
  get onDisconnect(): Observable<string> { return this.disconnect$.asObservable(); }
  get onConnected(): Observable<boolean> { return this.connected$.asObservable(); }

  getStoredPort(): number
  {
    return parseInt(sessionStorage.getItem('ft_port') ?? '3001');
  }

  isConnected(): boolean
  {
    return this.socket?.connected ?? false;
  }

  disconnect(): void
  {
    this.socket?.disconnect();
    this.socket = null;
  }
}
