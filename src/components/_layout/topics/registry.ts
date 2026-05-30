import type { ComponentType } from "react";
import type { TopicId } from "../../../data/topics";
import { AIContent } from "./AIContent";
import { CareerContent } from "./CareerContent";
import { CodingContent } from "./CodingContent";
import { FamilyContent } from "./FamilyContent";
import { FinanceContent } from "./FinanceContent";
import { GamesContent } from "./GamesContent";
import { MoviesTvContent } from "./MoviesTvContent";
import { MusicContent } from "./MusicContent";
import type { TopicContentProps } from "./primitives";
import { TechStackContent } from "./TechStackContent";
import { TravelContent } from "./TravelContent";

/*
 * Per-topic content components. Topics not in this map fall back to the
 * generic teaser-string rendering inside CurrentBlock. As topics diverge,
 * promote them here with their own component.
 */
export const TOPIC_CONTENTS: Partial<
	Record<TopicId, ComponentType<TopicContentProps>>
> = {
	coding: CodingContent,
	career: CareerContent,
	ai: AIContent,
	"tech-stack": TechStackContent,
	finance: FinanceContent,
	family: FamilyContent,
	travel: TravelContent,
	"movies-tv": MoviesTvContent,
	games: GamesContent,
	music: MusicContent,
};
