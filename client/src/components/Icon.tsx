import {
  Home,
  Target,
  ListTodo,
  BarChart3,
  Clock,
  Plus,
  Inbox,
  AlertCircle,
  Calendar,
  ScrollText,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit,
  type LucideIcon,
} from 'lucide-react-native';

export type IconName =
  | 'home'
  | 'target'
  | 'list'
  | 'chart'
  | 'clock'
  | 'plus'
  | 'inbox'
  | 'alert'
  | 'calendar'
  | 'scroll'
  | 'x'
  | 'check'
  | 'chevron-left'
  | 'chevron-right'
  | 'trash'
  | 'edit';

const iconMap: Record<IconName, LucideIcon> = {
  home: Home,
  target: Target,
  list: ListTodo,
  chart: BarChart3,
  clock: Clock,
  plus: Plus,
  inbox: Inbox,
  alert: AlertCircle,
  calendar: Calendar,
  scroll: ScrollText,
  x: X,
  check: Check,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  trash: Trash2,
  edit: Edit,
};

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 24, color = '#000', strokeWidth = 2 }: IconProps) {
  const LucideIcon = iconMap[name];

  if (!LucideIcon) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return <LucideIcon size={size} color={color} strokeWidth={strokeWidth} />;
}

export default Icon;
