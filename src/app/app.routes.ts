import { Routes } from '@angular/router';
import { PageNotFound } from './page-not-found/page-not-found.component';

export const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: '/work-logs' },
    { path: 'not-found', component: PageNotFound },
    { path: '**', redirectTo: '/not-found' }
];
