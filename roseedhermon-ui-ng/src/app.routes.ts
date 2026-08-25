import { Routes } from '@angular/router';
import {
  adminGuard,
  authGuard,
  eventsGuard,
  membersGuard,
  superAdminGuard
} from './app/core/auth/auth.guard';
import { AppLayout } from './app/layout/component/app.layout';
import { Landing } from './app/pages/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';
import { ListMemberComponent } from './app/web/pages/members/list-member/list-member.component';
import { ListEventsComponent } from './app/web/pages/events/list-events/list-events.component';
import { LoginComponent } from './app/web/pages/auth/login.component';
import { OauthCallbackComponent } from './app/web/pages/auth/oauth-callback.component';
import { Dashboard } from './app/web/pages/dashboard/dashboard';
import { GroupsComponent } from './app/web/pages/groups/groups.component';
import { HomeComponent } from './app/web/pages/home/home.component';
import { WebEventDetailComponent } from './app/web/pages/events/web-event-detail/web-event-detail.component';
import { WebReservationComponent } from './app/web/pages/events/web-reservation/web-reservation.component';
import { WebTicketComponent } from './app/web/pages/events/web-ticket/web-ticket.component';
import { WebCreateEventComponent } from './app/web/pages/events/web-create-event/web-create-event.component';
import { WebMembersComponent } from './app/web/pages/members/web-members/web-members.component';
import { WebMyEventsComponent } from './app/web/pages/events/web-my-events/web-my-events.component';
import { WebProfileComponent } from './app/web/pages/profile/web-profile.component';
import { VisitorEventsComponent } from './app/web/pages/visitor-events/visitor-events';
import { MobileEventsComponent } from './app/mobile/pages/events/mobile-events.component';
import { MobileMembersComponent } from './app/mobile/pages/members/mobile-members.component';
import { MobileProfileComponent } from './app/mobile/pages/profile/mobile-profile.component';
import { MobileTabsComponent } from './app/mobile/components/mobile-tabs.component';
import { PlatformRedirectComponent } from './app/core/components/platform-redirect.component';
import { MobileDashboardComponent } from './app/mobile/pages/dashboard/mobile-dashboard.component';
import { MobileEventDetailComponent } from './app/mobile/pages/events/mobile-event-detail.component';
import { MobileTicketComponent } from './app/mobile/pages/ticket/mobile-ticket.component';
import { MobilePaymentComponent } from './app/mobile/pages/payment/mobile-payment.component';
import { MobileLoginComponent } from './app/mobile/pages/login/mobile-login.component';
import { MobileTicketsComponent } from './app/mobile/pages/tickets/mobile-tickets.component';
import { MobileReservationComponent } from './app/mobile/pages/events/mobile-reservation.component';

export const appRoutes: Routes = [
    // Redirection automatique selon la plateforme
    { path: '', component: PlatformRedirectComponent },
    
    // Routes web
    { path: 'web', component: HomeComponent },
    { path: 'web/decouvrir', component: VisitorEventsComponent },
    // Un événement a besoin d'un auteur : sans session, personne ne pourrait ensuite
    // en consulter les statistiques (voir `administers` côté serveur).
    { path: 'web/creer-un-evenement', component: WebCreateEventComponent, canActivate: [authGuard] },
    // L'annuaire n'est visible que connecté, et seulement si le groupe gère ses
    // membres. Le serveur applique les deux mêmes règles.
    { path: 'web/membres', component: WebMembersComponent, canActivate: [authGuard, membersGuard] },
    /**
     * Agenda d'un membre connecté : les événements réservés à son groupe et le
     * catalogue public. Pas de `eventsGuard` ici — un groupe sans le module garde
     * accès au catalogue, et la page l'explique au lieu de rediriger.
     */
    // Agenda à assister ET onglet « Organisés par moi » (créés par la session) : les deux
    // sur cette même page, plutôt que deux pages qu'il aurait fallu deviner l'une de l'autre.
    { path: 'web/mes-evenements', component: WebMyEventsComponent, canActivate: [authGuard] },
    { path: 'web/profil', component: WebProfileComponent, canActivate: [authGuard] },
    { path: 'web/evenements/:id', component: WebEventDetailComponent },
    { path: 'web/evenements/:id/reservation', component: WebReservationComponent },
    { path: 'web/evenements/:id/billet', component: WebTicketComponent },
    { path: 'web/events', component: ListEventsComponent },
    { path: 'login', component: LoginComponent },
    // Retour de Google : Cognito y renvoie le navigateur avec son code.
    { path: 'auth/callback', component: OauthCallbackComponent },
    {
        path: 'app',
        component: AppLayout,
        canActivate: [adminGuard],
        children: [
            { path: 'dashboard', component: Dashboard },
            // Chaque module ouvre sa section : un groupe qui ne tient que son
            // annuaire n'a pas de page d'événements, et réciproquement.
            { path: 'members', component: ListMemberComponent, canActivate: [membersGuard] },
            { path: 'events', component: ListEventsComponent, canActivate: [eventsGuard] },
            { path: 'groups', component: GroupsComponent, canActivate: [superAdminGuard] },
        ]
    },
    
    // Routes mobiles
    {
        path: 'mobile',
        component: MobileTabsComponent,
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', component: MobileDashboardComponent },
            { path: 'events', component: MobileEventsComponent },
            { path: 'events/:id', component: MobileEventDetailComponent },
            { path: 'reservation/:id', component: MobileReservationComponent },
            { path: 'payment/:id', component: MobilePaymentComponent },
            { path: 'ticket/:id', component: MobileTicketComponent },
            { path: 'tickets', component: MobileTicketsComponent, canActivate: [authGuard] },
            { path: 'login', component: MobileLoginComponent },
            { path: 'members', component: MobileMembersComponent, canActivate: [authGuard, membersGuard] },
            { path: 'profile', component: MobileProfileComponent, canActivate: [authGuard] },
        ]
    },
    
    // Routes communes
    { path: 'landing', component: Landing },
    { path: 'notfound', component: Notfound },
    { path: '**', redirectTo: '/notfound' }
];
