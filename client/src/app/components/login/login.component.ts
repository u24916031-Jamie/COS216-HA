/*
 * Tamlyn Khan
 * u24675815
 * Jamie King
 * u24916031
 * Isabella Engelbrecht
 * u25090501
 */

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';
import { WebSocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, LucideAngularModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent
{
  email = '';
  password = '';
  port: number = 1067;
  error = '';
  loading = false;

  constructor(
    private auth: AuthService,
    private ws: WebSocketService,
    private router: Router
  ) {}

  async onLogin(): Promise<void>
  {
    this.error = '';
    if (!this.email || !this.password)
    {
      this.error = 'Please enter email and password.';
      return;
    }
    if (this.port < 1024 || this.port > 49151)
    {
      this.error = 'Port must be between 1024 and 49151.';
      return;
    }

    this.loading = true;
    try
    {
      const user = await this.auth.login(this.email, this.password);
      this.ws.connect(this.port, user.type, user.username, user.apikey);
      if (user.type === 'ATC')
      {
        this.router.navigate(['/atc']);
      }
      else
      {
        this.router.navigate(['/passenger']);
      }
    }
    catch (err: any)
    {
      this.error = err.message || 'Login failed. Check your credentials.';
    }
    finally
    {
      this.loading = false;
    }
  }
}
