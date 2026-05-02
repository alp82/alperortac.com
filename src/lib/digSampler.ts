/**
 * Stride-sampled cleared-percentage estimator for the dig canvas.
 *
 * We only inspect every `stride`-th pixel along both axes (default 8)
 * and only read the alpha channel. Because the canvas starts opaque
 * and `globalCompositeOperation = "destination-out"` punches alpha
 * down to zero, "cleared" means alpha < 8.
 *
 * The function early-exits as soon as the running cleared count
 * crosses 50% of the sample budget - we never need a more precise
 * answer than "more than half", and bailing early keeps the per-frame
 * cost flat as the dig progresses.
 *
 * Returns a value in `[0, 1]`.
 */
export function sampleClearedPct(
	ctx: CanvasRenderingContext2D,
	w: number,
	h: number,
	stride: number = 8,
): number {
	if (w <= 0 || h <= 0) return 0;
	const safeStride = Math.max(1, Math.floor(stride));

	const data = ctx.getImageData(0, 0, w, h).data;
	const xs = Math.max(1, Math.ceil(w / safeStride));
	const ys = Math.max(1, Math.ceil(h / safeStride));
	const total = xs * ys;
	const halfThreshold = Math.ceil(total * 0.5);

	let cleared = 0;
	for (let y = 0; y < h; y += safeStride) {
		const rowStart = y * w;
		for (let x = 0; x < w; x += safeStride) {
			// Alpha channel is index +3 in the RGBA tuple.
			const alphaIndex = (rowStart + x) * 4 + 3;
			const alpha = data[alphaIndex] ?? 0;
			if (alpha < 8) {
				cleared++;
				if (cleared >= halfThreshold) {
					return cleared / total;
				}
			}
		}
	}

	return cleared / total;
}
