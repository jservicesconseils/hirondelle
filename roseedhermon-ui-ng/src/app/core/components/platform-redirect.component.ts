import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PlatformService } from '../services/platform.service';

@Component({
  selector: 'app-platform-redirect',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="redirect-container">
      <div class="redirect-content">
        <div class="spinner"></div>
        <p>Détection de la plateforme...</p>
      </div>
    </div>
  `,
  styles: [`
    .redirect-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: linear-gradient(135deg, #ED5F00 0%, #9914CB 100%);
    }
    
    .redirect-content {
      text-align: center;
      color: white;
    }
    
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top: 4px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    p {
      margin: 0;
      font-size: 1.1rem;
    }
  `]
})
export class PlatformRedirectComponent implements OnInit {

  constructor(
    private platformService: PlatformService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Délai pour permettre la détection de plateforme
    setTimeout(() => {
      const defaultRoute = this.platformService.getDefaultRoute();
      console.log('Platform detected:', this.platformService.getPlatformName());
      console.log('Redirecting to:', defaultRoute);
      this.router.navigate([defaultRoute]);
    }, 1000);
  }
}