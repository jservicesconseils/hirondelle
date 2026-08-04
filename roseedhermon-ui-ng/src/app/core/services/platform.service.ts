import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class PlatformService {
  
  constructor(private platform: Platform) { }

  isMobile(): boolean {
    return this.platform.is('mobile') || this.platform.is('android') || this.platform.is('ios');
  }

  isWeb(): boolean {
    return this.platform.is('desktop') || this.platform.is('pwa');
  }

  isAndroid(): boolean {
    return this.platform.is('android');
  }

  isIOS(): boolean {
    return this.platform.is('ios');
  }

  getPlatformName(): string {
    if (this.isAndroid()) return 'android';
    if (this.isIOS()) return 'ios';
    if (this.isWeb()) return 'web';
    return 'unknown';
  }

  getDefaultRoute(): string {
    return this.isMobile() ? '/mobile' : '/web';
  }
}