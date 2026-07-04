"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import PropTypes, { InferProps } from 'prop-types';
import type { CheckoutType } from './shoppingcart.functions';
import { addToShoppingCart } from './shoppingcart.functions';
import { AddToCartButton, ViewItemDetails } from './shoppingcart.components';
import { FormButton } from '../sitebuilder/form/formcomponents';
import { usePixelatedConfig } from '../config/config.client';
import { Callout, type CalloutType } from '../structure/callout';
import { PageSection, PageGridItem, PageTitleHeader, PageSectionHeader } from '../structure/page-blocks';
import { SmartImage } from '../elements/smartimage';
import { Carousel } from '../structure/carousel';
import { buildSquareStoreFilters, matchesSquareStorePriceRange, SquarePaymentError, getSquarePaymentErrorMessage, SquareStoreItemShape, type SquareStoreItemShapeType, SquareStoreFilter, SquareStoreFilters, SquareStoreFilterValue, SquareFilterValues } from './square';
import { ProductSchema, SchemaEvent } from '../foundation/schema';
import { sanitizeString, normalizeEmail } from '../foundation/utilities';
import "./square.css";


function buildSquareProductSchema(item: SquareStoreItemShapeType) {
	const images = item.itemImageURLs?.filter((image): image is string => typeof image === 'string') ?? [];
	const productImages = images.length > 0 ? images : item.itemImageURL ? [item.itemImageURL] : undefined;

	return {
		'@context': 'https://schema.org',
		'@type': 'Product',
		name: item.itemTitle,
		description: item.itemDescription || item.itemTitle,
		image: productImages,
		url: item.itemURL,
		sku: item.itemSKU || item.itemID,
		offers: {
			'@type': 'Offer',
			url: item.itemURL,
			priceCurrency: item.itemCurrency ?? 'USD',
			price: item.itemPrice,
			availability: item.itemInventory > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
		},
	};
}

const SQUARE_PRODUCTION_SCRIPT_URL = 'https://web.squarecdn.com/v1/square.js';
const SQUARE_SANDBOX_SCRIPT_URL = 'https://sandbox.web.squarecdn.com/v1/square.js';

function isScriptSrc(scriptSrc: string) {
	const scripts = document.querySelectorAll<HTMLScriptElement>('script[src]');
	for (let i = 0; i < scripts.length; i++) {
		if (scripts[i].src.includes(scriptSrc)) {
			return true;
		}
	}
	return false;
}

function isSandboxSquare(squareConfig: any, checkoutData?: CheckoutType) {
	const checkoutEmail = normalizeEmail(checkoutData?.shippingTo?.email);
	const sandboxEmails = Array.isArray(squareConfig?.sandboxSquareEmails)
		? squareConfig.sandboxSquareEmails.map((value: any) => normalizeEmail(value))
		: [];
	const explicitSandbox = squareConfig?.environment === 'sandbox';
	return explicitSandbox || Boolean(checkoutEmail && sandboxEmails.includes(checkoutEmail));
}

function getSquareScriptUrl(applicationId?: string, squareConfig?: any, checkoutData?: CheckoutType) {
	if (squareConfig) {
		const useSandbox = isSandboxSquare(squareConfig, checkoutData);
		return useSandbox
			? squareConfig?.sandboxSquareScriptUrl || SQUARE_SANDBOX_SCRIPT_URL
			: squareConfig?.squareScriptUrl || SQUARE_PRODUCTION_SCRIPT_URL;
	}

	return applicationId?.startsWith('sandbox-')
		? SQUARE_SANDBOX_SCRIPT_URL
		: SQUARE_PRODUCTION_SCRIPT_URL;
}

function loadSquareScript(src: string) {
	return new Promise<void>((resolve, reject) => {
		if (isScriptSrc(src) && (window as any).Square) {
			resolve();
			return;
		}

		const script = document.createElement('script');
		script.src = src;
		script.async = true;
		script.onload = () => {
			resolve();
		};
		script.onerror = () => {
			reject(new Error('Failed to load Square Payments SDK.'));
		};
		document.head.appendChild(script);
	});
}


