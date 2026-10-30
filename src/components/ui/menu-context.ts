import { createContext } from "react";
import type { MenuItemSize } from "./MenuItem";

export const MenuContext = createContext<{ size: MenuItemSize; close: () => void } | null>(null);
