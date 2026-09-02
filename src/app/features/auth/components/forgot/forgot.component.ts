import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment.prod';

type Step = 'username' | 'password' | 'success';

@Component({
  selector: 'app-forgot',
  templateUrl: './forgot.component.html',
  styleUrls: ['./forgot.component.scss']
})
export class ForgotComponent implements OnInit, OnDestroy {
  currentStep: Step = 'username';
  
  usernameForm: FormGroup;
  resetForm: FormGroup;

  submitted = false;
  successMessage = '';
  errorMessage = '';
  infoMessage = '';
  isLoading = false;

  private currentUsername: string = '';
  private apiUrl = `${environment.apiUrl}/pg-ms-auth/auth`;

  slides = [
    {
      title: 'Recupera tu acceso',
      subtitle: 'Sigue los pasos para restablecer tu contraseña de forma segura.',
      image: 'assets/img/login-slide-1.jpg'
    },
    {
      title: 'Seguridad ante todo',
      subtitle: 'Verificamos tu identidad para proteger tu cuenta.',
      image: 'assets/img/login-slide-2.jpg'
    },
    {
      title: 'Vuelve a entrenar',
      subtitle: 'Restablece tu contraseña y continúa con tu progreso.',
      image: 'assets/img/login-slide-3.jpg'
    }
  ];
  currentSlide = 0;
  private slideInterval?: any;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.usernameForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]]
    });

    this.resetForm = this.fb.group({
      token: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(30),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { 
      validators: [
        this.passwordMatchValidator,
        this.passwordNoSpacesValidator
      ] 
    });
  }

  ngOnInit(): void {
    this.startSlideShow();
  }

  ngOnDestroy(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }

  // Getters para acceder fácilmente a los campos
  get username() { return this.usernameForm.get('username'); }
  get token() { return this.resetForm.get('token'); }
  get newPassword() { return this.resetForm.get('newPassword'); }
  get confirmPassword() { return this.resetForm.get('confirmPassword'); }

  get currentImage(): string {
    return this.slides[this.currentSlide].image;
  }

  // Funciones auxiliares para validación de requisitos
  hasUpperCase(value: string): boolean {
    return /[A-Z]/.test(value);
  }

  hasLowerCase(value: string): boolean {
    return /[a-z]/.test(value);
  }

  hasNumber(value: string): boolean {
    return /[0-9]/.test(value);
  }

  hasSpecialChar(value: string): boolean {
    return /[!@#$%^&*(),.?":{}|<>]/.test(value);
  }

  /**
   * Validador personalizado: Verifica que la contraseña sea fuerte
   * Requiere al menos una mayúscula, una minúscula, un número y un carácter especial
   */
  passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value || '';
    
    if (value.length === 0) return null; // Dejar que required maneje el vacío
    
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    
    const errors: ValidationErrors = {};
    
    if (!hasUpperCase) {
      errors['missingUppercase'] = true;
    }
    if (!hasLowerCase) {
      errors['missingLowercase'] = true;
    }
    if (!hasNumber) {
      errors['missingNumber'] = true;
    }
    if (!hasSpecialChar) {
      errors['missingSpecialChar'] = true;
    }
    
    return Object.keys(errors).length > 0 ? errors : null;
  }

  /**
   * Validador personalizado: Verifica que las contraseñas coincidan
   */
  passwordMatchValidator(form: FormGroup): ValidationErrors | null {
    const newPass = form.get('newPassword')?.value;
    const confirmPass = form.get('confirmPassword')?.value;
    
    if (newPass !== confirmPass) {
      return { mismatch: true };
    }
    return null;
  }

  /**
   * Validador personalizado: Verifica que la contraseña no tenga espacios
   */
  passwordNoSpacesValidator(form: FormGroup): ValidationErrors | null {
    const newPass = form.get('newPassword')?.value || '';
    const confirmPass = form.get('confirmPassword')?.value || '';
    
    if (newPass.includes(' ') || confirmPass.includes(' ')) {
      return { hasSpaces: true };
    }
    return null;
  }

  private startSlideShow(): void {
    this.slideInterval = setInterval(() => {
      this.currentSlide = (this.currentSlide + 1) % this.slides.length;
    }, 5000);
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
    clearInterval(this.slideInterval);
    this.startSlideShow();
  }

  onSubmitUsername(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.isLoading = true;

    if (this.usernameForm.invalid) {
      this.usernameForm.markAllAsTouched();
      this.isLoading = false;
      return;
    }

    const username = this.usernameForm.value.username;
    this.currentUsername = username;

    console.log('Enviando solicitud de recuperación para:', username);

    this.http.post(`${this.apiUrl}/forgot-password`, { username }).subscribe({
      next: (response: any) => {
        console.log('Respuesta del backend:', response);
        this.isLoading = false;
        
        this.currentStep = 'password';
        this.submitted = false;
        this.resetForm.reset();
        
        if (response && response.message) {
          this.infoMessage = response.message;
        } else {
          this.infoMessage = 'Si el username existe, recibirás un email con instrucciones';
        }
        
        if (this.slideInterval) {
          clearInterval(this.slideInterval);
        }
      },
      error: (error) => {
        console.error('Error al enviar el código:', error);
        this.isLoading = false;
        this.infoMessage = '';
        
        if (error.status === 404) {
          this.errorMessage = 'El nombre de usuario no existe. Por favor, verifica e intenta nuevamente.';
        } else if (error.status === 400) {
          const errorMessage = error.error?.message || error.error?.error || '';
          if (errorMessage.toLowerCase().includes('no existe') || 
              errorMessage.toLowerCase().includes('not found') ||
              errorMessage.toLowerCase().includes('usuario no encontrado')) {
            this.errorMessage = 'El nombre de usuario no existe. Por favor, verifica e intenta nuevamente.';
          } else {
            this.errorMessage = errorMessage || 'Error al procesar la solicitud. Intenta nuevamente.';
          }
        } else if (error.status === 500) {
          this.errorMessage = 'Error del servidor. Por favor, intenta más tarde.';
        } else if (error.status === 530 || (error.error && error.error.includes('mail'))) {
          this.errorMessage = 'El servidor de correo no está disponible en este momento. Por favor, inténtalo más tarde o contacta a soporte.';
        } else {
          this.errorMessage = error.error?.message || 'Error al enviar el código de verificación. Intenta nuevamente.';
        }
        
        this.usernameForm.get('username')?.setValue('');
        setTimeout(() => {
          const input = document.getElementById('username');
          if (input) {
            input.focus();
          }
        }, 100);
      }
    });
  }

  /**
   * Obtiene el mensaje de error para la contraseña
   */
  getPasswordErrorMessage(): string {
    const control = this.newPassword;
    if (!control || !control.errors || !(control.touched || this.submitted)) {
      return '';
    }

    if (control.errors['required']) {
      return 'La contraseña es obligatoria';
    }
    if (control.errors['minlength']) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    if (control.errors['maxlength']) {
      return 'La contraseña no debe exceder los 30 caracteres';
    }
    if (control.errors['missingUppercase']) {
      return 'Debe contener al menos una mayúscula (A-Z)';
    }
    if (control.errors['missingLowercase']) {
      return 'Debe contener al menos una minúscula (a-z)';
    }
    if (control.errors['missingNumber']) {
      return 'Debe contener al menos un número (0-9)';
    }
    if (control.errors['missingSpecialChar']) {
      return 'Debe contener al menos un carácter especial (!@#$%^&*(),.?":{}|<>)';
    }
    if (this.resetForm.errors?.['hasSpaces']) {
      return 'La contraseña no debe contener espacios';
    }

    return '';
  }

  /**
   * Obtiene el mensaje de error para la confirmación de contraseña
   */
  getConfirmPasswordErrorMessage(): string {
    if (!this.confirmPassword || !(this.confirmPassword.touched || this.submitted)) {
      return '';
    }

    if (this.confirmPassword.errors?.['required']) {
      return 'Debes confirmar tu contraseña';
    }

    if (this.resetForm.errors?.['mismatch'] && this.confirmPassword.value) {
      return 'Las contraseñas no coinciden';
    }

    return '';
  }

  onSubmitReset(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.infoMessage = '';

    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      
      // Scroll al primer campo con error
      const firstError = document.querySelector('.form-group .error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const payload = {
      token: this.resetForm.value.token,
      username: this.currentUsername,
      newPassword: this.resetForm.value.newPassword,
      confirmPassword: this.resetForm.value.confirmPassword
    };

    this.isLoading = true;

    this.http.post(`${this.apiUrl}/reset-password`, payload).subscribe({
      next: (response: any) => {
        console.log('Contraseña cambiada con éxito:', response);
        this.isLoading = false;
        this.successMessage = '¡Tu contraseña ha sido actualizada correctamente!';
        this.currentStep = 'success';
      },
      error: (error) => {
        console.error('Error al cambiar la contraseña:', error);
        this.isLoading = false;
        
        if (error.status === 400) {
          const errorMessage = error.error?.message || '';
          if (errorMessage.toLowerCase().includes('token') || errorMessage.toLowerCase().includes('código')) {
            this.errorMessage = 'El código de verificación es inválido o ha expirado. Solicita uno nuevo.';
          } else {
            this.errorMessage = errorMessage || 'Error al cambiar la contraseña. Verifica los datos.';
          }
        } else if (error.status === 404) {
          this.errorMessage = 'El usuario no existe o el código es inválido.';
        } else if (error.status === 500) {
          this.errorMessage = 'Error del servidor. Por favor, intenta más tarde.';
        } else {
          this.errorMessage = error.error?.message || 'El código es incorrecto o hubo un error al cambiar la contraseña.';
        }
        
        // Limpiar el token si hay error
        this.resetForm.get('token')?.setValue('');
        setTimeout(() => {
          const input = document.getElementById('token');
          if (input) {
            input.focus();
          }
        }, 100);
      }
    });
  }

  goToStep(step: Step): void {
    this.currentStep = step;
    this.submitted = false;
    this.errorMessage = '';
    this.infoMessage = '';
    this.isLoading = false;
    
    if (step === 'username') {
      this.startSlideShow();
      this.usernameForm.reset();
    } else {
      if (this.slideInterval) {
        clearInterval(this.slideInterval);
      }
    }
  }

  resendToken(): void {
    this.submitted = false;
    this.resetForm.reset();
    this.errorMessage = '';
    this.infoMessage = '';
    this.isLoading = true;
    
    if (this.currentUsername) {
      this.http.post(`${this.apiUrl}/forgot-password`, { username: this.currentUsername }).subscribe({
        next: (response: any) => {
          console.log('Código reenviado correctamente:', response);
          this.isLoading = false;
          
          if (response && response.message) {
            this.infoMessage = response.message;
          } else {
            this.infoMessage = 'Si el username existe, recibirás un email con instrucciones';
          }
          
          setTimeout(() => {
            this.infoMessage = '';
          }, 5000);
        },
        error: (error) => {
          console.error('Error al reenviar el código:', error);
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Error al reenviar el código. Intenta nuevamente.';
        }
      });
    } else {
      this.goToStep('username');
    }
  }

  /**
   * Verifica si el campo tiene errores y debe mostrarlos
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.resetForm.get(fieldName);
    return !!field && field.invalid && (field.touched || this.submitted);
  }

  /**
   * Verifica si el formulario tiene errores específicos
   */
  hasFormError(errorKey: string): boolean {
    return !!this.resetForm.errors?.[errorKey] && this.submitted;
  }
}