/**
 * SquareCheckout component renders a Square payment form for the shopping cart. It requires the Square application ID, location ID, checkout data, and an onApprove callback function as props. The component will load the Square Payments SDK, render the card input form, and handle the payment process when the user clicks the pay button.
 * 
 * @param: applicationId - The application ID for the Square application, used to authenticate API requests.
 * @param: locationId - The location ID for the Square account, used to specify the location for the transaction.
 * @param: checkoutData - An object containing the details of the checkout, such as total amount, currency, and shipping information.
 * @param: onApprove - A callback function that will be called when the payment is approved by the user. It receives the payment details as an argument.
 * @returns: A React component that renders the Square payment form and handles the payment process.
 */
SquareCheckout.propTypes = {
	applicationId: PropTypes.string.isRequired,
	locationId: PropTypes.string.isRequired,
	checkoutData: PropTypes.object.isRequired,
	onApprove: PropTypes.func.isRequired,
	onSquarePaymentCapture: PropTypes.func,
};
export type SquareCheckoutType = InferProps<typeof SquareCheckout.propTypes> & { checkoutData: CheckoutType };
export function SquareCheckout(props: SquareCheckoutType) {
	const config = usePixelatedConfig();
	const squareConfig = config?.integrations?.square;
	const [card, setCard] = useState<any>(null);
	const [initialized, setInitialized] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	useEffect(() => {
		let active = true;

		async function initializeSquare() {
			if (!props.applicationId || !props.locationId) {
				return;
			}

			try {
				const squareScriptUrl = getSquareScriptUrl(props.applicationId, squareConfig, props.checkoutData);
				await loadSquareScript(squareScriptUrl);
				if (!active) return;

				const Square = (window as any).Square;
				if (!Square || typeof Square.payments !== 'function') {
					throw new Error('Square Payments SDK failed to initialize.');
				}

				const payments = await Square.payments(props.applicationId, props.locationId);
				const cardInput = await payments.card();
				await cardInput.attach('#square-card-container');
				if (!active) return;

				setCard(cardInput);
				setInitialized(true);
			} catch (error: any) {
				if (!active) return;
				setErrorMessage(error?.message || 'Unable to initialize Square payment.');
			}
		}

		initializeSquare();
		return () => {
			active = false;
		};
	}, [props.applicationId, props.locationId, props.checkoutData, squareConfig]);

	async function handleSquarePayment(event: React.MouseEvent<HTMLButtonElement>) {
		event.preventDefault();
		setErrorMessage(null);

		if (!card) {
			setErrorMessage('Square payment form is not ready yet.');
			return;
		}

		try {
			setIsProcessing(true);
			const result = await card.tokenize();
			if (result.status === 'OK') {
				let captureResponse: any = undefined;
				if (typeof props.onSquarePaymentCapture === 'function') {
					try {
						captureResponse = await props.onSquarePaymentCapture({
							sourceId: result.token,
							checkoutData: props.checkoutData,
							card: result,
						});
					} catch (error: any) {
						if (error instanceof SquarePaymentError) {
							setErrorMessage(error.userMessage);
							return;
						}

						setErrorMessage(getSquarePaymentErrorMessage(error) || error?.message || 'Square payment capture failed.');
						return;
					}
				}

				props.onApprove({
					data: {
						sourceId: result.token,
						card: result,
						checkoutData: props.checkoutData,
						captureResponse,
					},
				});
			} else {
				const errors = result.errors?.map((item: any) => item.message).join(', ') || 'Square tokenization failed.';
				setErrorMessage(errors);
			}
		} catch (error: any) {
			if (error instanceof SquarePaymentError) {
				setErrorMessage(error.userMessage);
				return;
			}

			setErrorMessage(getSquarePaymentErrorMessage(error) || error?.message || 'Square payment capture failed.');
		} finally {
			setIsProcessing(false);
		}
	}

	return (
		<>
			<div className="pix-cart-payment-method">
				<div id="square-card-container" className="square-card-container" />
				{errorMessage && <div className="pix-cart-error">{errorMessage}</div>}
				<button className="pix-cart-button" type="button" onClick={handleSquarePayment} disabled={!initialized || isProcessing}>
					{isProcessing ? 'Processing payment...' : initialized ? 'Pay with Square' : 'Loading Square...' }
				</button>
			</div>
			<br /><br />
		</>
	);
}




