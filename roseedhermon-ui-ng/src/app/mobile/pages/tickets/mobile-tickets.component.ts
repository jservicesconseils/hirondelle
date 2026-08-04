import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { MobileFooterComponent } from '../../components/mobile-footer.component';

@Component({
  selector: 'app-mobile-tickets',
  standalone: true,
  imports: [CommonModule, IonicModule, MobileFooterComponent],
  template: `
    <div class="mobile-tickets">
      <!-- Header -->
      <div class="page-header">
        <h1 class="page-title">Your Order</h1>
      </div>

      <!-- Main Content -->
      <div class="main-content">
        <!-- Clipboard Illustration -->
        <div class="clipboard-illustration">
          <div class="clipboard">
            <div class="clipboard-clip"></div>
            <div class="clipboard-papers">
              <div class="paper paper-1"></div>
              <div class="paper paper-2"></div>
              <div class="paper paper-3">
                <div class="paper-square">
                  <div class="x-mark">×</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Text Content -->
        <div class="text-content">
          <h2 class="main-text">There are no upcoming tickets yet</h2>
          <p class="sub-text">Don't miss the chance to catch your favorite show</p>
        </div>

        <!-- Action Button -->
        <div class="action-section">
          <button class="get-tickets-btn" (click)="getTickets()">
            Get your tickets now!
          </button>
        </div>
      </div>

      <!-- Footer global -->
      <app-mobile-footer></app-mobile-footer>
    </div>
  `,
  styles: [`
    .mobile-tickets {
      min-height: 100vh;
      background: #f5f5f5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      position: relative;
      overflow-x: hidden;
    }

    /* Header */
    .page-header {
      background: #f5f5f5;
      padding: 20px 0;
      text-align: center;
    }

    .page-title {
      font-size: 24px;
      font-weight: bold;
      color: #000;
      margin: 0;
    }

    /* Main Content */
    .main-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px;
      text-align: center;
    }

    /* Clipboard Illustration */
    .clipboard-illustration {
      margin-bottom: 40px;
    }

    .clipboard {
      position: relative;
      width: 200px;
      height: 250px;
      background: #ffb3ba;
      border-radius: 8px;
      margin: 0 auto;
      box-shadow: 0 8px 20px rgba(0,0,0,0.15);
    }

    .clipboard-clip {
      position: absolute;
      top: -15px;
      left: 50%;
      transform: translateX(-50%);
      width: 60px;
      height: 30px;
      background: #ffd700;
      border-radius: 15px 15px 0 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    .clipboard-papers {
      position: absolute;
      top: 20px;
      left: 20px;
      right: 20px;
      bottom: 20px;
    }

    .paper {
      position: absolute;
      background: white;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .paper-1 {
      top: 0;
      left: 0;
      right: 0;
      height: 40px;
    }

    .paper-2 {
      top: 35px;
      left: 0;
      right: 0;
      height: 40px;
    }

    .paper-3 {
      top: 70px;
      left: 0;
      right: 0;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .paper-square {
      width: 20px;
      height: 20px;
      background: #ffb3ba;
      border-radius: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .x-mark {
      color: white;
      font-weight: bold;
      font-size: 14px;
    }

    /* Text Content */
    .text-content {
      margin-bottom: 40px;
    }

    .main-text {
      font-size: 20px;
      font-weight: bold;
      color: #000;
      margin: 0 0 16px 0;
    }

    .sub-text {
      font-size: 16px;
      color: #666;
      margin: 0;
    }

    /* Action Button */
    .action-section {
      width: 100%;
      max-width: 300px;
    }

    .get-tickets-btn {
      width: 100%;
      padding: 16px 24px;
      background: #a8e6cf;
      color: #000;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .get-tickets-btn:hover {
      background: #98d6bf;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0,0,0,0.15);
    }

    .get-tickets-btn:active {
      transform: translateY(0);
    }

    /* Responsive Design */
    @media (max-width: 480px) {
      .clipboard {
        width: 160px;
        height: 200px;
      }
      
      .main-text {
        font-size: 18px;
      }
      
      .sub-text {
        font-size: 14px;
      }
    }
  `]
})
export class MobileTicketsComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  getTickets(): void {
    // Naviguer vers la page des événements pour acheter des tickets
    this.router.navigate(['/mobile/events']);
  }
}