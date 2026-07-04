"use client";

import React from 'react';
import { PageSection, PageTitleHeader, PageSectionHeader, PageGridItem } from '@pixelated-tech/components';
import { Callout } from '@pixelated-tech/components';
import PropTypes, { InferProps } from 'prop-types';

export default function StudioSpecialsPage() {
	return (
		<>
			<PageSection columns={1} maxWidth="100%" id="studio-specials-section">
				<PageTitleHeader title="The Three Muses of Bluffton Studio Specials" />
			</PageSection>

			<Coupon title="Tiny Toes 2 - 3-Year-Old Class"
				callouts={[
					{
						img: "https://images.ctfassets.net/luf8eony1687/4faykiY64Sz8B6sZsOf3iQ/68caf7415bb67d32b124ae1b03e45443/ThreeMusesFinal-6801.jpg?fm=webp",
						title: "Leotard",
						subtitle: "Prices Vary"
					}, {
						img: "https://images.ctfassets.net/luf8eony1687/3TAlGC5C3ws8LLXvrG1eir/e381f82aa28a2969420a01ace42f07ba/ThreeMusesFinal-6789.jpg?fm=webp", 
						title: "Ballet Shoes", 
						subtitle: "$30.00"
					},{
						img: "https://images.ctfassets.net/luf8eony1687/3w9wVR51rt5clWIXnmdxDa/537b64694da67233480e8563061ad31f/ThreeMusesFinal-6203.jpg?fm=webp",
						title: "Tights", 
						subtitle: "FREE",
						content: "(savings of $11.50)"
					}
				]} 
				notes={[
					"All items are for Capezio Merchandise Only.",
					"Optional Add on For Above Classes : Ballet Sweater, Ballet Bag, Ballet Skirt"
				]}>
			</Coupon>

			<Coupon title="Preschool Class"
				callouts={[
					{
						img: "https://images.ctfassets.net/luf8eony1687/4faykiY64Sz8B6sZsOf3iQ/68caf7415bb67d32b124ae1b03e45443/ThreeMusesFinal-6801.jpg?fm=webp",
						title: "Leotard",
						subtitle: "Prices Vary"
					}, {
						img: "https://images.ctfassets.net/luf8eony1687/3TAlGC5C3ws8LLXvrG1eir/e381f82aa28a2969420a01ace42f07ba/ThreeMusesFinal-6789.jpg?fm=webp", 
						title: "Ballet Shoes", 
						subtitle: "$30.00"
					},{
						img: "https://images.ctfassets.net/luf8eony1687/7qApDugQR5cfqZTi5mocrZ/4dda19935d04bf137493e542b07604f2/ThreeMusesFinal-6511-v2.jpg?fm=webp",
						title: "Tap Shoes", 
						subtitle: "$27 or $37",
						content: "Essential Tap Shoe or Shuffle Tap Shoe", 
					},{
						img: "https://images.ctfassets.net/luf8eony1687/3w9wVR51rt5clWIXnmdxDa/537b64694da67233480e8563061ad31f/ThreeMusesFinal-6203.jpg?fm=webp",
						title: "Tights", 
						subtitle: "FREE",
						content: "(savings of $16.50)"
					}
				]}
				notes={[
					"All items are for Capezio Merchandise Only.",
					"Optional Add on For Above Classes : Ballet Sweater, Ballet Bag, Ballet Skirt"
				]}>
			</Coupon>

			<Coupon title="Ballet for 2nd Grade through 12th Grade"
				callouts={[
					{
						img: "https://images.ctfassets.net/luf8eony1687/4faykiY64Sz8B6sZsOf3iQ/68caf7415bb67d32b124ae1b03e45443/ThreeMusesFinal-6801.jpg?fm=webp",
						title: "Leotard",
						subtitle: "Prices Vary"
					}, {
						img: "https://images.ctfassets.net/luf8eony1687/3TAlGC5C3ws8LLXvrG1eir/e381f82aa28a2969420a01ace42f07ba/ThreeMusesFinal-6789.jpg?fm=webp", 
						title: "Ballet Shoes", 
						subtitle: "$30.00"
					},{
						img: "https://images.ctfassets.net/luf8eony1687/3w9wVR51rt5clWIXnmdxDa/537b64694da67233480e8563061ad31f/ThreeMusesFinal-6203.jpg?fm=webp",
						title: "Tights", 
						subtitle: "FREE",
						content: "(savings of $18.50)"
					}
				]}
				notes={[
					"All items are for Capezio Merchandise Only.",
					"Optional Add on For Above Classes : Ballet Sweater, Ballet Bag, Ballet Skirt"
				]}>
			</Coupon>

			<Coupon title="Combo Classes - up through First Grade"
				callouts={[
					{
						img: "https://images.ctfassets.net/luf8eony1687/4G4Z2bfM9Li0uy5HVJLV3d/107250fcaff018f43b586344f70b7f4d/ThreeMusesFinal-6177.jpg?fm=webp",
						title: "Leotard",
						subtitle: "Prices Vary"
					}, {
						img: "https://images.ctfassets.net/luf8eony1687/3TAlGC5C3ws8LLXvrG1eir/e381f82aa28a2969420a01ace42f07ba/ThreeMusesFinal-6789.jpg?fm=webp", 
						title: "Ballet Shoes", 
						subtitle: "$30.00"
					},{
						img: "https://images.ctfassets.net/luf8eony1687/7qApDugQR5cfqZTi5mocrZ/4dda19935d04bf137493e542b07604f2/ThreeMusesFinal-6511-v2.jpg?fm=webp",
						title: "Jazz or Tap Shoes", 
						subtitle: "$27 - $52"
					},{
						img: "https://images.ctfassets.net/luf8eony1687/3w9wVR51rt5clWIXnmdxDa/537b64694da67233480e8563061ad31f/ThreeMusesFinal-6203.jpg?fm=webp",
						title: "Tights", 
						subtitle: "$16.50"
					}
				]}
				notes={[
					"DISCOUNT 10% OF TOTAL PURCHASE",
					"All items are for Capezio Merchandise Only.",
					"Optional Add on For Above Classes : Ballet Sweater, Ballet Bag, Ballet Skirt",
					"If any add on is purchased it will be included in the combo classes discount."
				]}>
			</Coupon>

			<Coupon title="Combo Class for 2nd Grade through 12th Grade"
				callouts={[
					{
						img: "https://images.ctfassets.net/luf8eony1687/4G4Z2bfM9Li0uy5HVJLV3d/107250fcaff018f43b586344f70b7f4d/ThreeMusesFinal-6177.jpg?fm=webp",
						title: "Leotard",
						subtitle: "Prices Vary"
					}, {
						img: "https://images.ctfassets.net/luf8eony1687/3TAlGC5C3ws8LLXvrG1eir/e381f82aa28a2969420a01ace42f07ba/ThreeMusesFinal-6789.jpg?fm=webp", 
						title: "Ballet Shoes", 
						subtitle: "$30.00"
					},{
						img: "https://images.ctfassets.net/luf8eony1687/7qApDugQR5cfqZTi5mocrZ/4dda19935d04bf137493e542b07604f2/ThreeMusesFinal-6511-v2.jpg?fm=webp",
						title: "Tap Shoes", 
						subtitle: "$48 - $99"
					},{
						img: "https://images.ctfassets.net/luf8eony1687/2o5J6PWPmMzedRVfk9UlMS/9750dc0e318468c74bcb9651f2df2d37/ThreeMusesFinal-6512-v2.jpg?fm=webp",
						title: "Jazz Shoes", 
						subtitle: "$52.00"
					},{
						img: "https://images.ctfassets.net/luf8eony1687/3w9wVR51rt5clWIXnmdxDa/537b64694da67233480e8563061ad31f/ThreeMusesFinal-6203.jpg?fm=webp",
						title: "Tights", 
						subtitle: "$18.50 x 2 pairs"
					}
				]}
				notes={[
					"DISCOUNT 20% OF TOTAL PURCHASE",
					"All items are for Capezio Merchandise Only.",
					"Optional Add on For Above Classes : Ballet Sweater, Ballet Bag, Ballet Skirt",
					"If any add on is purchased it will be included in the combo classes discount."
				]}>
			</Coupon>

		</>
	);
}




