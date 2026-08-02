// The scene-authoring panel's model (wayfinder #63, built on #88): one row per
// schedulable unit of the shipped cast, over the REAL structures the schedule
// landed in (#64's note: the single SCENE table fits single-pool members only,
// so clouds/birds/mist/fireflies fan into their own typed tables).
//
// A row edits its tables IN PLACE - the driver (computeJourney) reads them
// fresh every frame, so a mutation plus one journey.applyAt IS the session
// state. Nothing persists: scene.ts stays the source of truth and a reload
// returns to the committed values (the no-persistence rule).
//
// Scope is the schedule vocabulary only - windows, count, alpha. Geometry
// (bands, depths, sprites, speeds) is design locked by the prototypes and the
// element pools are rendered once at page load, so a count above a row's
// ceiling activates nothing until the seed is committed and the page reloads.

import {
	BIRD_SPECIES_KEYS,
	BIRDS,
	CLOUD_TYPE_KEYS,
	CLOUDSCAPE,
	FIREFLIES,
	FIREFLY_GROUP_KEYS,
	MIST,
	MIST_GROUP_KEYS,
	poolSize,
	SCENE,
	type SceneWindow,
	type Track,
} from "./scene";

/** Board drags snap here; raw drag floats leaked into the first emit (#63). */
export const DRAG_SNAP = 0.005;
/** A window can never be dragged narrower than this. */
export const MIN_WINDOW_SPAN = 0.02;

export function snapTo(v: number, step: number = DRAG_SNAP): number {
	return Math.round(v / step) * step;
}

/** Emit quantization (#63): authored values read like a human wrote them. */
export function round3(v: number): number {
	return Number(v.toFixed(3));
}

export type SceneRowGroup = "clouds" | "birds" | "mist" | "fireflies" | "stars";

export type SceneRow = {
	/** unique row id, "<group>.<label>" */
	key: string;
	label: string;
	group: SceneRowGroup;
	/** where the values live in scene.ts - the emit header and paste target */
	home: string;
	/** live window objects: editing a field mutates the schedule table */
	windows: () => SceneWindow[];
	/** present only where the member's schedule holds windows[] (mist, fireflies) */
	addWindow?: () => void;
	removeWindow?: (i: number) => void;
	count: {
		/** the field's name in scene.ts (count / flights) */
		field: string;
		get: () => Track;
		set: (t: Track) => void;
		/** true where the driver evaluates a stops track (trackAt) */
		trackable: boolean;
		/** rendered pool size, fixed at page load - higher counts stay inert */
		ceiling: number;
	};
	/** the row's opacity instrument; absent where markup owns it (fireflies) */
	alpha?: {
		get: () => number;
		set: (v: number) => void;
	};
	/** stars: presence derives from the sky curve, the board shows it read-only */
	derived?: boolean;
};

