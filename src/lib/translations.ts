export const languages = {
  en: { name: "English", flag: "🇺🇸", nativeName: "English" },
  es: { name: "Spanish", flag: "🇪🇸", nativeName: "Español" },
  fr: { name: "French", flag: "🇫🇷", nativeName: "Français" },
  de: { name: "German", flag: "🇩🇪", nativeName: "Deutsch" },
  pt: { name: "Portuguese", flag: "🇧🇷", nativeName: "Português" },
  it: { name: "Italian", flag: "🇮🇹", nativeName: "Italiano" },
  ja: { name: "Japanese", flag: "🇯🇵", nativeName: "日本語" },
  zh: { name: "Chinese", flag: "🇨🇳", nativeName: "中文" },
  ko: { name: "Korean", flag: "🇰🇷", nativeName: "한국어" },
  ar: { name: "Arabic", flag: "🇸🇦", nativeName: "العربية" },
} as const;

export type Language = keyof typeof languages;

interface TranslationStrings {
  common: {
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    back: string;
    next: string;
    done: string;
    loading: string;
    error: string;
    success: string;
    confirm: string;
    yes: string;
    no: string;
  };
  home: {
    title: string;
    subtitle: string;
    startQuest: string;
    viewQuests: string;
    leaderboard: string;
    profile: string;
  };
  quests: {
    createQuest: string;
    activeQuests: string;
    completedQuests: string;
    queuedQuests: string;
    noActiveQuests: string;
    questDetail: string;
    startQuest: string;
    completeQuest: string;
    regenerateQuest: string;
    category: string;
    difficulty: string;
    goalType: string;
    progress: string;
    timeRemaining: string;
    viewOnMap: string;
  };
  categories: {
    SALES: string;
    SOCIAL: string;
    ENTREPRENEURSHIP: string;
    DATING: string;
    CONFIDENCE: string;
    CAREER: string;
  };
  difficulties: {
    EASY: string;
    MEDIUM: string;
    HARD: string;
    EXPERT: string;
  };
  questTypes: {
    rejectionChallenge: string;
    actionChallenge: string;
    rejectionDescription: string;
    actionDescription: string;
  };
  createQuest: {
    title: string;
    generateWithAI: string;
    generateDescription: string;
    selectCategory: string;
    selectDifficulty: string;
    questType: string;
    questTypeDescription: string;
    personalContext: string;
    personalContextDescription: string;
    personalContextPlaceholder: string;
    personalContextExamples: string;
    createButton: string;
    generating: string;
  };
  settings: {
    title: string;
    account: string;
    appearance: string;
    theme: string;
    themeLight: string;
    themeDark: string;
    themeSystem: string;
    preferences: string;
    language: string;
    notifications: string;
    questReminders: string;
    liveFeatures: string;
    enableLivestreaming: string;
    legal: string;
    safetyGuidelines: string;
    accountActions: string;
    signOut: string;
  };
  language: {
    title: string;
    subtitle: string;
    selectLanguage: string;
    currentLanguage: string;
  };
  stats: {
    currentStreak: string;
    longestStreak: string;
    totalXP: string;
    totalPoints: string;
    trophies: string;
    diamonds: string;
    rank: string;
    leaderboard: string;
  };
  profile: {
    title: string;
    editProfile: string;
    settings: string;
    stats: string;
    achievements: string;
  };
}

