import { Routes } from '@angular/router';
import { Access } from './access';
import { Login } from './login';
import { Error } from './error';
import { Dashboard } from '../dashboard/dashboard';
import { ListMemberComponent } from '../members/list-member/list-member.component';

export default [
    { path: 'access', component: Access },
    { path: 'error', component: Error },
    { path: '/', component: Login },
    { path: '/dashboard', component: Dashboard },
    { path: '/members', component: ListMemberComponent }
] as Routes;
