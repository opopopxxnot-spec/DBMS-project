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

function App() {
  // App States
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
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

  const searchInputRef = useRef(null);

  // Load initial users
  useEffect(() => {
    fetchUsers();
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
  }, [activeUser]);

  // Fetch Users
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users`);
      const data = await res.json();
      setUsers(data);
      if (data.length > 0) {
        // Set first user (usually Admin) as default active
        setActiveUser(data[0]);
      }
    } catch (err) {
      triggerToast("Failed to fetch users. Check backend connection.", "error");
    }
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
    triggerToast(`Theme switched to ${nextTheme === 'dark' ? 'Dark' : 'Light'} Mode!`);
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
      setSearchResults(data);
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
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + date.toLocaleDateString();
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
  const activeSettings = settings.filter(s => s.group_id === activeGroup);

  return (
    <div className={`app-container ${isSidebarCollapsed ? 'collapsed-sidebar' : ''}`}>
      
      {/* HEADER SECTION */}
      <header className="app-header">
        <div className="brand">
          <Settings className="brand-icon" />
          {!isSidebarCollapsed && <span>ConfigHub</span>}
        </div>

        {/* Semantic Search Bar */}
        <div className="search-container">
          <input 
            type="text" 
            ref={searchInputRef}
            placeholder="Search settings semantically... (e.g., 'privacy options')"
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
          <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle visual theme">
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
                      <span className="user-role">{activeUser.role}</span>
                    </div>
                    <ChevronDown size={14} style={{ marginLeft: 4 }} />
                  </>
                )}
              </div>

              {/* User switcher Dropdown */}
              {isUserDropdownOpen && (
                <div className="user-dropdown">
                  <div className="user-dropdown-header">Switch User Role Context</div>
                  {users.map(u => (
                    <div 
                      key={u.id} 
                      className={`user-option ${u.id === activeUser.id ? 'active' : ''}`}
                      onClick={() => handleUserChange(u)}
                    >
                      <img src={u.avatar} alt="Avatar" className="user-avatar" />
                      <div className="user-info">
                        <span className="user-name">{u.name}</span>
                        <span className="user-role">{u.role}</span>
                      </div>
                      {u.id === activeUser.id && <Check size={14} style={{ marginLeft: 'auto', color: 'var(--primary)' }} />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* SIDEBAR NAVIGATION */}
      <aside className="app-sidebar">
        <div className="sidebar-nav">
          {groups.map(g => (
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
            title="Audit Trail Logs"
          >
            <History className="nav-item-icon" />
            {!isSidebarCollapsed && <span>Audit Trail Logs</span>}
          </button>
        </div>

        {/* Sidebar footer collapse */}
        <div className="sidebar-footer">
          <button className="sidebar-collapse-btn" onClick={toggleSidebar}>
            <Menu size={16} />
            {!isSidebarCollapsed && <span>Collapse Sidebar</span>}
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
                Semantic Search Results
              </h2>
              <p className="section-desc">
                AI-driven Vector search results matching query: <strong>"{searchQuery}"</strong>
              </p>
            </div>

            {searchResults.length > 0 ? (
              <div className="search-results-grid">
                <div className="search-results-meta">
                  Found {searchResults.length} matching configuration settings.
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
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <AlertCircle className="empty-icon" />
                <h3>No settings matched your query</h3>
                <p>Try searching with words like "privacy", "notifications", "alerts", "theme", or "timeout".</p>
              </div>
            )}
          </div>
        ) : showLogs ? (
          // AUDIT TRAIL LOGS INTERFACE
          <div>
            <div className="section-header">
              <h2 className="section-title">
                <History style={{ marginRight: 8 }} /> Configuration Audit Trail
              </h2>
              <p className="section-desc">
                History of configuration and settings updates logged in Mock MongoDB <code>configuration_logs</code>.
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
                        <strong>{log.setting_name}</strong>
                      </span>
                      <div className="log-value-change">
                        <span className="log-old-val">{log.old_value}</span>
                        <span className="log-arrow"><ArrowRight size={12} /></span>
                        <span className="log-new-val">{log.new_value}</span>
                      </div>
                      <div className="log-meta">
                        <span className={`setting-badge ${log.is_system_wide ? 'system-wide' : 'user-specific'}`}>
                          {log.is_system_wide ? 'System' : 'User-specific'}
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
                <h3>No audit logs available</h3>
                <p>Changes will appear here in real-time as configurations are updated.</p>
              </div>
            )}
          </div>
        ) : (
          // CATEGORY DETAILS VIEW
          <div>
            {groups.find(g => g.id === activeGroup) && (
              <div className="section-header">
                <h2 className="section-title">
                  {groups.find(g => g.id === activeGroup).name}
                </h2>
                <p className="section-desc">
                  {groups.find(g => g.id === activeGroup).description}
                </p>
              </div>
            )}

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
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* DETAIL EXPLANATION INFO DIALOG */}
      {activeInfoSetting && (
        <div className="overlay" onClick={() => setActiveInfoSetting(null)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h3 className="dialog-title">{activeInfoSetting.name}</h3>
              <button className="dialog-close" onClick={() => setActiveInfoSetting(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="dialog-body">
              <div>
                <div className="dialog-section-title">Description</div>
                <p>{activeInfoSetting.description}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div className="dialog-section-title">Config Key</div>
                  <code style={{ fontSize: 12 }}>{activeInfoSetting.id}</code>
                </div>
                <div>
                  <div className="dialog-section-title">Scope</div>
                  <span className={`setting-badge ${activeInfoSetting.is_system_wide ? 'system-wide' : 'user-specific'}`}>
                    {activeInfoSetting.is_system_wide ? 'System-wide' : 'User-specific'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div className="dialog-section-title">Data Type</div>
                  <span style={{ textTransform: 'capitalize', fontSize: 13 }}>{activeInfoSetting.type}</span>
                </div>
                <div>
                  <div className="dialog-section-title">Default Value</div>
                  <span style={{ fontSize: 13, fontFamily: 'monospace' }}>{activeInfoSetting.default_value}</span>
                </div>
              </div>
              
              <div className="dialog-insight-box">
                <div className="dialog-section-title" style={{ fontSize: 10, color: 'var(--primary)' }}>Configuration Impact</div>
                <p style={{ fontSize: 12, marginTop: 4 }}>
                  {activeInfoSetting.is_system_wide 
                    ? "Changes to this configuration affect the entire application globally for all users immediately upon submission. Only administrative roles may update this setting." 
                    : "This configuration option is user-specific. Custom values are sandboxed and will only apply to your user session, stored under user preferences."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
  showRelevance
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
            {setting.is_system_wide ? 'System-Wide' : 'User-Specific'}
          </span>

          {isReadOnly && (
            <span className="setting-badge" style={{ background: 'rgba(239, 68, 68, 0.05)', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Lock size={10} /> Read-only
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
          title="Explain configuration options"
        >
          <HelpCircle size={16} />
        </button>
      </div>
    </div>
  );
}

export default App;
