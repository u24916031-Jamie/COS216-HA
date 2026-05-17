/*
 * Tamlyn Khan
 * u24675815
 * Jamie King
 * u24916031
 * Isabella Engelbrecht
 * u25090501
 */

import { Injectable } from '@angular/core';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';

const API_URL = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class AuthService
{
  private currentUser: User | null = null;

  async login(email: string, password: string): Promise<User>
  {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'Login', email, password })
    });

    const json = await res.json();

    if (!res.ok || json.status !== 'success')
    {
      throw new Error(json.message || 'Login failed');
    }

    this.currentUser = json.data[0] as User;
    sessionStorage.setItem('ft_user', JSON.stringify(this.currentUser));
    return this.currentUser;
  }

  getUser(): User | null
  {
    if (!this.currentUser)
    {
      const stored = sessionStorage.getItem('ft_user');
      if (stored) this.currentUser = JSON.parse(stored) as User;
    }
    return this.currentUser;
  }

  logout(): void
  {
    this.currentUser = null;
    sessionStorage.removeItem('ft_user');
    sessionStorage.removeItem('ft_port');
  }
}
