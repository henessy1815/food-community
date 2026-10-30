import type { ComponentType, SVGProps } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  BatteryFull,
  Bell,
  Bookmark,
  Calendar,
  Camera,
  Car,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  CircleCheck,
  Copy,
  Ellipsis,
  EllipsisVertical,
  ExternalLink,
  Eye,
  EyeOff,
  Funnel,
  Heart,
  House,
  Image,
  ImageOff,
  Info,
  LoaderCircle,
  Lock,
  LogOut,
  MapPin,
  MapPinned,
  Menu,
  MessageCircle,
  Navigation,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Share2,
  Signal,
  Star,
  Trash2,
  TriangleAlert,
  User,
  Utensils,
  Wifi,
  X,
} from "lucide-react";
import {
  BellIcon,
  BookmarkSimpleIcon,
  HouseIcon,
  MapPinIcon,
  UserIcon,
} from "@phosphor-icons/react/ssr";
import type { IconProps as PhosphorIconProps } from "@phosphor-icons/react";

type SvgIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

// design.pen 아이콘 컴포넌트명(icon-{name}-{size}) → 라이브러리 아이콘
const lucideIcons = {
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  "arrow-up": ArrowUp,
  "arrow-down": ArrowDown,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "chevron-up": ChevronUp,
  "chevron-down": ChevronDown,
  home: House,
  calendar: Calendar,
  copy: Copy,
  refresh: RefreshCw,
  logout: LogOut,
  close: X,
  menu: Menu,
  search: Search,
  filter: Funnel,
  sort: ArrowUpDown,
  plus: Plus,
  edit: Pencil,
  delete: Trash2,
  bookmark: Bookmark,
  share: Share2,
  "more-horizontal": Ellipsis,
  "more-vertical": EllipsisVertical,
  check: Check,
  info: Info,
  warning: TriangleAlert,
  error: CircleAlert,
  user: User,
  settings: Settings,
  notification: Bell,
  heart: Heart,
  star: Star,
  comment: MessageCircle,
  image: Image,
  utensils: Utensils,
  car: Car,
  loader: LoaderCircle,
  "map-pin": MapPin,
  "map-pinned": MapPinned,
  navigation: Navigation,
  "external-link": ExternalLink,
  camera: Camera,
  "image-off": ImageOff,
  "check-circle": CircleCheck,
  signal: Signal,
  wifi: Wifi,
  battery: BatteryFull,
  eye: Eye,
  "eye-off": EyeOff,
  lock: Lock,
} satisfies Record<string, SvgIcon>;

// 채움(fill) 아이콘은 디자인에서 phosphor fill 웨이트 사용
const phosphorFillIcons = {
  "home-fill": HouseIcon,
  "map-pin-fill": MapPinIcon,
  "bookmark-fill": BookmarkSimpleIcon,
  "notification-fill": BellIcon,
  "user-fill": UserIcon,
} satisfies Record<string, ComponentType<PhosphorIconProps>>;

export type IconName = keyof typeof lucideIcons | keyof typeof phosphorFillIcons;
export type IconSize = 16 | 20 | 24 | 32;

export const iconNames = [
  ...Object.keys(lucideIcons),
  ...Object.keys(phosphorFillIcons),
] as IconName[];
export const iconSizes: IconSize[] = [16, 20, 24, 32];

export interface IconProps {
  name: IconName;
  size?: IconSize;
  className?: string;
  /** 지정하면 role="img"로 노출, 생략하면 장식용(aria-hidden) */
  label?: string;
}

export function Icon({ name, size = 24, className, label }: IconProps) {
  const a11y = label
    ? { role: "img", "aria-label": label }
    : { "aria-hidden": true as const };
  // 색상은 currentColor — 기본값은 body의 color-text-default를 상속
  const classes = `shrink-0 ${className ?? ""}`.trim();

  if (name in phosphorFillIcons) {
    const Phosphor = phosphorFillIcons[name as keyof typeof phosphorFillIcons];
    return <Phosphor size={size} weight="fill" className={classes} {...a11y} />;
  }

  const Lucide = lucideIcons[name as keyof typeof lucideIcons];
  return <Lucide size={size} className={classes} {...a11y} />;
}
