import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

/** Adresse normalisée, prête à remplir un formulaire. */
export interface AddressSuggestion {
  /** Libellé complet affiché dans la liste de suggestions. */
  label: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  placeName: string;
  latitude: number | null;
  longitude: number | null;
}

/** Réponse Nominatim (`format=jsonv2&addressdetails=1`). */
interface NominatimResult {
  display_name?: string;
  name?: string;
  lat?: string;
  lon?: string;
  address?: Record<string, string>;
}

/**
 * Recherche d'adresse via Nominatim (OpenStreetMap) : couverture mondiale, sans
 * clé d'API. Les données de l'application mêlent adresses françaises et
 * canadiennes, d'où ce choix plutôt qu'un service limité à un seul pays.
 *
 * La politique d'usage de Nominatim impose de rester sous une requête par
 * seconde : l'appelant doit temporiser la saisie (voir le `debounceTime` du
 * formulaire de création d'événement).
 */
@Injectable({ providedIn: 'root' })
export class AddressLookupService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = 'https://nominatim.openstreetmap.org/search';

  search(query: string, limit = 5): Observable<AddressSuggestion[]> {
    const term = (query || '').trim();
    if (term.length < 3) {
      return of([]);
    }

    return this.http
      .get<NominatimResult[]>(this.endpoint, {
        params: {
          q: term,
          format: 'jsonv2',
          addressdetails: '1',
          'accept-language': 'fr',
          limit: String(limit)
        }
      })
      .pipe(
        map((results) => (results || []).map((result) => toSuggestion(result))),
        // Un service de géocodage injoignable ne doit pas casser la saisie manuelle.
        catchError((error) => {
          console.error('Recherche d\'adresse indisponible', error);
          return of([]);
        })
      );
  }
}

function toSuggestion(result: NominatimResult): AddressSuggestion {
  const parts = result.address || {};

  // Nominatim place la ville sous des clés différentes selon le type de commune.
  const city =
    parts['city'] || parts['town'] || parts['village'] || parts['municipality'] || parts['county'] || '';

  const street = [parts['house_number'], parts['road']].filter(Boolean).join(' ').trim();
  // Sans voie (lieu-dit, bâtiment nommé), on retombe sur le premier segment du
  // libellé complet, qui porte le nom du lieu.
  const address = street || (result.display_name || '').split(',')[0].trim();

  const placeName =
    parts['amenity'] || parts['building'] || parts['place_of_worship'] || parts['shop'] || result.name || '';

  return {
    label: result.display_name || address,
    address,
    city,
    postalCode: parts['postcode'] || '',
    country: parts['country'] || '',
    placeName: placeName === address ? '' : placeName,
    latitude: result.lat ? Number(result.lat) : null,
    longitude: result.lon ? Number(result.lon) : null
  };
}
