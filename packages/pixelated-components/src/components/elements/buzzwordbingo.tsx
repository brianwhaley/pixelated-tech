'use client';

import React, { useState, useEffect } from 'react';
import PropTypes, { InferProps } from 'prop-types';
import "../../css/pixelated.grid.scss";
import './buzzwordbingo.css';
import { buzzwords as defaultBuzzwords } from './buzzwordbingo.words';

/**
 * BuzzwordBingo — renders a bingo-style card populated with provided buzzwords (defaults to config or internal list).
 *
 * @param {array} [props.buzzwords] - Array of words (strings) used to populate the bingo card; uses config or default list when omitted.
 * 
 * @returns A styled bingo card component with headers B I N G O and buzzwords in the cells, including a "FREE SPACE" in the center.
 */
BuzzwordBingo.propTypes = {
	/** List of buzzwords used to populate the bingo card. */
	buzzwords: PropTypes.array,
};
export type BuzzwordBingoType = InferProps<typeof BuzzwordBingo.propTypes>;
export function BuzzwordBingo(props: BuzzwordBingoType) {
	const buzzwords = props.buzzwords || defaultBuzzwords;
	const myBingoHeaders = ["B", "I", "N", "G", "O"];
	const [bingoWords, setBingoWords] = useState<string[]>([]);
	useEffect(() => {
		const shuffled = [...buzzwords].sort(() => Math.random() - 0.5);
		const selection = shuffled.slice(0, 24);
		selection.splice(12, 0, 'FREE SPACE');
		setBingoWords(selection);
	}, [buzzwords]);
	return (
		<div className="bingo-card rowfix-5col">
			{ myBingoHeaders.map((word) => (
				<BingoHeader word={word} key={word} />
			))}
			{ bingoWords.map((word) => (
				<BingoBox word={word} key={word} /> 
			))}
		</div>
	);
}



/**
 * BingoHeader — renders a single header cell for the bingo card (letters B I N G O).
 * 
 * @param {string} word - The header letter to display (e.g., 'B', 'I', 'N', 'G', 'O').
 * @returns A styled div element representing the bingo header cell.
 */
BingoHeader.propTypes = {
	word: PropTypes.string.isRequired,
};
type BingoHeaderType = InferProps<typeof BingoHeader.propTypes>;
function BingoHeader({ word }: BingoHeaderType) {
	return (
		<div className="bingo-header grid-item">
			<div className="bingo-box-text">
				{word}
			</div>
		</div>
	);
} 



/**
 * BingoBox — renders an individual bingo cell (word or 'FREE SPACE').
 * @param {string} word - The word to display in the bingo cell; if 'FREE SPACE', applies special styling.
 * @returns A styled div element representing a bingo cell, with conditional styling for 'FREE SPACE'.
 */
BingoBox.propTypes = {
	word: PropTypes.string.isRequired,
};
type BingoBoxType = InferProps<typeof BingoBox.propTypes>;
function BingoBox({ word }: BingoBoxType) {
	return (
		<div className="bingo-box grid-item">
			<div className={(word == "FREE SPACE") ? "bingo-box-free-space bingo-box-free-space bingoBoxFreeSpace" : "bingo-box-text bingo-box-text bingoBoxText" }>
				{word}
			</div>
		</div>
	);
}