/**
 * 
 * SquareStoreListFilter component renders a filter form for the Square store item listing. It allows users to select a property and value to filter the displayed items. The component receives an array of filters (each with a name and possible values) and a callback function as props. When the user selects a property and value and clicks the filter button, the callback function is called with the selected filter values.
 * 
 * @param: filters - An array of filter objects, each containing a name and an array of possible values for that property.
 * @param: callback - A function that will be called when the user applies a filter. It receives an object with the selected property name and value.
 * 
 * @returns: A React component that renders the filter form and handles user input to apply filters to the Square store item listing.
 * 
 */
SquareStoreListFilter.propTypes = {
	filters: PropTypes.arrayOf(
		PropTypes.shape({
			name: PropTypes.string.isRequired,
			values: PropTypes.arrayOf(
				PropTypes.shape({
					label: PropTypes.string.isRequired,
					value: PropTypes.string.isRequired,
				})
			).isRequired,
		})
	).isRequired,
	callback: PropTypes.func.isRequired,
	clearCallback: PropTypes.func,
};
export type SquareStoreListFilterType = InferProps<typeof SquareStoreListFilter.propTypes>;
export function SquareStoreListFilter(props: SquareStoreListFilterType) {
	const [selectedProperty, setSelectedProperty] = useState('');
	const [selectedValue, setSelectedValue] = useState('');
	const [availableValues, setAvailableValues] = useState<SquareStoreFilterValue[]>([]);

	useEffect(() => {
		if (!selectedProperty) {
			setAvailableValues([]);
			setSelectedValue('');
			return;
		}
		const selectedFilter = props.filters.find((filter): filter is SquareStoreFilter =>
			Boolean(filter && filter.name === selectedProperty)
		);
		setAvailableValues(selectedFilter?.values || []);
		setSelectedValue('');
	}, [selectedProperty, props.filters]);

	function handlePropertyChange(event: React.ChangeEvent<HTMLSelectElement>) {
		setSelectedProperty(event.target.value);
	}

	function handleValueChange(event: React.ChangeEvent<HTMLSelectElement>) {
		setSelectedValue(event.target.value);
	}

	function applyFilter() {
		if (selectedProperty && selectedValue) {
			props.callback({ propertyName: selectedProperty, propertyValue: selectedValue });
		}
	}

	function clearFilter() {
		setSelectedProperty('');
		setSelectedValue('');
		setAvailableValues([]);
		if (typeof props.clearCallback === 'function') {
			props.clearCallback();
		}
	}

	return (
		<form className="square-store-filter" name="square-store-filter" id="square-store-filter" onSubmit={(e) => { e.preventDefault(); applyFilter(); }}>
			<span className="filter-input">
				<label htmlFor="square-property">Property</label>
				<select id="square-property" value={selectedProperty} onChange={handlePropertyChange}>
					<option value=""></option>
					{props.filters.filter((filter): filter is SquareStoreFilter => Boolean(filter)).map((filter) => (
						<option key={filter.name} value={filter.name}>{filter.name}</option>
					))}
				</select>
			</span>
			<span className="filter-input">
				<label htmlFor="square-value">Value</label>
				<select id="square-value" value={selectedValue} onChange={handleValueChange} disabled={!selectedProperty}>
					<option value=""></option>
					{availableValues.map((filterValue) => (
						<option key={filterValue.value} value={filterValue.value}>{filterValue.label}</option>
					))}
				</select>
			</span>
			<span className="filter-input">
				<button type="button" onClick={applyFilter} disabled={!selectedProperty || !selectedValue}>Filter</button>
			</span>
			<span className="filter-input">
				<button type="button" onClick={clearFilter}>Clear</button>
			</span>
		</form>
	);
}






/**
 * SquareStoreItemSmall component renders a single item in the Square store listing. It displays the item's image, title, price, inventory status, description, and properties. The component also includes buttons to view item details and add the item to the shopping cart. It receives an item object as a prop, which contains all the necessary information about the store item.
 * @param: item - An object representing the Square store item, containing properties such as itemID, itemTitle, itemPrice, itemCurrency, itemInventory, itemDescription, itemImageURL, and any additional properties.
 * @return: A React component that displays the store item information and provides actions for viewing details and adding to cart.
 */
