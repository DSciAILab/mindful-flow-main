import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Settings as SettingsIcon, 
  Palette, 
  Moon, 
  Sun, 
  Check,
  Sparkles,
  Monitor,
  Brain,
  Type
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LLMSettings } from "./LLMSettings";

interface ThemePreset {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    accent: string;
    background: string;
  };
  preview: {
    bg: string;
    primary: string;
    accent: string;
  };
}

const themePresets: ThemePreset[] = [
  {
    id: 'warm',
    name: 'Amber Quente',
    description: 'Tons quentes e acolhedores',
    colors: {
      primary: '32 85% 55%',
      accent: '170 45% 45%',
      background: '25 20% 8%',
    },
    preview: {
      bg: 'bg-amber-950',
      primary: 'bg-amber-500',
      accent: 'bg-teal-500',
    },
  },
  {
    id: 'ocean',
    name: 'Oceano',
    description: 'Azuis calmos e profundos',
    colors: {
      primary: '200 80% 50%',
      accent: '280 60% 55%',
      background: '220 25% 8%',
    },
    preview: {
      bg: 'bg-slate-900',
      primary: 'bg-sky-500',
      accent: 'bg-violet-500',
    },
  },
  {
    id: 'forest',
    name: 'Floresta',
    description: 'Verdes naturais e terrosos',
    colors: {
      primary: '160 60% 45%',
      accent: '45 80% 55%',
      background: '160 15% 8%',
    },
    preview: {
      bg: 'bg-emerald-950',
      primary: 'bg-emerald-500',
      accent: 'bg-yellow-500',
    },
  },
  {
    id: 'sunset',
    name: 'Pôr do Sol',
    description: 'Laranjas e rosas vibrantes',
    colors: {
      primary: '15 80% 55%',
      accent: '340 70% 55%',
      background: '15 20% 8%',
    },
    preview: {
      bg: 'bg-orange-950',
      primary: 'bg-orange-500',
      accent: 'bg-pink-500',
    },
  },
  {
    id: 'lavender',
    name: 'Lavanda',
    description: 'Roxos suaves e relaxantes',
    colors: {
      primary: '270 60% 55%',
      accent: '200 60% 50%',
      background: '270 20% 8%',
    },
    preview: {
      bg: 'bg-purple-950',
      primary: 'bg-purple-500',
      accent: 'bg-cyan-500',
    },
  },
  {
    id: 'mono',
    name: 'Monocromático',
    description: 'Minimalista preto e branco',
    colors: {
      primary: '0 0% 90%',
      accent: '0 0% 60%',
      background: '0 0% 5%',
    },
    preview: {
      bg: 'bg-neutral-950',
      primary: 'bg-neutral-200',
      accent: 'bg-neutral-500',
    },
  },
];

interface FontOption {
  id: string;
  name: string;
  family: string;
  description: string;
}

const fontOptions: FontOption[] = [
  { id: 'jakarta', name: 'Plus Jakarta Sans', family: '"Plus Jakarta Sans", system-ui, sans-serif', description: 'Moderna e legível' },
  { id: 'inter', name: 'Inter', family: '"Inter", system-ui, sans-serif', description: 'Clean e profissional' },
  { id: 'dm-sans', name: 'DM Sans', family: '"DM Sans", system-ui, sans-serif', description: 'Geométrica e elegante' },
  { id: 'space-grotesk', name: 'Space Grotesk', family: '"Space Grotesk", system-ui, sans-serif', description: 'Tech e futurista' },
  { id: 'outfit', name: 'Outfit', family: '"Outfit", system-ui, sans-serif', description: 'Suave e arredondada' },
  { id: 'nunito', name: 'Nunito', family: '"Nunito", system-ui, sans-serif', description: 'Amigável e acessível' },
  { id: 'rubik', name: 'Rubik', family: '"Rubik", system-ui, sans-serif', description: 'Compacta e moderna' },
];

interface SettingsProps {
  onThemeChange?: (themeId: string) => void;
}

