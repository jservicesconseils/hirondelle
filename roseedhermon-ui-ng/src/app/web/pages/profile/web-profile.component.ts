import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../core/auth/auth.service';
import { toE164 } from '../../../shared/utils/phone';
import { PublicHeaderComponent } from '../../components/public-header.component';
import { PublicFooterComponent } from '../../components/public-footer.component';

/**
 * Profil de la personne connectée : pour l'instant, uniquement le téléphone —
 * seul renseignement que la connexion par téléphone requiert et que
 * l'inscription ne demandait pas encore avant son ajout. Un compte créé plus
 * tôt s'en sert pour se rattraper, sans devoir recréer un compte.
 */
@Component({
  selector: 'app-web-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, PublicHeaderComponent, PublicFooterComponent],
  templateUrl: './web-profile.component.html',
  styleUrls: ['./web-profile.component.scss']
})
export class WebProfileComponent implements OnInit {
  firstName = '';
  lastName = '';
  phone = '';

  loading = true;
  saving = false;
  error = '';
  notice = '';

  constructor(public auth: AuthService) {}

  ngOnInit(): void {
    const member = this.auth.user().member;
    this.firstName = member?.firstName ?? '';
    this.lastName = member?.lastName ?? '';

    this.auth
      .getAccountPhone()
      .then((phone) => {
        this.phone = phone ?? '';
        this.loading = false;
      })
      .catch(() => {
        this.loading = false;
      });
  }

  async save(): Promise<void> {
    if (this.saving) return;

    const firstName = this.firstName.trim();
    const lastName = this.lastName.trim();
    if (!firstName && !lastName) {
      this.error = 'Indiquez au moins un prénom ou un nom.';
      this.notice = '';
      return;
    }

    const phoneEntered = this.phone.trim();
    const e164 = phoneEntered ? toE164(phoneEntered) : null;
    if (phoneEntered && !e164) {
      this.error = 'Indiquez un numéro de téléphone valide.';
      this.notice = '';
      return;
    }

    this.saving = true;
    this.error = '';
    this.notice = '';

    try {
      await this.auth.updateName(firstName, lastName);

      if (e164) {
        await this.auth.registerAccountPhone(e164);
        // Accessoire : le profil reste enregistré même si Cognito refuse l'attribut.
        await this.auth.updatePhoneNumber(e164).catch(() => undefined);
        this.phone = e164;
      }

      this.notice = 'Profil enregistré.';
    } catch (error) {
      this.error = (error as Error)?.message || "L'enregistrement a échoué.";
    } finally {
      this.saving = false;
    }
  }
}
