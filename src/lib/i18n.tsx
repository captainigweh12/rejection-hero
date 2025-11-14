import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Language = "en" | "es" | "fr" | "de" | "pt" | "it" | "ja" | "zh" | "ko" | "ar";

export const LANGUAGES: Record<Language, { name: string; nativeName: string; flag: string }> = {
  en: { name: "English", nativeName: "English", flag: "🇺🇸" },
  es: { name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  fr: { name: "French", nativeName: "Français", flag: "🇫🇷" },
  de: { name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  pt: { name: "Portuguese", nativeName: "Português", flag: "🇧🇷" },
  it: { name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  ja: { name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  zh: { name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  ko: { name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  ar: { name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
};

type Translations = {
  // Common
  cancel: string;
  save: string;
  delete: string;
  edit: string;
  done: string;

  // Navigation
  home: string;
  community: string;
  live: string;
  map: string;
  profile: string;
  settings: string;

  // Profile
  online: string;
  quests: string;
  journals: string;
  about: string;
  level: string;
  streak: string;
  signOut: string;

  // Settings
  account: string;
  appearance: string;
  theme: string;
  lightMode: string;
  darkMode: string;
  liveFeatures: string;
  enableLive: string;
  enableLiveDesc: string;
  preferences: string;
  language: string;
  notifications: string;
  questReminders: string;
  questRemindersDesc: string;
  legal: string;
  safetyGuidelines: string;
  safetyGuidelinesDesc: string;

  // Quests
  createQuest: string;
  activeQuests: string;
  queuedQuests: string;
  startQuest: string;
  completeQuest: string;

  // Auth
  email: string;
  password: string;
  login: string;
  signUp: string;
  logout: string;
};

const translations: Record<Language, Translations> = {
  en: {
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    done: "Done",
    home: "Home",
    community: "Community",
    live: "Live",
    map: "Map",
    profile: "Profile",
    settings: "Settings",
    online: "Online",
    quests: "Quests",
    journals: "Journals",
    about: "About",
    level: "Level",
    streak: "Streak",
    signOut: "Sign Out",
    account: "Account",
    appearance: "Appearance",
    theme: "Theme",
    lightMode: "Light Mode",
    darkMode: "Dark Mode",
    liveFeatures: "Live Features",
    enableLive: "Enable Live",
    enableLiveDesc: "Configure backend and unlock livestreaming features",
    preferences: "Preferences",
    language: "Language",
    notifications: "Notifications",
    questReminders: "Quest Reminders",
    questRemindersDesc: "Get notified to complete daily quests",
    legal: "Legal",
    safetyGuidelines: "Safety Guidelines",
    safetyGuidelinesDesc: "Read important safety information",
    createQuest: "Create Quest",
    activeQuests: "Active Quests",
    queuedQuests: "Queued Quests",
    startQuest: "Start Quest",
    completeQuest: "Complete Quest",
    email: "Email",
    password: "Password",
    login: "Login",
    signUp: "Sign Up",
    logout: "Logout",
  },
  es: {
    cancel: "Cancelar",
    save: "Guardar",
    delete: "Eliminar",
    edit: "Editar",
    done: "Hecho",
    home: "Inicio",
    community: "Comunidad",
    live: "En Vivo",
    map: "Mapa",
    profile: "Perfil",
    settings: "Configuración",
    online: "En línea",
    quests: "Misiones",
    journals: "Diarios",
    about: "Acerca de",
    level: "Nivel",
    streak: "Racha",
    signOut: "Cerrar Sesión",
    account: "Cuenta",
    appearance: "Apariencia",
    theme: "Tema",
    lightMode: "Modo Claro",
    darkMode: "Modo Oscuro",
    liveFeatures: "Funciones en Vivo",
    enableLive: "Habilitar Transmisión",
    enableLiveDesc: "Configurar backend y desbloquear funciones de transmisión en vivo",
    preferences: "Preferencias",
    language: "Idioma",
    notifications: "Notificaciones",
    questReminders: "Recordatorios de Misiones",
    questRemindersDesc: "Recibe notificaciones para completar misiones diarias",
    legal: "Legal",
    safetyGuidelines: "Pautas de Seguridad",
    safetyGuidelinesDesc: "Leer información importante de seguridad",
    createQuest: "Crear Misión",
    activeQuests: "Misiones Activas",
    queuedQuests: "Misiones en Cola",
    startQuest: "Iniciar Misión",
    completeQuest: "Completar Misión",
    email: "Correo Electrónico",
    password: "Contraseña",
    login: "Iniciar Sesión",
    signUp: "Registrarse",
    logout: "Cerrar Sesión",
  },
  fr: {
    cancel: "Annuler",
    save: "Enregistrer",
    delete: "Supprimer",
    edit: "Modifier",
    done: "Terminé",
    home: "Accueil",
    community: "Communauté",
    live: "En Direct",
    map: "Carte",
    profile: "Profil",
    settings: "Paramètres",
    online: "En ligne",
    quests: "Quêtes",
    journals: "Journaux",
    about: "À propos",
    level: "Niveau",
    streak: "Série",
    signOut: "Se Déconnecter",
    account: "Compte",
    appearance: "Apparence",
    theme: "Thème",
    lightMode: "Mode Clair",
    darkMode: "Mode Sombre",
    liveFeatures: "Fonctionnalités en Direct",
    enableLive: "Activer le Direct",
    enableLiveDesc: "Configurer le backend et débloquer les fonctionnalités de diffusion en direct",
    preferences: "Préférences",
    language: "Langue",
    notifications: "Notifications",
    questReminders: "Rappels de Quêtes",
    questRemindersDesc: "Recevoir des notifications pour compléter les quêtes quotidiennes",
    legal: "Légal",
    safetyGuidelines: "Consignes de Sécurité",
    safetyGuidelinesDesc: "Lire les informations importantes sur la sécurité",
    createQuest: "Créer une Quête",
    activeQuests: "Quêtes Actives",
    queuedQuests: "Quêtes en Attente",
    startQuest: "Commencer la Quête",
    completeQuest: "Terminer la Quête",
    email: "Email",
    password: "Mot de passe",
    login: "Connexion",
    signUp: "S'inscrire",
    logout: "Déconnexion",
  },
  de: {
    cancel: "Abbrechen",
    save: "Speichern",
    delete: "Löschen",
    edit: "Bearbeiten",
    done: "Fertig",
    home: "Startseite",
    community: "Gemeinschaft",
    live: "Live",
    map: "Karte",
    profile: "Profil",
    settings: "Einstellungen",
    online: "Online",
    quests: "Quests",
    journals: "Tagebücher",
    about: "Über",
    level: "Level",
    streak: "Serie",
    signOut: "Abmelden",
    account: "Konto",
    appearance: "Erscheinungsbild",
    theme: "Thema",
    lightMode: "Heller Modus",
    darkMode: "Dunkler Modus",
    liveFeatures: "Live-Funktionen",
    enableLive: "Live Aktivieren",
    enableLiveDesc: "Backend konfigurieren und Live-Streaming-Funktionen freischalten",
    preferences: "Einstellungen",
    language: "Sprache",
    notifications: "Benachrichtigungen",
    questReminders: "Quest-Erinnerungen",
    questRemindersDesc: "Benachrichtigungen erhalten, um tägliche Quests abzuschließen",
    legal: "Rechtliches",
    safetyGuidelines: "Sicherheitsrichtlinien",
    safetyGuidelinesDesc: "Wichtige Sicherheitsinformationen lesen",
    createQuest: "Quest Erstellen",
    activeQuests: "Aktive Quests",
    queuedQuests: "Wartende Quests",
    startQuest: "Quest Starten",
    completeQuest: "Quest Abschließen",
    email: "E-Mail",
    password: "Passwort",
    login: "Anmelden",
    signUp: "Registrieren",
    logout: "Abmelden",
  },
  pt: {
    cancel: "Cancelar",
    save: "Salvar",
    delete: "Excluir",
    edit: "Editar",
    done: "Concluído",
    home: "Início",
    community: "Comunidade",
    live: "Ao Vivo",
    map: "Mapa",
    profile: "Perfil",
    settings: "Configurações",
    online: "Online",
    quests: "Missões",
    journals: "Diários",
    about: "Sobre",
    level: "Nível",
    streak: "Sequência",
    signOut: "Sair",
    account: "Conta",
    appearance: "Aparência",
    theme: "Tema",
    lightMode: "Modo Claro",
    darkMode: "Modo Escuro",
    liveFeatures: "Recursos ao Vivo",
    enableLive: "Ativar ao Vivo",
    enableLiveDesc: "Configurar backend e desbloquear recursos de transmissão ao vivo",
    preferences: "Preferências",
    language: "Idioma",
    notifications: "Notificações",
    questReminders: "Lembretes de Missões",
    questRemindersDesc: "Receba notificações para completar missões diárias",
    legal: "Legal",
    safetyGuidelines: "Diretrizes de Segurança",
    safetyGuidelinesDesc: "Ler informações importantes de segurança",
    createQuest: "Criar Missão",
    activeQuests: "Missões Ativas",
    queuedQuests: "Missões na Fila",
    startQuest: "Iniciar Missão",
    completeQuest: "Completar Missão",
    email: "Email",
    password: "Senha",
    login: "Entrar",
    signUp: "Cadastrar",
    logout: "Sair",
  },
  it: {
    cancel: "Annulla",
    save: "Salva",
    delete: "Elimina",
    edit: "Modifica",
    done: "Fatto",
    home: "Home",
    community: "Comunità",
    live: "In Diretta",
    map: "Mappa",
    profile: "Profilo",
    settings: "Impostazioni",
    online: "Online",
    quests: "Missioni",
    journals: "Diari",
    about: "Informazioni",
    level: "Livello",
    streak: "Serie",
    signOut: "Disconnetti",
    account: "Account",
    appearance: "Aspetto",
    theme: "Tema",
    lightMode: "Modalità Chiara",
    darkMode: "Modalità Scura",
    liveFeatures: "Funzionalità Live",
    enableLive: "Abilita Live",
    enableLiveDesc: "Configura il backend e sblocca le funzionalità di streaming live",
    preferences: "Preferenze",
    language: "Lingua",
    notifications: "Notifiche",
    questReminders: "Promemoria Missioni",
    questRemindersDesc: "Ricevi notifiche per completare le missioni giornaliere",
    legal: "Legale",
    safetyGuidelines: "Linee Guida sulla Sicurezza",
    safetyGuidelinesDesc: "Leggi informazioni importanti sulla sicurezza",
    createQuest: "Crea Missione",
    activeQuests: "Missioni Attive",
    queuedQuests: "Missioni in Coda",
    startQuest: "Inizia Missione",
    completeQuest: "Completa Missione",
    email: "Email",
    password: "Password",
    login: "Accedi",
    signUp: "Registrati",
    logout: "Disconnetti",
  },
  ja: {
    cancel: "キャンセル",
    save: "保存",
    delete: "削除",
    edit: "編集",
    done: "完了",
    home: "ホーム",
    community: "コミュニティ",
    live: "ライブ",
    map: "マップ",
    profile: "プロフィール",
    settings: "設定",
    online: "オンライン",
    quests: "クエスト",
    journals: "日記",
    about: "について",
    level: "レベル",
    streak: "連続記録",
    signOut: "サインアウト",
    account: "アカウント",
    appearance: "外観",
    theme: "テーマ",
    lightMode: "ライトモード",
    darkMode: "ダークモード",
    liveFeatures: "ライブ機能",
    enableLive: "ライブを有効化",
    enableLiveDesc: "バックエンドを設定してライブストリーミング機能をアンロック",
    preferences: "環境設定",
    language: "言語",
    notifications: "通知",
    questReminders: "クエストリマインダー",
    questRemindersDesc: "毎日のクエストを完了するための通知を受け取る",
    legal: "法的情報",
    safetyGuidelines: "安全ガイドライン",
    safetyGuidelinesDesc: "重要な安全情報を読む",
    createQuest: "クエスト作成",
    activeQuests: "アクティブなクエスト",
    queuedQuests: "待機中のクエスト",
    startQuest: "クエスト開始",
    completeQuest: "クエスト完了",
    email: "メール",
    password: "パスワード",
    login: "ログイン",
    signUp: "サインアップ",
    logout: "ログアウト",
  },
  zh: {
    cancel: "取消",
    save: "保存",
    delete: "删除",
    edit: "编辑",
    done: "完成",
    home: "首页",
    community: "社区",
    live: "直播",
    map: "地图",
    profile: "个人资料",
    settings: "设置",
    online: "在线",
    quests: "任务",
    journals: "日记",
    about: "关于",
    level: "等级",
    streak: "连胜",
    signOut: "退出登录",
    account: "账户",
    appearance: "外观",
    theme: "主题",
    lightMode: "浅色模式",
    darkMode: "深色模式",
    liveFeatures: "直播功能",
    enableLive: "启用直播",
    enableLiveDesc: "配置后端并解锁直播功能",
    preferences: "偏好设置",
    language: "语言",
    notifications: "通知",
    questReminders: "任务提醒",
    questRemindersDesc: "获取每日任务完成通知",
    legal: "法律",
    safetyGuidelines: "安全指南",
    safetyGuidelinesDesc: "阅读重要的安全信息",
    createQuest: "创建任务",
    activeQuests: "活跃任务",
    queuedQuests: "排队任务",
    startQuest: "开始任务",
    completeQuest: "完成任务",
    email: "邮箱",
    password: "密码",
    login: "登录",
    signUp: "注册",
    logout: "退出登录",
  },
  ko: {
    cancel: "취소",
    save: "저장",
    delete: "삭제",
    edit: "편집",
    done: "완료",
    home: "홈",
    community: "커뮤니티",
    live: "라이브",
    map: "지도",
    profile: "프로필",
    settings: "설정",
    online: "온라인",
    quests: "퀘스트",
    journals: "일기",
    about: "정보",
    level: "레벨",
    streak: "연속 기록",
    signOut: "로그아웃",
    account: "계정",
    appearance: "외관",
    theme: "테마",
    lightMode: "라이트 모드",
    darkMode: "다크 모드",
    liveFeatures: "라이브 기능",
    enableLive: "라이브 활성화",
    enableLiveDesc: "백엔드를 구성하고 라이브 스트리밍 기능을 잠금 해제",
    preferences: "환경설정",
    language: "언어",
    notifications: "알림",
    questReminders: "퀘스트 알림",
    questRemindersDesc: "일일 퀘스트 완료 알림 받기",
    legal: "법률",
    safetyGuidelines: "안전 지침",
    safetyGuidelinesDesc: "중요한 안전 정보 읽기",
    createQuest: "퀘스트 생성",
    activeQuests: "활성 퀘스트",
    queuedQuests: "대기 중인 퀘스트",
    startQuest: "퀘스트 시작",
    completeQuest: "퀘스트 완료",
    email: "이메일",
    password: "비밀번호",
    login: "로그인",
    signUp: "가입하기",
    logout: "로그아웃",
  },
  ar: {
    cancel: "إلغاء",
    save: "حفظ",
    delete: "حذف",
    edit: "تعديل",
    done: "تم",
    home: "الرئيسية",
    community: "المجتمع",
    live: "مباشر",
    map: "الخريطة",
    profile: "الملف الشخصي",
    settings: "الإعدادات",
    online: "متصل",
    quests: "المهام",
    journals: "اليوميات",
    about: "حول",
    level: "المستوى",
    streak: "السلسلة",
    signOut: "تسجيل الخروج",
    account: "الحساب",
    appearance: "المظهر",
    theme: "السمة",
    lightMode: "الوضع الفاتح",
    darkMode: "الوضع الداكن",
    liveFeatures: "ميزات البث المباشر",
    enableLive: "تفعيل البث المباشر",
    enableLiveDesc: "تكوين الواجهة الخلفية وإلغاء قفل ميزات البث المباشر",
    preferences: "التفضيلات",
    language: "اللغة",
    notifications: "الإشعارات",
    questReminders: "تذكيرات المهام",
    questRemindersDesc: "احصل على إشعارات لإكمال المهام اليومية",
    legal: "قانوني",
    safetyGuidelines: "إرشادات السلامة",
    safetyGuidelinesDesc: "اقرأ معلومات السلامة المهمة",
    createQuest: "إنشاء مهمة",
    activeQuests: "المهام النشطة",
    queuedQuests: "المهام في قائمة الانتظار",
    startQuest: "بدء المهمة",
    completeQuest: "إكمال المهمة",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    login: "تسجيل الدخول",
    signUp: "التسجيل",
    logout: "تسجيل الخروج",
  },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: Translations;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = "@app_language";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    // Load saved language on mount
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage && savedLanguage in LANGUAGES) {
        setLanguageState(savedLanguage as Language);
      }
    } catch (error) {
      console.error("Failed to load language:", error);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      setLanguageState(lang);
    } catch (error) {
      console.error("Failed to save language:", error);
    }
  };

  const value: I18nContextType = {
    language,
    setLanguage,
    t: translations[language],
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
