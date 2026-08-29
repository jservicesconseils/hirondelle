import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { APP_INITIALIZER, ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import Lara from '@primeng/themes/lara';
import { providePrimeNG } from 'primeng/config';
import { appRoutes } from './app.routes';
import { authInterceptor } from './app/core/auth/auth.interceptor';
import { AuthService } from './app/core/auth/auth.service';
import { LanguageService } from './app/core/language.service';

// Angular n'embarque que la locale en-US : sans cet enregistrement, le pipe `date`
// lève « Missing locale data » dès qu'on lui demande fr-FR, ce qui interrompt le
// rendu de la vue en cours (lignes de tableau vides).
registerLocaleData(localeFr, 'fr-FR');

export const appConfig: ApplicationConfig = {
    providers: [
        { provide: LOCALE_ID, useValue: 'fr-FR' },
        provideRouter(appRoutes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }), withEnabledBlockingInitialNavigation()),
        // L'intercepteur joint le jeton Cognito aux appels vers notre API.
        provideHttpClient(withInterceptors([authInterceptor])),

        // La session Cognito est restaurée avant le premier rendu : les gardes de
        // route disposent ainsi des rôles dès la première navigation.
        {
            provide: APP_INITIALIZER,
            multi: true,
            deps: [AuthService],
            useFactory: (auth: AuthService) => () => auth.restore()
        },

        // Bascule de langue à l'exécution (FR/EN), sans recompilation : les
        // fichiers de traduction sont chargés depuis /i18n/<langue>.json.
        provideTranslateService({ lang: 'fr', fallbackLang: 'fr' }),
        provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }),
        // Instancié tôt pour que la langue mémorisée (ou détectée) soit active
        // avant le premier rendu, comme la session Cognito ci-dessus.
        {
            provide: APP_INITIALIZER,
            multi: true,
            deps: [LanguageService],
            useFactory: () => () => {}
        },
        provideAnimationsAsync(),
        providePrimeNG({
            theme: {
                preset: Lara,
                options: { darkModeSelector: '.app-dark' }
            },
            // Sans cette traduction, les calendriers PrimeNG restent en anglais :
            // `LOCALE_ID` ne pilote que les pipes Angular, pas les composants PrimeNG.
            translation: {
                dayNames: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
                dayNamesShort: ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'],
                dayNamesMin: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
                monthNames: [
                    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
                    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
                ],
                monthNamesShort: [
                    'janv', 'févr', 'mars', 'avr', 'mai', 'juin',
                    'juil', 'août', 'sept', 'oct', 'nov', 'déc'
                ],
                today: "Aujourd'hui",
                clear: 'Effacer',
                dateFormat: 'dd/mm/yy',
                firstDayOfWeek: 1,
                weekHeader: 'Sem'
            }
        })
    ]
};
