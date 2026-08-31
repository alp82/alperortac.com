import {
	SiAngular,
	SiConvex,
	SiCoolify,
	SiCratedb,
	SiCss,
	SiD3,
	SiDelphi,
	SiGrafana,
	SiGraphql,
	SiHetzner,
	SiHtml5,
	SiIcq,
	SiJavascript,
	SiKubernetes,
	SiMongodb,
	SiMysql,
	SiNamecheap,
	SiOpenjdk,
	SiPhp,
	SiPostgresql,
	SiPosthog,
	SiPython,
	SiReact,
	SiRedis,
	SiRedux,
	SiRust,
	SiTailwindcss,
	SiTanstack,
	SiTypescript,
	SiVuedotjs,
} from "@icons-pack/react-simple-icons";
import { Cpu, Orbit, Wind } from "lucide-react";
import type { ComponentType } from "react";

/*
 * Rack-rail icons for the coding subpage, keyed by the tool names in
 * `src/data/coding.ts` (TOOL_GROUP). Real simple-icons marks where one
 * exists; Windmill and SpacetimeDB keep the lucide stand-ins the Tech Stack
 * band used (Wind / Orbit); everything without a mark anywhere (the pre-web
 * era, mostly) falls back to the generic chip glyph.
 */

type IconComponent = ComponentType<{ className?: string }>;

const TOOL_ICONS: Record<string, IconComponent> = {
	Delphi: SiDelphi,
	JavaScript: SiJavascript,
	PHP: SiPhp,
	Java: SiOpenjdk,
	TypeScript: SiTypescript,
	Python: SiPython,
	Rust: SiRust,
	HTML: SiHtml5,
	CSS: SiCss,
	Tailwind: SiTailwindcss,
	Angular: SiAngular,
	"Vue.js": SiVuedotjs,
	React: SiReact,
	Redux: SiRedux,
	"Tanstack Start": SiTanstack,
	GraphQL: SiGraphql,
	D3: SiD3,
	MySQL: SiMysql,
	PostgreSQL: SiPostgresql,
	MongoDB: SiMongodb,
	Redis: SiRedis,
	CrateDB: SiCratedb,
	Convex: SiConvex,
	Kubernetes: SiKubernetes,
	Hetzner: SiHetzner,
	Coolify: SiCoolify,
	Posthog: SiPosthog,
	Grafana: SiGrafana,
	Namecheap: SiNamecheap,
	ICQ: SiIcq,
	Windmill: Wind,
	SpacetimeDB: Orbit,
};

export function toolIcon(name: string): IconComponent {
	return TOOL_ICONS[name] ?? Cpu;
}
