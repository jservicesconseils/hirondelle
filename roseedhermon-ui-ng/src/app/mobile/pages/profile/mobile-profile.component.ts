import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { MemberService } from '../../../shared/services/members/members.service';
import { Member } from '../../../shared/services/api/model/member';
import { IdentityService } from '../../services/identity.service';
import { AuthService } from '../../../core/auth/auth.service';
import { compressImageToDataUrl } from '../../../shared/utils/image-compression';
import { AppLanguage, LanguageService } from '../../../core/language.service';
import { fieldIconKind, mergedFieldValue, MERGED_KINDS } from '../../../shared/utils/field-icons';

const GENDERS = ['Homme', 'Femme'];

/**
 * Le modèle généré restreint `gender` à MALE/FEMALE/OTHER, alors que les fiches
 * existantes portent « Homme »/« Femme ». On garde donc une chaîne libre côté
 * formulaire pour ne pas réécrire des valeurs déjà en base.
 */
type ProfileForm = Omit<Member, 'gender'> & { gender?: string };
/** Filet de sécurité avant compression : au-delà, ce n'est probablement plus une photo. */
const MAX_SOURCE_PHOTO_BYTES = 20_000_000;

@Component({
  selector: 'app-mobile-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="profile-screen">

      <p class="state" *ngIf="loading">{{ 'profile.loading' | translate }}</p>
      <p class="state error" *ngIf="loadError">{{ loadError }}</p>

      <!-- Profil -->
      <ng-container *ngIf="!loading && !loadError">
        <header class="hero">
          <label class="avatar-slot">
            <span class="avatar-ring">
              <img *ngIf="form.photo; else initialsTpl" [src]="form.photo" alt="Photo de profil" />
              <ng-template #initialsTpl><span class="avatar-initials">{{ initials }}</span></ng-template>
            </span>
            <span class="avatar-edit">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 3l-1.83 2H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.17L15 3H9zm3 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" /></svg>
            </span>
            <input type="file" accept="image/*" (change)="onPhotoSelected($event)" hidden />
          </label>

          <h1>{{ 'profile.title' | translate }}</h1>
          <p>{{ 'profile.subtitle' | translate }}</p>
          <p class="photo-error" *ngIf="photoError">{{ photoError }}</p>
        </header>

        <form class="profile-form" (ngSubmit)="save()" novalidate>

          <section class="card">
            <h2 class="card-title violet">
              <span class="dot"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg></span>
              {{ 'profile.identity' | translate }}
            </h2>

            <div class="field-row">
              <label class="field">
                <span>{{ 'profile.firstName' | translate }}</span>
                <input type="text" name="firstName" [(ngModel)]="form.firstName" />
              </label>
              <label class="field">
                <span>{{ 'profile.lastName' | translate }}</span>
                <input type="text" name="lastName" [(ngModel)]="form.lastName" />
              </label>
            </div>

            <label class="field">
              <span>{{ 'profile.gender' | translate }}</span>
              <div class="chip-choice">
                <button type="button"
                        *ngFor="let option of genders"
                        [class.on]="form.gender === option"
                        (click)="form.gender = option">
                  <span class="chip-dot" *ngIf="form.gender === option"></span>
                  {{ option }}
                </button>
              </div>
            </label>

            <label class="field">
              <span>{{ 'profile.birthDate' | translate }}</span>
              <input type="date" name="birthDate" [(ngModel)]="form.birthDate" />
            </label>
          </section>

          <section class="card">
            <h2 class="card-title blue">
              <span class="dot"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" /></svg></span>
              {{ 'profile.contact' | translate }}
            </h2>

            <label class="field">
              <span>{{ 'profile.phone' | translate }}</span>
              <input type="tel" name="phoneNumber" inputmode="tel" [(ngModel)]="form.phoneNumber" />
            </label>

            <label class="field">
              <span>{{ 'profile.email' | translate }}</span>
              <input type="email" name="email" inputmode="email" [(ngModel)]="form.email" />
              <em class="error" *ngIf="form.email && !emailValid">Adresse de courriel invalide.</em>
            </label>
          </section>

          <section class="card">
            <h2 class="card-title coral">
              <span class="dot"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" /></svg></span>
              {{ 'profile.addressCard' | translate }}
            </h2>

            <label class="field">
              <span>{{ 'profile.address' | translate }}</span>
              <input type="text" name="address" [(ngModel)]="form.address" />
            </label>

            <label class="field">
              <span>{{ 'profile.city' | translate }}</span>
              <input type="text" name="city" [(ngModel)]="form.city" />
            </label>
          </section>

          <section class="card">
            <h2 class="card-title green">
              <span class="dot"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-4V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm-6 0h-4V4h4v2z" /></svg></span>
              {{ 'profile.activity' | translate }}
            </h2>

            <label class="field">
              <span>{{ 'profile.profession' | translate }}</span>
              <input type="text" name="profession" [(ngModel)]="form.profession" />
            </label>
          </section>

          <!-- Propre à la communauté du membre : colonnes de son fichier d'import, sous leur en-tête d'origine. -->
          <section class="card" *ngIf="member?.groupId && customFieldEntries.length">
            <h2 class="card-title orange">
              <span class="dot"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg></span>
              {{ 'profile.community' | translate }}
            </h2>

            <label class="field" *ngFor="let entry of customFieldEntries">
              <span>{{ entry.key }}</span>
              <input type="text" [(ngModel)]="entry.value" [name]="'custom-' + entry.key" />
            </label>
          </section>

          <!-- Bascule FR/EN : s'applique immédiatement, sans reconstruction ni
               redémarrage — voir LanguageService. -->
          <section class="card">
            <h2 class="card-title violet">
              <span class="dot"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" /></svg></span>
              {{ 'profile.language' | translate }}
            </h2>

            <div class="chip-choice">
              <button type="button"
                      [class.on]="language.lang() === 'fr'"
                      (click)="setLanguage('fr')">
                <span class="chip-dot" *ngIf="language.lang() === 'fr'"></span>
                Français
              </button>
              <button type="button"
                      [class.on]="language.lang() === 'en'"
                      (click)="setLanguage('en')">
                <span class="chip-dot" *ngIf="language.lang() === 'en'"></span>
                English
              </button>
            </div>
          </section>

          <p class="feedback ok" *ngIf="savedMessage">{{ savedMessage }}</p>
          <p class="feedback ko" *ngIf="saveError">{{ saveError }}</p>

          <div class="save-bar">
            <button type="submit" class="save" [disabled]="saving || !canSave">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              {{ (saving ? 'profile.saving' : 'profile.save') | translate }}
            </button>
          </div>
        </form>

        <button type="button" class="sign-out" (click)="signOut()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
          {{ 'profile.signOut' | translate }}
        </button>
      </ng-container>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .profile-screen {
      min-height: 100vh;
      background: #f5f6f8;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1a1c22;
      padding-bottom: 8px;
    }

    .state { text-align: center; color: #7c8189; padding: 60px 24px; margin: 0; }
    .state.error { color: #c0392b; font-weight: 600; }

    /* ---------- Bandeau ---------- */

    .hero {
      position: relative;
      min-height: 200px;
      box-sizing: border-box;
      padding: 34px 24px 30px;
      text-align: center;
      color: #fff;
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      border-radius: 0 0 32px 32px;
    }


    .hero h1 { margin: 14px 0 0; font-size: 22px; font-weight: 800; letter-spacing: -0.01em; color: #fff; }
    .hero p { margin: 4px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.8); }
    .hero .photo-error { margin-top: 8px; font-size: 13px; color: #ffe0d6; font-weight: 600; }

    .switch {
      position: absolute;
      top: 18px;
      right: 18px;
      padding: 7px 14px;
      border: 1px solid rgba(255, 255, 255, 0.55);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.18);
      color: #fff;
      font: inherit;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }

    /* Photo : l'étiquette entière déclenche le sélecteur de fichier. */
    .avatar-slot {
      position: relative;
      display: inline-block;
      cursor: pointer;
    }

    .avatar-ring {
      display: inline-flex;
      width: 88px;
      height: 88px;
      border-radius: 50%;
      padding: 4px;
      background: rgba(255, 255, 255, 0.9);
      align-items: center;
      justify-content: center;
    }

    .avatar-ring img,
    .avatar-initials {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #fff;
      color: #2563eb;
      font-size: 28px;
      font-weight: 800;
      box-sizing: border-box;
    }

    .avatar-edit {
      position: absolute;
      right: 2px;
      bottom: 2px;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: #f4551d;
      color: #fff;
      border: 2px solid #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(244, 85, 29, 0.4);
    }

    .avatar-edit svg { width: 15px; height: 15px; }

    /* ---------- Formulaire ---------- */

    /* Les cartes remontent par-dessus le bas du bandeau : c'est ce chevauchement
       qui donne la profondeur du modèle. */
    .profile-form { margin-top: -32px; padding: 0 18px 18px; position: relative; }

    .card {
      background: #fff;
      border-radius: 20px;
      padding: 16px;
      margin-bottom: 14px;
      box-shadow: 0 12px 28px rgba(16, 28, 48, 0.08);
    }

    .card-title {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0 0 14px;
      font-size: 17px;
      font-weight: 800;
    }

    .card-title .dot {
      width: 34px;
      height: 34px;
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }

    .card-title .dot svg { width: 18px; height: 18px; }
    .card-title.violet .dot { background: linear-gradient(135deg, #a86bf0 0%, #7b3fd4 100%); }
    .card-title.blue .dot { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
    .card-title.coral .dot { background: linear-gradient(135deg, #ff7a4d 0%, #f4551d 100%); }
    .card-title.green .dot { background: linear-gradient(135deg, #43cd80 0%, #17a05c 100%); }
    .card-title.orange .dot { background: linear-gradient(135deg, #ffb04d 0%, #f4551d 100%); }

    .field { display: block; margin-bottom: 12px; }
    .field:last-child { margin-bottom: 0; }

    .field > span {
      display: block;
      margin-bottom: 6px;
      font-size: 13.5px;
      font-weight: 600;
      color: #6b7178;
    }

    .field input {
      width: 100%;
      height: 44px;
      padding: 0 14px;
      border: 1px solid #e6e9ee;
      border-radius: 12px;
      background: #f9fafb;
      font: inherit;
      font-size: 15px;
      color: #1a1c22;
      outline: none;
      box-sizing: border-box;
    }

    .field input:focus { border-color: #2563eb; background: #fff; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.14); }

    .field .error { display: block; margin-top: 5px; font-size: 13px; font-style: normal; color: #c0392b; }

    .field-row { display: flex; gap: 10px; }
    .field-row .field { flex: 1 1 0; min-width: 0; }

    .chip-choice { display: flex; gap: 8px; }

    .chip-choice button {
      flex: 1 1 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      height: 44px;
      border: 1px solid #e6e9ee;
      border-radius: 12px;
      background: #f9fafb;
      font: inherit;
      font-size: 15px;
      font-weight: 600;
      color: #4d535b;
      cursor: pointer;
    }

    .chip-choice button.on {
      border-color: transparent;
      background: #2563eb;
      color: #fff;
    }

    .chip-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #f4551d;
    }

    .feedback { margin: 4px 0 12px; text-align: center; font-size: 14px; font-weight: 600; }
    .feedback.ok { color: #17804a; }
    .feedback.ko { color: #c0392b; }

    /* Le bouton suit le défilement, juste au-dessus de la barre de navigation. */
    .save-bar {
      position: sticky;
      bottom: 0;
      padding: 10px 0 4px;
      background: linear-gradient(180deg, rgba(245, 246, 248, 0) 0%, #f5f6f8 42%);
    }

    .save {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      height: 52px;
      border: none;
      border-radius: 14px;
      background: #17a05c;
      color: #fff;
      font: inherit;
      font-size: 16px;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 12px 26px rgba(23, 160, 92, 0.35);
    }

    .save svg { width: 19px; height: 19px; flex-shrink: 0; }

    .save:disabled { opacity: 0.6; cursor: default; box-shadow: none; }

    .sign-out {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      // 100% s'ajoutait aux 18px de marge de chaque côté (le bouton est hors de
      // .profile-form, donc sans son padding pour absorber la largeur) : le
      // bouton débordait de 36px hors de l'écran. calc() les soustrait au lieu.
      width: calc(100% - 36px);
      height: 48px;
      margin: 4px 18px 18px;
      border: none;
      border-radius: 14px;
      background: #e74c3c;
      color: #fff;
      font: inherit;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 10px 22px rgba(231, 76, 60, 0.3);
    }

    .sign-out svg { width: 18px; height: 18px; flex-shrink: 0; }
  `]
})
export class MobileProfileComponent implements OnInit {
  member: Member | null = null;

  loading = true;
  loadError = '';
  saving = false;
  savedMessage = '';
  saveError = '';
  photoError = '';

  readonly genders = GENDERS;

  form: ProfileForm = {};

  /** Colonnes du fichier d'import de la communauté du membre : en-tête d'origine -> valeur, éditable. */
  customFieldEntries: { key: string; value: string }[] = [];

  constructor(
    private memberService: MemberService,
    private identity: IdentityService,
    private auth: AuthService,
    private router: Router,
    public language: LanguageService,
    private translate: TranslateService
  ) {}

  setLanguage(lang: AppLanguage): void {
    this.language.setLanguage(lang);
  }

  ngOnInit(): void {
    // La fiche du compte connecté fait foi ; l'identifiant local n'est qu'un repli
    // pour les environnements sans authentification.
    const memberId = this.auth.user().member?.id ?? this.identity.memberId;

    // Aucune fiche associée à l'appareil : on ouvre un profil vierge, qui sera
    // créé au premier enregistrement. Rien ne bloque l'accès à l'écran.
    if (!memberId) {
      this.loading = false;
      return;
    }

    this.memberService.getMember(memberId).subscribe({
      next: (member: Member) => {
        if (member?.id) {
          this.applyMember(member);
        } else {
          this.identity.memberId = '';
        }
        this.loading = false;
      },
      error: (error: any) => {
        // Fiche disparue : on repart d'un profil vierge plutôt que d'un écran mort.
        if (error?.status === 404) {
          this.identity.memberId = '';
        } else {
          console.error('Erreur lors du chargement du profil', error);
          this.loadError = this.translate.instant('profile.loadError', { status: error?.status || 'réseau' });
        }
        this.loading = false;
      }
    });
  }

  get initials(): string {
    return this.initialsOf(this.form);
  }

  get emailValid(): boolean {
    const email = (this.form.email || '').trim();
    return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  get canSave(): boolean {
    return !!(this.form.firstName || '').trim() && !!(this.form.lastName || '').trim() && this.emailValid;
  }

  initialsOf(member: ProfileForm): string {
    return `${(member.firstName || '').charAt(0)}${(member.lastName || '').charAt(0)}`.toUpperCase() || '?';
  }

  /**
   * Un fichier importé avant que Ville/Adresse/Genre/Téléphone ne deviennent
   * des champs structurés (ou qui les a nommés autrement que l'en-tête exact
   * attendu) laisse la valeur dans `customFields` : sans ce repli, le champ
   * structuré du formulaire apparaissait vide alors que la vraie valeur était
   * là, un peu plus bas, dans « Ma communauté » — la personne ne la retapait
   * que dans le champ vide et les deux copies restaient en désaccord.
   *
   * « Ma communauté » ne garde donc que les colonnes réellement propres à la
   * communauté (Ministère, Profession détaillée...), jamais un doublon de ces
   * quatre-là — comme sur la fiche d'édition du site.
   */
  private applyMember(member: Member): void {
    this.member = member;
    this.form = {
      ...member,
      gender: mergedFieldValue(member.customFields, member.gender, 'gender'),
      phoneNumber: mergedFieldValue(member.customFields, member.phoneNumber, 'phone'),
      city: mergedFieldValue(member.customFields, member.city, 'city'),
      address: mergedFieldValue(member.customFields, member.address, 'address'),
    };
    this.customFieldEntries = Object.entries(member.customFields || {})
      .filter(([key]) => !MERGED_KINDS.includes(fieldIconKind(key)))
      .map(([key, value]) => ({ key, value }));
  }

  async onPhotoSelected(event: Event): Promise<void> {
    this.photoError = '';
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.photoError = this.translate.instant('profile.photoNotImage');
      return;
    }
    if (file.size > MAX_SOURCE_PHOTO_BYTES) {
      this.photoError = this.translate.instant('profile.photoTooLarge');
      return;
    }

    // Redimensionnée et recompressée avant d'être gardée : une photo prise au
    // téléphone (couramment plusieurs Mo) tient large sous la limite une fois
    // passée par là, sans jamais refuser l'envoi côté personne.
    try {
      this.form.photo = await compressImageToDataUrl(file);
    } catch (error) {
      console.error('Compression de la photo impossible', error);
      this.photoError = this.translate.instant('profile.photoFailed');
    }
  }

  async save(): Promise<void> {
    if (!this.canSave) return;

    this.saving = true;
    this.savedMessage = '';
    this.saveError = '';

    /**
     * Le prénom et le nom passent d'abord par `/api/v1/me/name`, qui les
     * rattache au courriel de connexion côté serveur — le champ « Courriel »
     * de ce formulaire est libre et peut ne pas correspondre, ou rester vide
     * sur une fiche qui n'existe pas encore. Sans ce lien garanti, l'en-tête
     * de l'application (et tout ce qui affiche le nom de la personne
     * connectée) continuerait de retomber sur le préfixe du courriel.
     *
     * Attendu avant la suite quand la fiche n'existe pas encore : sinon
     * `/me/name` et `createMember` en créeraient chacun une, en double.
     */
    try {
      await this.auth.updateName((this.form.firstName || '').trim(), (this.form.lastName || '').trim());
      const linkedId = this.auth.user().member?.id;
      if (!this.member?.id && linkedId) this.member = { ...this.member, id: linkedId };
    } catch (error) {
      console.warn("Le nom n'a pas pu être synchronisé avec le compte", error);
    }

    // On repart de la fiche d'origine pour ne perdre aucun champ non affiché.
    const payload = { ...(this.member || {}), ...this.form } as Member;
    // Toujours réassigné, même vide : sinon un ancien doublon Ville/Adresse/Genre/
    // Téléphone resté dans customFields (voir applyMember) survivrait à l'enregistrement.
    payload.customFields = Object.fromEntries(this.customFieldEntries.map((entry) => [entry.key, entry.value]));

    // Fiche existante : mise à jour. Sinon, première sauvegarde : on la crée.
    const request = this.member?.id
      ? this.memberService.updateMember({ ...payload, id: this.member.id })
      : this.memberService.createMember(payload);

    request.subscribe({
      next: (saved: Member) => {
        this.applyMember(saved?.id ? saved : payload);
        if (this.member?.id) this.identity.memberId = this.member.id;
        this.saving = false;
        this.savedMessage = this.translate.instant('profile.saved');
      },
      error: (error: any) => {
        console.error('Enregistrement du profil impossible', error);
        this.saving = false;
        this.saveError = this.translate.instant('profile.saveFailed', { status: error?.status || 'réseau' });
      }
    });
  }

  signOut(): void {
    this.auth.signOut();
    this.router.navigate(['/mobile/login']);
  }
}
