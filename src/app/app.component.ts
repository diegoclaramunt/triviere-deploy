import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface AppConfig {
  appName: string;
  clientName: string;
  basePath: string;
}

interface Item {
  _id: string;
  label: string;
  createdAt: string;
}

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiBase = new URL('api/', document.baseURI).pathname;

  readonly config = signal<AppConfig | null>(null);
  readonly items = signal<Item[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  label = '';

  ngOnInit(): void {
    this.http.get<AppConfig>(`${this.apiBase}config`).subscribe({
      next: (config) => this.config.set(config),
      error: () => this.error.set('No se pudo cargar la configuración del despliegue.'),
    });
    this.loadItems();
  }

  addItem(): void {
    const label = this.label.trim();
    if (!label) return;

    this.error.set('');
    this.http.post<Item>(`${this.apiBase}items`, { label }).subscribe({
      next: (item) => {
        this.items.update((items) => [item, ...items]);
        this.label = '';
      },
      error: () => this.error.set('MongoDB no está disponible o rechazó la escritura.'),
    });
  }

  private loadItems(): void {
    this.http.get<Item[]>(`${this.apiBase}items`).subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('MongoDB no está disponible o rechazó la lectura.');
        this.loading.set(false);
      },
    });
  }
}
