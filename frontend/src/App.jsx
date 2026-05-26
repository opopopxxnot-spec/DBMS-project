import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, 
  Shield, 
  Bell, 
  Palette, 
  Cpu, 
  History, 
  Sun, 
  Moon, 
  Search, 
  X, 
  ChevronRight, 
  Check, 
  AlertCircle, 
  HelpCircle, 
  User, 
  Info, 
  Menu, 
  ChevronDown, 
  CheckCircle2, 
  Lock,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';

const API_BASE = "http://localhost:8000";

const parseTimezoneOffset = (tzString) => {
  if (!tzString || tzString === 'UTC') return 0;
  const match = tzString.match(/GMT([+-])(\d+)(?::(\d+))?/);
  if (match) {
    const sign = match[1] === '+' ? 1 : -1;
    const hours = parseInt(match[2], 10);
    const minutes = match[3] ? parseInt(match[3], 10) : 0;
    return sign * (hours + minutes / 60);
  }
  return 0;
};

const TRANSLATIONS = {
  English: {
    brand: "ConfigHub",
    subBrand: "Enterprise Configurations Portal",
    signIn: "Sign In",
    signUp: "Sign Up",
    fullName: "Full Name",
    username: "Username",
    password: "Password",
    accountRole: "Account Role",
    userStandard: "User (Standard Access)",
    adminFull: "Administrator (Full Access)",
    roleHelp: "For testing, admins can edit system-wide configurations.",
    signInBtn: "Sign In to Portal",
    signUpBtn: "Create Free Account",
    searchPlaceholder: "Search settings semantically... (e.g., 'privacy options')",
    themeTitle: "Toggle visual theme",
    logout: "Log Out",
    collapseSidebar: "Collapse Sidebar",
    expandSidebar: "Expand Sidebar",
    auditTrail: "Audit Trail Logs",
    auditHeader: "Configuration Audit Trail",
    auditDesc: "History of configuration and settings updates logged in Mock MongoDB configuration_logs.",
    searchResultHeader: "Semantic Search Results",
    searchResultDesc: "AI-driven Vector search results matching query",
    emptySearch: "No settings matched your query",
    emptySearchDesc: "Try searching with words like 'privacy', 'notifications', 'alerts', 'theme', or 'timeout'.",
    foundResults: "Found {count} matching configuration settings.",
    noLogs: "No audit logs available",
    noLogsDesc: "Changes will appear here in real-time as configurations are updated.",
    explainBtn: "Explain configuration options",
    scope: "Scope",
    dataType: "Data Type",
    defaultValue: "Default Value",
    configImpact: "Configuration Impact",
    systemWide: "System-Wide",
    userSpecific: "User-Specific",
    readOnly: "Read-only",
    admin: "Administrator",
    standardUser: "Standard User",
    configKey: "Config Key",
    description: "Description",
    generalSettings: "General Settings",
    generalDesc: "Basic app details, default language, and timezone options.",
    securityPrivacy: "Security & Privacy",
    securityDesc: "MFA, session timeout, profile visibility, and data usage sharing.",
    notificationsTab: "Notifications",
    notificationsDesc: "Manage email alerts, push notifications, and marketing preferences.",
    appearanceTab: "UI & Appearance",
    appearanceDesc: "Customize visual experience, themes, and font size choices.",
    systemAdvanced: "System & Advanced",
    systemDesc: "System-wide parameters like rate limiting, upload types, and maintenance mode.",
    setting_site_name: "Site Name",
    setting_site_name_desc: "The title of the web portal displayed in browsertabs and headers.",
    setting_site_description: "Site Description",
    setting_site_description_desc: "Meta description of the portal used for SEO and portal metadata.",
    setting_language: "Language Preference",
    setting_language_desc: "Your default display language for translation and localization.",
    setting_timezone: "Timezone",
    setting_timezone_desc: "Standard timezone used to display logs and timelines.",
    setting_two_factor_auth: "Two-Factor Authentication (2FA)",
    setting_two_factor_auth_desc: "Require a security token verification code in addition to user credentials.",
    setting_session_timeout: "Session Idle Timeout",
    setting_session_timeout_desc: "Automatically log users out after a specific period of inactivity (in minutes).",
    setting_profile_visibility: "Profile Visibility",
    setting_profile_visibility_desc: "Control who can search and view your user profile details.",
    setting_data_sharing: "Anonymous Analytics Sharing",
    setting_data_sharing_desc: "Share anonymous usage statistics to help us improve user experience.",
    setting_email_notifications: "Email Notifications",
    setting_email_notifications_desc: "Send alerts via email for important system updates and account actions.",
    setting_push_notifications: "Push Notifications",
    setting_push_notifications_desc: "Show desktop alert notifications when the system generates events.",
    setting_marketing_emails: "Marketing & Promotional Emails",
    setting_marketing_emails_desc: "Receive newsletters and promotional material from our teams.",
    setting_notification_frequency: "Notification Frequency",
    setting_notification_frequency_desc: "Frequency at which notifications digests are sent.",
    setting_theme: "App Visual Theme",
    setting_theme_desc: "Switches the site color scheme between light, dark, or system preferences.",
    setting_font_size: "Font Sizing",
    setting_font_size_desc: "Adjust the UI scaling font size for accessibility.",
    setting_maintenance_mode: "Maintenance Mode",
    setting_maintenance_mode_desc: "Locks out non-admin users and shows a maintenance screen.",
    setting_api_rate_limit: "API Rate Limit",
    setting_api_rate_limit_desc: "Maximum HTTP requests allowed per client IP per minute.",
    setting_allowed_file_types: "Allowed File Attachment Types",
    setting_allowed_file_types_desc: "Comma separated file extensions allowed to upload in support tickets."
  },
  Spanish: {
    brand: "ConfigHub",
    subBrand: "Portal de Configuraciones Empresariales",
    signIn: "Iniciar Sesión",
    signUp: "Registrarse",
    fullName: "Nombre Completo",
    username: "Nombre de Usuario",
    password: "Contraseña",
    accountRole: "Rol de la Cuenta",
    userStandard: "Usuario (Acceso Estándar)",
    adminFull: "Administrador (Acceso Completo)",
    roleHelp: "Para pruebas, los administradores pueden editar configuraciones del sistema.",
    signInBtn: "Iniciar Sesión en el Portal",
    signUpBtn: "Crear Cuenta Gratis",
    searchPlaceholder: "Buscar configuraciones semánticamente... (ej. 'opciones de privacidad')",
    themeTitle: "Cambiar tema visual",
    logout: "Cerrar Sesión",
    collapseSidebar: "Contraer Barra Lateral",
    expandSidebar: "Expandir Barra Lateral",
    auditTrail: "Registro de Auditoría",
    auditHeader: "Pista de Auditoría de Configuración",
    auditDesc: "Historial de actualizaciones de configuración y ajustes registrados en la base de datos.",
    searchResultHeader: "Resultados de Búsqueda Semántica",
    searchResultDesc: "Resultados de búsqueda vectorial impulsados por IA para la consulta",
    emptySearch: "Ninguna configuración coincidió con su consulta",
    emptySearchDesc: "Intente buscar con palabras como 'privacidad', 'notificaciones', 'alertas', 'tema' o 'tiempo de espera'.",
    foundResults: "Se encontraron {count} ajustes de configuración coincidentes.",
    noLogs: "No hay registros de auditoría disponibles",
    noLogsDesc: "Los cambios aparecerán aquí en tiempo real a medida que se actualicen las configuraciones.",
    explainBtn: "Explicar opciones de configuración",
    scope: "Alcance",
    dataType: "Tipo de Datos",
    defaultValue: "Valor Predeterminado",
    configImpact: "Impacto de la Configuración",
    systemWide: "Todo el Sistema",
    userSpecific: "Usuario Específico",
    readOnly: "Sólo lectura",
    admin: "Administrador",
    standardUser: "Usuario Estándar",
    configKey: "Clave de Config",
    description: "Descripción",
    generalSettings: "Ajustes Generales",
    generalDesc: "Detalles básicos de la aplicación, idioma predeterminado y opciones de zona horaria.",
    securityPrivacy: "Seguridad y Privacidad",
    securityDesc: "MFA, tiempo de espera de sesión, visibilidad del perfil e intercambio de uso de datos.",
    notificationsTab: "Notificaciones",
    notificationsDesc: "Administre alertas por correo electrónico, notificaciones automáticas y preferencias de marketing.",
    appearanceTab: "Interfaz y Apariencia",
    appearanceDesc: "Personalice la experiencia visual, los temas y el tamaño de fuente.",
    systemAdvanced: "Sistema y Avanzado",
    systemDesc: "Parámetros del sistema como límite de tasa, tipos de archivos cargados y modo de mantenimiento.",
    setting_site_name: "Nombre del Sitio",
    setting_site_name_desc: "El título del portal web que se muestra en las pestañas del navegador.",
    setting_site_description: "Descripción del Sitio",
    setting_site_description_desc: "Meta descripción del portal utilizada para SEO.",
    setting_language: "Preferencia de Idioma",
    setting_language_desc: "Su idioma de visualización predeterminado para traducción y localización.",
    setting_timezone: "Zona Horaria",
    setting_timezone_desc: "Zona horaria estándar utilizada para mostrar registros y cronogramas.",
    setting_two_factor_auth: "Autenticación de Dos Factores (2FA)",
    setting_two_factor_auth_desc: "Requiere un código de verificación además de las credenciales de usuario.",
    setting_session_timeout: "Tiempo de Espera de Sesión",
    setting_session_timeout_desc: "Cierra automáticamente la sesión de los usuarios después de un período de inactividad (en minutos).",
    setting_profile_visibility: "Visibilidad del Perfil",
    setting_profile_visibility_desc: "Controla quién puede buscar y ver los detalles de tu perfil de usuario.",
    setting_data_sharing: "Compartir Datos de Análisis Anónimos",
    setting_data_sharing_desc: "Compartir estadísticas de uso anónimas para ayudarnos a mejorar.",
    setting_email_notifications: "Notificaciones por Correo Electrónico",
    setting_email_notifications_desc: "Enviar alertas por correo electrónico para actualizaciones importantes del sistema.",
    setting_push_notifications: "Notificaciones Push",
    setting_push_notifications_desc: "Mostrar alertas de escritorio cuando el sistema genera eventos.",
    setting_marketing_emails: "Correos Electrónicos Promocionales",
    setting_marketing_emails_desc: "Recibir boletines informativos y material promocional de nuestros equipos.",
    setting_notification_frequency: "Frecuencia de Notificaciones",
    setting_notification_frequency_desc: "Frecuencia con la que se envían los resúmenes de notificaciones.",
    setting_theme: "Tema Visual de la Aplicación",
    setting_theme_desc: "Cambia el esquema de color del sitio entre claro y oscuro.",
    setting_font_size: "Tamaño de Fuente",
    setting_font_size_desc: "Ajustar el tamaño de fuente para mejorar la accesibilidad.",
    setting_maintenance_mode: "Modo de Mantenimiento",
    setting_maintenance_mode_desc: "Bloquea a los usuarios no administradores y muestra una pantalla de mantenimiento.",
    setting_api_rate_limit: "Límite de Tasa de API",
    setting_api_rate_limit_desc: "Solicitudes HTTP máximas permitidas por IP de cliente por minuto.",
    setting_allowed_file_types: "Tipos de Archivos Permitidos",
    setting_allowed_file_types_desc: "Extensiones de archivo permitidas para subir en los tickets de soporte."
  },
  French: {
    brand: "ConfigHub",
    subBrand: "Portail des Configurations d'Entreprise",
    signIn: "Se Connecter",
    signUp: "S'Inscrire",
    fullName: "Nom Complet",
    username: "Nom d'Utilisateur",
    password: "Mot de Passe",
    accountRole: "Rôle du Compte",
    userStandard: "Utilisateur (Accès Standard)",
    adminFull: "Administrateur (Accès Complet)",
    roleHelp: "Pour les tests, les administrateurs peuvent modifier les configurations système.",
    signInBtn: "Se Connecter au Portail",
    signUpBtn: "Créer un Compte Gratuit",
    searchPlaceholder: "Rechercher des paramètres sémantiquement... (ex. 'options de confidentialité')",
    themeTitle: "Basculer le thème visuel",
    logout: "Se Déconnecter",
    collapseSidebar: "Réduire la Barre Latérale",
    expandSidebar: "Agrandir la Barre Latérale",
    auditTrail: "Journal d'Audit",
    auditHeader: "Journal d'Audit des Configurations",
    auditDesc: "Historique des mises à jour des paramètres enregistré dans la base de données.",
    searchResultHeader: "Résultats de Recherche Sémantique",
    searchResultDesc: "Résultats de recherche vectorielle IA correspondant à la requête",
    emptySearch: "Aucun paramètre ne correspond à votre requête",
    emptySearchDesc: "Essayez de rechercher avec des mots comme 'confidentialité', 'notifications', 'alertes', 'thème' ou 'délai d'expiration'.",
    foundResults: "Trouvé {count} paramètres de configuration correspondants.",
    noLogs: "Aucun journal d'audit disponible",
    noLogsDesc: "Les modifications apparaîtront ici en temps réel au fur et à mesure de la mise à jour des configurations.",
    explainBtn: "Expliquer les options de configuration",
    scope: "Portée",
    dataType: "Type de Données",
    defaultValue: "Valeur par Défaut",
    configImpact: "Impact de la Configuration",
    systemWide: "Tout le Système",
    userSpecific: "Spécifique à l'Utilisateur",
    readOnly: "Lecture seule",
    admin: "Administrateur",
    standardUser: "Utilisateur Standard",
    configKey: "Clé de Config",
    description: "Description",
    generalSettings: "Paramètres Généraux",
    generalDesc: "Informations de base, langue par défaut et options de fuseau horaire.",
    securityPrivacy: "Sécurité et Confidentialité",
    securityDesc: "MFA, délai d'expiration de session, visibilité du profil et partage de données anonymes.",
    notificationsTab: "Notifications",
    notificationsDesc: "Gérer les alertes e-mail, les notifications push et les préférences marketing.",
    appearanceTab: "UI & Apparence",
    appearanceDesc: "Personnaliser l'expérience visuelle, les thèmes et la taille de la police.",
    systemAdvanced: "Système & Avancé",
    systemDesc: "Paramètres système tels que la limitation du débit, les types de fichiers autorisés et le mode de maintenance.",
    setting_site_name: "Nom du Site",
    setting_site_name_desc: "Le titre du portail Web affiché dans les onglets du navigateur.",
    setting_site_description: "Description du Site",
    setting_site_description_desc: "Méta description du portail utilisée pour le référencement SEO.",
    setting_language: "Préférence de Langue",
    setting_language_desc: "Votre langue d'affichage par défaut pour la traduction et la localisation.",
    setting_timezone: "Fuseau Chronologique",
    setting_timezone_desc: "Fuseau horaire standard utilisé pour afficher les journaux.",
    setting_two_factor_auth: "Authentification à Double Facteur (2FA)",
    setting_two_factor_auth_desc: "Nécessite un code de vérification en plus des identifiants de l'utilisateur.",
    setting_session_timeout: "Délai d'Expiration de Session",
    setting_session_timeout_desc: "Déconnecte automatiquement les utilisateurs après une période d'inactivité (en minutes).",
    setting_profile_visibility: "Visibilité du Profil",
    setting_profile_visibility_desc: "Contrôlez qui peut rechercher et voir les détails de votre profil d'utilisateur.",
    setting_data_sharing: "Partage de Données Analytiques Anonymes",
    setting_data_sharing_desc: "Partagez des statistiques d'utilisation anonymes pour nous aider à nous améliorer.",
    setting_email_notifications: "Notifications par E-mail",
    setting_email_notifications_desc: "Envoyer des alertes par e-mail pour les mises à jour importantes du système.",
    setting_push_notifications: "Notifications Push",
    setting_push_notifications_desc: "Afficher des alertes sur le bureau lorsque le système génère des événements.",
    setting_marketing_emails: "E-mails Marketing et Promotionnels",
    setting_marketing_emails_desc: "Recevoir des newsletters et du matériel promotionnel de nos équipes.",
    setting_notification_frequency: "Fréquence des Notifications",
    setting_notification_frequency_desc: "Fréquence d'envoi des résumés de notifications.",
    setting_theme: "Thème Visuel de l'Application",
    setting_theme_desc: "Bascule le schéma de couleurs du site entre clair et sombre.",
    setting_font_size: "Taille de Police",
    setting_font_size_desc: "Ajustez la taille de police pour l'accessibilité de l'interface.",
    setting_maintenance_mode: "Mode de Maintenance",
    setting_maintenance_mode_desc: "Verrouille l'accès aux utilisateurs non administrateurs.",
    setting_api_rate_limit: "Limite de Débit de l'API",
    setting_api_rate_limit_desc: "Requêtes HTTP maximales autorisées par IP client par minute.",
    setting_allowed_file_types: "Types de Fichiers Autorisés",
    setting_allowed_file_types_desc: "Extensions de fichiers autorisées à être téléchargées dans les tickets de support."
  },
  German: {
    brand: "ConfigHub",
    subBrand: "Unternehmenskonfigurationsportal",
    signIn: "Einloggen",
    signUp: "Registrieren",
    fullName: "Vollständiger Name",
    username: "Benutzername",
    password: "Passwort",
    accountRole: "Kontorolle",
    userStandard: "Benutzer (Standardzugriff)",
    adminFull: "Administrator (Vollzugriff)",
    roleHelp: "Für Testzwecke können Administratoren systemweite Konfigurationen bearbeiten.",
    signInBtn: "Im Portal einloggen",
    signUpBtn: "Kostenloses Konto erstellen",
    searchPlaceholder: "Einstellungen semantisch suchen... (z. B. 'Datenschutzoptionen')",
    themeTitle: "Visuelles Thema wechseln",
    logout: "Ausloggen",
    collapseSidebar: "Seitenleiste einklappen",
    expandSidebar: "Seitenleiste ausklappen",
    auditTrail: "Audit-Protokoll",
    auditHeader: "Konfigurations-Audit-Trail",
    auditDesc: "Verlauf der in Mock MongoDB protokollierten Konfigurations- und Einstellungsaktualisierungen.",
    searchResultHeader: "Semantische Suchergebnisse",
    searchResultDesc: "KI-gestützte Vektorsuchergebnisse passend zur Suchanfrage",
    emptySearch: "Keine Einstellungen entsprechen Ihrer Suchanfrage",
    emptySearchDesc: "Versuchen Sie die Suche mit Begriffen wie 'Datenschutz', 'Benachrichtigungen', 'Benachrichtigungstöne', 'Thema' oder 'Zeitüberschreitung'.",
    foundResults: "{count} übereinstimmende Konfigurationseinstellungen gefunden.",
    noLogs: "Keine Audit-Protokolle verfügbar",
    noLogsDesc: "Änderungen werden hier in Echtzeit angezeigt, sobald Konfigurationen aktualisiert werden.",
    explainBtn: "Konfigurationsoptionen erklären",
    scope: "Bereich",
    dataType: "Datentyp",
    defaultValue: "Standardwert",
    configImpact: "Auswirkung der Konfiguration",
    systemWide: "Systemweit",
    userSpecific: "Benutzerspezifisch",
    readOnly: "Schreibgeschützt",
    admin: "Administrator",
    standardUser: "Standardbenutzer",
    configKey: "Konfig-Schlüssel",
    description: "Beschreibung",
    generalSettings: "Allgemeine Einstellungen",
    generalDesc: "Grundlegende App-Details, Standardsprache und Zeitzonenoptionen.",
    securityPrivacy: "Sicherheit & Datenschutz",
    securityDesc: "MFA, Sitzungs-Timeout, Profilsichtbarkeit und gemeinsame Datennutzung.",
    notificationsTab: "Benachrichtigungen",
    notificationsDesc: "Verwalten Sie E-Mail-Benachrichtigungen, Push-Benachrichtigungen und Marketing-Präferenzen.",
    appearanceTab: "UI & Aussehen",
    appearanceDesc: "Passen Sie die visuelle Darstellung, Themen und Schriftgrößen an.",
    systemAdvanced: "System & Erweitert",
    systemDesc: "Systemweite Parameter wie Ratenbegrenzung, Dateiuploads und Wartungsmodus.",
    setting_site_name: "Webseitenname",
    setting_site_name_desc: "Der in Browser-Tabs und Headern angezeigte Name des Webportals.",
    setting_site_description: "Seitenbeschreibung",
    setting_site_description_desc: "Für SEO und Metadaten des Portals verwendete Beschreibung.",
    setting_language: "Sprachpräferenz",
    setting_language_desc: "Ihre Standardanzeigesprache für Übersetzung und Lokalisierung.",
    setting_timezone: "Zeitzone",
    setting_timezone_desc: "Standardzeitzone für die Anzeige von Protokollen und Timelines.",
    setting_two_factor_auth: "Zwei-Faktor-Authentisierung (2FA)",
    setting_two_factor_auth_desc: "Erfordert einen zusätzlichen Bestätigungscode neben den Zugangsdaten.",
    setting_session_timeout: "Sitzungstimeout",
    setting_session_timeout_desc: "Meldet Benutzer nach einer bestimmten Zeit der Inaktivität (in Minuten) automatisch ab.",
    setting_profile_visibility: "Profilsichtbarkeit",
    setting_profile_visibility_desc: "Steuern Sie, wer Ihre Benutzerprofildetails suchen und anzeigen kann.",
    setting_data_sharing: "Anonyme Analysefreigabe",
    setting_data_sharing_desc: "Teilen Sie anonyme Nutzungsstatistiken, um uns bei der Verbesserung zu helfen.",
    setting_email_notifications: "E-Mail-Benachrichtigungen",
    setting_email_notifications_desc: "Senden Sie E-Mail-Benachrichtigungen für wichtige System- und Kontoupdates.",
    setting_push_notifications: "Push-Benachrichtigungen",
    setting_push_notifications_desc: "Desktop-Benachrichtigungen anzeigen, wenn das System Ereignisse generiert.",
    setting_marketing_emails: "Marketing & Werbe-E-Mails",
    setting_marketing_emails_desc: "Erhalten Sie Newsletter und Werbematerial von unseren Teams.",
    setting_notification_frequency: "Benachrichtigungshäufigkeit",
    setting_notification_frequency_desc: "Häufigkeit, mit der Benachrichtigungszusammenfassungen gesendet werden.",
    setting_theme: "Visuelles App-Thema",
    setting_theme_desc: "Wechselt das Farbschema der Website zwischen Hell, Dunkel oder Systemvorgabe.",
    setting_font_size: "Schriftgröße",
    setting_font_size_desc: "Passen Sie die UI-Schriftgröße für Barrierefreiheit an.",
    setting_maintenance_mode: "Wartungsmodus",
    setting_maintenance_mode_desc: "Sperrt Nicht-Admin-Benutzer aus und zeigt einen Wartungsbildschirm an.",
    setting_api_rate_limit: "API-Ratenbegrenzung",
    setting_api_rate_limit_desc: "Maximale Anzahl zulässiger HTTP-Anfragen pro IP-Adresse pro Minute.",
    setting_allowed_file_types: "Zulässige Dateianhangstypen",
    setting_allowed_file_types_desc: "Durch Kommas getrennte Dateierweiterungen für Datei-Uploads."
  }
};

