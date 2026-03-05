import { useBudget } from "@/contexts/budget-context";

const translations: Record<string, Record<string, string>> = {
  en: {
    // Landing
    "landing.title": "MKE Budget Compass",
    "landing.subtitle": "See exactly where your Milwaukee tax dollars go",
    "landing.addressPlaceholder": "Enter your Milwaukee address...",
    "landing.orChoose": "Or choose a home value:",
    "landing.iAmA": "I am a...",
    "landing.resident": "Resident",
    "landing.student": "Student",
    "landing.journalist": "Journalist",
    "landing.cta": "Show Me Where My Money Goes",

    // Tabs
    "tab.receipt": "My Receipt",
    "tab.explore": "Explore",
    "tab.simulate": "Simulate",
    "tab.ask": "Ask",

    // Tax Receipt
    "receipt.title": "Your 2026 Milwaukee Tax Receipt",
    "receipt.annual": "Annual Property Tax",
    "receipt.monthly": "per month",
    "receipt.daily": "per day",
    "receipt.whereItGoes": "Where Your Tax Dollars Go",
    "receipt.cityDetail": "City Budget Detail",
    "receipt.credits": "Tax Credits",
    "receipt.methodology": "How we calculate",

    // Explore
    "explore.title": "Explore Milwaukee Budgets",
    "explore.clickToDrill": "Click any area to explore details",
    "explore.allBudgets": "All Budgets",
    "explore.yourShare": "Your Share",

    // Simulator
    "sim.title": "Budget Simulator",
    "sim.subtitle":
      "Adjust city department budgets and see how it affects your tax bill",
    "sim.adjusted": "Your Adjusted Annual Tax",
    "sim.change": "Change from current",
    "sim.reset": "Reset All",
    "sim.cityLevy": "Adjusted City Levy",

    // Ask
    "ask.title": "Ask About the Budget",
    "ask.placeholder": "Ask a question about Milwaukee's budget...",
    "ask.send": "Send",
    "ask.context": "AI knows your tax context",
    "ask.starter": "Try asking:",

    // Voice
    "voice.briefing": "Briefing",
    "voice.tour": "Tour",
    "voice.talk": "Talk",
    "voice.playBriefing": "Play Budget Briefing",

    // Common
    "common.perYear": "per year",
    "common.perMonth": "per month",
    "common.perDay": "per day",
    "common.back": "Back",
    "common.home": "Home",
    "common.tax": "Tax",
    "common.dataSource": "How we verify our data",
    "common.footer":
      "Data from City of Milwaukee, MPS, & Milwaukee County 2026 budgets",
  },
  es: {
    // Landing
    "landing.title": "MKE Brújula Presupuestaria",
    "landing.subtitle":
      "Vea exactamente a dónde van sus impuestos de Milwaukee",
    "landing.addressPlaceholder": "Ingrese su dirección de Milwaukee...",
    "landing.orChoose": "O elija un valor de vivienda:",
    "landing.iAmA": "Yo soy...",
    "landing.resident": "Residente",
    "landing.student": "Estudiante",
    "landing.journalist": "Periodista",
    "landing.cta": "Muéstrame A Dónde Va Mi Dinero",

    // Tabs
    "tab.receipt": "Mi Recibo",
    "tab.explore": "Explorar",
    "tab.simulate": "Simular",
    "tab.ask": "Preguntar",

    // Tax Receipt
    "receipt.title": "Su Recibo de Impuestos de Milwaukee 2026",
    "receipt.annual": "Impuesto Anual de Propiedad",
    "receipt.monthly": "por mes",
    "receipt.daily": "por día",
    "receipt.whereItGoes": "A Dónde Van Sus Impuestos",
    "receipt.cityDetail": "Detalle del Presupuesto de la Ciudad",
    "receipt.credits": "Créditos Fiscales",
    "receipt.methodology": "Cómo calculamos",

    // Explore
    "explore.title": "Explore los Presupuestos de Milwaukee",
    "explore.clickToDrill":
      "Haga clic en cualquier área para ver detalles",
    "explore.allBudgets": "Todos los Presupuestos",
    "explore.yourShare": "Su Parte",

    // Simulator
    "sim.title": "Simulador de Presupuesto",
    "sim.subtitle":
      "Ajuste los presupuestos departamentales y vea cómo afecta su factura de impuestos",
    "sim.adjusted": "Su Impuesto Anual Ajustado",
    "sim.change": "Cambio respecto al actual",
    "sim.reset": "Restablecer Todo",
    "sim.cityLevy": "Impuesto Municipal Ajustado",

    // Ask
    "ask.title": "Pregunte Sobre el Presupuesto",
    "ask.placeholder":
      "Haga una pregunta sobre el presupuesto de Milwaukee...",
    "ask.send": "Enviar",
    "ask.context": "La IA conoce su contexto fiscal",
    "ask.starter": "Intente preguntar:",

    // Voice
    "voice.briefing": "Resumen",
    "voice.tour": "Recorrido",
    "voice.talk": "Hablar",
    "voice.playBriefing": "Reproducir Resumen del Presupuesto",

    // Common
    "common.perYear": "por año",
    "common.perMonth": "por mes",
    "common.perDay": "por día",
    "common.back": "Volver",
    "common.home": "Vivienda",
    "common.tax": "Impuesto",
    "common.dataSource": "Cómo verificamos nuestros datos",
    "common.footer":
      "Datos de la Ciudad de Milwaukee, MPS y el Condado de Milwaukee, presupuestos 2026",
  },
};

export function useTranslation() {
  const { language } = useBudget();
  const t = (key: string): string => {
    return translations[language]?.[key] ?? translations.en[key] ?? key;
  };
  return { t, language };
}
