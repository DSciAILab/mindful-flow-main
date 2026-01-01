"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client'; // Importa o cliente Supabase
import { MadeWithDyad } from '@/components/made-with-dyad';
import { useTheme } from 'next-themes';

const Login = () => {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center text-foreground">Bem-vindo de volta!</h1>
        <Auth
          supabaseClient={supabase}
          providers={[]} // Você pode adicionar 'google', 'github', etc., aqui se quiser
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))',
                  brandAccent: 'hsl(var(--primary-foreground))',
                },
              },
            },
          }}
          theme={theme === 'dark' ? 'dark' : 'light'} // Usando tema dinâmico
          redirectTo={window.location.origin + '/'} // Redireciona para a página inicial após o login
        />
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Login;