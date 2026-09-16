import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss']
})
export class LandingPageComponent implements OnInit, OnDestroy {

  constructor(private router: Router) {}

  heroSlides = [
    {
      image: 'assets/img/login-slide-1.jpg',
      position: 'center center' 
    },
    {
      image: 'assets/img/login-slide-2.jpg',
      position: 'center 30%' 
    },
    {
      image: 'assets/img/login-slide-3.jpg',
      position: 'center -20%'
    },
  ];

  currentHeroSlide = 0;
  private heroSlideInterval?: any;

  ngOnInit(): void {
    this.startHeroSlideShow();
  }

  ngOnDestroy(): void {
    if (this.heroSlideInterval) {
      clearInterval(this.heroSlideInterval);
    }
  }

  private startHeroSlideShow(): void {
    this.heroSlideInterval = setInterval(() => {
      this.currentHeroSlide = (this.currentHeroSlide + 1) % this.heroSlides.length;
    }, 5000);
  }

  goToHeroSlide(index: number): void {
    this.currentHeroSlide = index;
    clearInterval(this.heroSlideInterval);
    this.startHeroSlideShow();
  }

  irAlLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  irAPoliticas(): void {
    this.router.navigate(['/politicas']);
  }
}