import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EventService } from '../../../shared/services/events/events.service';
import { EventImageService } from '../../../shared/services/events/event-image.service';
import { EVENT_CATEGORIES, EventCategoryEnum } from '../../../shared/models/model';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';

@Component({
    selector: 'app-visitor-events',
    standalone: true,
    imports: [CommonModule, RouterModule, AutoCompleteModule, ButtonModule, FormsModule, DropdownModule],
    encapsulation: ViewEncapsulation.None,
    template: `
        <!-- Header Section -->
        <header class="hero-section">
            <div class="hero-content">
                <div class="container">
                    <div class="hero-text">
                        <h1 class="hero-title">Découvrez nos événements</h1>
                        <p class="hero-subtitle">Rejoignez-nous pour des moments inoubliables et des rencontres enrichissantes</p>
                        <div class="hero-buttons">
                            <button class="btn btn-primary">Voir les événements</button>
                            <button class="btn btn-secondary">En savoir plus</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="hero-overlay"></div>
        </header>

        <!-- Barre de recherche et menus en haut -->
        <div class="search-header">
            <div class="container">
                <div class="search-wrapper">
                    <div class="search-fields">
                        <div class="unified-search">
                            <div class="search-segment city-segment">
                                <i class="pi pi-map-marker"></i>
                                <p-autoComplete
                                    [(ngModel)]="cityFilter"
                                    [suggestions]="citySuggestions"
                                    (completeMethod)="filterCity($event)"
                                    field="city"
                                    placeholder="Ville"
                                    class="search-field"
                                    inputId="city-autocomplete"
                                    name="cityFilter"
                                ></p-autoComplete>
                            </div>
                            <div class="separator"></div>
                            <div class="search-segment category-segment">
                                <i class="pi pi-tag"></i>
                                <p-dropdown
                                    [(ngModel)]="selectedCategory"
                                    [options]="categories"
                                    optionLabel="label"
                                    optionValue="key"
                                    placeholder="Catégorie"
                                    class="search-field"
                                    inputId="category-dropdown"
                                    name="category"
                                    (onChange)="applyFilters()"
                                ></p-dropdown>
                            </div>
                            <div class="separator"></div>
                            <div class="search-segment event-segment">
                                <i class="pi pi-search"></i>
                                <p-autoComplete
                                    [(ngModel)]="eventNameFilter"
                                    [suggestions]="eventNameSuggestions"
                                    (completeMethod)="filterEventName($event)"
                                    field="name"
                                    placeholder="Événement"
                                    class="search-field"
                                    inputId="eventname-autocomplete"
                                    name="eventNameFilter"
                                ></p-autoComplete>
                            </div>
                        </div>
                    </div>
                    <div class="header-actions">
                        <button pButton type="button" label="Créer un événement" icon="pi pi-plus" class="p-button-primary"></button>
                        <button pButton type="button" label="Se connecter" icon="pi pi-sign-in" class="p-button-outlined"></button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Style Toggle -->
        <div class="style-toggle">
            <div class="container">
                <div class="toggle-buttons">
                    <button 
                        class="toggle-btn" 
                        [class.active]="currentStyle === 'style1'"
                        (click)="setStyle('style1')"
                        title="Style Grille">
                        <i class="pi pi-th-large"></i>
                    </button>
                    <button 
                        class="toggle-btn" 
                        [class.active]="currentStyle === 'style2'"
                        (click)="setStyle('style2')"
                        title="Style Liste">
                        <i class="pi pi-list"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- Events Section -->
        <section class="events-section">
            <div class="container">
                <div class="section-header">
                    <h2 class="section-title">Événements à venir</h2>
                    <p class="section-subtitle">Découvrez nos prochains événements et réservez votre place</p>
                </div>

                <!-- Style 1: Original Grid Layout -->
                <div class="events-grid" *ngIf="currentStyle === 'style1'">
                    <div class="event-card" *ngFor="let event of events">
                        <div class="event-image">
                            <img [src]="getEventImageUrl(event)" 
                                 [alt]="event.name"
                                 (error)="onImageError($event, event)"
                                 (load)="onImageLoad($event, event)">
                            <div class="event-date">
                                <span class="day">{{ event.date ? (event.date | date:'dd') : '--' }}</span>
                                <span class="month">{{ event.date ? (event.date | date:'MMM') : '--' }}</span>
                            </div>
                        </div>
                        <div class="event-content">
                            <div class="event-header-style1">
                                <div class="event-category">{{ event.category }}</div>
                                <div class="event-price-style1">{{ event.free ? 'Gratuit' : (event.amount ? (event.amount + ' €') : '-') }}</div>
                            </div>
                            <h3 class="event-title">{{ event.name }}</h3>
                            <p class="event-description">{{ event.description }}</p>
                            <div class="event-meta">
                                <div class="event-location">
                                    <i class="pi pi-map-marker"></i>
                                    <span>{{ event.location?.placeName }}<span *ngIf="event.location?.city">, {{ event.location.city }}</span></span>
                                </div>
                                <div class="event-time">
                                    <i class="pi pi-clock"></i>
                                    <span>{{ event.date ? (event.date | date:'HH:mm') : '' }}</span>
                                </div>
                            </div>
                            <div class="event-footer">
                                <div class="event-buttons-style1">
                                    <button class="btn-style1 btn-outline-style1">
                                        DÉTAILS
                                    </button>
                                    <button class="btn-style1 btn-primary-style1">
                                        RÉSERVER
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Style 2: Event Style 04 Layout -->
                <div class="events-style2" *ngIf="currentStyle === 'style2'">
                    <div class="event-item-style2" *ngFor="let event of events">
                        <div class="event-image-style2">
                            <img [src]="getEventImageUrl(event)" 
                                 [alt]="event.name"
                                 (error)="onImageError($event, event)"
                                 (load)="onImageLoad($event, event)">
                            <div class="event-overlay">
                                <div class="event-date-style2">
                                    <div class="date-circle">
                                        <span class="date-day">{{ event.date ? (event.date | date:'dd') : '--' }}</span>
                                        <span class="date-month">{{ event.date ? (event.date | date:'MMM') : '--' }}</span>
                                    </div>
                                </div>
                                <div class="event-actions">
                                    <button class="action-btn">
                                        <i class="pi pi-heart"></i>
                                    </button>
                                    <button class="action-btn">
                                        <i class="pi pi-share-alt"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="event-details-style2">
                            <div class="event-header-style2">
                                <div class="event-category-style2">{{ event.category }}</div>
                                <div class="event-price-style2">{{ event.free ? 'Gratuit' : (event.amount ? (event.amount + ' €') : '-') }}</div>
                            </div>
                            <h3 class="event-title-style2">{{ event.name }}</h3>
                            <p class="event-description-style2">{{ event.description }}</p>
                            <div class="event-meta-style2">
                                <div class="meta-item location">
                                    <i class="pi pi-map-marker"></i>
                                    <span>{{ event.location?.placeName }}<span *ngIf="event.location?.city">, {{ event.location.city }}</span></span>
                                </div>
                                <div class="meta-item">
                                    <i class="pi pi-clock"></i>
                                    <span>{{ event.date ? (event.date | date:'HH:mm') : '' }}</span>
                                </div>
                                <div class="meta-item">
                                    <i class="pi pi-calendar"></i>
                                    <span>{{ event.date ? (event.date | date:'dd MMM') : '' }}</span>
                                </div>
                            </div>
                            <div class="event-footer-style2">
                                <button class="btn-style2 btn-primary-style2">
                                    RÉSERVER
                                </button>
                                <button class="btn-style2 btn-outline-style2">
                                    DÉTAILS
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="load-more">
                    <button class="btn btn-primary">Voir plus d'événements</button>
                </div>
            </div>
        </section>

        <!-- Features Section -->
        <section class="features-section">
            <div class="container">
                <div class="features-grid">
                    <div class="feature-card">
                        <div class="feature-icon">
                            <i class="pi pi-calendar"></i>
                        </div>
                        <h3>Événements variés</h3>
                        <p>Découvrez une large gamme d'événements adaptés à tous les goûts et intérêts</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">
                            <i class="pi pi-users"></i>
                        </div>
                        <h3>Communauté active</h3>
                        <p>Rejoignez une communauté dynamique de passionnés et de professionnels</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">
                            <i class="pi pi-star"></i>
                        </div>
                        <h3>Qualité garantie</h3>
                        <p>Profitez d'événements de qualité organisés avec soin et professionnalisme</p>
                    </div>
                </div>
            </div>
        </section>
    `,
    styles: [`
        /* CSS Variables for theme colors */
        :host {
            --theme-color1: #ED5F00;
            --theme-color3: #9914CB;
            --theme-color-light: #ffffff;
        }

        /* Search Header Styles */
        .search-header {
            background: linear-gradient(135deg, #2e31a4 0%, #1a1c6b 100%);
            padding: 20px 0;
            border-bottom: 1px solid #e9ecef;
        }

        .search-wrapper {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
        }

        .search-fields {
            display: flex;
            gap: 15px;
            flex: 1;
        }

        .unified-search {
            display: flex;
            align-items: center;
            background: white;
            border-radius: 8px;
            border: 1px solid #ddd;
            position: relative;
            flex: 1;
        }

        .search-segment {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
        }

        .city-segment {
            flex: 1;
            min-width: 0;
        }

        .category-segment {
            flex: 1;
            min-width: 0;
        }

        .event-segment {
            flex: 2;
            min-width: 0;
        }

        .separator {
            width: 1px;
            height: 30px;
            background: #ddd;
            margin: 0 4px;
        }

        .search-segment i {
            color: #2e31a4;
            font-size: 1rem;
            flex-shrink: 0;
        }

        .search-field {
            flex: 1;
            min-width: 0;
        }

        .header-actions {
            display: flex;
            gap: 10px;
        }

        /* PrimeNG Override Styles */
        :host ::ng-deep .search-field .p-autocomplete,
        :host ::ng-deep .search-field .p-dropdown {
            width: 100%;
        }

        :host ::ng-deep .search-field .p-autocomplete-input,
        :host ::ng-deep .search-field .p-dropdown-label {
            border: none;
            border-radius: 0;
            padding: 0;
            font-size: 0.9rem;
            background: transparent;
            box-shadow: none;
        }

        :host ::ng-deep .search-field .p-autocomplete-input:focus,
        :host ::ng-deep .search-field .p-dropdown.p-focus .p-dropdown-label {
            border: none;
            outline: none;
            box-shadow: none;
        }

        :host ::ng-deep .search-field .p-dropdown-trigger {
            color: #2e31a4;
        }

        :host ::ng-deep .unified-search .p-autocomplete-panel,
        :host ::ng-deep .unified-search .p-dropdown-panel {
            margin-top: 4px;
            z-index: 9999;
            position: absolute;
        }

        :host ::ng-deep .unified-search .p-dropdown-panel {
            position: absolute;
            z-index: 9999;
        }

        :host ::ng-deep .unified-search .p-dropdown-items-wrapper {
            z-index: 9999;
        }

        :host ::ng-deep .p-dropdown-panel {
            z-index: 9999 !important;
        }

        :host ::ng-deep .p-autocomplete-panel {
            z-index: 9999 !important;
        }

        /* Style moderne pour le dropdown catégorie */
        :host ::ng-deep .category-segment .p-dropdown {
            width: 220px;
            min-width: 180px;
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(46,49,164,0.07);
            border: 1.5px solid #e9ecef;
        }
        :host ::ng-deep .category-segment .p-dropdown-label {
            color: #2e31a4;
            font-weight: 600;
            font-size: 1rem;
            padding-left: 2.2em;
        }
        :host ::ng-deep .category-segment .p-dropdown .p-dropdown-trigger {
            color: #2e31a4;
        }
        :host ::ng-deep .category-segment .p-dropdown-panel {
            border-radius: 8px;
            box-shadow: 0 8px 24px rgba(46,49,164,0.10);
            border: 1.5px solid #e9ecef;
            margin-top: 4px;
        }
        :host ::ng-deep .category-segment .p-dropdown-item {
            padding-left: 2.2em;
            font-size: 1rem;
            color: #222;
            position: relative;
        }
        :host ::ng-deep .category-segment .p-dropdown-item.p-highlight {
            background: #2e31a4 !important;
            color: #fff !important;
        }
        :host ::ng-deep .category-segment .p-dropdown-item:not(.p-highlight):hover {
            background: #f2f4fa !important;
            color: #2e31a4 !important;
        }
        /* Icône à gauche du label */
        :host ::ng-deep .category-segment .p-dropdown-item:before,
        :host ::ng-deep .category-segment .p-dropdown-label:before {
            content: "\\f02b"; /* pi pi-tag */
            font-family: 'PrimeIcons';
            position: absolute;
            left: 0.7em;
            color: #2e31a4;
            font-size: 1.1em;
            top: 50%;
            transform: translateY(-50%);
        }
        :host ::ng-deep .category-segment .p-dropdown-label.p-placeholder {
            color: #888 !important;
            font-weight: 400;
        }

        /* Style pill moderne pour le dropdown catégorie */
        :host ::ng-deep .category-segment .p-dropdown {
            width: 240px;
            min-width: 180px;
            background: #f2f4fa;
            border-radius: 999px;
            box-shadow: 0 2px 8px rgba(46,49,164,0.07);
            border: 2px solid #e9ecef;
            padding: 0 18px;
            font-size: 1.05rem;
            font-weight: 600;
            color: #2e31a4;
            transition: box-shadow 0.2s, border-color 0.2s;
        }
        :host ::ng-deep .category-segment .p-dropdown.p-focus {
            box-shadow: 0 0 0 3px rgba(46,49,164,0.10);
            border-color: #2e31a4;
        }
        :host ::ng-deep .category-segment .p-dropdown-label {
            color: #2e31a4;
            font-weight: 600;
            font-size: 1.05rem;
            padding-left: 2.2em;
            text-align: center;
        }
        :host ::ng-deep .category-segment .p-dropdown-label.p-placeholder {
            color: #8fa2d6 !important;
            font-weight: 400;
        }
        :host ::ng-deep .category-segment .p-dropdown .p-dropdown-trigger {
            color: #2e31a4;
        }
        :host ::ng-deep .category-segment .p-dropdown-panel {
            border-radius: 18px;
            box-shadow: 0 8px 24px rgba(46,49,164,0.10);
            border: 2px solid #e9ecef;
            margin-top: 4px;
            overflow: hidden;
        }
        :host ::ng-deep .category-segment .p-dropdown-item {
            padding-left: 2.2em;
            font-size: 1.05rem;
            color: #2e31a4;
            position: relative;
            border-radius: 999px;
            margin: 2px 8px;
            transition: background 0.15s, color 0.15s;
        }
        :host ::ng-deep .category-segment .p-dropdown-item.p-highlight {
            background: #2e31a4 !important;
            color: #fff !important;
            box-shadow: 0 2px 8px rgba(46,49,164,0.10);
        }
        :host ::ng-deep .category-segment .p-dropdown-item:not(.p-highlight):hover {
            background: #1a1c6b !important;
            color: #fff !important;
        }
        /* Icône à gauche du label */
        :host ::ng-deep .category-segment .p-dropdown-item:before,
        :host ::ng-deep .category-segment .p-dropdown-label:before {
            content: "\\f02b"; /* pi pi-tag */
            font-family: 'PrimeIcons';
            position: absolute;
            left: 0.7em;
            color: #2e31a4;
            font-size: 1.1em;
            top: 50%;
            transform: translateY(-50%);
        }

        /* Style moderne pour la liste déroulante du dropdown catégorie */
        :host ::ng-deep .category-segment .p-dropdown-panel {
            background: #f8faff;
            border-radius: 12px !important;
            box-shadow: 0 8px 32px rgba(46,49,164,0.18);
            border: 2px solid #e9ecef;
            margin-top: 6px;
            padding: 8px 0;
            animation: fadeInDropdown 0.18s cubic-bezier(.4,0,.2,1);
        }
        :host ::ng-deep .category-segment .p-dropdown-items {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        :host ::ng-deep .category-segment .p-dropdown-item {
            padding: 12px 2.2em 12px 2.2em;
            font-size: 1.08rem;
            color: #2e31a4;
            border-radius: 999px;
            margin: 0 10px;
            transition: background 0.15s, color 0.15s, box-shadow 0.15s;
            box-shadow: none;
        }
        :host ::ng-deep .category-segment .p-dropdown-item.p-highlight {
            background: #2e31a4 !important;
            color: #fff !important;
            box-shadow: 0 2px 8px rgba(46,49,164,0.10);
        }
        :host ::ng-deep .category-segment .p-dropdown-item:not(.p-highlight):hover {
            background: #e3eafd !important;
            color: #2e31a4 !important;
        }
        @keyframes fadeInDropdown {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* Responsive */
        @media (max-width: 768px) {
            .search-wrapper {
                flex-direction: column;
                gap: 15px;
            }

            .search-fields {
                flex-direction: column;
                width: 100%;
            }

            .unified-search {
                flex-direction: column;
                border-radius: 8px;
            }

            .search-segment {
                width: 100%;
                border-bottom: 1px solid #eee;
            }

            .search-segment:last-child {
                border-bottom: none;
            }

            .separator {
                display: none;
            }

            .header-actions {
                width: 100%;
                justify-content: center;
            }
        }

        /* Reset and base styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }

        /* Style Toggle */
        .style-toggle {
            background: #f8f9fa;
            padding: 20px 0;
            border-bottom: 1px solid #e9ecef;
        }

        .toggle-buttons {
            display: flex;
            justify-content: center;
            gap: 10px;
        }

        .toggle-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 50px;
            height: 50px;
            border: 2px solid #2e31a4;
            background: white;
            color: #2e31a4;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.3s ease;
            font-weight: 600;
        }

        .toggle-btn i {
            font-size: 1.2rem;
        }

        .toggle-btn.active {
            background: #2e31a4;
            color: white;
            transform: scale(1.1);
        }

        .toggle-btn:hover {
            background: #2e31a4;
            color: white;
            transform: scale(1.05);
        }

        /* Hero Section */
        .hero-section {
            position: relative;
            height: 100vh;
            /* background: linear-gradient(135deg, #2e31a4 0%, #1a1c6b 100%); */
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            color: white;
            overflow: hidden;
        }

        .hero-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.4);
            z-index: 1;
        }

        .hero-content {
            position: relative;
            z-index: 2;
            width: 100%;
        }

        .hero-title {
            font-size: 3.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }

        .hero-subtitle {
            font-size: 1.25rem;
            margin-bottom: 2rem;
            opacity: 0.9;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }

        .hero-buttons {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
        }

        /* Button Styles */
        .btn {
            padding: 12px 30px;
            border: none;
            border-radius: 50px;
            font-size: 1rem;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            transition: all 0.3s ease;
            display: inline-block;
            text-align: center;
        }

        .btn-primary {
            background: linear-gradient(135deg, #2e31a4 0%, #1a1c6b 100%);
            color: white;
            box-shadow: 0 4px 15px rgba(46, 49, 164, 0.4);
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(46, 49, 164, 0.6);
        }

        .btn-secondary {
            background: transparent;
            color: white;
            border: 2px solid white;
        }

        .btn-secondary:hover {
            background: white;
            color: #2e31a4;
        }

        .btn-outline {
            background: transparent;
            color: #2e31a4;
            border: 2px solid #2e31a4;
        }

        .btn-outline:hover {
            background: #2e31a4;
            color: white;
        }

        /* Events Section */
        .events-section {
            padding: 80px 0;
            background: #f8f9fa;
        }

        .section-header {
            text-align: center;
            margin-bottom: 60px;
        }

        .section-title {
            font-size: 2.5rem;
            font-weight: 700;
            color: #333;
            margin-bottom: 1rem;
        }

        .section-subtitle {
            font-size: 1.1rem;
            color: #666;
            max-width: 600px;
            margin: 0 auto;
        }

        /* Style 1: Original Grid Layout */
        .events-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 30px;
            margin-bottom: 50px;
        }

        .event-card {
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
        }

        .event-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }

        .event-image {
            position: relative;
            height: 200px;
            overflow: hidden;
        }

        .event-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .event-date {
            position: absolute;
            top: 15px;
            right: 15px;
            background: rgba(46, 49, 164, 0.9);
            color: white;
            padding: 10px;
            border-radius: 8px;
            text-align: center;
            min-width: 60px;
        }

        .event-date .day {
            display: block;
            font-size: 1.5rem;
            font-weight: 700;
            line-height: 1;
        }

        .event-date .month {
            display: block;
            font-size: 0.8rem;
            text-transform: uppercase;
            opacity: 0.9;
        }

        .event-content {
            padding: 25px;
            display: flex;
            flex-direction: column;
            height: 400px;
        }

        .event-header-style1 {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
            height: 30px;
        }

        .event-category {
            color: #2e31a4;
            font-size: 0.9rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .event-price-style1 {
            font-size: 1.3rem;
            font-weight: 700;
            color: #2e31a4;
        }

        .event-title {
            font-size: 1.4rem;
            font-weight: 700;
            color: #333;
            margin-bottom: 10px;
            line-height: 1.3;
            height: 60px;
            overflow: hidden;
        }

        .event-description {
            color: #666;
            margin-bottom: 20px;
            line-height: 1.6;
            height: 80px;
            overflow: hidden;
        }

        .event-meta {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
            height: 30px;
        }

        .event-location, .event-time {
            display: flex;
            align-items: center;
            gap: 5px;
            color: #666;
            font-size: 0.9rem;
        }

        .event-location i, .event-time i {
            color: #2e31a4;
        }

        .event-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 20px;
            border-top: 1px solid #eee;
            margin-top: auto;
            height: 80px;
        }

        .event-buttons-style1 {
            display: flex;
            gap: 15px;
            justify-content: space-between;
            width: 100%;
        }

        .btn-style1 {
            padding: 12px 25px;
            border: none;
            border-radius: 25px;
            font-size: 0.9rem;
            font-weight: 800;
            text-transform: uppercase;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            width: 120px;
            justify-content: center;
        }

        .btn-primary-style1 {
            position: relative;
            font-size: 14px;
            line-height: 18px;
            padding: 12px 30px;
            border-radius: 50px;
            font-weight: 800;
            overflow: hidden;
            color: #ffffff;
            background-color: #7C3AED; /* Violet foncé */
            text-transform: uppercase;
            border: none;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            width: 120px;
            justify-content: center;
        }

        .btn-primary-style1:hover {
            background-color: #6D28D9; /* Violet encore plus foncé au hover */
            color: #ffffff;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4);
        }

        .btn-outline-style1 {
            background-color: #F59E0B; /* Orange comme demandé */
            color: #ffffff;
            padding: 10px 25px;
            border: none;
            border-radius: 25px;
            font-size: 0.8rem;
            font-weight: 800;
            text-transform: uppercase;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            width: 120px;
            justify-content: center;
        }

        .btn-outline-style1:hover {
            background-color: #D97706; /* Orange plus foncé au hover */
            color: #ffffff;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }

        /* Style 2: Event Style 04 Layout */
        .events-style2 {
            display: flex;
            flex-direction: column;
            gap: 30px;
            margin-bottom: 50px;
        }

        .event-item-style2 {
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            display: flex;
            height: 280px;
        }

        .event-item-style2:hover {
            transform: translateY(-5px);
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
        }

        .event-image-style2 {
            position: relative;
            width: 350px;
            height: 100%;
            overflow: hidden;
        }

        .event-image-style2 img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
        }

        .event-item-style2:hover .event-image-style2 img {
            transform: scale(1.05);
        }

        .event-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(46, 49, 164, 0.8) 0%, rgba(26, 28, 107, 0.8) 100%);
            opacity: 0;
            transition: opacity 0.3s ease;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 20px;
        }

        .event-item-style2:hover .event-overlay {
            opacity: 1;
        }

        .event-date-style2 {
            display: flex;
            justify-content: flex-end;
        }

        .date-circle {
            background: linear-gradient(135deg, #2e31a4 0%, #1a1c6b 100%);
            border-radius: 15px;
            width: 80px;
            height: 80px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            position: relative;
            box-shadow: 0 8px 20px rgba(46, 49, 164, 0.3);
            border: 2px solid rgba(255, 255, 255, 0.2);
            transform: rotate(-5deg);
        }

        .date-circle::before {
            content: '';
            position: absolute;
            top: -15px;
            left: 50%;
            transform: translateX(-50%);
            width: 30px;
            height: 20px;
            background: linear-gradient(135deg, #2e31a4 0%, #1a1c6b 100%);
            border-radius: 15px 15px 0 0;
            z-index: -1;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            border: 2px solid rgba(255, 255, 255, 0.2);
        }

        .date-circle::after {
            content: '';
            position: absolute;
            top: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 20px;
            height: 15px;
            background: linear-gradient(135deg, #2e31a4 0%, #1a1c6b 100%);
            border-radius: 10px 10px 0 0;
            z-index: -1;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .date-day {
            font-size: 1.6rem;
            font-weight: 800;
            line-height: 1;
            color: white;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .date-month {
            font-size: 0.9rem;
            text-transform: uppercase;
            font-weight: 700;
            color: white;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
            letter-spacing: 1px;
        }

        .date-circle:hover {
            transform: rotate(0deg) scale(1.05);
            box-shadow: 0 12px 30px rgba(46, 49, 164, 0.4);
            transition: all 0.3s ease;
        }

        .event-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }

        .action-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: none;
            background: rgba(255, 255, 255, 0.9);
            color: #2e31a4;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .action-btn:hover {
            background: white;
            transform: scale(1.1);
        }

        .event-details-style2 {
            flex: 1;
            padding: 30px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        .event-header-style2 {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
        }

        .event-category-style2 {
            background: linear-gradient(135deg, #2e31a4 0%, #1a1c6b 100%);
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .event-price-style2 {
            font-size: 1.3rem;
            font-weight: 700;
            color: #2e31a4;
        }

        .event-title-style2 {
            font-size: 1.6rem;
            font-weight: 700;
            color: #333;
            margin-bottom: 15px;
            line-height: 1.3;
        }

        .event-description-style2 {
            color: #666;
            line-height: 1.6;
            margin-bottom: 20px;
            flex: 1;
        }

        .event-meta-style2 {
            display: flex;
            gap: 25px;
            margin-bottom: 25px;
            flex-wrap: wrap;
        }

        .meta-item {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #666;
            font-size: 0.9rem;
        }

        .meta-item i {
            color: #2e31a4;
            font-size: 1rem;
        }

        .meta-item.location {
            font-weight: 700 !important;
            color: #333 !important;
        }

        .meta-item.location span {
            font-weight: 700 !important;
        }

        .event-footer-style2 {
            display: flex;
            gap: 15px;
            justify-content: flex-end;
        }

        .btn-style2 {
            padding: 12px 25px;
            border: none;
            border-radius: 25px;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .btn-primary-style2 {
            position: relative;
            font-size: 16px;
            line-height: 20px;
            padding: 16.5px 41px;
            border-radius: 50px;
            font-weight: 800;
            overflow: hidden;
            color: #ffffff;
            background-color: #F59E0B; /* Orange moderne */
            text-transform: uppercase;
            border: none;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .btn-primary-style2:hover {
            background-color: #D97706; /* Orange plus foncé au hover */
            color: #ffffff;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
        }

        .btn-outline-style2 {
            background-color: #F3F4F6; /* Gris clair moderne */
            color: #374151; /* Gris foncé pour le texte */
            padding: 14.5px 36px;
            border: none;
            border-radius: 25px;
            font-size: 0.9rem;
            font-weight: 800;
            text-transform: uppercase;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .btn-outline-style2:hover {
            background-color: #E5E7EB; /* Gris plus foncé au hover */
            color: #1F2937; /* Gris très foncé au hover */
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(156, 163, 175, 0.3);
        }

        .load-more {
            text-align: center;
        }

        /* Features Section */
        .features-section {
            padding: 80px 0;
            background: white;
        }

        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 40px;
        }

        .feature-card {
            text-align: center;
            padding: 40px 20px;
        }

        .feature-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #2e31a4 0%, #1a1c6b 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
        }

        .feature-icon i {
            font-size: 2rem;
            color: white;
        }

        .feature-card h3 {
            font-size: 1.5rem;
            font-weight: 700;
            color: #333;
            margin-bottom: 15px;
        }

        .feature-card p {
            color: #666;
            line-height: 1.6;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
            .hero-title {
                font-size: 2.5rem;
            }

            .hero-subtitle {
                font-size: 1.1rem;
            }

            .hero-buttons {
                flex-direction: column;
                align-items: center;
            }

            .events-grid {
                grid-template-columns: 1fr;
            }

            .event-item-style2 {
                flex-direction: column;
                height: auto;
            }

            .event-image-style2 {
                width: 100%;
                height: 200px;
            }

            .event-details-style2 {
                padding: 20px;
            }

            .event-meta-style2 {
                gap: 15px;
            }

            .event-footer-style2 {
                flex-direction: column;
            }

            .section-title {
                font-size: 2rem;
            }

            .features-grid {
                grid-template-columns: 1fr;
            }
        }

        @media (max-width: 480px) {
            .hero-title {
                font-size: 2rem;
            }

            .container {
                padding: 0 15px;
            }

            .event-content {
                padding: 20px;
            }

            .event-details-style2 {
                padding: 15px;
            }
        }

        /* Styles robustes pour les boutons RÉSERVER et DÉTAILS */
        :host ::ng-deep .event-buttons-style1 .btn-primary-style1 {
            background: #7C3AED !important; /* Violet foncé */
            color: #fff !important;
            border: none !important;
            border-radius: 999px !important;
            font-weight: 700 !important;
            font-size: 1rem !important;
            padding: 12px 32px !important;
            box-shadow: 0 2px 8px rgba(124, 58, 237, 0.10) !important;
            transition: background 0.18s, color 0.18s, box-shadow 0.18s !important;
        }
        :host ::ng-deep .event-footer-style2 .btn-primary-style2 {
            background: #F59E0B !important; /* Orange moderne */
            color: #fff !important;
            border: none !important;
            border-radius: 999px !important;
            font-weight: 700 !important;
            font-size: 1rem !important;
            padding: 12px 32px !important;
            box-shadow: 0 2px 8px rgba(245, 158, 11, 0.10) !important;
            transition: background 0.18s, color 0.18s, box-shadow 0.18s !important;
        }
        :host ::ng-deep .event-buttons-style1 .btn-primary-style1:hover {
            background: #6D28D9 !important; /* Violet encore plus foncé */
            color: #fff !important;
            box-shadow: 0 4px 16px rgba(124, 58, 237, 0.18) !important;
        }
        :host ::ng-deep .event-footer-style2 .btn-primary-style2:hover {
            background: #D97706 !important; /* Orange plus foncé */
            color: #fff !important;
            box-shadow: 0 4px 16px rgba(245, 158, 11, 0.18) !important;
        }
        :host ::ng-deep .event-buttons-style1 .btn-outline-style1 {
            background: #F59E0B !important; /* Orange comme demandé */
            color: #fff !important;
            border: none !important;
            border-radius: 999px !important;
            font-weight: 700 !important;
            font-size: 1rem !important;
            padding: 12px 32px !important;
            box-shadow: none !important;
            transition: background 0.18s, color 0.18s, box-shadow 0.18s !important;
        }
        :host ::ng-deep .event-footer-style2 .btn-outline-style2 {
            background: #F3F4F6 !important; /* Gris clair moderne */
            color: #374151 !important; /* Gris foncé pour le texte */
            border: none !important;
            border-radius: 999px !important;
            font-weight: 700 !important;
            font-size: 1rem !important;
            padding: 12px 32px !important;
            box-shadow: none !important;
            transition: background 0.18s, color 0.18s, box-shadow 0.18s !important;
        }
        :host ::ng-deep .event-buttons-style1 .btn-outline-style1:hover {
            background: #D97706 !important; /* Orange plus foncé */
            color: #fff !important;
            box-shadow: 0 4px 16px rgba(245, 158, 11, 0.18) !important;
        }
        :host ::ng-deep .event-footer-style2 .btn-outline-style2:hover {
            background: #E5E7EB !important; /* Gris plus foncé */
            color: #1F2937 !important; /* Gris très foncé */
            box-shadow: 0 4px 16px rgba(156, 163, 175, 0.18) !important;
        }
    `]
})
export class VisitorEventsComponent implements OnInit {
    currentStyle = 'style1';
    cityFilter: string = '';
    citySuggestions: string[] = [];
    eventNameFilter: string = '';
    eventNameSuggestions: string[] = [];
    selectedCategory: EventCategoryEnum | '' = '';
    categories = EVENT_CATEGORIES;
    events: any[] = [];
    allEvents: any[] = [];

