import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';

interface MenuItem {
  label: string;
  iconHtml: SafeHtml;
  route: string;
  exact?: boolean;
  children?: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {

  menuItems: MenuItem[] = [];
  membershipChildren: MenuItem[] = [];
  attendanceChildren: MenuItem[] = [];
  isMembershipOpen: boolean = false;
  isAttendanceOpen: boolean = false;
  usersChildren: MenuItem[] = [];
  isUsersOpen: boolean = false;

  constructor(
    private sanitizer: DomSanitizer,
    private router: Router,
    private authService: AuthService
  ) {
    this.initMenuItems();
  }

  ngOnInit(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.isUsersOpen = this.isUsersActive();
      this.isMembershipOpen = this.isMembershipActive();
      this.isAttendanceOpen = this.isAttendanceActive();
    });

    setTimeout(() => {
      this.isUsersOpen = this.isUsersActive();
      this.isMembershipOpen = this.isMembershipActive();
      this.isAttendanceOpen = this.isAttendanceActive();
    }, 100);
  }

  initMenuItems(): void {
    const assignIcon = this.sanitizer.bypassSecurityTrustHtml(`
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
        <line x1="19" y1="5" x2="19" y2="11"></line>
        <line x1="16" y1="8" x2="22" y2="8"></line>
      </svg>
    `);

    const historyIcon = this.sanitizer.bypassSecurityTrustHtml(`
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
        <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
        <g id="SVGRepo_iconCarrier"> 
        <path d="M7 3V6M17 3V6M7.10002 20C7.56329 17.7178 9.58104 16 12 16C14.419 16 16.4367 17.7178 16.9 20M6.2 21H17.8C18.9201 21 19.4802 21 19.908 20.782C20.2843 20.5903 20.5903 20.2843 20.782 19.908C21 19.4802 21 18.9201 21 17.8V8.2C21 7.07989 21 6.51984 20.782 6.09202C20.5903 5.71569 20.2843 5.40973 19.908 5.21799C19.4802 5 18.9201 5 17.8 5H6.2C5.0799 5 4.51984 5 4.09202 5.21799C3.71569 5.40973 3.40973 5.71569 3.21799 6.09202C3 6.51984 3 7.07989 3 8.2V17.8C3 18.9201 3 19.4802 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.51984 21 5.07989 21 6.2 21ZM14 11C14 12.1046 13.1046 13 12 13C10.8954 13 10 12.1046 10 11C10 9.89543 10.8954 9 12 9C13.1046 9 14 9.89543 14 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g>
      </svg>
    `);

    const profileIcon = this.sanitizer.bypassSecurityTrustHtml(`
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
        <path d="M18 8v6"></path>
        <path d="M15 11h6"></path>
      </svg>
    `);

    const documentIcon = this.sanitizer.bypassSecurityTrustHtml(`
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    `);

    const certificateIcon = this.sanitizer.bypassSecurityTrustHtml(`
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="8" r="7"></circle>
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
      </svg>
    `);

    const physicalHistoryIcon = this.sanitizer.bypassSecurityTrustHtml(`
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
      </svg>
    `);

    const medicalProfileIcon = this.sanitizer.bypassSecurityTrustHtml(`
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"></path>
        <line x1="12" y1="8" x2="12" y2="16"></line>
        <line x1="8" y1="12" x2="16" y2="12"></line>
      </svg>
    `);

    this.membershipChildren = [
      {
        label: 'Asignar Membresía',
        route: '/dashboard-admin/memberships/assign',
        iconHtml: assignIcon,
      }
    ];

    this.attendanceChildren = [
      {
        label: 'Historial Accesos',
        route: '/dashboard-admin/attendance/history',
        iconHtml: historyIcon,
      }
    ];

    this.usersChildren = [
      {
        label: 'Credenciales de Usuarios',
        route: '/dashboard-admin/users',
        exact: true,
        iconHtml: this.sanitizer.bypassSecurityTrustHtml(`
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        `),
      },
      {
        label: 'Perfiles de Usuarios',
        route: '/dashboard-admin/users/profiles',
        iconHtml: profileIcon,
      },
      {
        label: 'Documentos Legales',
        route: '/dashboard-admin/users/documents',
        iconHtml: documentIcon,
      },
      {
        label: 'Certificaciones',
        route: '/dashboard-admin/users/certificates',
        iconHtml: certificateIcon,
      },
      {
        label: 'Historial Físico',
        route: '/dashboard-admin/users/physical-history',
        iconHtml: physicalHistoryIcon,
      },
      {
        label: 'Perfiles Médicos',
        route: '/dashboard-admin/users/medical-profile',
        iconHtml: medicalProfileIcon,
      }
    ];

    this.menuItems = [
      {
        label: 'Dashboard',
        route: '/dashboard-admin',
        exact: true,
        iconHtml: this.sanitizer.bypassSecurityTrustHtml(`
          <svg viewBox="0 -0.5 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" class="sidebar__nav-icon">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M9.918 10.0005H7.082C6.66587 9.99708 6.26541 10.1591 5.96873 10.4509C5.67204 10.7427 5.50343 11.1404 5.5 11.5565V17.4455C5.5077 18.3117 6.21584 19.0078 7.082 19.0005H9.918C10.3341 19.004 10.7346 18.842 11.0313 18.5502C11.328 18.2584 11.4966 17.8607 11.5 17.4445V11.5565C11.4966 11.1404 11.328 10.7427 11.0313 10.4509C10.7346 10.1591 10.3341 9.99708 9.918 10.0005Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M9.918 4.0006H7.082C6.23326 3.97706 5.52559 4.64492 5.5 5.4936V6.5076C5.52559 7.35629 6.23326 8.02415 7.082 8.0006H9.918C10.7667 8.02415 11.4744 7.35629 11.5 6.5076V5.4936C11.4744 4.64492 10.7667 3.97706 9.918 4.0006Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M15.082 13.0007H17.917C18.3333 13.0044 18.734 12.8425 19.0309 12.5507C19.3278 12.2588 19.4966 11.861 19.5 11.4447V5.55666C19.4966 5.14054 19.328 4.74282 19.0313 4.45101C18.7346 4.1592 18.3341 3.9972 17.918 4.00066H15.082C14.6659 3.9972 14.2654 4.1592 13.9687 4.45101C13.672 4.74282 13.5034 5.14054 13.5 5.55666V11.4447C13.5034 11.8608 13.672 12.2585 13.9687 12.5503C14.2654 12.8421 14.6659 13.0041 15.082 13.0007Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M15.082 19.0006H17.917C18.7661 19.0247 19.4744 18.3567 19.5 17.5076V16.4936C19.4744 15.6449 18.7667 14.9771 17.918 15.0006H15.082C14.2333 14.9771 13.5256 15.6449 13.5 16.4936V17.5066C13.525 18.3557 14.2329 19.0241 15.082 19.0006Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        `),
      },
      {
        label: 'Payments',
        route: '/dashboard-admin/payments',
        iconHtml: this.sanitizer.bypassSecurityTrustHtml(`
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="sidebar__nav-icon">
            <path d="M3 21H21M3 18H21M5.82333 3.00037C6.2383 3.36683 6.5 3.90285 6.5 4.5C6.5 5.60457 5.60457 6.5 4.5 6.5C3.90285 6.5 3.36683 6.2383 3.00037 5.82333M5.82333 3.00037C5.94144 3 6.06676 3 6.2 3H17.8C17.9332 3 18.0586 3 18.1767 3.00037M5.82333 3.00037C4.94852 3.00308 4.46895 3.02593 4.09202 3.21799C3.71569 3.40973 3.40973 3.71569 3.21799 4.09202C3.02593 4.46895 3.00308 4.94852 3.00037 5.82333M3.00037 5.82333C3 5.94144 3 6.06676 3 6.2V11.8C3 11.9332 3 12.0586 3.00037 12.1767M3.00037 12.1767C3.36683 11.7617 3.90285 11.5 4.5 11.5C5.60457 11.5 6.5 12.3954 6.5 13.5C6.5 14.0971 6.2383 14.6332 5.82333 14.9996M3.00037 12.1767C3.00308 13.0515 3.02593 13.531 3.21799 13.908C3.40973 14.2843 3.71569 14.5903 4.09202 14.782C4.46895 14.9741 4.94852 14.9969 5.82333 14.9996M5.82333 14.9996C5.94144 15 6.06676 15 6.2 15H17.8C17.9332 15 18.0586 15 18.1767 14.9996M21 12.1771C20.6335 11.7619 20.0973 11.5 19.5 11.5C18.3954 11.5 17.5 12.3954 17.5 13.5C17.5 14.0971 17.7617 14.6332 18.1767 14.9996M21 12.1771C21.0004 12.0589 21 11.9334 21 11.8V6.2C21 6.06676 21 5.94144 20.9996 5.82333M21 12.1771C20.9973 13.0516 20.974 13.5311 20.782 13.908C20.5903 14.2843 20.2843 14.5903 19.908 14.782C19.5311 14.9741 19.0515 14.9969 18.1767 14.9996M20.9996 5.82333C20.6332 6.2383 20.0971 6.5 19.5 6.5C18.3954 6.5 17.5 5.60457 17.5 4.5C17.5 3.90285 17.7617 3.36683 18.1767 3.00037M20.9996 5.82333C20.9969 4.94852 20.9741 4.46895 20.782 4.09202C20.5903 3.71569 20.2843 3.40973 19.908 3.21799C19.5311 3.02593 19.0515 3.00308 18.1767 3.00037M14 9C14 10.1046 13.1046 11 12 11C10.8954 11 10 10.1046 10 9C10 7.89543 10.8954 7 12 7C13.1046 7 14 7.89543 14 9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        `),
      },
      {
        label: 'Equipment',
        route: '/dashboard-admin/equipment',
        iconHtml: this.sanitizer.bypassSecurityTrustHtml(`
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="sidebar__nav-icon">
            <circle cx="6.27" cy="13.91" r="4.77" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="1.91"/>
            <circle cx="18.2" cy="16.3" r="2.39" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="1.91"/>
            <polyline points="6.27 13.91 8.18 13.91 18.68 13.91" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="1.91"/>
            <line x1="6.27" y1="18.68" x2="18.68" y2="18.68" stroke="currentColor" stroke-miterlimit="10" stroke-width="1.91"/>
            <line x1="18.68" y1="6.27" x2="18.68" y2="13.91" stroke="currentColor" stroke-miterlimit="10" stroke-width="1.91"/>
            <line x1="6.27" y1="2.45" x2="6.27" y2="9.14" stroke="currentColor" stroke-miterlimit="10" stroke-width="1.91"/>
            <polyline points="0.55 1.5 2.46 1.5 10.09 4.36" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="1.91"/>
            <line x1="6.27" y1="18.68" x2="4.36" y2="22.5" stroke="currentColor" stroke-miterlimit="10" stroke-width="1.91"/>
            <line x1="18.68" y1="18.68" x2="18.68" y2="22.5" stroke="currentColor" stroke-miterlimit="10" stroke-width="1.91"/>
            <line x1="23.45" y1="22.5" x2="0.55" y2="22.5" stroke="currentColor" stroke-miterlimit="10" stroke-width="1.91"/>
            <path d="M21.55,5.32h0a3.28,3.28,0,0,1-2.31.95H15.82" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="1.91"/>
            <circle cx="6.27" cy="13.91" r="0.95" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="1.91"/>
          </svg>
        `),
      },
      {
        label: 'Reports',
        route: '/dashboard-admin/reports',
        iconHtml: this.sanitizer.bypassSecurityTrustHtml(`
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="sidebar__nav-icon">
            <path d="M2,2V20a2,2,0,0,0,2,2H22" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
            <rect x="6" y="12" width="3" height="6" rx="1.5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
            <rect x="12" y="7" width="3" height="6" rx="1.5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
            <rect x="18" y="3" width="3" height="6" rx="1.5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
          </svg>
        `),
      }
    ];
  }

  getMembershipIcon(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(`
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="sidebar__nav-icon">
        <path d="M15.9201 12.8959L19.2583 8.89003C19.533 8.5604 19.6704 8.39557 19.7681 8.21065C19.8548 8.0466 19.9183 7.87128 19.9567 7.68973C20 7.48508 20 7.27053 20 6.84144V6.2C20 5.07989 20 4.51984 19.782 4.09202C19.5903 3.71569 19.2843 3.40973 18.908 3.21799C18.4802 3 17.9201 3 16.8 3H7.2C6.0799 3 5.51984 3 5.09202 3.21799C4.71569 3.40973 4.40973 3.71569 4.21799 4.09202C4 4.51984 4 5.07989 4 6.2V6.84144C4 7.27053 4 7.48508 4.04328 7.68973C4.08168 7.87128 4.14515 8.0466 4.23188 8.21065C4.32964 8.39557 4.467 8.5604 4.74169 8.89003L8.07995 12.8959M13.4009 11.1989L19.3668 3.53988M10.5991 11.1989L4.6394 3.53414M6.55673 6H17.4505M17 16C17 18.7614 14.7614 21 12 21C9.23858 21 7 18.7614 7 16C7 13.2386 9.23858 11 12 11C14.7614 11 17 13.2386 17 16Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      </svg>
    `);
  }

  getUsersIcon(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(`
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="sidebar__nav-icon">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `);
  }

  getAttendanceIcon(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(`
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> 
        <path d="M14 19.2857L15.8 21L20 17M4 21C4 17.134 7.13401 14 11 14C12.4872 14 13.8662 14.4638 15 15.2547M15 7C15 9.20914 13.2091 11 11 11C8.79086 11 7 9.20914 7 7C7 4.79086 8.79086 3 11 3C13.2091 3 15 4.79086 15 7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g>
      </svg>
    `)
  }

  isMembershipActive(): boolean {
    const url = this.router.url;
    return url.includes('/dashboard-admin/memberships');
  }

  isAttendanceActive(): boolean {
    const url = this.router.url;
    return url.includes('/dashboard-admin/attendance');
  }

  isUsersActive(): boolean {
    const url = this.router.url;
    return url.includes('/dashboard-admin/users');
  }

  goToMembershipList(): void {
    this.router.navigate(['/dashboard-admin/memberships/list']);
  }

  goToAttendanceList(): void {
    this.router.navigate(['/dashboard-admin/attendance/list']);
  }

  onLogout() {
    console.log('Logout');
  }

  logout(): void {
    this.authService.logout();
  }
}