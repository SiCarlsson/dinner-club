// app/i18n/navigation.ts

import { routing } from "./routing";
import { createNavigation } from "next-intl/navigation";

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
