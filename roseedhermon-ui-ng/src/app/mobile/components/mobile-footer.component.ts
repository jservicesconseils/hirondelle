import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-mobile-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Bottom Navigation Footer -->
    <div class="bottom-navigation">
      <div class="nav-item" [class.active]="currentRoute === '/mobile/dashboard'" (click)="navigateToDashboard()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
        <span>Home</span>
      </div>
      <div class="nav-item" [class.active]="currentRoute === '/mobile/members' || currentRoute.startsWith('/mobile/members')" (click)="navigateToContacts()">
        <i class="pi pi-users" style="font-size: 20px;"></i>
        <span>Contact</span>
      </div>
      <div class="nav-item" [class.active]="currentRoute === '/mobile/tickets'" (click)="navigateToTickets()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6zm2 0v12h16V6H4zm2 2h12v2H6V8zm0 4h12v2H6v-2zm0 4h8v2H6v-2z"/>
        </svg>
        <span>Tickets</span>
      </div>
      <div class="nav-item" [class.active]="currentRoute === '/mobile/profile'" (click)="navigateToProfile()">
        <div class="profile-avatar">
          <img src="assets/images/user-avatar.svg" alt="Profile" />
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Empêche le mouvement du footer sur web */
    :host ::ng-deep body {
      overflow-x: hidden !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    
    :host ::ng-deep html {
      overflow-x: hidden !important;
      margin: 0 !important;
      padding: 0 !important;
      height: 100% !important;
    }
    
    /* Force la visibilité du footer */
    :host ::ng-deep app-mobile-footer {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    
    /* Force le footer à rester fixe sur web */
    :host {
      position: fixed !important;
      bottom: 0 !important;
      left: 0 !important;
      right: 0 !important;
      z-index: 999999 !important;
      width: 100vw !important;
      height: 70px !important;
      display: block !important;
      transform: translateZ(0) !important;
      -webkit-transform: translateZ(0) !important;
      will-change: auto !important;
      backface-visibility: hidden !important;
      -webkit-backface-visibility: hidden !important;
      contain: layout style paint !important;
      isolation: isolate !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    
    /* Bottom Navigation */
    .bottom-navigation {
      position: fixed !important;
      bottom: 0 !important;
      left: 0 !important;
      right: 0 !important;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-top: 3px solid #c2410c;
      display: flex;
      justify-content: space-around;
      align-items: center;
      padding: 0 !important;
      margin: 0 !important;
      box-shadow: 0 -4px 16px rgba(0,0,0,0.2);
      width: 100vw !important;
      height: 70px !important;
      z-index: 999999 !important;
      box-sizing: border-box !important;
    }
    
    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0;
      padding: 0;
      margin: 0;
      cursor: pointer;
      transition: all 0.3s ease;
      border-radius: 12px;
      width: 60px;
      height: 60px;
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(194, 65, 12, 0.2);
      flex-shrink: 0;
      aspect-ratio: 1;
      box-sizing: border-box;
    }
    
    .nav-item:hover {
      background: rgba(194, 65, 12, 0.1);
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(194, 65, 12, 0.2);
    }
    
    .nav-item.active {
      color: white;
      background: #c2410c;
      border: 1px solid #c2410c;
      box-shadow: 0 4px 12px rgba(194, 65, 12, 0.4);
    }
    
    .nav-item.active svg,
    .nav-item.active i {
      color: white !important;
      fill: white !important;
    }
    
    .nav-item.active span {
      color: white !important;
    }
    
    .nav-item svg {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      display: block;
      aspect-ratio: 1;
    }
    
    .nav-item i {
      font-size: 20px;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      aspect-ratio: 1;
    }
    
    .nav-item span {
      font-size: 11px;
      font-weight: 500;
      text-align: center;
      line-height: 1.2;
    }
    
    .profile-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid #2e31a4;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .profile-avatar img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }
    
    /* Responsive Design */
    @media (max-width: 480px) {
      :host {
        height: 65px !important;
      }
      
      .bottom-navigation {
        height: 65px !important;
        padding: 0 !important;
        margin: 0 !important;
        width: 100vw !important;
      }
      
      .nav-item {
        width: 50px;
        height: 50px;
        padding: 0;
        gap: 0;
        aspect-ratio: 1;
      }
      
      .nav-item svg {
        width: 18px;
        height: 18px;
        aspect-ratio: 1;
      }
      
      .nav-item i {
        font-size: 18px;
        width: 18px;
        height: 18px;
        aspect-ratio: 1;
      }
      
      .nav-item span {
        font-size: 10px;
      }
      
      .profile-avatar {
        width: 20px;
        height: 20px;
      }
    }
  `]
})
export class MobileFooterComponent implements OnInit {
  
  currentRoute: string = '';

  constructor(private router: Router) { }

  ngOnInit(): void {
    // Écouter les changements de route
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
      });
    
    // Initialiser avec la route actuelle
    this.currentRoute = this.router.url;
  }

  navigateToDashboard(): void {
    this.router.navigate(['/mobile/dashboard']);
  }

  navigateToContacts(): void {
    this.router.navigate(['/mobile/members']);
  }

  navigateToTickets(): void {
    this.router.navigate(['/mobile/tickets']);
  }

  navigateToProfile(): void {
    this.router.navigate(['/mobile/profile']);
  }
}