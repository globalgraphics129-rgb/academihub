import 'react'

declare module 'lucide-react' {
  interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: number | string
    color?: string
    strokeWidth?: number | string
    absoluteStrokeWidth?: boolean
  }
  type Icon = React.FC<IconProps>
  export const GraduationCap: Icon
  export const BookOpen: Icon
  export const ChevronRight: Icon
  export const ChevronLeft: Icon
  export const Menu: Icon
  export const X: Icon
  export const Users: Icon
  export const UserPlus: Icon
  export const LogIn: Icon
  export const LogOut: Icon
  export const Sun: Icon
  export const Moon: Icon
  export const Bell: Icon
  export const Settings: Icon
  export const Home: Icon
  export const ArrowRight: Icon
  export const ArrowLeft: Icon
  export const ExternalLink: Icon
  export const CheckCircle: Icon
  export const AlertTriangle: Icon
  export const ShieldAlert: Icon
  export const Search: Icon
  export const LayoutDashboard: Icon
  export const Building2: Icon
  export const ClipboardList: Icon
  export const Send: Icon
  export const BarChart3: Icon
  export const Timer: Icon
  export const Plus: Icon
  export const Trash2: Icon
  export const Edit: Icon
  export const Download: Icon
  export const RefreshCw: Icon
  export const Github: Icon
  export const Mail: Icon
  export const Phone: Icon
  export const Globe: Icon
  export const User: Icon
  export const Users2: Icon
  export const Sparkles: Icon
  export const Loader2: Icon
  export const Check: Icon
  export const FileText: Icon
  export const FolderOpen: Icon
  export const Link: Icon
  export const Bot: Icon
  export const MessageSquare: Icon
  export const PanelRightClose: Icon
  export const PanelRightOpen: Icon
  export const Calendar: Icon
  export const Clock: Icon
  export const Eye: Icon
  export const EyeOff: Icon
  export const Lock: Icon
  export const Unlock: Icon
  export const List: Icon
  export const Grid3X3: Icon
  export const Star: Icon
  export const Package: Icon
  export const ChevronDown: Icon
  export const TriangleAlert: Icon
  export const Flag: Icon
  export const XCircle: Icon
  export const CircleX: Icon
  export const KeyRound: Icon
  export const ArrowRightFromLine: Icon
  export const ArrowLeftFromLine: Icon
}
