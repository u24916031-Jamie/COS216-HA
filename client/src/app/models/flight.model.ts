/*
 * Tamlyn Khan
 * u24675815
 * Jamie King
 * u24916031
 * Isabella Engelbrecht
 * u25090501
 */

export type FlightStatus = 'Scheduled' | 'Boarding' | 'In Flight' | 'Landed';

export interface Flight {
  id: number;
  flight_number: string;
  origin_airport_id?: number;
  destination_airport_id?: number;
  origin_airport?: string;
  destination_airport?: string;
  departure_time?: string;
  flight_duration_hours?: number;
  status: FlightStatus;
  current_latitude?: number;
  current_longitude?: number;
  dispatched_at?: string;
  seat_number?: string;
  boarding_confirmed?: number;
  confirmed_at?: string;
}

export interface PassengerInfo {
  id: number;
  username: string;
  boarding_confirmed: number;
}

export interface FlightDetail extends Flight {
  passengers?: PassengerInfo[];
}
