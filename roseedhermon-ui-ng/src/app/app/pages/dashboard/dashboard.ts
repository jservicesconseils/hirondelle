import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="dashboard-container">
            <div class="dashboard-content">
                <h1>Dashboard</h1>
                <p>Page dashboard en cours de développement...</p>
            </div>
        </div>
    `,
    styles: [`
        .dashboard-container {
            position: relative;
            width: 100%;
            height: 100%;
            padding: 20px;
            margin: 0;
            background-color: #f5f5f5;
        }

        .dashboard-content {
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }

        .dashboard-content h1 {
            color: #2e31a4;
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 20px;
        }

        .dashboard-content p {
            color: #666;
            font-size: 1.1rem;
            margin: 0;
        }
    `]
})
export class Dashboard {} 