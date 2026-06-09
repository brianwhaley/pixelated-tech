import { BuzzwordBingo } from '@/components/elements/buzzwordbingo';
import { buzzwords } from "@/components/elements/buzzwordbingo.words";
import '@/css/pixelated.global.css';

export default {
	title: 'General/Buzzword Bingo',
	component: BuzzwordBingo
};

export const BuzzwordBingoStory = {
	args: {
		buzzwords: buzzwords
	}
};
