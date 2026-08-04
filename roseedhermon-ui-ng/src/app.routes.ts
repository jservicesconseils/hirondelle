import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Documentation } from './app/pages/documentation/documentation';
import { Landing } from './app/pages/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';
import { ListMemberComponent } from './app/web/pages/members/list-member/list-member.component';
import { ListEventsComponent } from './app/web/pages/events/list-events/list-events.component';
import { Login } from './app/pages/auth/login';
import { Dashboard } from './app/app/pages/dashboard/dashboard';
import { VisitorEventsComponent } from './app/pages/visitor-events/visitor-events';
import { MobileEventsComponent } from './app/mobile/pages/events/mobile-events.component';
import { MobileMembersComponent } from './app/mobile/pages/members/mobile-members.component';
import { MobileProfileComponent } from './app/mobile/pages/profile/mobile-profile.component';
import { MobileTabsComponent } from './app/mobile/components/mobile-tabs.component';
import { PlatformRedirectComponent } from './app/core/components/platform-redirect.component';
import { MobileEventsTestComponent } from './app/mobile/pages/events/mobile-events-test.component';
import { MobileDashboardComponent } from './app/mobile/pages/dashboard/mobile-dashboard.component';
import { MobileEventDetailComponent } from './app/mobile/pages/events/mobile-event-detail.component';
import { MobileTicketComponent } from './app/mobile/pages/ticket/mobile-ticket.component';

export const appRoutes: Routes = [
    // Redirection automatique selon la plateforme
    { path: '', component: PlatformRedirectComponent },
    
    // Routes web
    { path: 'web', component: VisitorEventsComponent },
    { path: 'web/events', component: ListEventsComponent },
    { path: 'login', component: Login },
    {
        path: 'app',
        component: AppLayout,
        children: [
            { path: 'dashboard', component: Dashboard },
            { path: 'members', component: ListMemberComponent },
            { path: 'events', component: ListEventsComponent },
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
            { path: 'ticket/:id', component: MobileTicketComponent },
            { path: 'members', component: MobileMembersComponent },
            { path: 'profile', component: MobileProfileComponent },
        ]
    },
    
    // Routes communes
    { path: 'landing', component: Landing },
    { path: 'notfound', component: Notfound },
    { path: 'test-ionic', component: MobileEventsTestComponent },
    { path: '**', redirectTo: '/notfound' }
];
