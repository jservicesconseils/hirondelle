import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { MemberService } from '../../../shared/services/members/members.service';
import { Member } from '../../../shared/services/api/model/member';
import { MobileFooterComponent } from '../../components/mobile-footer.component';

@Component({
  selector: 'app-mobile-members',
  standalone: true,
  imports: [CommonModule, IonicModule, MobileFooterComponent],
  template: `
    <div class="mobile-members">
      <!-- Header avec style teal-green comme sur l'image -->
      <div class="page-header">
        <!-- Éléments décoratifs -->
        <div class="header-decoration-left">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="rgba(255,255,255,0.3)">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <div class="header-decoration-right">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="rgba(255,255,255,0.3)">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        
        <div class="header-content">
          <button class="back-btn" (click)="goBack()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
          <h1 class="page-title">Contacts</h1>
          <div class="header-search">
      <ion-searchbar 
              placeholder="Rechercher..."
        (ionInput)="onSearchChange($event)"
              show-clear-button="focus"
              class="header-searchbar">
      </ion-searchbar>
          </div>
        </div>
      </div>

      <!-- Liste des membres en grille -->
      <div class="members-grid">
        <div class="empty-state" *ngIf="filteredMembers.length === 0 && !loading">
          <p>Aucun membre à afficher</p>
        </div>
        <div class="member-card" *ngFor="let member of filteredMembers">

          <!-- Bannière colorée -->
          <div class="member-banner" [style.background]="getMemberBannerColor(member)">
            <div class="banner-content">

            </div>
          </div>

          <!-- Photo de profil -->
          <div class="member-avatar">
            <img [src]="getMemberImageUrl(member)" 
                 [alt]="member.firstName + ' ' + member.lastName" 
                 (error)="onImageError($event)"
                 class="avatar-img">
          </div>

          <!-- Informations du membre -->
          <div class="member-info">
            <div class="member-name">
              <h3>{{ member.firstName }} {{ member.lastName }}</h3>
              <svg class="verified-icon" width="16" height="16" viewBox="0 0 24 24" fill="#4285F4">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            
            <div class="member-title">
              {{ getMemberTitle(member) }}
            </div>

            <div class="contact-info">
              <!-- Numéro de téléphone -->
              <div class="phone-info">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#4285F4" style="flex-shrink: 0;">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
                <span class="phone-text">{{ getPhoneNumber(member) }}</span>
              </div>
              
              <!-- Adresse complète -->
              <div class="address-info">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#4285F4" style="flex-shrink: 0;">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <span class="address-text">{{ getFullAddress(member) }}</span>
              </div>
            </div>
          </div>

          <!-- Boutons d'action -->
          <div class="action-buttons">
            <button class="action-btn whatsapp-btn" (click)="openWhatsApp(member)" title="WhatsApp">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
            </button>
            
            <button class="action-btn call-btn" (click)="makeCall(member)" title="Appeler">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
            </button>
            
            <button class="action-btn maps-btn" (click)="openGoogleMaps(member)" title="Google Maps">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Footer global -->
      <app-mobile-footer></app-mobile-footer>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      overflow: hidden;
      color: #333333; /* Évite l'héritage de couleurs invisibles (Tailwind/Ionic) */
    }

    .mobile-members {
      min-height: 100vh;
      height: 100vh;
      background: #f5f5f5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      position: relative;
      overflow-x: hidden;
      overflow-y: hidden;
      display: flex;
      flex-direction: column;
    }

    /* Header de la page avec style teal-green */
    .page-header {
      background: #c2410c;
      position: relative;
      padding: 6px 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
      height: 45px;
      flex-shrink: 0;
      z-index: 10;
    }

    /* Éléments décoratifs */
    .header-decoration-left {
      position: absolute;
      top: 10px;
      left: 10px;
      opacity: 0.3;
    }

    .header-decoration-right {
      position: absolute;
      top: 10px;
      right: 10px;
      opacity: 0.3;
    }

    .header-content {
      display: flex;
      align-items: center;
      padding: 0 12px;
      gap: 12px;
      position: relative;
      z-index: 2;
      height: 100%;
    }

    .back-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      padding: 6px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }

    .back-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.05);
    }

    .page-title {
      font-size: 16px;
      font-weight: 600;
      color: white;
      margin: 0;
      flex: 0 0 auto;
      text-align: center;
    }

    .header-search {
      flex: 1;
      max-width: 150px;
      min-width: 100px;
    }

    .header-searchbar {
      --background: rgba(255, 255, 255, 0.3);
      --border-radius: 15px;
      --box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      --placeholder-color: rgba(255, 255, 255, 0.9);
      --color: white;
      --padding-start: 8px;
      --padding-end: 8px;
      --icon-color: white;
      height: 28px;
      width: 100%;
    }

    /* État vide */
    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 40px 20px;
      color: #666;
      font-size: 16px;
    }

    /* Grille des membres */
    .members-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      padding: 16px;
      padding-bottom: 100px; /* Espace pour le footer (70px) + marge */
      background: #f5f5f5;
      overflow-y: auto;
      flex: 1;
      min-height: 0; /* Permet le scroll dans flex */
      -webkit-overflow-scrolling: touch;
    }

    /* Carte de membre */
    .member-card {
      background: #ffffff !important;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      position: relative;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      display: block;
      min-height: 320px; /* Hauteur suffisante pour afficher tous les boutons */
      color: #333333 !important;
    }

    .member-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }

    /* Bannière */
    .member-banner {
      height: 80px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .banner-content {
      text-align: center;
    }

    .banner-text {
      font-size: 24px;
      font-weight: bold;
      color: white;
      text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    }

    /* Avatar */
    .member-avatar {
      position: absolute;
      top: 40px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2;
    }

    .avatar-img {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      border: 4px solid white;
      object-fit: cover;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    /* Informations du membre */
    .member-info {
      padding: 60px 16px 16px 16px;
      text-align: center;
      color: #333333 !important;
    }

    .member-name {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-bottom: 8px;
    }

    .member-name h3 {
      font-size: 16px !important;
      font-weight: 600 !important;
      color: #333333 !important;
      margin: 0 !important;
    }

    .verified-icon {
      flex-shrink: 0;
    }

    .member-title {
      font-size: 14px !important;
      color: #555555 !important;
      margin-bottom: 12px;
      line-height: 1.4;
    }

    .contact-info {
      margin-bottom: 16px;
    }

    .phone-info {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
      font-size: 12px !important;
      color: #555555 !important;
      gap: 6px;
    }

    .phone-info svg {
      flex-shrink: 0;
      width: 14px;
      height: 14px;
    }

    .address-info {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
      font-size: 12px !important;
      color: #555555 !important;
      gap: 6px;
    }

    .address-info svg {
      flex-shrink: 0;
      width: 14px;
      height: 14px;
    }

    .phone-text {
      font-size: 12px !important;
      color: #555555 !important;
      line-height: 1.3;
    }

    .address-text {
      font-size: 12px !important;
      color: #555555 !important;
      line-height: 1.3;
      word-wrap: break-word;
    }


    /* Boutons d'action */
    .action-buttons {
      display: flex !important;
      justify-content: center;
      gap: 12px;
      padding: 0 16px 16px 16px;
      position: relative;
      z-index: 2;
      visibility: visible !important;
    }

    .action-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 2px solid;
      background: white;
      display: flex !important;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .action-btn svg {
      fill: white !important;
      width: 20px !important;
      height: 20px !important;
      flex-shrink: 0;
      display: block !important;
    }

    .whatsapp-btn {
      border-color: #25D366 !important;
      background: #25D366 !important;
    }

    .whatsapp-btn svg {
      fill: white !important;
    }

    .whatsapp-btn:hover {
      background: #20bd5a !important;
      border-color: #20bd5a !important;
    }

    .call-btn {
      border-color: #34A853 !important;
      background: #34A853 !important;
    }

    .call-btn svg {
      fill: white !important;
    }

    .call-btn:hover {
      background: #2D8F47 !important;
      border-color: #2D8F47 !important;
    }

    .maps-btn {
      border-color: #1E3A8A !important;
      background: #1E3A8A !important;
    }

    .maps-btn svg {
      fill: white !important;
    }

    .maps-btn:hover {
      background: #1E40AF !important;
      border-color: #1E40AF !important;
    }

    /* Footer */
    app-mobile-footer {
      flex-shrink: 0;
      position: relative;
      z-index: 1000;
    }

    /* Responsive */
    @media (max-width: 480px) {
      .members-grid {
        grid-template-columns: 1fr;
        gap: 12px;
        padding: 12px;
        padding-bottom: 81px; /* Espace pour le footer (65px) + padding */
      }
    }
  `]
})
export class MobileMembersComponent implements OnInit {
  members: Member[] = [];
  filteredMembers: Member[] = [];
  searchTerm: string = '';
  loading = true;