SquareStoreItemSmall.propTypes = {
	item: PropTypes.shape(SquareStoreItemShape).isRequired,
	itemURLPrefix: PropTypes.string,
};
export type SquareStoreItemSmallType = InferProps<typeof SquareStoreItemSmall.propTypes>;
export function SquareStoreItemSmall(props: SquareStoreItemSmallType) {
	const itemURL = props.itemURLPrefix && props.item.itemURL?.startsWith('/store/')
		? `${props.itemURLPrefix.replace(/\/$/, '')}/${props.item.itemURL.replace(/^\/store\//, '')}`
		: props.item.itemURL;
	return (
		<div className="square-store-item-callout">
			<Callout
				variant="boxed"
				layout="vertical"
				direction="left"
				img={props.item.itemImageURL ?? '/images/placeholder.png'}
				imgAlt={props.item.itemTitle}
				title={props.item.itemTitle}
				url={itemURL}
				// subtitle={`${props.item.itemCurrency ?? 'USD'} ${props.item.itemPrice.toFixed(2)} · In stock: ${props.item.itemInventory}`}
				subtitle={`${props.item.itemCurrency ?? 'USD'} ${props.item.itemPrice.toFixed(2)}`}
				content={props.item.itemDescription || 'No description available.'}
			>
				<div className="square-store-item-card-body">
					{ /* props.item.properties && Object.keys(props.item.properties).length > 0 && (
						<div className="square-store-item-properties">
							<h4>Details</h4>
							<ul>
								{Object.entries(props.item.properties).map(([key, value]) => (
									<li key={key}><strong>{key}:</strong> {value}</li>
								))}
							</ul>
						</div>
					) */ }
					<div className="square-store-item-actions">
						<ViewItemDetails href={itemURL} itemID={props.item.itemID} />
						<AddToCartButton handler={addToShoppingCart} item={{
							...props.item,
							itemQuantity: 1,
						}} itemID={props.item.itemID} />
					</div>
				</div>
			</Callout>
		</div>
	);
}








/**
 * SquareStoreItemSmall component renders a single item in the Square store listing. It displays the item's image, title, price, inventory status, description, and properties. The component also includes buttons to view item details and add the item to the shopping cart. It receives an item object as a prop, which contains all the necessary information about the store item.
 * @param: item - An object representing the Square store item, containing properties such as itemID, itemTitle, itemPrice, itemCurrency, itemInventory, itemDescription, itemImageURL, and any additional properties.
 * @return: A React component that displays the store item information and provides actions for viewing details and adding to cart.
 */
SquareStoreItemLarge.propTypes = {
	item: PropTypes.shape(SquareStoreItemShape).isRequired,
	itemURLPrefix: PropTypes.string,
};
export type SquareStoreItemLargeType = InferProps<typeof SquareStoreItemLarge.propTypes>;
export function SquareStoreItemLarge(props: SquareStoreItemLargeType) {
	const itemURL = props.itemURLPrefix && props.item.itemURL?.startsWith('/store/')
		? `${props.itemURLPrefix.replace(/\/$/, '')}/${props.item.itemURL.replace(/^\/store\//, '')}`
		: props.item.itemURL;
	return (
		<div className="square-store-item-callout">
			<Callout
				variant="grid"
				layout="horizontal"
				direction="left"
				img={props.item.itemImageURL ?? '/images/placeholder.png'}
				imgAlt={props.item.itemTitle}
				title={props.item.itemTitle}
				url={itemURL}
				subtitle={`${props.item.itemStartDate} ${props.item.itemStartTime} - ${props.item.itemEndDate} ${props.item.itemEndTime}`}
				content={props.item.itemDescription || 'No description available.'}
				buttonText="More Details"
			>
				<div className="square-store-item-card-body">
					<div className="square-store-item-description">
						{props.item.itemDescription || 'No description available.'}
					</div>
					<div className="square-store-item-actions">
						<ViewItemDetails href={itemURL} itemID={props.item.itemID} />
						<AddToCartButton handler={addToShoppingCart} item={{
							...props.item,
							itemQuantity: 1,
						}} itemID={props.item.itemID} />
					</div>
				</div>
			</Callout>
		</div>
	);
}







/**
 * 
 * SquareStoreItems component renders a list of items in the Square store with optional filtering. It displays a header with a title and introduction, a filter form if there are filterable properties, and a grid of SquareStoreItem components for each item in the list. The component receives an array of items, an optional title, and an optional introduction as props. It allows users to filter the displayed items based on their properties using the SquareStoreListFilter component.
 * @param: items - An array of objects representing the Square store items to be displayed, each containing properties such as itemID, itemTitle, itemPrice, itemCurrency, itemInventory, itemDescription, itemImageURL, and any additional properties.
 * @param: title - An optional string to be displayed as the header title for the store items section.
 * @param: intro - An optional string to be displayed as an introduction or description below the header title.
 * 
 * @return: A React component that displays a list of Square store items with filtering options and actions for each item.
 * 
 */
