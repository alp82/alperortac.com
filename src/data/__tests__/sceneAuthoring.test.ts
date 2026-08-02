import { describe, expect, it } from "vitest";
import {
	BIRD_SPECIES_KEYS,
	CLOUD_TYPE_KEYS,
	CLOUDSCAPE,
	FIREFLY_GROUP_KEYS,
	MIST,
	MIST_GROUP_KEYS,
	poolSize,
} from "../scene";
import {
	DRAG_SNAP,
	emitSceneSource,
	round3,
	SCENE_ROWS,
	snapTo,
} from "../sceneAuthoring";

describe("scene authoring rows", () => {
	it("covers every schedulable unit of the shipped cast", () => {
		// 5 cloud types + 3 bird species + 3 mist groups + 3 firefly groups + stars.
		expect(SCENE_ROWS).toHaveLength(
			CLOUD_TYPE_KEYS.length +
				BIRD_SPECIES_KEYS.length +
				MIST_GROUP_KEYS.length +
				FIREFLY_GROUP_KEYS.length +
				1,
		);
		const keys = SCENE_ROWS.map((r) => r.key);
		expect(new Set(keys).size).toBe(keys.length);
	});

	it("edits the real schedule tables in place", () => {
		const row = SCENE_ROWS.find((r) => r.key === "clouds.cirrus");
		if (!row?.alpha) throw new Error("cirrus row must carry alpha");
		const committed = CLOUDSCAPE.types.cirrus.alpha;
		row.alpha.set(0.5);
		expect(CLOUDSCAPE.types.cirrus.alpha).toBe(0.5);
		row.alpha.set(committed);

		const win = row.windows()[0];
		if (!win) throw new Error("cirrus row must expose its window");
		const start = win.start;
		win.start = 0.2;
		expect(CLOUDSCAPE.types.cirrus.window.start).toBe(0.2);
		win.start = start;
	});

	it("mist rows expose the live windows[] with add/remove", () => {
		const row = SCENE_ROWS.find((r) => r.key === "mist.far");
		if (!row?.addWindow || !row.removeWindow)
			throw new Error("mist rows must support window add/remove");
		const before = MIST.groups.far.windows.length;
		row.addWindow();
		expect(MIST.groups.far.windows.length).toBe(before + 1);
		row.removeWindow(before);
		expect(MIST.groups.far.windows.length).toBe(before);
	});

	it("fireflies carry no alpha (the emitter exemption owns opacity)", () => {
		for (const key of FIREFLY_GROUP_KEYS) {
			const row = SCENE_ROWS.find((r) => r.key === `fireflies.${key}`);
			expect(row?.alpha).toBeUndefined();
		}
	});

	it("count ceilings match the rendered pools", () => {
		for (const key of CLOUD_TYPE_KEYS) {
			const row = SCENE_ROWS.find((r) => r.key === `clouds.${key}`);
			expect(row?.count.ceiling).toBe(poolSize(CLOUDSCAPE.types[key].count));
		}
	});

	it("stars presence is derived, never authored", () => {
		const row = SCENE_ROWS.find((r) => r.key === "stars.stars");
		expect(row?.derived).toBe(true);
		expect(row?.windows()).toHaveLength(0);
	});
});

describe("quantization", () => {
	it("snaps drag values to the 0.005 grid", () => {
		// The exact leak from the first #63 round-trip.
		expect(snapTo(0.7750618811881188)).toBeCloseTo(0.775, 10);
		expect(snapTo(0.1234)).toBeCloseTo(0.125, 10);
		expect(DRAG_SNAP).toBe(0.005);
	});

	it("rounds emitted values to 3 decimals", () => {
		expect(round3(0.7750618811881188)).toBe(0.775);
		expect(round3(1)).toBe(1);
	});
});

describe("emit", () => {
	it("prints one block per row, at its home path", () => {
		const src = emitSceneSource();
		for (const row of SCENE_ROWS) {
			expect(src).toContain(`// ${row.home}`);
		}
	});

	it("uses window for single-window members and windows for windows[]", () => {
		const src = emitSceneSource();
		const cirrus = src.split("// CLOUDSCAPE.types.cirrus")[1]?.split("//")[0];
		expect(cirrus).toContain("window: {");
		const far = src.split("// MIST.groups.far")[1]?.split("//")[0];
		expect(far).toContain("windows: [");
	});

	it("emits quantized values, never raw drag floats", () => {
		const w = CLOUDSCAPE.types.cirrus.window;
		const committed = w.start;
		w.start = 0.7750618811881188;
		const src = emitSceneSource();
		w.start = committed;
		expect(src).toContain("start: 0.775");
		expect(src).not.toContain("0.7750618811881188");
	});

	it("emits no window line for stars and no alpha for fireflies", () => {
		const src = emitSceneSource();
		const stars = src.split("// SCENE.stars")[1] ?? "";
		expect(stars).not.toContain("window");
		const ff = src.split("// FIREFLIES.groups.far")[1]?.split("//")[0] ?? "";
		expect(ff).not.toContain("alpha");
	});
});