  constructor(
    private memberService: MemberService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadMembers();
  }

  loadMembers(): void {
    this.loading = true;
    this.memberService.getMembers().subscribe({
      next: (members: Member[] | any) => {
        const list = Array.isArray(members) ? members : (members?.content ?? members?.data ?? []);
        this.members = list;
        this.filteredMembers = list;
        this.loading = false;
        console.log('Membres chargés:', list.length);
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des membres:', error);
        this.members = [];
        this.filteredMembers = [];
        this.loading = false;
      }
    });
  }

  onSearchChange(event: any): void {
    this.searchTerm = event.detail.value.toLowerCase();
    this.filterMembers();
  }

  filterMembers(): void {
    if (!this.searchTerm) {
      this.filteredMembers = this.members;
    } else {
      this.filteredMembers = this.members.filter(member =>
        member.firstName?.toLowerCase().includes(this.searchTerm) ||
        member.lastName?.toLowerCase().includes(this.searchTerm)
      );
    }
  }

  getMemberImageUrl(member: Member): string {
    if (member.photo) {
      return member.photo;
    }
    return `https://via.placeholder.com/60x60/4285F4/ffffff?text=${member.firstName?.charAt(0) || 'U'}`;
  }

  onImageError(event: any): void {
    event.target.src = 'https://via.placeholder.com/60x60/4285F4/ffffff?text=U';
  }

