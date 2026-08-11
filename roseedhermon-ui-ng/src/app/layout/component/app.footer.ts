import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Pied de page réduit à la mention légale, centrée sous toute la largeur. */
@Component({
    standalone: true,
    selector: 'app-footer',
    imports: [CommonModule],
    template: `
        <footer class="app-footer">
            <small>© {{ year }} · Version {{ version }}</small>
        </footer>
    `,
    styles: [`
        .app-footer {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 1.5rem 1rem;
            font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        }

        .app-footer small {
            font-size: 0.82rem;
            color: #8f96b8;
        }
    `]
})
export class AppFooter {
    readonly year = new Date().getFullYear();
    readonly version = '1.0.0';
}
