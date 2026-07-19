/*
 * PROTOTYPE — snippet players for the Music subpage (wayfinder #27).
 * Owns the album-shelf slot on /music so variant D can swap the shelf itself.
 * Variants via `?variant=`:
 *   a — real shelf + iTunes 30s preview custom audio player below
 *   b — real shelf + visible YouTube "watch this moment" embeds below
 *   c — real shelf + hybrid (audio rows + expandable exact-moment video)
 *   d — the shelf grid ITSELF hosts the player: clicking a badged cover
 *       swaps a 2x2 block for the YouTube embed
 * Without the param (and on `off`) it renders the untouched AlbumShelf —
 * the same tree PersonalPanel rendered before this prototype existed.
 */
import type { Album } from "../../../../data/personal";
import { AlbumShelf } from "../AlbumShelf";
import { GridEmbedPrototype } from "./GridEmbedPrototype";
import { HybridPrototype } from "./HybridPrototype";
import { ItunesPreviewPrototype } from "./ItunesPreviewPrototype";
import { PrototypeSwitcher } from "./PrototypeSwitcher";
import { usePrototypeVariant } from "./usePrototypeVariant";
import { YoutubeMomentsPrototype } from "./YoutubeMomentsPrototype";

export function SnippetPlayersPrototype({
	albums,
	active,
}: {
	albums: Album[];
	active: boolean;
}) {
	const [variant, setVariant] = usePrototypeVariant();

	if (variant === null) return <AlbumShelf albums={albums} active={active} />;

	return (
		<>
			{variant === "d" ? (
				<GridEmbedPrototype albums={albums} active={active} />
			) : (
				<AlbumShelf albums={albums} active={active} />
			)}
			{variant === "a" && <ItunesPreviewPrototype />}
			{variant === "b" && <YoutubeMomentsPrototype />}
			{variant === "c" && <HybridPrototype />}
			<PrototypeSwitcher variant={variant} onChange={setVariant} />
		</>
	);
}
