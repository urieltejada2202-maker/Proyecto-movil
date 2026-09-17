import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false // 
})
export class LoginPage {
  username = '';
  password = '';
  mostrarError = false;

  integrantes = [
    { user: 'uriel', pass: '1234', nombre: 'Uriel Tejada', rol: 'UX/UI' },
    { user: 'junior', pass: '1234', nombre: 'Junior Gómez', rol: 'Manager' },
    { user: 'stevenson', pass: '1234', nombre: 'Stevenson Tavárez', rol: 'Backend' },
    { user: 'darlenny', pass: '1234', nombre: 'Darlenny Pimentel', rol: 'QA' }
  ];

  constructor(private router: Router) {}

  ingresar() {
    const usuarioEncontrado = this.integrantes.find(
      (persona) => persona.user === this.username.toLowerCase() && persona.pass === this.password
    );

    if (usuarioEncontrado) {
      localStorage.setItem('usuarioActivo', JSON.stringify(usuarioEncontrado));
      
      this.username = '';
      this.password = '';

      this.router.navigate(['/home']); 
    } else {
      this.mostrarError = true;
    }
  }
}