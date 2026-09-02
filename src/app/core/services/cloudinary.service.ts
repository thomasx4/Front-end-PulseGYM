import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';
import { SKIP_AUTH } from '../constants/http-context';

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {
  private cloudinaryUrl = `https://api.cloudinary.com/v1_1/${environment.cloudinary.cloudName}/auto/upload`;
  private uploadPreset = environment.cloudinary.uploadPreset;

  constructor(private http: HttpClient) {}

  uploadImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('folder', 'pulse-gym/users');

    return this.http.post(this.cloudinaryUrl, formData, {
      context: new HttpContext().set(SKIP_AUTH, true)
    });
  }

  deleteImage(publicId: string): Observable<any> {
    return this.http.delete(`https://api.cloudinary.com/v1_1/${environment.cloudinary.cloudName}/image/destroy`, {
      params: {
        public_id: publicId,
        api_key: environment.cloudinary.apiKey,
        api_secret: environment.cloudinary.apiSecret
      },
      context: new HttpContext().set(SKIP_AUTH, true)
    });
  }
}