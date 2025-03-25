interface PluginEditTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function PluginEditTabs({
  activeTab,
  onTabChange,
}: PluginEditTabsProps) {
  const tabs = [
    { id: "details", label: "Details" },
    { id: "versions", label: "Versions" },
    { id: "assets", label: "Assets" },
    { id: "localizations", label: "Localizations" },
    { id: "database", label: "Plugin Database" },
    { id: "userDatabase", label: "User Database" },
    { id: "logs", label: "Logs" },
    { id: "analytics", label: "Analytics" },
  ];

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <nav className="flex -mb-px overflow-x-auto hide-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`py-4 px-6 text-sm font-medium whitespace-nowrap ${
              activeTab === tab.id
                ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