    constructor(
        private eventService: EventService,
        private eventImageService: EventImageService
    ) { }

    ngOnInit(): void {
        // Essayer d'abord de récupérer les événements avec fichiers
        this.eventService.getEventsWithFiles().subscribe({
            next: (events) => {
                console.log('📋 Événements avec fichiers reçus:', events);
                this.allEvents = events;
                this.logEventsDetails(events);
                this.applyFilters();
            },
            error: (error) => {
                console.log('⚠️ Endpoint with-files non disponible, fallback vers getEvents:', error);
                // Fallback vers la méthode de base
                this.eventService.getEvents().subscribe(events => {
                    console.log('📋 Événements de base reçus:', events);
                    this.allEvents = events;
                    this.logEventsDetails(events);
                    this.applyFilters();
                });
            }
        });
    }

    private logEventsDetails(events: any[]): void {
        events.forEach((event, index) => {
            console.log(`📅 Événement ${index + 1}:`, {
                id: event.id,
                name: event.name,
                mainPhotoId: event.mainPhotoId,
                hasFiles: !!event.files,
                filesCount: event.files ? event.files.length : 0,
                files: event.files
            });
        });
    }

    // Méthode pour obtenir l'URL de l'image principale de l'événement
    getEventImageUrl(event: any): string {
        return this.eventImageService.getEventImageUrl(event);
    }

