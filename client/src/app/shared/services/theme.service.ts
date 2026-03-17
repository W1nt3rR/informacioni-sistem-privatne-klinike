import { Injectable, signal } from '@angular/core';

export interface ThemeConfig {
  light: string;
  dark: string;
  mode: 'light' | 'dark' | 'system';
}

export const DAISY_THEMES = {
  light: [
    'light', 'cupcake', 'bumblebee', 'emerald', 'corporate',
    'garden', 'lofi', 'pastel', 'fantasy', 'wireframe',
    'cmyk', 'autumn', 'acid', 'lemonade', 'winter',
    'nord', 'caramellatte', 'silk',
  ],
  dark: [
    'dark', 'synthwave', 'halloween', 'forest', 'black',
    'luxury', 'dracula', 'night', 'coffee', 'dim',
    'sunset', 'abyss', 'cobalt',
  ],
};

const STORAGE_KEY = 'themeConfig';

const DEFAULT_CONFIG: ThemeConfig = { light: 'light', dark: 'dark', mode: 'system' };

@Injectable({ providedIn: 'root' })
export class ThemeService {
  config = signal<ThemeConfig>(this.load());
  activeTheme = signal(this.resolveTheme(this.load()));

  private mediaQuery = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;

  constructor() {
    this.apply(this.activeTheme());
    this.mediaQuery?.addEventListener('change', () => {
      if (this.config().mode === 'system') {
        const theme = this.resolveTheme(this.config());
        this.activeTheme.set(theme);
        this.apply(theme);
      }
    });
  }

  update(partial: Partial<ThemeConfig>): void {
    const cfg = { ...this.config(), ...partial };
    this.config.set(cfg);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    const theme = this.resolveTheme(cfg);
    this.activeTheme.set(theme);
    this.apply(theme);
  }

  toggleMode(): void {
    const current = this.config().mode;
    const next = current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light';
    this.update({ mode: next });
  }

  isDark(): boolean {
    const mode = this.config().mode;
    if (mode === 'system') return this.mediaQuery?.matches ?? false;
    return mode === 'dark';
  }

  private resolveTheme(cfg: ThemeConfig): string {
    if (cfg.mode === 'light') return cfg.light;
    if (cfg.mode === 'dark') return cfg.dark;
    return (this.mediaQuery?.matches ?? false) ? cfg.dark : cfg.light;
  }

  private apply(theme: string): void {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }

  private load(): ThemeConfig {
    if (typeof localStorage === 'undefined') return DEFAULT_CONFIG;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  }
}