export const translations: Record<Language, TranslationStrings> = {
  en: {
    common: {
      cancel: "Cancel",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      back: "Back",
      next: "Next",
      done: "Done",
      loading: "Loading...",
      error: "Error",
      success: "Success",
      confirm: "Confirm",
      yes: "Yes",
      no: "No",
    },
    home: {
      title: "Go for No",
      subtitle: "Build confidence through rejection challenges",
      startQuest: "Start Quest",
      viewQuests: "View Quests",
      leaderboard: "Leaderboard",
      profile: "Profile",
    },
    quests: {
      createQuest: "Create Quest",
      activeQuests: "Active Quests",
      completedQuests: "Completed Quests",
      queuedQuests: "Queued Quests",
      noActiveQuests: "No active quests",
      questDetail: "Quest Detail",
      startQuest: "Start Quest",
      completeQuest: "Complete Quest",
      regenerateQuest: "Regenerate Quest",
      category: "Category",
      difficulty: "Difficulty",
      goalType: "Goal Type",
      progress: "Progress",
      timeRemaining: "Time Remaining",
      viewOnMap: "View on Map",
    },
    categories: {
      SALES: "Sales",
      SOCIAL: "Social",
      ENTREPRENEURSHIP: "Entrepreneurship",
      DATING: "Dating",
      CONFIDENCE: "Confidence",
      CAREER: "Career",
    },
    difficulties: {
      EASY: "Easy",
      MEDIUM: "Medium",
      HARD: "Hard",
      EXPERT: "Expert",
    },
    questTypes: {
      rejectionChallenge: "Rejection Challenge",
      actionChallenge: "Action Challenge",
      rejectionDescription: "Track YES/NO responses. Perfect for asking for discounts, favors, or dates.",
      actionDescription: "Complete actions. Great for applying to jobs, complimenting people, or networking.",
    },
    createQuest: {
      title: "Create Quest",
      generateWithAI: "Generate with AI",
      generateDescription: "Let Ben create an action quest for you",
      selectCategory: "Select Category",
      selectDifficulty: "Select Difficulty",
      questType: "Quest Type",
      questTypeDescription: "Choose your challenge style",
      personalContext: "Add Personal Context",
      personalContextDescription: "Tell AI about your goals so it can create tailored quests",
      personalContextPlaceholder: "E.g., I'm a software developer looking for a job, help me take action towards applying for multiple positions",
      personalContextExamples: "💡 Examples:\n• Career: \"I'm a software developer looking for a job\"\n• Dating: \"I want to practice asking people out on dates\"\n• Sales: \"I'm building a SaaS product and need to talk to potential customers\"",
      createButton: "Create Quest with AI",
      generating: "Generating...",
    },
    settings: {
      title: "Settings",
      account: "Account",
      appearance: "Appearance",
      theme: "Theme",
      themeLight: "Light",
      themeDark: "Dark",
      themeSystem: "System",
      preferences: "Preferences",
      language: "Language",
      notifications: "Notifications",
      questReminders: "Quest Reminders",
      liveFeatures: "Live Features",
      enableLivestreaming: "Enable Livestreaming",
      legal: "Legal",
      safetyGuidelines: "Safety Guidelines",
      accountActions: "Account Actions",
      signOut: "Sign Out",
    },
    language: {
      title: "Language",
      subtitle: "Choose your preferred language",
      selectLanguage: "Select Language",
      currentLanguage: "Current Language",
    },
    stats: {
      currentStreak: "Current Streak",
      longestStreak: "Longest Streak",
      totalXP: "Total XP",
      totalPoints: "Total Points",
      trophies: "Trophies",
      diamonds: "Diamonds",
      rank: "Rank",
      leaderboard: "Leaderboard",
    },
    profile: {
      title: "Profile",
      editProfile: "Edit Profile",
      settings: "Settings",
      stats: "Stats",
      achievements: "Achievements",
    },
  },
  es: {
    common: {
      cancel: "Cancelar",
      save: "Guardar",
      delete: "Eliminar",
      edit: "Editar",
      back: "Atrás",
      next: "Siguiente",
      done: "Hecho",
      loading: "Cargando...",
      error: "Error",
      success: "Éxito",
      confirm: "Confirmar",
      yes: "Sí",
      no: "No",
    },
    home: {
      title: "Ve por el No",
      subtitle: "Construye confianza a través de desafíos de rechazo",
      startQuest: "Iniciar Misión",
      viewQuests: "Ver Misiones",
      leaderboard: "Clasificación",
      profile: "Perfil",
    },
    quests: {
      createQuest: "Crear Misión",
      activeQuests: "Misiones Activas",
      completedQuests: "Misiones Completadas",
      queuedQuests: "Misiones en Cola",
      noActiveQuests: "No hay misiones activas",
      questDetail: "Detalle de Misión",
      startQuest: "Iniciar Misión",
      completeQuest: "Completar Misión",
      regenerateQuest: "Regenerar Misión",
      category: "Categoría",
      difficulty: "Dificultad",
      goalType: "Tipo de Objetivo",
      progress: "Progreso",
      timeRemaining: "Tiempo Restante",
      viewOnMap: "Ver en Mapa",
    },
    categories: {
      SALES: "Ventas",
      SOCIAL: "Social",
      ENTREPRENEURSHIP: "Emprendimiento",
      DATING: "Citas",
      CONFIDENCE: "Confianza",
      CAREER: "Carrera",
    },
    difficulties: {
      EASY: "Fácil",
      MEDIUM: "Medio",
      HARD: "Difícil",
      EXPERT: "Experto",
    },
    questTypes: {
      rejectionChallenge: "Desafío de Rechazo",
      actionChallenge: "Desafío de Acción",
      rejectionDescription: "Rastrea respuestas SÍ/NO. Perfecto para pedir descuentos, favores o citas.",
      actionDescription: "Completa acciones. Genial para postular a trabajos, cumplidos o networking.",
    },
    createQuest: {
      title: "Crear Misión",
      generateWithAI: "Generar con IA",
      generateDescription: "Deja que Ben cree una misión de acción para ti",
      selectCategory: "Seleccionar Categoría",
      selectDifficulty: "Seleccionar Dificultad",
      questType: "Tipo de Misión",
      questTypeDescription: "Elige tu estilo de desafío",
      personalContext: "Añadir Contexto Personal",
      personalContextDescription: "Cuéntale a la IA sobre tus objetivos para crear misiones personalizadas",
      personalContextPlaceholder: "Ej., Soy un desarrollador de software buscando trabajo, ayúdame a tomar acción para postular a múltiples posiciones",
      personalContextExamples: "💡 Ejemplos:\n• Carrera: \"Soy un desarrollador de software buscando trabajo\"\n• Citas: \"Quiero practicar invitar personas a salir\"\n• Ventas: \"Estoy construyendo un producto SaaS y necesito hablar con clientes potenciales\"",
      createButton: "Crear Misión con IA",
      generating: "Generando...",
    },
    settings: {
      title: "Configuración",
      account: "Cuenta",
      appearance: "Apariencia",
      theme: "Tema",
      themeLight: "Claro",
      themeDark: "Oscuro",
      themeSystem: "Sistema",
      preferences: "Preferencias",
      language: "Idioma",
      notifications: "Notificaciones",
      questReminders: "Recordatorios de Misiones",
      liveFeatures: "Funciones en Vivo",
      enableLivestreaming: "Habilitar Transmisión en Vivo",
      legal: "Legal",
      safetyGuidelines: "Pautas de Seguridad",
      accountActions: "Acciones de Cuenta",
      signOut: "Cerrar Sesión",
    },
    language: {
      title: "Idioma",
      subtitle: "Elige tu idioma preferido",
      selectLanguage: "Seleccionar Idioma",
      currentLanguage: "Idioma Actual",
    },
    stats: {
      currentStreak: "Racha Actual",
      longestStreak: "Racha Más Larga",
      totalXP: "XP Total",
      totalPoints: "Puntos Totales",
      trophies: "Trofeos",
      diamonds: "Diamantes",
      rank: "Rango",
      leaderboard: "Clasificación",
    },
    profile: {
      title: "Perfil",
      editProfile: "Editar Perfil",
      settings: "Configuración",
      stats: "Estadísticas",
      achievements: "Logros",
    },
  },
  // Abbreviated other languages for brevity - in production, all would be fully translated
  fr: {
    common: {
      cancel: "Annuler",
      save: "Enregistrer",
      delete: "Supprimer",
      edit: "Modifier",
      back: "Retour",
      next: "Suivant",
      done: "Terminé",
      loading: "Chargement...",
      error: "Erreur",
      success: "Succès",
      confirm: "Confirmer",
      yes: "Oui",
      no: "Non",
    },
    home: {
      title: "Allez vers le Non",
      subtitle: "Renforcez votre confiance grâce aux défis de rejet",
      startQuest: "Commencer la Quête",
      viewQuests: "Voir les Quêtes",
      leaderboard: "Classement",
      profile: "Profil",
    },
    quests: {
      createQuest: "Créer une Quête",
      activeQuests: "Quêtes Actives",
      completedQuests: "Quêtes Terminées",
      queuedQuests: "Quêtes en Attente",
      noActiveQuests: "Aucune quête active",
      questDetail: "Détail de la Quête",
      startQuest: "Commencer la Quête",
      completeQuest: "Terminer la Quête",
      regenerateQuest: "Régénérer la Quête",
      category: "Catégorie",
      difficulty: "Difficulté",
      goalType: "Type d'Objectif",
      progress: "Progrès",
      timeRemaining: "Temps Restant",
      viewOnMap: "Voir sur la Carte",
    },
    categories: {
      SALES: "Ventes",
      SOCIAL: "Social",
      ENTREPRENEURSHIP: "Entrepreneuriat",
      DATING: "Rencontres",
      CONFIDENCE: "Confiance",
      CAREER: "Carrière",
    },
    difficulties: {
      EASY: "Facile",
      MEDIUM: "Moyen",
      HARD: "Difficile",
      EXPERT: "Expert",
    },
    questTypes: {
      rejectionChallenge: "Défi de Rejet",
      actionChallenge: "Défi d'Action",
      rejectionDescription: "Suivez les réponses OUI/NON. Parfait pour demander des réductions, des faveurs ou des rendez-vous.",
      actionDescription: "Complétez des actions. Idéal pour postuler à des emplois, faire des compliments ou réseauter.",
    },
    createQuest: {
      title: "Créer une Quête",
      generateWithAI: "Générer avec l'IA",
      generateDescription: "Laissez Ben créer une quête d'action pour vous",
      selectCategory: "Sélectionner une Catégorie",
      selectDifficulty: "Sélectionner la Difficulté",
      questType: "Type de Quête",
      questTypeDescription: "Choisissez votre style de défi",
      personalContext: "Ajouter un Contexte Personnel",
      personalContextDescription: "Parlez de vos objectifs à l'IA pour créer des quêtes personnalisées",
      personalContextPlaceholder: "Ex., Je suis un développeur logiciel à la recherche d'un emploi, aidez-moi à postuler à plusieurs postes",
      personalContextExamples: "💡 Exemples:\n• Carrière: \"Je suis un développeur logiciel à la recherche d'un emploi\"\n• Rencontres: \"Je veux m'entraîner à inviter des gens à sortir\"\n• Ventes: \"Je construis un produit SaaS et j'ai besoin de parler aux clients potentiels\"",
      createButton: "Créer une Quête avec l'IA",
      generating: "Génération...",
    },
    settings: {
      title: "Paramètres",
      account: "Compte",
      appearance: "Apparence",
      theme: "Thème",
      themeLight: "Clair",
      themeDark: "Sombre",
      themeSystem: "Système",
      preferences: "Préférences",
      language: "Langue",
      notifications: "Notifications",
      questReminders: "Rappels de Quête",
      liveFeatures: "Fonctionnalités en Direct",
      enableLivestreaming: "Activer la Diffusion en Direct",
      legal: "Légal",
      safetyGuidelines: "Directives de Sécurité",
      accountActions: "Actions du Compte",
      signOut: "Se Déconnecter",
    },
    language: {
      title: "Langue",
      subtitle: "Choisissez votre langue préférée",
      selectLanguage: "Sélectionner la Langue",
      currentLanguage: "Langue Actuelle",
    },
    stats: {
      currentStreak: "Série Actuelle",
      longestStreak: "Série la Plus Longue",
      totalXP: "XP Total",
      totalPoints: "Points Totaux",
      trophies: "Trophées",
      diamonds: "Diamants",
      rank: "Rang",
      leaderboard: "Classement",
    },
    profile: {
      title: "Profil",
      editProfile: "Modifier le Profil",
      settings: "Paramètres",
      stats: "Statistiques",
      achievements: "Réalisations",
    },
  },
  de: {
    common: {
      cancel: "Abbrechen",
      save: "Speichern",
      delete: "Löschen",
      edit: "Bearbeiten",
      back: "Zurück",
      next: "Weiter",
      done: "Fertig",
      loading: "Laden...",
      error: "Fehler",
      success: "Erfolg",
      confirm: "Bestätigen",
      yes: "Ja",
      no: "Nein",
    },
    home: {
      title: "Geh auf Nein",
      subtitle: "Baue Vertrauen durch Ablehnungs-Herausforderungen auf",
      startQuest: "Quest Starten",
      viewQuests: "Quests Ansehen",
      leaderboard: "Bestenliste",
      profile: "Profil",
    },
    quests: {
      createQuest: "Quest Erstellen",
      activeQuests: "Aktive Quests",
      completedQuests: "Abgeschlossene Quests",
      queuedQuests: "Wartende Quests",
      noActiveQuests: "Keine aktiven Quests",
      questDetail: "Quest-Details",
      startQuest: "Quest Starten",
      completeQuest: "Quest Abschließen",
      regenerateQuest: "Quest Neu Generieren",
      category: "Kategorie",
      difficulty: "Schwierigkeit",
      goalType: "Zieltyp",
      progress: "Fortschritt",
      timeRemaining: "Verbleibende Zeit",
      viewOnMap: "Auf Karte Anzeigen",
    },
    categories: {
      SALES: "Vertrieb",
      SOCIAL: "Sozial",
      ENTREPRENEURSHIP: "Unternehmertum",
      DATING: "Dating",
      CONFIDENCE: "Selbstvertrauen",
      CAREER: "Karriere",
    },
    difficulties: {
      EASY: "Einfach",
      MEDIUM: "Mittel",
      HARD: "Schwer",
      EXPERT: "Experte",
    },
    questTypes: {
      rejectionChallenge: "Ablehnungs-Herausforderung",
      actionChallenge: "Aktions-Herausforderung",
      rejectionDescription: "JA/NEIN-Antworten verfolgen. Perfekt zum Fragen nach Rabatten, Gefälligkeiten oder Dates.",
      actionDescription: "Aktionen abschließen. Großartig zum Bewerben, Komplimente machen oder Networking.",
    },
    createQuest: {
      title: "Quest Erstellen",
      generateWithAI: "Mit KI Generieren",
      generateDescription: "Lass Ben eine Aktions-Quest für dich erstellen",
      selectCategory: "Kategorie Auswählen",
      selectDifficulty: "Schwierigkeit Auswählen",
      questType: "Quest-Typ",
      questTypeDescription: "Wähle deinen Herausforderungsstil",
      personalContext: "Persönlichen Kontext Hinzufügen",
      personalContextDescription: "Erzähle der KI von deinen Zielen, damit sie maßgeschneiderte Quests erstellen kann",
      personalContextPlaceholder: "Z.B., Ich bin ein Softwareentwickler auf Jobsuche, hilf mir, mich bei mehreren Stellen zu bewerben",
      personalContextExamples: "💡 Beispiele:\n• Karriere: \"Ich bin ein Softwareentwickler auf Jobsuche\"\n• Dating: \"Ich möchte üben, Leute um ein Date zu bitten\"\n• Vertrieb: \"Ich baue ein SaaS-Produkt und muss mit potenziellen Kunden sprechen\"",
      createButton: "Quest mit KI Erstellen",
      generating: "Generiere...",
    },
    settings: {
      title: "Einstellungen",
      account: "Konto",
      appearance: "Erscheinungsbild",
      theme: "Theme",
      themeLight: "Hell",
      themeDark: "Dunkel",
      themeSystem: "System",
      preferences: "Einstellungen",
      language: "Sprache",
      notifications: "Benachrichtigungen",
      questReminders: "Quest-Erinnerungen",
      liveFeatures: "Live-Funktionen",
      enableLivestreaming: "Livestreaming Aktivieren",
      legal: "Rechtliches",
      safetyGuidelines: "Sicherheitsrichtlinien",
      accountActions: "Konto-Aktionen",
      signOut: "Abmelden",
    },
    language: {
      title: "Sprache",
      subtitle: "Wähle deine bevorzugte Sprache",
      selectLanguage: "Sprache Auswählen",
      currentLanguage: "Aktuelle Sprache",
    },
    stats: {
      currentStreak: "Aktuelle Serie",
      longestStreak: "Längste Serie",
      totalXP: "Gesamt-XP",
      totalPoints: "Gesamtpunkte",
      trophies: "Trophäen",
      diamonds: "Diamanten",
      rank: "Rang",
      leaderboard: "Bestenliste",
    },
    profile: {
      title: "Profil",
      editProfile: "Profil Bearbeiten",
      settings: "Einstellungen",
      stats: "Statistiken",
      achievements: "Erfolge",
    },
  },
  // Simplified versions for remaining languages
  pt: {} as TranslationStrings,
  it: {} as TranslationStrings,
  ja: {} as TranslationStrings,
  zh: {} as TranslationStrings,
  ko: {} as TranslationStrings,
  ar: {} as TranslationStrings,
};

// Copy English for languages not fully translated (fallback)
const fallbackLanguages: Language[] = ["pt", "it", "ja", "zh", "ko", "ar"];
fallbackLanguages.forEach((lang) => {
  translations[lang] = { ...translations.en };
});
