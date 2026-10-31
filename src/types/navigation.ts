export type ModuleId =
  | 'dashboard'
  | 'timetable'
  | 'gaps'
  | 'meals'
  | 'breaks'
  | 'goals'
  | 'insights'
  | 'notifications'
  | 'settings';

export interface NavItem {
  id: ModuleId;
  label: string;
  iconName: string;
  badge?: string | number;
  badgeVariant?: 'forest' | 'rose' | 'gold' | 'blush';
}