// Built once at module load, like the element pools, so every ceiling reflects
// what the page actually rendered.
function buildRows(): SceneRow[] {
	const rows: SceneRow[] = [];

	for (const key of CLOUD_TYPE_KEYS) {
		const t = CLOUDSCAPE.types[key];
		rows.push({
			key: `clouds.${key}`,
			label: key,
			group: "clouds",
			home: `CLOUDSCAPE.types.${key}`,
			windows: () => [t.window],
			count: {
				field: "count",
				get: () => t.count,
				set: (v) => {
					t.count = typeof v === "number" ? [v] : v;
				},
				trackable: true,
				ceiling: poolSize(t.count),
			},
			alpha: {
				get: () => t.alpha,
				set: (v) => {
					t.alpha = v;
				},
			},
		});
	}

	for (const key of BIRD_SPECIES_KEYS) {
		const sp = BIRDS[key];
		rows.push({
			key: `birds.${key}`,
			label: key,
			group: "birds",
			home: `BIRDS.${key}`,
			windows: () => [sp.window],
			count: {
				field: "flights",
				get: () => sp.flights,
				set: (v) => {
					sp.flights = typeof v === "number" ? v : (v[0] ?? sp.flights);
				},
				trackable: false,
				ceiling: sp.flights,
			},
			alpha: {
				get: () => sp.alpha,
				set: (v) => {
					sp.alpha = v;
				},
			},
		});
	}

	for (const key of MIST_GROUP_KEYS) {
		const g = MIST.groups[key];
		rows.push({
			key: `mist.${key}`,
			label: key,
			group: "mist",
			home: `MIST.groups.${key}`,
			windows: () => g.windows,
			addWindow: () => {
				g.windows.push({ start: 0.5, rampIn: 0.05, end: 0.7, rampOut: 0.05 });
			},
			removeWindow: (i) => {
				if (g.windows.length > 1) g.windows.splice(i, 1);
			},
			count: {
				field: "count",
				get: () => g.count,
				set: (v) => {
					g.count = typeof v === "number" ? v : (v[0] ?? g.count);
				},
				trackable: false,
				ceiling: g.count,
			},
			alpha: {
				get: () => g.alpha,
				set: (v) => {
					g.alpha = v;
				},
			},
		});
	}

	for (const key of FIREFLY_GROUP_KEYS) {
		const g = FIREFLIES.groups[key];
		rows.push({
			key: `fireflies.${key}`,
			label: key,
			group: "fireflies",
			home: `FIREFLIES.groups.${key}`,
			windows: () => g.windows,
			addWindow: () => {
				g.windows.push({ start: 0.5, rampIn: 0.05, end: 0.8, rampOut: 0.05 });
			},
			removeWindow: (i) => {
				if (g.windows.length > 1) g.windows.splice(i, 1);
			},
			count: {
				field: "count",
				get: () => g.count,
				set: (v) => {
					g.count = typeof v === "number" ? [v] : v;
				},
				trackable: true,
				ceiling: poolSize(g.count),
			},
			// No alpha: the warm colour and the `dim` afterglow are fixed markup
			// (the emitter exemption, #81) - the driver writes no opacity ceiling.
		});
	}

	rows.push({
		key: "stars.stars",
		label: "stars",
		group: "stars",
		home: "SCENE.stars",
		// Presence is the driver's starsO ramp across phase2 (the sky curve is
		// tunable at runtime, so the window is derived, never authored here).
		windows: () => [],
		count: {
			field: "count",
			get: () => SCENE.stars.count,
			set: (v) => {
				SCENE.stars.count = typeof v === "number" ? [v] : v;
			},
			trackable: true,
			ceiling: poolSize(SCENE.stars.count),
		},
		derived: true,
	});

	return rows;
}

export const SCENE_ROWS: SceneRow[] = buildRows();

export const SCENE_ROW_GROUPS: SceneRowGroup[] = [
	"clouds",
	"birds",
	"mist",
	"fireflies",
	"stars",
];

// ---------------------------------------------------------------------------
// Emit (#63): the one-shot committed form. Tune in session, emit once, copy,
// paste each block over the matching fields in scene.ts, commit.
// ---------------------------------------------------------------------------

function fmtWindow(w: SceneWindow): string {
	return `{ start: ${round3(w.start)}, rampIn: ${round3(w.rampIn)}, end: ${round3(w.end)}, rampOut: ${round3(w.rampOut)} }`;
}

function fmtTrack(t: Track): string {
	if (typeof t === "number") return String(round3(t));
	return `[${t.map(round3).join(", ")}]`;
}

/**
 * The committed literal for every row's schedule fields, grouped by their home
 * in scene.ts. Only the schedule vocabulary is emitted - geometry fields stay
 * exactly as authored, so a block pastes over the matching lines and nothing
 * else moves.
 */
export function emitSceneSource(): string {
	let out = `// Scene schedule - session values from the authoring panel (?scene).\n`;
	out += `// Paste each block over the matching fields in src/data/scene.ts.\n`;
	for (const row of SCENE_ROWS) {
		out += `\n// ${row.home}\n`;
		const wins = row.windows();
		if (wins.length === 1 && wins[0]) {
			const field = row.addWindow ? "windows" : "window";
			const body = fmtWindow(wins[0]);
			out +=
				field === "windows" ? `windows: [${body}],\n` : `window: ${body},\n`;
		} else if (wins.length > 1) {
			out += `windows: [\n${wins.map((w) => `\t${fmtWindow(w)},`).join("\n")}\n],\n`;
		}
		out += `${row.count.field}: ${fmtTrack(row.count.get())},\n`;
		if (row.alpha) out += `alpha: ${round3(row.alpha.get())},\n`;
	}
	return out;
}