function App() {
  // App States
  const [activeUser, setActiveUser] = useState(() => {
    try {
      const saved = localStorage.getItem("confighub_auth");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [settings, setSettings] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  
  // UI State Controls
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [savingStatus, setSavingStatus] = useState({}); // { setting_id: 'saving' | 'saved' | 'error' }
  const [activeInfoSetting, setActiveInfoSetting] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [revealedSensitives, setRevealedSensitives] = useState({}); // { setting_id: boolean }

  // Authentication UI States
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authForm, setAuthForm] = useState({ name: '', username: '', password: '', role: 'user' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const searchInputRef = useRef(null);

  // Dynamic Translation Helpers
  const getLang = () => {
    const langSetting = settings.find(s => s.id === 'language');
    const langValue = langSetting ? langSetting.value : 'English';
    return TRANSLATIONS[langValue] || TRANSLATIONS.English;
  };

  const t = (key, count) => {
    const dict = getLang();
    let text = dict[key] || TRANSLATIONS.English[key] || key;
    if (count !== undefined) {
      text = text.replace('{count}', count);
    }
    return text;
  };

  const translateSetting = (s) => {
    if (!s) return s;
    const nameKey = `setting_${s.id}`;
    const descKey = `setting_${s.id}_desc`;
    const dict = getLang();
    return {
      ...s,
      name: dict[nameKey] || s.name,
      description: dict[descKey] || s.description
    };
  };

  const translateGroup = (g) => {
    if (!g) return g;
    const dict = getLang();
    const nameKey = g.id === 'general' ? 'generalSettings' : 
                    g.id === 'security' ? 'securityPrivacy' :
                    g.id === 'notifications' ? 'notificationsTab' :
                    g.id === 'appearance' ? 'appearanceTab' :
                    g.id === 'system' ? 'systemAdvanced' : `${g.id}Settings`;
    const descKey = `${g.id}Desc`;
    return {
      ...g,
      name: dict[nameKey] || g.name,
      description: dict[descKey] || g.description
    };
  };

  // Load configuration groups on boot
  useEffect(() => {
    fetchGroups();
  }, []);

  // Sync settings when active user changes
  useEffect(() => {
    if (activeUser) {
      fetchSettings(activeUser.id);
      fetchUserPreferences(activeUser.id);
      if (showLogs) {
        fetchLogs();
      }
    }
  }, [activeUser, showLogs]);

  // Auth Submit Handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!authForm.username.trim() || !authForm.password) {
      setAuthError("All fields are required.");
      return;
    }
    
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: authForm.username.trim(),
          password: authForm.password
        })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Login failed");
      }
      
      const userData = await res.json();
      localStorage.setItem("confighub_auth", JSON.stringify(userData));
      setActiveUser(userData);
      triggerToast(`Welcome back, ${userData.name}!`);
      setAuthForm({ name: '', username: '', password: '', role: 'user' });
    } catch (err) {
      setAuthError(err.message);
      triggerToast(err.message, "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!authForm.name.trim() || !authForm.username.trim() || !authForm.password) {
      setAuthError("All fields are required.");
      return;
    }
    if (authForm.username.trim().length < 3) {
      setAuthError("Username must be at least 3 characters.");
      return;
    }
    if (authForm.password.length < 5) {
      setAuthError("Password must be at least 5 characters.");
      return;
    }
    
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: authForm.name.trim(),
          username: authForm.username.trim(),
          password: authForm.password,
          role: authForm.role
        })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Registration failed");
      }
      
      const userData = await res.json();
      localStorage.setItem("confighub_auth", JSON.stringify(userData));
      setActiveUser(userData);
      triggerToast(`Account created successfully! Welcome, ${userData.name}!`);
      setAuthForm({ name: '', username: '', password: '', role: 'user' });
    } catch (err) {
      setAuthError(err.message);
      triggerToast(err.message, "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("confighub_auth");
    setActiveUser(null);
    setShowLogs(false);
    clearSearch();
    setIsUserDropdownOpen(false);
    triggerToast("Logged out successfully.");
  };

  // Fetch Configuration Groups
  const fetchGroups = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/groups`);
      const data = await res.json();
      setGroups(data);
    } catch (err) {
      triggerToast("Failed to load settings categories.", "error");
    }
  };

  // Fetch Settings Definitions & Values for Active User
  const fetchSettings = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/api/settings?user_id=${userId}`);
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      triggerToast("Failed to load settings configuration.", "error");
    }
  };

  // Fetch Audit Logs
  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/logs`);
      const data = await res.json();
      setAuditLogs(data);
    } catch (err) {
      triggerToast("Failed to load audit logs.", "error");
    }
  };

  // Fetch User Preferences (theme, sidebar collapse)
  const fetchUserPreferences = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/api/preferences?user_id=${userId}`);
      const data = await res.json();
      if (data.theme) {
        setTheme(data.theme);
        applyTheme(data.theme);
      }
      if (data.collapsed_sidebar) {
        setIsSidebarCollapsed(data.collapsed_sidebar === 'true');
      }
    } catch (err) {
      console.warn("Failed to fetch user preferences", err);
    }
  };

  // Save specific preference to Mock MongoDB
  const saveUserPreference = async (key, value) => {
    if (!activeUser) return;
    try {
      await fetch(`${API_BASE}/api/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: activeUser.id,
          pref_key: key,
          pref_value: String(value)
        })
      });
    } catch (err) {
      console.warn("Failed to save user preference", err);
    }
  };

  const applyTheme = (targetTheme) => {
    const root = document.documentElement;
    if (targetTheme === 'light') {
      root.classList.add('light-theme');
    } else {
      root.classList.remove('light-theme');
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    applyTheme(nextTheme);
    saveUserPreference('theme', nextTheme);
    
    // Sync settings in SQLite database
    const themeSettingValue = nextTheme === 'light' ? 'Light Mode' : 'Dark Mode';
    handleSettingChange('theme', themeSettingValue);
  };

  const toggleSidebar = () => {
    const nextState = !isSidebarCollapsed;
    setIsSidebarCollapsed(nextState);
    saveUserPreference('collapsed_sidebar', nextState);
  };

  // Switch context to another user
  const handleUserChange = (user) => {
    setActiveUser(user);
    setIsUserDropdownOpen(false);
    triggerToast(`Switched context to ${user.name}`);
  };

  // Handle setting updates
  const handleSettingChange = async (settingId, newValue) => {
    if (!activeUser) return;

    // Apply visual theme immediately if changed via appearance tab select
    if (settingId === 'theme') {
      const mappedTheme = newValue === 'Light Mode' ? 'light' : 'dark';
      setTheme(mappedTheme);
      applyTheme(mappedTheme);
      saveUserPreference('theme', mappedTheme);
    }

    // Keep backup for rollback in case of error
    const previousSettings = [...settings];

    // Optimistically update setting value locally
    setSettings(prev => prev.map(s => {
      if (s.id === settingId) {
        return { ...s, value: newValue };
      }
      return s;
    }));

    // Update search results list if in search mode
    if (isSearching) {
      setSearchResults(prev => prev.map(s => {
        if (s.id === settingId) {
          return { ...s, value: newValue };
        }
        return s;
      }));
    }

    setSavingStatus(prev => ({ ...prev, [settingId]: 'saving' }));

    try {
      const response = await fetch(`${API_BASE}/api/settings/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setting_id: settingId,
          user_id: activeUser.id,
          value: newValue
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update setting");
      }

      setSavingStatus(prev => ({ ...prev, [settingId]: 'saved' }));
      triggerToast(`Setting saved successfully!`);
      
      // Auto-clear success checkmark indicator after 2s
      setTimeout(() => {
        setSavingStatus(prev => ({ ...prev, [settingId]: null }));
      }, 2000);

      // Re-fetch logs if audit panel is currently viewable
      if (showLogs) {
        fetchLogs();
      }

    } catch (err) {
      // Revert local value on error
      setSettings(previousSettings);
      if (isSearching) {
        // Find old value from previousSettings
        const oldSet = previousSettings.find(s => s.id === settingId);
        if (oldSet) {
          setSearchResults(prev => prev.map(s => {
            if (s.id === settingId) {
              return { ...s, value: oldSet.value };
            }
            return s;
          }));
        }
      }
      setSavingStatus(prev => ({ ...prev, [settingId]: 'error' }));
      triggerToast(err.message, "error");
      
      setTimeout(() => {
        setSavingStatus(prev => ({ ...prev, [settingId]: null }));
      }, 3000);
    }
  };

  // Perform semantic search
  const handleSearch = async (queryVal) => {
    setSearchQuery(queryVal);
    if (!queryVal.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`${API_BASE}/api/settings/search?q=${encodeURIComponent(queryVal)}&user_id=${activeUser.id}`);
      const data = await res.json();
      setSearchResults(data.map(translateSetting));
    } catch (err) {
      console.error("Search error", err);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    setSearchResults([]);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Toast notifier helper
  const triggerToast = (message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Toggle sensitive field visibility (e.g. rate limit, secret items)
  const toggleRevealSensitive = (settingId) => {
    setRevealedSensitives(prev => ({ ...prev, [settingId]: !prev[settingId] }));
  };

  // Map category IDs to icons
  const getGroupIcon = (iconName) => {
    switch (iconName.toLowerCase()) {
      case 'settings': return <Settings className="nav-item-icon" />;
      case 'shield': return <Shield className="nav-item-icon" />;
      case 'bell': return <Bell className="nav-item-icon" />;
      case 'palette': return <Palette className="nav-item-icon" />;
      case 'cpu': return <Cpu className="nav-item-icon" />;
      default: return <Settings className="nav-item-icon" />;
    }
  };

  // Format date helper for audit logs
  const formatLogTime = (isoString) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      
      const tzSetting = settings.find(s => s.id === 'timezone');
      const tzValue = tzSetting ? tzSetting.value : 'UTC';
      const offsetHours = parseTimezoneOffset(tzValue);
      
      const utcMs = date.getTime() + (date.getTimezoneOffset() * 60000);
      const targetTime = new Date(utcMs + (offsetHours * 3600000));
      
      const timeStr = targetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dateStr = targetTime.toLocaleDateString();
      const tzLabel = tzValue.split(' ')[0];
      return `${timeStr} ${dateStr} (${tzLabel})`;
    } catch (e) {
      return isoString;
    }
  };

  // Find setting name dynamically from settings definitions
  const getSettingName = (settingId) => {
    const item = settings.find(s => s.id === settingId);
    return item ? item.name : settingId;
  };

  // Filter settings by selected category tab
  const activeSettings = settings.filter(s => s.group_id === activeGroup).map(translateSetting);

  if (!activeUser) {
    return (
      <div className="app-container auth-page">
        <div className="auth-card-container">
          <div className="auth-brand">
            <Settings className="auth-brand-icon animate-spin-slow" size={48} />
            <h2>{t('brand')}</h2>
            <p>{t('subBrand')}</p>
          </div>
          
          <div className="auth-card">
            <div className="auth-tabs">
              <button 
                type="button"
                className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
                onClick={() => { setAuthMode('login'); setAuthError(''); }}
              >
                {t('signIn')}
              </button>
              <button 
                type="button"
                className={`auth-tab ${authMode === 'register' ? 'active' : ''}`}
                onClick={() => { setAuthMode('register'); setAuthError(''); }}
              >
                {t('signUp')}
              </button>
            </div>
            
            <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="auth-form">
              {authError && (
                <div className="auth-error-box">
                  <AlertCircle size={16} />
                  <span>{authError}</span>
                </div>
              )}
              
              {authMode === 'register' && (
                <div className="form-group">
                  <label htmlFor="auth-name">{t('fullName')}</label>
                  <div className="input-with-icon">
                    <User size={18} className="input-icon" />
                    <input 
                      type="text" 
                      id="auth-name"
                      placeholder=""
                      value={authForm.name}
                      onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                      required
                    />
                  </div>
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="auth-username">{t('username')}</label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input 
                    type="text" 
                    id="auth-username"
                    placeholder=""
                    value={authForm.username}
                    onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="auth-password">{t('password')}</label>
                <div className="input-with-icon">
                  <Lock size={18} className="input-icon" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    id="auth-password"
                    placeholder=""
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    required
                  />
                  <button 
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              
              {authMode === 'register' && (
                <div className="form-group">
                  <label htmlFor="auth-role">{t('accountRole')}</label>
                  <select 
                    id="auth-role"
                    className="auth-select"
                    value={authForm.role}
                    onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}
                  >
                    <option value="user">{t('userStandard')}</option>
                    <option value="admin">{t('adminFull')}</option>
                  </select>
                  <small className="help-text">{t('roleHelp')}</small>
                </div>
              )}
              
              <button type="submit" className="auth-submit-btn" disabled={authLoading}>
                {authLoading ? (
                  <div className="spinner auth-spinner"></div>
                ) : (
                  <>
                    <span>{authMode === 'login' ? t('signInBtn') : t('signUpBtn')}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
        
        <div className="toast-container">
          {toasts.map(toast => (
            <div key={toast.id} className={`toast ${toast.type}`} onClick={() => removeToast(toast.id)}>
              <div className="toast-icon">
                {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              </div>
              <span>{toast.message}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`app-container ${isSidebarCollapsed ? 'collapsed-sidebar' : ''}`}>
      
      {/* HEADER SECTION */}
      <header className="app-header">
        <div className="brand">
          <Settings className="brand-icon" />
          {!isSidebarCollapsed && <span>{t('brand')}</span>}
        </div>

        {/* Semantic Search Bar */}
        <div className="search-container">
          <input 
            type="text" 
            ref={searchInputRef}
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            className="search-input"
            onChange={(e) => handleSearch(e.target.value)}
          />
          <Search className="search-icon-left" size={18} />
          {searchQuery && (
            <button className="search-clear" onClick={clearSearch}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* User Switcher and Theme Toggle */}
        <div className="header-actions">
          <button className="theme-toggle-btn" onClick={toggleTheme} title={t('themeTitle')}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {activeUser && (
            <div style={{ position: 'relative' }}>
              <div className="user-switcher" onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}>
                <img src={activeUser.avatar} alt="Avatar" className="user-avatar" />
                {!isSidebarCollapsed && (
                  <>
                    <div className="user-info">
                      <span className="user-name">{activeUser.name}</span>
                      <span className="user-role">{t(activeUser.role === 'admin' ? 'admin' : 'standardUser')}</span>
                    </div>
                    <ChevronDown size={14} style={{ marginLeft: 4 }} />
                  </>
                )}
              </div>

              {/* User Dropdown Profile & Logout */}
              {isUserDropdownOpen && (
                <div className="user-dropdown">
                  <div className="user-dropdown-profile">
                    <img src={activeUser.avatar} alt="Avatar" className="user-dropdown-avatar" />
                    <h4>{activeUser.name}</h4>
                    <span className="user-dropdown-username">@{activeUser.username}</span>
                    <span className={`setting-badge ${activeUser.role === 'admin' ? 'system-wide' : 'user-specific'}`} style={{ marginTop: 8 }}>
                      {activeUser.role === 'admin' ? t('admin') : t('standardUser')}
                    </span>
                  </div>
                  <div className="user-dropdown-divider"></div>
                  <button className="user-dropdown-logout-btn" onClick={handleLogout}>
                    {t('logout')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* SIDEBAR NAVIGATION */}
      <aside className="app-sidebar">
        <div className="sidebar-nav">
          {groups.map(translateGroup).map(g => (
            <button
              key={g.id}
              className={`nav-item ${activeGroup === g.id && !showLogs && !isSearching ? 'active' : ''}`}
              onClick={() => {
                setActiveGroup(g.id);
                setShowLogs(false);
                clearSearch();
              }}
              title={g.name}
            >
              {getGroupIcon(g.icon)}
              {!isSidebarCollapsed && <span>{g.name}</span>}
            </button>
          ))}

          {/* Audit Logs nav button */}
          <button 
            className={`nav-item ${showLogs && !isSearching ? 'active' : ''}`}
            onClick={() => {
              setShowLogs(true);
              fetchLogs();
              clearSearch();
            }}
            title={t('auditTrail')}
          >
            <History className="nav-item-icon" />
            {!isSidebarCollapsed && <span>{t('auditTrail')}</span>}
          </button>
        </div>

        {/* Sidebar footer collapse */}
        <div className="sidebar-footer">
          <button className="sidebar-collapse-btn" onClick={toggleSidebar}>
            <Menu size={16} />
            {!isSidebarCollapsed && <span>{t('collapseSidebar')}</span>}
          </button>
        </div>
      </aside>

      {/* MAIN MAIN CONTENT CONTAINER */}
      <main className="app-main">
        {isSearching ? (
          // SEMANTIC SEARCH RESULTS INTERFACE
          <div>
            <div className="section-header">
              <h2 className="section-title">
                {t('searchResultHeader')}
              </h2>
              <p className="section-desc">
                {t('searchResultDesc')}: <strong>"{searchQuery}"</strong>
              </p>
            </div>

            {searchResults.length > 0 ? (
              <div className="search-results-grid">
                <div className="search-results-meta">
                  {t('foundResults', searchResults.length)}
                </div>
                {searchResults.map(setting => (
                  <SettingCard 
                    key={setting.id}
                    setting={setting}
                    activeUser={activeUser}
                    savingStatus={savingStatus[setting.id]}
                    revealedSensitives={revealedSensitives}
                    toggleRevealSensitive={toggleRevealSensitive}
                    handleSettingChange={handleSettingChange}
                    setActiveInfoSetting={setActiveInfoSetting}
                    showRelevance={true}
                    t={t}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <AlertCircle className="empty-icon" />
                <h3>{t('emptySearch')}</h3>
                <p>{t('emptySearchDesc')}</p>
              </div>
            )}
          </div>
        ) : showLogs ? (
          // AUDIT TRAIL LOGS INTERFACE
          <div>
            <div className="section-header">
              <h2 className="section-title">
                <History style={{ marginRight: 8 }} /> {t('auditHeader')}
              </h2>
              <p className="section-desc">
                {t('auditDesc')}
              </p>
            </div>

            {auditLogs.length > 0 ? (
              <div className="logs-timeline">
                {auditLogs.map((log) => (
                  <div key={log._id} className={`log-item ${log.is_system_wide ? 'system' : ''}`}>
                    <div className="log-avatar">
                      <User size={18} style={{ color: log.is_system_wide ? 'var(--accent)' : 'var(--primary)' }} />
                    </div>
                    <div className="log-details">
                      <span className="log-text">
                        <strong>{log.username}</strong> ({log.role}) updated{" "}
                        <strong>{getSettingName(log.setting_id)}</strong>
                      </span>
                      <div className="log-value-change">
                        <span className="log-old-val">{log.old_value}</span>
                        <span className="log-arrow"><ArrowRight size={12} /></span>
                        <span className="log-new-val">{log.new_value}</span>
                      </div>
                      <div className="log-meta">
                        <span className={`setting-badge ${log.is_system_wide ? 'system-wide' : 'user-specific'}`}>
                          {log.is_system_wide ? t('systemWide') : t('userSpecific')}
                        </span>
                      </div>
                    </div>
                    <div className="log-time">
                      {formatLogTime(log.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <History className="empty-icon" />
                <h3>{t('noLogs')}</h3>
                <p>{t('noLogsDesc')}</p>
              </div>
            )}
          </div>
        ) : (
          // CATEGORY DETAILS VIEW
          <div>
            {groups.find(g => g.id === activeGroup) && (() => {
              const translatedGroup = translateGroup(groups.find(g => g.id === activeGroup));
              return (
                <div className="section-header">
                  <h2 className="section-title">
                    {translatedGroup.name}
                  </h2>
                  <p className="section-desc">
                    {translatedGroup.description}
                  </p>
                </div>
              );
            })()}

            <div className="settings-grid">
              {activeSettings.map(setting => (
                <SettingCard 
                  key={setting.id}
                  setting={setting}
                  activeUser={activeUser}
                  savingStatus={savingStatus[setting.id]}
                  revealedSensitives={revealedSensitives}
                  toggleRevealSensitive={toggleRevealSensitive}
                  handleSettingChange={handleSettingChange}
                  setActiveInfoSetting={setActiveInfoSetting}
                  showRelevance={false}
                  t={t}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* DETAIL EXPLANATION INFO DIALOG */}
      {activeInfoSetting && (() => {
        const translatedInfo = translateSetting(activeInfoSetting);
        return (
          <div className="overlay" onClick={() => setActiveInfoSetting(null)}>
            <div className="dialog" onClick={(e) => e.stopPropagation()}>
              <div className="dialog-header">
                <h3 className="dialog-title">{translatedInfo.name}</h3>
                <button className="dialog-close" onClick={() => setActiveInfoSetting(null)}>
                  <X size={20} />
                </button>
              </div>
              <div className="dialog-body">
                <div>
                  <div className="dialog-section-title">{t('description')}</div>
                  <p>{translatedInfo.description}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div className="dialog-section-title">{t('configKey')}</div>
                    <code style={{ fontSize: 12 }}>{translatedInfo.id}</code>
                  </div>
                  <div>
                    <div className="dialog-section-title">{t('scope')}</div>
                    <span className={`setting-badge ${translatedInfo.is_system_wide ? 'system-wide' : 'user-specific'}`}>
                      {translatedInfo.is_system_wide ? t('systemWide') : t('userSpecific')}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div className="dialog-section-title">{t('dataType')}</div>
                    <span style={{ textTransform: 'capitalize', fontSize: 13 }}>{translatedInfo.type}</span>
                  </div>
                  <div>
                    <div className="dialog-section-title">{t('defaultValue')}</div>
                    <span style={{ fontSize: 13, fontFamily: 'monospace' }}>{translatedInfo.default_value}</span>
                  </div>
                </div>
                
                <div className="dialog-insight-box">
                  <div className="dialog-section-title" style={{ fontSize: 10, color: 'var(--primary)' }}>{t('configImpact')}</div>
                  <p style={{ fontSize: 12, marginTop: 4 }}>
                    {translatedInfo.is_system_wide 
                      ? "Changes to this configuration affect the entire application globally for all users immediately upon submission. Only administrative roles may update this setting." 
                      : "This configuration option is user-specific. Custom values are sandboxed and will only apply to your user session, stored under user preferences."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TOAST OVERLAY NOTIFICATIONS */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type}`} onClick={() => removeToast(toast.id)}>
            <div className="toast-icon">
              {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            </div>
            <span>{toast.message}</span>
            <button style={{ background: 'none', border: 'none', color: 'inherit', marginLeft: 'auto', cursor: 'pointer' }}>
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}

// Subcomponent: Individual Setting Form Card
function SettingCard({ 
  setting, 
  activeUser, 
  savingStatus, 
  revealedSensitives, 
  toggleRevealSensitive, 
  handleSettingChange, 
  setActiveInfoSetting,
  showRelevance,
  t
}) {
  const isReadOnly = setting.is_system_wide && activeUser && activeUser.role !== 'admin';

  const renderControl = () => {
    switch (setting.type) {
      case 'boolean':
        return (
          <label className="switch">
            <input 
              type="checkbox" 
              checked={setting.value === 'true'} 
              disabled={isReadOnly}
              onChange={(e) => handleSettingChange(setting.id, e.target.checked ? 'true' : 'false')}
            />
            <span className="slider"></span>
          </label>
        );
      case 'select':
        return (
          <select 
            value={setting.value} 
            disabled={isReadOnly}
            className="custom-select"
            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
          >
            {setting.options && setting.options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case 'number':
        return (
          <input 
            type="number" 
            value={setting.value}
            disabled={isReadOnly}
            className="custom-text-input"
            style={{ width: 100 }}
            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
          />
        );
      case 'string':
      default:
        const isSensitive = setting.is_sensitive || setting.id.includes("secret") || setting.id.includes("key");
        const showPlain = !isSensitive || revealedSensitives[setting.id];
        
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input 
              type={showPlain ? "text" : "password"} 
              value={setting.value}
              disabled={isReadOnly}
              className="custom-text-input"
              onChange={(e) => handleSettingChange(setting.id, e.target.value)}
            />
            {isSensitive && (
              <button 
                type="button" 
                onClick={() => toggleRevealSensitive(setting.id)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                {showPlain ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            )}
          </div>
        );
    }
  };

  return (
    <div className="setting-card">
      <div className="setting-info">
        <div className="setting-header-row">
          <span className="setting-name">{setting.name}</span>
          
          <span className={`setting-badge ${setting.is_system_wide ? 'system-wide' : 'user-specific'}`}>
            {t(setting.is_system_wide ? 'systemWide' : 'userSpecific')}
          </span>

          {isReadOnly && (
            <span className="setting-badge" style={{ background: 'rgba(239, 68, 68, 0.05)', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Lock size={10} /> {t('readOnly')}
            </span>
          )}

          {showRelevance && setting.score && (
            <span className="relevance-score">
              Match: {Math.round(setting.score * 100)}%
            </span>
          )}
        </div>
        <p className="setting-description">{setting.description}</p>
      </div>

      <div className="setting-control">
        {/* Save Status Spinner/Indicator */}
        <div className="save-status">
          {savingStatus === 'saving' && <div className="spinner"></div>}
          {savingStatus === 'saved' && <Check size={16} style={{ color: 'var(--success)' }} />}
          {savingStatus === 'error' && <AlertCircle size={16} style={{ color: 'var(--danger)' }} />}
        </div>

        {/* The Action Form Control */}
        {renderControl()}

        {/* Explain dialog trigger */}
        <button 
          className="info-btn" 
          onClick={() => setActiveInfoSetting(setting)}
          title={t('explainBtn')}
        >
          <HelpCircle size={16} />
        </button>
      </div>
    </div>
  );
}

export default App;
