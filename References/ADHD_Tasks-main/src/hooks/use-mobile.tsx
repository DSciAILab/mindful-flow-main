import * as React from "react";

const MOBILE_BREAKPOINT = 768; // Corresponde ao breakpoint 'md' do Tailwind

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    const onChange = () => {
      setIsMobile(mql.matches);
    };

    // Adiciona o listener para mudanças
    mql.addEventListener("change", onChange);
    
    // Define o estado inicial
    setIsMobile(mql.matches);

    // Limpa o listener quando o componente é desmontado
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}