  getMemberBannerColor(member: Member): string {
    const colors = [
      'linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)',
      'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)',
      'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
      'linear-gradient(135deg, #FF6B35 0%, #8B5CF6 50%, #1E3A8A 100%)',
      'linear-gradient(135deg, #8B5CF6 0%, #1E3A8A 100%)',
      'linear-gradient(135deg, #1E3A8A 0%, #FF6B35 100%)',
      'linear-gradient(135deg, #FF6B35 0%, #1E3A8A 100%)',
      'linear-gradient(135deg, #8B5CF6 0%, #FF6B35 100%)'
    ];
    
    const index = (member.firstName?.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  }

  getMemberInitials(member: Member): string {
    const firstInitial = member.firstName?.charAt(0) || '';
    const lastInitial = member.lastName?.charAt(0) || '';
    return (firstInitial + lastInitial).toUpperCase();
  }

  getMemberTitle(member: Member): string {
    if (member.profession) {
      return member.profession;
    }
    if (member.email) {
      return member.email;
    }
    return 'Membre';
  }

  hasContactInfo(member: Member): boolean {
    return !!(member.phoneNumber || member.address || member.city);
  }

  hasAddress(member: Member): boolean {
    return !!(member.address || member.city);
  }

  getPhoneNumber(member: Member): string {
    if (member.phoneNumber) {
      return member.phoneNumber;
    }
    // Numéro de test si pas de numéro réel
    return '+1 (555) 123-4567';
  }

  getFullAddress(member: Member): string {
    const parts = [];
    if (member.address) parts.push(member.address);
    if (member.city) parts.push(member.city);
    
    // Adresse de test si pas d'adresse réelle
    if (parts.length === 0) {
      return '123 Rue de la Paix, Montréal';
    }
    
    return parts.join(', ');
  }

  openGoogleMaps(member: Member): void {
    const address = this.getFullAddress(member);
    if (address) {
      const encodedAddress = encodeURIComponent(address);
      const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      window.open(url, '_blank');
    }
  }

  goBack(): void {
    console.log('Retour au dashboard');
    this.router.navigate(['/mobile/dashboard']);
  }


  openWhatsApp(member: Member): void {
    if (member.phoneNumber) {
      const phoneNumber = member.phoneNumber.replace(/\D/g, '');
      const message = `Bonjour ${member.firstName}, je vous contacte via l'application Eventrue.`;
      const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    }
  }

  makeCall(member: Member): void {
    if (member.phoneNumber) {
      window.open(`tel:${member.phoneNumber}`, '_self');
    }
  }


}