    // Gestion des erreurs de chargement d'images
    onImageError(event: any, eventData: any): void {
        this.eventImageService.onImageError(eventData, event.target);
    }

    // Gestion du chargement réussi des images
    onImageLoad(event: any, eventData: any): void {
        this.eventImageService.onImageLoad(eventData, event.target);
    }

    setStyle(style: string) {
        this.currentStyle = style;
    }

    filterCity(event: any) {
        const query = event.query.toLowerCase();
        this.eventService.getEvents().subscribe(events => {
            this.citySuggestions = [...new Set(events.map(e => e.location?.city).filter((v): v is string => !!v && v.toLowerCase().includes(query)))];
        });
        this.applyFilters();
    }
    filterEventName(event: any) {
        const query = event.query.toLowerCase();
        this.eventService.getEvents().subscribe(events => {
            this.eventNameSuggestions = [...new Set(events.map(e => e.name).filter((v): v is string => !!v && v.toLowerCase().includes(query)))];
        });
        this.applyFilters();
    }
    applyFilters() {
        this.events = this.allEvents.filter(event => {
            const cityMatch = !this.cityFilter || (event.location?.city && event.location.city.toLowerCase().includes(this.cityFilter.toLowerCase()));
            const nameMatch = !this.eventNameFilter || (event.name && event.name.toLowerCase().includes(this.eventNameFilter.toLowerCase()));
            const catMatch = !this.selectedCategory || event.category === this.selectedCategory;
            return cityMatch && nameMatch && catMatch;
        });
    }
} 