'use client';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  type?: 'underline' | 'pill';
  children?: React.ReactNode;
}

export function Tabs({ tabs, active, onChange, type = 'underline', children }: TabsProps) {
  return (
    <div className="hr-tabs-container">
      <div className={type === 'pill' ? 'hr-tabs-pill' : 'hr-tabs-underline'} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => onChange(tab.id)}
            className={`hr-tab-btn ${active === tab.id ? 'active' : ''}`.trim()}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && <span className="tab-count">{tab.count}</span>}
          </button>
        ))}
      </div>
      {children && <div className="hr-tabs-content">{children}</div>}
    </div>
  );
}