SquareStoreItems.propTypes = {
	items: PropTypes.arrayOf(PropTypes.shape(SquareStoreItemShape).isRequired).isRequired, // Array of Square store items to render
	filters: PropTypes.arrayOf(
		PropTypes.shape({
			name: PropTypes.string.isRequired,
			values: PropTypes.arrayOf(
				PropTypes.shape({
					label: PropTypes.string.isRequired,
					value: PropTypes.string.isRequired,
				})
			).isRequired,
		})
	),
	title: PropTypes.string, // Optional heading for the store listing
	intro: PropTypes.string, // Optional introductory text below the header title
	errorMessage: PropTypes.string, // Optional override for empty state copy
	emptyMessage: PropTypes.string, // Optional override for empty state copy
	initialFilter: PropTypes.shape({
		propertyName: PropTypes.string.isRequired,
		propertyValue: PropTypes.string.isRequired,
	}),
	showFilters: PropTypes.bool,
	itemSize: PropTypes.oneOf(['small', 'large']),
	itemURLPrefix: PropTypes.string,
};
export type SquareStoreItemsType = InferProps<typeof SquareStoreItems.propTypes>;
export function SquareStoreItems(props: SquareStoreItemsType) {
	const items = props.items || [];
	const filters = props.filters && props.filters.length ? props.filters : buildSquareStoreFilters(items);
	const showFilters = props.showFilters !== false;
	const itemSize = props.itemSize ?? 'small';
	const [selectedFilter, setSelectedFilter] = useState<SquareFilterValues | null>(props.initialFilter ?? null);

	const filteredItems = useMemo(() => {
		if (!selectedFilter || !selectedFilter.propertyName || !selectedFilter.propertyValue) {
			return items;
		}

		return items.filter((item) => {
			if (selectedFilter.propertyName === 'Category') {
				return Boolean(item.categories?.some((category) => category?.id === selectedFilter.propertyValue));
			}

			if (selectedFilter.propertyName === 'Price Range') {
				return matchesSquareStorePriceRange(item.itemPrice, selectedFilter.propertyValue);
			}

			return item.properties?.[selectedFilter.propertyName] === selectedFilter.propertyValue;
		});
	}, [items, selectedFilter]);

	const totalItems = items.length;
	const hasActiveFilter = Boolean(selectedFilter?.propertyName && selectedFilter?.propertyValue);

	function handleFilter(select: SquareFilterValues) {
		setSelectedFilter(select);
	}

	return (
		<>
			<PageGridItem columnStart={1} columnEnd={-1} id="square-store-header" className="square-store-header">
				<PageSectionHeader>{props.title ?? 'Boutique Store Items'}</PageSectionHeader>
				<div className="square-store-item-count">
					Total items: {totalItems}
					{hasActiveFilter ? ` · Filtered items: ${filteredItems.length}` : ''}
				</div>
				{props.intro ? <p>{props.intro}</p> : null}
			</PageGridItem>

			{showFilters ? (
				<PageGridItem columnStart={1} columnEnd={-1} id="square-store-filters" className="square-store-filters">
					{filters.length > 0 ? (
						<SquareStoreListFilter filters={filters} callback={handleFilter} clearCallback={() => setSelectedFilter(null)} />
					) : (
						<div className="square-store-filter-empty">No filterable product details are available for these items.</div>
					)}
				</PageGridItem>
			) : null}

			{filteredItems.map((item) => (
				<ProductSchema key={`square-schema-${item.itemID}`} product={buildSquareProductSchema(item)} />
			))}

			{filteredItems.map((item) => (
				itemSize === 'large' ? (
					<PageGridItem columnStart={1} columnEnd={-1} key={item.itemID}>
						<SquareStoreItemLarge key={item.itemID} item={item} itemURLPrefix={props.itemURLPrefix} />
					</PageGridItem>
				) : (
					<PageGridItem key={item.itemID}>
						<SquareStoreItemSmall key={item.itemID} item={item} itemURLPrefix={props.itemURLPrefix} />
					</PageGridItem>
				)
			))}

		</>
	);
}






