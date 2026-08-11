import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { FormsModule } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { DropdownModule } from 'primeng/dropdown';
import { EVENT_CATEGORIES } from '../../../shared/models/model';

@Component({
    selector: 'hero-widget',
    imports: [ButtonModule, RippleModule, FormsModule, AutoCompleteModule, DropdownModule],
    template: `
        <div
            id="hero"
            class="flex flex-col pt-6 px-6 lg:px-20 overflow-hidden"
            style="background: linear-gradient(0deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2)), radial-gradient(77.36% 256.97% at 77.36% 57.52%, rgb(238, 239, 175) 0%, rgb(195, 227, 250) 100%); clip-path: ellipse(150% 87% at 93% 13%)"
        >
            <div class="mx-6 md:mx-20 mt-0 md:mt-6">
                <h1 class="text-6xl font-bold text-gray-900 leading-tight"><span class="font-light block">Eu sem integer</span>eget magna fermentum</h1>
                <p class="font-normal text-2xl leading-normal md:mt-4 text-gray-700">Sed blandit libero volutpat sed cras. Fames ac turpis egestas integer. Placerat in egestas erat...</p>
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-8 mt-8">
                    <!-- Recherche à gauche -->
                    <form class="flex flex-col md:flex-row gap-4 md:gap-2 w-full md:w-auto">
                        <p-autoComplete
                            [(ngModel)]="city"
                            [suggestions]="filteredCities"
                            (completeMethod)="filterCity($event)"
                            field="city"
                            placeholder="Ville de l'événement"
                            class="w-full md:w-56"
                            inputId="city-autocomplete"
                            name="city"
                        ></p-autoComplete>
                        <p-dropdown
                            [(ngModel)]="category"
                            [options]="categories"
                            optionLabel="label"
                            optionValue="key"
                            placeholder="Catégorie"
                            class="w-full md:w-48"
                            inputId="category-dropdown"
                            name="category"
                        ></p-dropdown>
                        <p-autoComplete
                            [(ngModel)]="eventName"
                            [suggestions]="filteredEventNames"
                            (completeMethod)="filterEventName($event)"
                            field="name"
                            placeholder="Nom de l'événement"
                            class="w-full md:w-56"
                            inputId="eventname-autocomplete"
                            name="eventName"
                        ></p-autoComplete>
                    </form>
                    <!-- Boutons à droite -->
                    <div class="flex gap-4 justify-end">
                        <button pButton pRipple [rounded]="true" type="button" label="Créer un événement" class="!text-xl !px-4" routerLink="/app/events/create"></button>
                        <button pButton pRipple [rounded]="true" type="button" label="Se connecter" class="!text-xl !px-4 p-button-secondary" routerLink="/auth/login"></button>
                    </div>
                </div>
            </div>
            <div class="flex justify-center md:justify-end">
                <img src="https://primefaces.org/cdn/templates/sakai/landing/screen-1.png" alt="Hero Image" class="w-9/12 md:w-auto" />
            </div>
        </div>
    `,
})
export class HeroWidget {
    city: string = '';
    filteredCities: string[] = [];
    category: string = '';
    categories = EVENT_CATEGORIES;
    eventName: string = '';
    filteredEventNames: string[] = [];

    // Simuler une source de données pour l'autocomplete (à remplacer par un service réel)
    allCities: string[] = ['Montréal', 'Paris', 'Lyon', 'Québec', 'Toronto', 'Marseille'];
    allEventNames: string[] = ['Forum Immigration', 'Salon Étudiant', 'Journée Carrière', 'Atelier CV', 'Conférence Diversité'];

    filterCity(event: any) {
        const query = event.query.toLowerCase();
        this.filteredCities = this.allCities.filter(city => city.toLowerCase().includes(query));
    }
    filterEventName(event: any) {
        const query = event.query.toLowerCase();
        this.filteredEventNames = this.allEventNames.filter(name => name.toLowerCase().includes(query));
    }
}