/**
 * Coupon component for displaying a coupon with a title, column count, and children elements.
 *
 * @param {Object} props - The props for the Coupon component.
 * @param {string} props.title - The title of the coupon.
 * @param {number} props.columCount - The number of columns for the coupon layout.
 * @param {Array<Object>} props.callouts - The array of callout objects for the coupon.
 * @param {Array<string>} props.notes - The array of notes for the coupon.
 * @param {React.ReactNode} props.children - The children elements to be rendered inside the coupon.
 * 
 * @returns {JSX.Element} The rendered Coupon component.
 */
Coupon.propTypes = {
	title: PropTypes.string,
	columCount: PropTypes.number,
	callouts: PropTypes.arrayOf(PropTypes.object),
	notes: PropTypes.arrayOf(PropTypes.string),
	children: PropTypes.node
};
type CouponProps = InferProps<typeof Coupon.propTypes>;
function Coupon(props: CouponProps) {
	const { title, columCount, callouts, notes, children } = props;
	
	return (
		<PageSection columns={columCount || callouts?.length} maxWidth="768px" id="coupon-section" 
			className="coupon-section" >
			<PageGridItem columnStart={1} columnEnd={-1}>
				<PageSectionHeader title={title} />
			</PageGridItem>
			{callouts && callouts.map((callout, index) => (
				<PageGridItem key={index}>
					<Callout variant="grid" layout="vertical" imgShape="round" {...callout} />
				</PageGridItem>
			))}

			<PageGridItem columnStart={1} columnEnd={-1}>
				{notes && notes.map((note, index) => (
					<li key={index} className="coupon-note">{note}</li>
				))}
			</PageGridItem>
			{children}
		</PageSection>
	);
}