/**
 * Props for the SquareFeaturedItems component.
 * 
 * @prop items - An array of Square store items to be featured, each containing properties such as itemID, itemTitle, itemPrice, itemCurrency, itemInventory, itemDescription, itemImageURL, and any additional properties.
 * @prop title - An optional string to be displayed as the header title for the featured items section.
 * @prop intro - An optional string to be displayed as an introduction or description below the header title for the featured items section.
 * 
 * @return A React component that displays a list of featured Square store items with a header and introduction.
 * 
 */
SquareFeaturedItems.propTypes = {
	items: PropTypes.arrayOf(PropTypes.shape(SquareStoreItemShape).isRequired).isRequired, // Array of featured Square store items
	title: PropTypes.string, // Optional heading for the featured items section
	intro: PropTypes.string, // Optional introductory text for featured items
};
export type SquareFeaturedItemsType = InferProps<typeof SquareFeaturedItems.propTypes>;
export function SquareFeaturedItems(props: SquareFeaturedItemsType) {
	return (
		<>
			<PageGridItem columnStart={1} columnEnd={-1} id="square-featured-items-header" className="square-featured-items-header">
				<PageSectionHeader>{props.title ?? 'Featured Boutique Items'}</PageSectionHeader>
				{props.intro ? <p>{props.intro}</p> : null}
			</PageGridItem>

			{props.items && props.items.length > 0 ? (
				<>
					{props.items.map((item) => (
						<ProductSchema key={`featured-schema-${item.itemID}`} product={buildSquareProductSchema(item)} />
					))}
					{props.items.map((item) => (
						<PageGridItem key={item.itemID}>
							<SquareStoreItemSmall key={item.itemID} item={item} />
						</PageGridItem>
					))}
				</>
			) : (
				<div className="square-store-empty">No featured boutique items are available right now.</div>
			)}

		</>
	);
}







/**
 * SquareStoreItemDetail component renders detailed information about a Square store item, including structured data for the product, a page title header, and a page section with product details. It receives a Square store item object as a prop and builds the product schema using the provided item data. The component displays the product images, title, description, inventory, SKU, shipping information, weight, and start date/time if available. It also provides an action to add the item to the shopping cart.
 * @param: item - An object representing the Square store item, containing properties such as itemTitle, itemDescription, itemID, itemInventory, itemSKU, itemIsShippable, itemWeight, itemWeightUnit, itemStartDate, itemStartTime, and any additional item details.
 * @return: A React component that displays detailed information about a Square store item and provides an action to add the item to the shopping cart.
 * 
 */
