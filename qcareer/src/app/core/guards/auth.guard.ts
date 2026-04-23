import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

function waitForAuth(auth: AuthService): Promise<void> {
  return new Promise(resolve => {
    const check = () => {
      if (!auth.loading()) { resolve(); return; }
      setTimeout(check, 40);
    };
    check();
  });
}

export const authGuard: CanActivateFn = async (): Promise<boolean | UrlTree> => {
  const auth = inject(AuthService), router = inject(Router);
  await waitForAuth(auth);
  return auth.isLoggedIn() ? true : router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = async (): Promise<boolean | UrlTree> => {
  const auth = inject(AuthService), router = inject(Router);
  await waitForAuth(auth);
  return !auth.isLoggedIn() ? true : router.createUrlTree(['/dashboard']);
};
