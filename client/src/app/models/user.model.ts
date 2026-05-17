/*
 * Tamlyn Khan
 * u24675815
 * Jamie King
 * u24916031
 * Isabella Engelbrecht
 * u25090501
 */

export interface User {
  id: number;
  username: string;
  email: string;
  type: 'Passenger' | 'ATC';
  apikey: string;
}