export function Settings({ onThemeChange }: SettingsProps) {
  const [selectedTheme, setSelectedTheme] = useState('warm');
  const [darkMode, setDarkMode] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [selectedFont, setSelectedFont] = useState('jakarta');

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
    
    // Load saved font preference
    const savedFont = localStorage.getItem('app-font');
    if (savedFont) {
      setSelectedFont(savedFont);
      const font = fontOptions.find(f => f.id === savedFont);
      if (font) {
        document.documentElement.style.setProperty('--font-sans', font.family);
      }
    }
  }, []);

  const handleDarkModeChange = (enabled: boolean) => {
    setDarkMode(enabled);
    if (enabled) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId);
    const theme = themePresets.find(t => t.id === themeId);
    if (theme) {
      // Apply theme colors to CSS variables
      document.documentElement.style.setProperty('--primary', theme.colors.primary);
      document.documentElement.style.setProperty('--accent', theme.colors.accent);
      onThemeChange?.(themeId);
    }
  };

  const handleReducedMotionChange = (enabled: boolean) => {
    setReducedMotion(enabled);
    if (enabled) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  };

  const handleFontSelect = (fontId: string) => {
    setSelectedFont(fontId);
    const font = fontOptions.find(f => f.id === fontId);
    if (font) {
      // Set the CSS variable that controls all fonts
      document.documentElement.style.setProperty('--font-family', font.family);
      localStorage.setItem('app-font', fontId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="mb-2 flex items-center gap-3 font-display text-2xl font-semibold text-foreground md:text-3xl">
          <SettingsIcon className="h-8 w-8 text-primary" />
          Configurações
        </h1>
        <p className="text-muted-foreground">
          Personalize sua experiência
        </p>
      </div>

      {/* Appearance Section */}
      <div className="animate-fade-in rounded-2xl border border-border/50 bg-card p-6 shadow-card" style={{ animationDelay: '100ms' }}>
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
          <Palette className="h-5 w-5 text-primary" />
          Aparência
        </h3>

        {/* Dark Mode Toggle */}
        <div className="mb-6 flex items-center justify-between rounded-xl bg-muted/30 p-4">
          <div className="flex items-center gap-3">
            {darkMode ? (
              <Moon className="h-5 w-5 text-primary" />
            ) : (
              <Sun className="h-5 w-5 text-yellow-500" />
            )}
            <div>
              <Label className="text-sm font-medium text-foreground">Modo Escuro</Label>
              <p className="text-xs text-muted-foreground">Reduz cansaço visual</p>
            </div>
          </div>
          <Switch
            checked={darkMode}
            onCheckedChange={handleDarkModeChange}
          />
        </div>

        {/* Theme Presets */}
        <div className="mb-4">
          <Label className="mb-3 block text-sm font-medium text-foreground">Tema de Cores</Label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {themePresets.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeSelect(theme.id)}
                className={cn(
                  "group relative rounded-xl border-2 p-3 text-left transition-all duration-200",
                  selectedTheme === theme.id
                    ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                    : "border-border/50 bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
                )}
              >
                {/* Color preview */}
                <div className="mb-2 flex gap-1.5">
                  <div className={cn("h-6 w-6 rounded-lg", theme.preview.bg)} />
                  <div className={cn("h-6 w-6 rounded-lg", theme.preview.primary)} />
                  <div className={cn("h-6 w-6 rounded-lg", theme.preview.accent)} />
                </div>
                <p className="text-sm font-medium text-foreground">{theme.name}</p>
                <p className="text-xs text-muted-foreground">{theme.description}</p>
                
                {selectedTheme === theme.id && (
                  <div className="absolute right-2 top-2 rounded-full bg-primary p-1">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Font Selection */}
        <div className="mt-6 border-t border-border/30 pt-6">
          <Label className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
            <Type className="h-4 w-4 text-primary" />
            Fonte
          </Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {fontOptions.map((font) => (
              <button
                key={font.id}
                onClick={() => handleFontSelect(font.id)}
                className={cn(
                  "group relative rounded-xl border-2 p-3 text-left transition-all duration-200",
                  selectedFont === font.id
                    ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                    : "border-border/50 bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
                )}
              >
                <p 
                  className="text-sm font-semibold text-foreground"
                  style={{ fontFamily: font.family }}
                >
                  {font.name}
                </p>
                <p className="text-xs text-muted-foreground">{font.description}</p>
                
                {selectedFont === font.id && (
                  <div className="absolute right-2 top-2 rounded-full bg-primary p-1">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Accessibility Section */}
      <div className="animate-fade-in rounded-2xl border border-border/50 bg-card p-6 shadow-card" style={{ animationDelay: '200ms' }}>
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
          <Monitor className="h-5 w-5 text-primary" />
          Acessibilidade
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-muted/30 p-4">
            <div>
              <Label className="text-sm font-medium text-foreground">Reduzir Animações</Label>
              <p className="text-xs text-muted-foreground">Menos movimento na tela</p>
            </div>
            <Switch
              checked={reducedMotion}
              onCheckedChange={handleReducedMotionChange}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-muted/30 p-4">
            <div>
              <Label className="text-sm font-medium text-foreground">Alto Contraste</Label>
              <p className="text-xs text-muted-foreground">Cores mais intensas</p>
            </div>
            <Switch
              checked={highContrast}
              onCheckedChange={setHighContrast}
            />
          </div>
        </div>
      </div>

      {/* LLM Configuration Section */}
      <div className="animate-fade-in rounded-2xl border border-border/50 bg-card p-6 shadow-card" style={{ animationDelay: '300ms' }}>
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
          <Brain className="h-5 w-5 text-primary" />
          Configuração de IA
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Configure qual provedor de IA será usado como "cérebro" da aplicação
        </p>
        <LLMSettings />
      </div>

      {/* AI Features Section */}
      <div className="animate-fade-in rounded-2xl border border-border/50 bg-card p-6 shadow-card" style={{ animationDelay: '400ms' }}>
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
          <Sparkles className="h-5 w-5 text-accent" />
          Recursos com IA
        </h3>

        <div className="rounded-xl bg-accent/10 p-4">
          <p className="mb-3 text-sm text-foreground">
            A IA pode te ajudar a:
          </p>
          <ul className="mb-4 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-accent" />
              Dividir tarefas grandes em subtarefas
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-accent" />
              Analisar sua Roda da Vida
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-accent" />
              Sugerir melhorias baseadas nos seus padrões
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-accent" />
              Conversar para definir scores quando estiver em dúvida
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
