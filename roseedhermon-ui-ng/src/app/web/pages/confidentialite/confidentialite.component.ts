import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PublicHeaderComponent } from '../../components/public-header.component';
import { PublicFooterComponent } from '../../components/public-footer.component';

/** Politique de confidentialité publique — requise par Apple/Google pour la revue des stores. */
@Component({
  selector: 'app-confidentialite',
  standalone: true,
  imports: [CommonModule, PublicHeaderComponent, PublicFooterComponent],
  templateUrl: './confidentialite.component.html',
  styleUrls: ['./confidentialite.component.scss']
})
export class ConfidentialiteComponent {
  readonly lastUpdated = '5 septembre 2026';
}