SquareStoreItemDetail.propTypes = {
	item: PropTypes.shape(SquareStoreItemShape).isRequired, // Square item object with details for the item detail page
};
export type SquareStoreItemDetailType = InferProps<typeof SquareStoreItemDetail.propTypes>;
export function SquareStoreItemDetail(props: SquareStoreItemDetailType) {
	const itemImageURLs = props.item.itemImageURLs?.filter((image): image is string => typeof image === 'string') ?? [];
	const imageCards = itemImageURLs.length > 1 ? itemImageURLs.map((image, index: number) => ({
		index,
		cardIndex: index,
		cardLength: itemImageURLs.length,
		image,
		imageAlt: `${props.item.itemTitle} ${index + 1}`,
		imgFit: 'contain' as const,
	})) : [];

	return (
		<PageSection columns={1} id="square-store-item-detail" className="square-store-item-detail">

			<ProductSchema product={buildSquareProductSchema(props.item)} />

			<div className="square-store-item-detail">

				<div className="square-store-item-detail-title">
					<PageTitleHeader>{props.item.itemTitle}</PageTitleHeader>
				</div>
				
				<div className="square-store-item-detail-image">
					{imageCards.length > 1 ? (
						<Carousel cards={imageCards} imgFit="contain" draggable={false} />
					) : itemImageURLs.length === 1 ? (
						<SmartImage aboveFold={true} src={itemImageURLs[0]} alt={props.item.itemTitle} />
					) : props.item.itemImageURL ? (
						<SmartImage aboveFold={true} src={props.item.itemImageURL} alt={props.item.itemTitle} />
					) : (
						<SmartImage aboveFold={true} src="/images/placeholder.png" alt={props.item.itemTitle} />
					)}
				</div>

				<div className="square-store-item-detail-body">
					<h3>Product Details</h3>
					{props.item.itemDescription ? <p>{props.item.itemDescription}</p> : null}
					<div className="square-store-item-detail-id">Item ID: {props.item.itemID}</div>
					<div className="square-store-item-detail-sku">SKU: {props.item.itemSKU ?? 'N/A'}</div>
					<div className="square-store-item-detail-inventory">In stock: {props.item.itemInventory}</div>
					<div className="square-store-item-detail-shipping">Shippable: {props.item.itemIsShippable ? 'Yes' : 'No'}</div>

					{props.item.itemWeight != null ? (
						<div className="square-store-item-detail-weight">Weight: {props.item.itemWeight.toFixed(2)} {props.item.itemWeightUnit ?? 'lb'}</div>
					) : null}
					{props.item.categories && props.item.categories.length > 0 ? (
						<div className="square-store-item-detail-categories">Categories: {props.item.categories.filter((category): category is { id: string; name: string } => Boolean(category)).map((category) => category.name).join(', ')}</div>
					) : null}
					{props.item.itemStartDate && props.item.itemStartTime ? (
						<div className="square-store-item-detail-start">Start: {props.item.itemStartDate} at {props.item.itemStartTime}</div>
					) : null}
					{props.item.itemEndDate && props.item.itemEndTime ? (
						<div className="square-store-item-detail-end">End: {props.item.itemEndDate} at {props.item.itemEndTime}</div>
					) : null}
					{props.item.itemDurationHours != null ? (
						<div className="square-store-item-detail-duration">Duration: {props.item.itemDurationHours} hours</div>
					) : null}
					{props.item.itemAvailableSeats != null ? (
						<div className="square-store-item-detail-seats">Available seats: {props.item.itemAvailableSeats}{props.item.itemMaxSeats != null ? ` · Max seats: ${props.item.itemMaxSeats}` : ''}</div>
					) : null}
					{ /* props.item.properties && Object.keys(props.item.properties).length > 0 ? (
						<div className="square-store-item-detail-properties">
							<dl>
								{Object.entries(props.item.properties).map(([key, value]) => (
									<React.Fragment key={key}>
										<dt>{key}</dt>
										<dd>{value as string}</dd>
									</React.Fragment>
								))}
							</dl>
						</div>
					) : null */ }
					<div className="square-store-item-detail-price">{`${props.item.itemPrice.toFixed(2)} ${props.item.itemCurrency}`}</div>
					<div className="square-store-item-detail-actions">
						<AddToCartButton handler={addToShoppingCart} item={{
							...props.item,
							itemQuantity: 1,
						}} itemID={props.item.itemID} />
					</div>
				</div>
			</div>
		</PageSection>
	);
}




/**
 * SquareThankYou component renders a thank you message and order details after a successful Square payment. It receives the order data and configuration as props, extracts relevant information such as the payment token, amount, and currency, and displays them in a user-friendly format. If the necessary information is not available, it will display the raw order data for debugging purposes.
 * @param: orderData - An object containing the details of the completed order, including payment information and checkout data.
 * @param: config - An optional configuration object that may contain settings related to the shopping cart and currency.
 * @return: A React component that displays a thank you message and relevant order details after a successful Square payment.
 * 
 */
renderSquareThankYou.propTypes = {
	orderData: PropTypes.any.isRequired, // The order data object containing payment and checkout details
	config: PropTypes.object, // Optional configuration object for additional settings
};
export type renderSquareThankYouType = InferProps<typeof renderSquareThankYou.propTypes>;
export function renderSquareThankYou(props: renderSquareThankYouType) {
	const orderData = props.orderData;
	const config = props.config;
	const sourceId = orderData?.data?.sourceId || orderData?.sourceId;
	const amount = orderData?.data?.checkoutData?.total ?? orderData?.checkoutData?.total;
	const currency = (config as any)?.integrations?.shoppingcart?.currency || orderData?.data?.checkoutData?.currency || 'USD';

	return (
		<div>
			<h3>Thank you for your payment!</h3>
			{sourceId ? (
				<>
					Payment Token : {sourceId} <br />
					Amount : ${amount ?? 'Unknown'} {currency} <br />
				</>
			) : (
				<pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(orderData, null, 2)}</pre>
			)}
		</div>
	);
}
