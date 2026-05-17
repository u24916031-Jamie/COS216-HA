/*
 * Tamlyn Khan
 * u24675815
 * Jamie King
 * u24916031
 * Isabella Engelbrecht
 * u25090501
 */

import { Injectable } from '@angular/core';
import { Airport } from '../models/airport.model';
import { Flight, FlightDetail } from '../models/flight.model';
import { environment } from '../../environments/environment';

const API_URL = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ApiService
{

  private async post(body: object): Promise<any>
  {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const json = await res.json();
    if (json.status !== 'success')
    {
      throw new Error(json.message || `API error ${res.status}`);
    }
    return json.data;
  }

  async getAirports(apiKey: string): Promise<Airport[]>
  {
    const data = await this.post({ type: 'GetAirports', api_key: apiKey });
    return data as Airport[];
  }

  async getAllFlights(apiKey: string): Promise<Flight[]>
  {
    const data = await this.post({ type: 'GetAllFlights', api_key: apiKey });
    return data as Flight[];
  }

  async getFlight(flightId: number, apiKey: string): Promise<FlightDetail>
  {
    const data = await this.post({ type: 'GetFlight', flight_id: flightId, api_key: apiKey });
    const detail: FlightDetail = { ...data.flight, passengers: data.passengers ?? [] };
    return detail;
  }
}
