
"use client";

import React, { useState, useEffect } from 'react';
import PropTypes, { InferProps } from 'prop-types';
import { PageSectionHeader } from '../general/semantic';
import { FormEngine } from "../sitebuilder/form/formengine";
import { FormButton } from '../sitebuilder/form/formcomponents';
import { emailJSON } from "../sitebuilder/form/formsubmit";
import '../sitebuilder/form/form.css';
import { MicroInteractions } from '../foundation/microinteractions';
import { Modal, handleModalOpen } from '../general/modal';
import { Table } from "../general/table";
import { getCart, getShippingInfo, setShippingInfo, setDiscountCodes, getRemoteDiscountCodes, getCheckoutData, removeFromShoppingCart, clearShoppingCart, getCartItemCount } from "./shoppingcart.functions";
import { formatAsUSD, formatAsHundredths } from "../foundation/utilities";
import type { CartItemType, CheckoutType } from "./shoppingcart.functions";
import { usePixelatedConfig } from '../config/config.client';
import { SmartImage } from '../general/smartimage';
import { getActivePaymentProvider } from './shoppingcart.providers';
import personalInfoData from "./checkout.personal.info.json";
import discountInfoData from "./checkout.discount.info.json";
import shippingInfoData from "./checkout.shipping.info.json";
import "./shoppingcart.css";



const debug = false;

/* ================================================ */
/* ========== SHOPPING CART UI COMPONENT ========== */
/* ================================================ */

type ShoppingCartFormOverride = {
	fields?: any[];
	properties?: Record<string, any>;
};

/**
 * ShoppingCart — page-level shopping cart UI that handles items, shipping, and checkout flows.
 *
 * Props:
 * @param {function} [props.onPaymentCapture] - Optional callback invoked to capture payment on the server.
 */
ShoppingCart.propTypes = {
	/** Optional callback invoked to capture payment on the server */
	onPaymentCapture: PropTypes.func,
	/** Optional app-specific custom subtotal discount */
	subtotalDiscountCustom: PropTypes.number,
	/** Optional override for the checkout personal info form */
	personalInfoForm: PropTypes.object,
	/** Optional override for the checkout discount form */
	discountInfoForm: PropTypes.object,
	/** Optional override for the checkout shipping form */
	shippingInfoForm: PropTypes.object,
	/** Optional override for additional checkout info fields */
	additionalInfoForm: PropTypes.object,
	/** Optional flag to hide the shipping section when cart items are non-shippable */
	showShippingInfoSection: PropTypes.bool,
};
export type ShoppingCartType = InferProps<typeof ShoppingCart.propTypes> & { personalInfoForm?: ShoppingCartFormOverride; discountInfoForm?: ShoppingCartFormOverride; shippingInfoForm?: ShoppingCartFormOverride; additionalInfoForm?: ShoppingCartFormOverride; };
export function ShoppingCart(props: ShoppingCartType) {
	const config = usePixelatedConfig();
	const effectiveConfig = config || {};

	const activeProvider = getActivePaymentProvider(effectiveConfig);
	const PaymentProviderComponent = activeProvider ? activeProvider.component : null;
	const checkoutDataForProvider = getCheckoutData();
	const checkoutDiscountCustom = props.subtotalDiscountCustom ?? 0;

	const personalInfoFormData = props.personalInfoForm ?? personalInfoData;
	const discountInfoFormData = props.discountInfoForm ?? discountInfoData;
	const shippingInfoFormData = props.shippingInfoForm ?? shippingInfoData;
	const additionalInfoFormData = props.additionalInfoForm;
	const showShippingInfoSection = props.showShippingInfoSection !== false;

	const discountFormData = discountInfoFormData;
	const shippingFormFields = [
		...(personalInfoFormData?.fields ?? []),
		...(discountFormData?.fields ?? []),
		...(checkoutDiscountCustom > 0 ? [{
			component: "FormLabel",
			props: {
				id: "checkout_discount_custom_label",
				label: `Discount applied: ${formatAsUSD(checkoutDiscountCustom)}`,
				className: "pix-cart-discount-applied"
			}
		}] : []),
		...(showShippingInfoSection ? (shippingInfoFormData?.fields ?? []) : []),
		...(additionalInfoFormData ? [{
			component: "FormSectionHeader",
			props: {
				"title": "Additional Checkout Info"
			}
		}] : []),
		...(additionalInfoFormData?.fields ?? []),
		{
			component: "FormButton",
			props: {
				id: "saveShippingInfo",
				type: "submit",
				text: "Continue to Checkout",
				className: "pix-cart-button"
			}
		}
	];
	const shippingFormDataCombined = {
		properties: personalInfoFormData?.properties ?? {},
		fields: shippingFormFields
	};
	const effectiveSubtotalDiscount = formatAsHundredths((checkoutDataForProvider.subtotal_discount || 0) + checkoutDiscountCustom);
	const effectiveCheckoutData: CheckoutType = {
		...checkoutDataForProvider,
		subtotal_discount: effectiveSubtotalDiscount,
		total: formatAsHundredths(
			checkoutDataForProvider.subtotal - effectiveSubtotalDiscount + checkoutDataForProvider.shippingCost + checkoutDataForProvider.handlingFee + (checkoutDataForProvider.insuranceCost ?? 0) + (checkoutDataForProvider.shipping_discount ?? 0) + checkoutDataForProvider.salesTax
		)
	};
	const paymentProviderProps = activeProvider ? {
		...activeProvider.getProps(effectiveConfig, effectiveCheckoutData, {
			onPaymentCapture: props.onPaymentCapture ?? undefined,
		}),
	} : {};
	const [ shoppingCart, setShoppingCart ] = useState<CartItemType[]>([]);
	const [ shippingData, setShippingData ] = useState<any>();
	const [ checkoutData, setcheckoutData ] = useState<CheckoutType>();
	const [ orderData, setOrderData ] = useState<any>();
	const [ progressStep, setProgressStep ] = useState<ProgressStepType>("EmptyCart");

	type ProgressStepType = "EmptyCart" | "CartItems" | "ShippingInfo" | "Checkout" | "ThankYou" ;
	function SetProgressStep(step?: ProgressStepType){
		if (step) {
			setProgressStep(step);
		} else {
			const hasShoppingCart = getCart().length > 0;
			if (debug) console.log("hasShoppingCart", hasShoppingCart);
			const hasShippingInfo = Object.keys(getShippingInfo()).length > 0 ;
			if (debug) console.log("hasShippingInfo", hasShippingInfo);
			const hasOrderData = orderData && ((Array.isArray(orderData) && orderData.length > 0) || (!Array.isArray(orderData) && Object.keys(orderData).length > 0));
			if (debug) console.log("hasOrderData", hasOrderData);
			if (debug && orderData && !Array.isArray(orderData)) console.log(Object.keys(orderData).length);
			if ( hasOrderData ) {
				setProgressStep("ThankYou");
			} else if ( hasShippingInfo && hasShoppingCart ) {
				setProgressStep("Checkout");
			} else if (hasShoppingCart) {
				setProgressStep("ShippingInfo");
			} else {
				setProgressStep("EmptyCart");
			}
		}
	}

	/* useEffect(() => {
		// UPDATE LOCALSTORAGE IF SHOPPINGCART STATE CHANGES
		setCart(shoppingCart ?? []);
	}, [shoppingCart]); */

	/* useEffect(() => {
		// UPDATE LOCALSTORAGE IF SHIPPINGDATA STATE CHANGES
		setShippingInfo(shippingInfo);
	}, [shippingInfo]); */

	useEffect(() => {
		// UPDATE DISCOUNT CODES ON EACH PAGE LOAD
		(async () => {
			const contentfulConfig = config?.contentful;
			setDiscountCodes(await getRemoteDiscountCodes(contentfulConfig));
		})();
		// UPDATE SHOPPINGCART AND SHIPPINGDATA STATES IF LOCALSTORAGE CHANGES
		function handleStorageChange(){
			setShoppingCart( getCart() );
			setShippingData( getShippingInfo() );
			setcheckoutData( getCheckoutData() );
			SetProgressStep();
		}
		window.addEventListener('storage', handleStorageChange);
		window.dispatchEvent(new Event('storage'));
		return () => {
			window.removeEventListener('storage', handleStorageChange);
		};
	}, []);

	useEffect(() => {
		// LOAD THE SHIPPING INFO FORM WITH VALUES IF SHIPPING INFO HAS ALREADY BEEN SAVED
		if (shippingData && progressStep === "ShippingInfo") {
			Object.entries(shippingData).forEach(([key, value]) => {
				const elements = Array.from(document.getElementsByName(key) as NodeListOf<HTMLInputElement>);
				if (!elements.length) return;
				if (elements[0].type === 'radio') {
					elements.forEach(el => {
						(el as HTMLInputElement).checked = String((value ?? '')).trim() === (el as HTMLInputElement).value;
					});
				} else {
					elements.forEach(el => {
						(el as HTMLInputElement).value = String(value ?? '');
					});
				}
			});
		}
	}, [progressStep, shippingData]);

	paintCartItems.PropTypes = {
		items: PropTypes.array.isRequired
	};
	function paintCartItems(items: CartItemType[]){
		if (debug) console.log("Painting Shopping Cart Items");
		const newItems = [];
		for (const key in items) {
			const myItem: CartItemType = items[key];
			const newItem = <ShoppingCartItem item={myItem} key={myItem.itemID}  />;
			newItems.push(newItem);
		}
		return newItems;
	}

	function onShippingSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = event.currentTarget as HTMLFormElement;
		const formObject = Object.fromEntries(new FormData(form));
		setShippingInfo(formObject);
	}

	/**
	 * handlePaymentSuccess — invoked after a payment provider reports success.
	 *
	 * @param {object} [props.data] - Payment approval payload returned by the provider.
	 */
	handlePaymentSuccess.propTypes = {
		data: PropTypes.any.isRequired
	};
	type handlePaymentSuccessType = InferProps<typeof handlePaymentSuccess.propTypes>;
	function handlePaymentSuccess(props: handlePaymentSuccessType ){
		if (debug) console.log("Handling payment success");
		setOrderData(props.data);
		clearShoppingCart();
		SetProgressStep("ThankYou");
	}

	if ( progressStep === "ThankYou" ) {
		// ========== SENDMAIL ==========
		const cartConfig = config?.shoppingcart;
		const json = {
			'to': cartConfig?.orderTo,
			'from': cartConfig?.orderFrom,
			'subject': cartConfig?.orderSubject,
			'orderData': JSON.stringify(orderData, null, 2),
		};
		const sendMailResponse = emailJSON(json);
		if (debug) console.log("SendMail Response:", sendMailResponse);

		// ========== THANK YOU ==========
		if (debug) console.log('SendMail Response:', sendMailResponse);

		const renderThankYouContent = () => {
			if (!orderData) {
				return (
					<div>
						<h3>Thank you for your payment!</h3>
					</div>
				);
			}

			const receipt = buildReceiptData(orderData, config);
			if (receipt) {
				return (
					<div>
						<h3>Thank you for your payment!</h3>
						<br />
						<h3 style={{"textAlign": "center"}}>Your Receipt:</h3>
						{renderReceiptTable(receipt)}
					</div>
				);
			}


			return (
				<div>
					<h3>Thank you for your payment!</h3>
					<pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(orderData, null, 2)}</pre>
				</div>
			);
		};

		return (
			<div className="pix-cart">
				<PageSectionHeader title="Shopping Cart : " />
				<br />
				{renderThankYouContent()}
			</div>

		);
	} else if ( progressStep === "Checkout" ) {
		// ========== CHECKOUT ==========
		return (
			<div className="pix-cart">
				<PageSectionHeader title="Checkout Summary : " />
				{ effectiveCheckoutData && <CheckoutItems {...effectiveCheckoutData} /> }
				<br />
				<FormButton className="pix-cart-button" type="button" id="backToCart" text="<= Back To Cart"
					onClick={() => SetProgressStep("ShippingInfo")} />
				<br />
				<PageSectionHeader title="Payment Options : " />
				{PaymentProviderComponent ? (
					<PaymentProviderComponent
						{...paymentProviderProps}
						checkoutData={effectiveCheckoutData}
						onApprove={handlePaymentSuccess}
					/>
				) : (
					<div>No payment provider is configured. Add PayPal or Square configuration to pixelated.config.json.</div>
				)}
			</div>
		);
	} else if ( progressStep === "ShippingInfo" ) {
		// ========== SHOPPING CART ==========
		// ========== SHIPPING INFO ==========
		return (
			<div className="pix-cart">
				<PageSectionHeader title="Shopping Cart : " />
				{ paintCartItems(shoppingCart ?? []) }
				<br />
				<div>
					<FormButton className="pix-cart-button" type="button" id="backToCart" text="Clear Cart"
						onClick={() => clearShoppingCart()} />
				</div>
				<br /><br /><hr /><br /><br />
				<div>
					<PageSectionHeader title="Checkout Info" />
					<FormEngine name="checkout_shipping" id="checkout_shipping" formData={shippingFormDataCombined as any} onSubmitHandler={onShippingSubmit} />
				</div>
			</div>
		);
	} else {
		// ========== EMPTY SHOPPING CART ==========
		return (
			<div className="pix-cart">
				<PageSectionHeader title="Shopping Cart : " />
				<br />
				<div className="centered">No items in your shopping cart</div>
			</div>

		);
	}
}

/**
 * ShoppingCartItem — Render a single cart line item showing thumbnail, title, quantity and price.
 *
 * @param {shape} [props.item] - Shopping cart line item with id, title, image, quantity and cost.
 * @param {string} [props.itemID] - Unique identifier for the cart item.
 * @param {string} [props.itemURL] - Optional item detail URL to link the title and image.
 * @param {string} [props.itemTitle] - Display title for the item.
 * @param {string} [props.itemImageURL] - Thumbnail image URL for the item.
 * @param {number} [props.itemQuantity] - Quantity of this line item in the cart.
 * @param {number} [props.itemCost] - Per-item cost (numeric) used to compute totals.
 */
ShoppingCartItem.propTypes = {
/** Shopping cart line item object */
	item: PropTypes.shape({
		/** Unique item id */
		itemID: PropTypes.string.isRequired,
		/** Optional URL for the item details */
		itemURL: PropTypes.string,
		/** Item display title */
		itemTitle: PropTypes.string.isRequired,
		/** Thumbnail image URL */
		itemImageURL: PropTypes.string,
		/** Line item quantity */
		itemQuantity: PropTypes.number.isRequired,
		/** Per-item price */
		itemCost: PropTypes.number.isRequired,
	}).isRequired
};
export type ShoppingCartItemType = InferProps<typeof ShoppingCartItem.propTypes>;
export function ShoppingCartItem(props: ShoppingCartItemType) {
	const thisItem = props.item;
	const thisItemTarget = "_self"; // "_blank"
	const config = usePixelatedConfig();
	return (
		<div className="pix-cart-item row-12col">
			<div className="pix-cart-item-photo grid-s1-e4">
				{ thisItem.itemURL && thisItem.itemImageURL
					? <a href={thisItem.itemURL} target={thisItemTarget} rel="noopener noreferrer">
						<SmartImage src={thisItem.itemImageURL} alt={thisItem.itemTitle} 
							cloudinaryEnv={config?.cloudinary?.product_env}
							cloudinaryDomain={config?.cloudinary?.baseUrl}
							cloudinaryTransforms={config?.cloudinary?.transforms} />
					</a>
					: thisItem.itemImageURL 
						? (
							<SmartImage src={thisItem.itemImageURL} title={thisItem.itemTitle} alt={thisItem.itemTitle} 
								cloudinaryEnv={config?.cloudinary?.product_env}
								cloudinaryDomain={config?.cloudinary?.baseUrl}
								cloudinaryTransforms={config?.cloudinary?.transforms} />
						)
						: <></>
				}
			</div>
			<div className="grid-s4-e11">
				<div className="pix-cart-item-header">
					<span>
						{ thisItem.itemURL
							? <a href={thisItem.itemURL} target={thisItemTarget} rel="noopener noreferrer"><h2 className="">{thisItem.itemTitle}</h2></a>
							: <h2 className="">{thisItem.itemTitle}</h2>
						}
					</span>
				</div>
				<div className="pix-cart-item-details grid12">
					<br />
					<div><b>Item ID: </b>{thisItem.itemID}</div>
					<div><b>Quantity: </b>{thisItem.itemQuantity}</div>
					<br />
					<div>
						<FormButton className="pix-cart-button" type="button" id={`btn-rm-${thisItem.itemID}`} text="Remove Item From Cart"
							onClick={()=>removeFromShoppingCart(thisItem as CartItemType)} />
					</div>
				</div>
			</div>
			<div className="grid-s11-e13">
				<div className="pix-cart-item-price">
					{ formatAsUSD(thisItem.itemCost) }
				</div>
			</div>
		</div>
	);
}



/**
 * CheckoutItems — Display a checkout summary with itemized lines and shipping information.
 *
 * @param {arrayOf} [props.items] - Cart items included in the checkout summary.
 * @param {shape} [props.shippingTo] - Shipping address object with name, street1, city, state and zip.
 * @param {number} [props.subtotal_discount] - Discount amount applied to subtotal.
 * @param {number} [props.subtotal] - Subtotal amount before shipping and taxes.
 * @param {number} [props.shippingCost] - Shipping cost for the order.
 * @param {number} [props.handlingFee] - Optional handling fees.
 * @param {number} [props.salesTax] - Sales tax amount.
 * @param {number} [props.total] - Final total amount charged.
 */
CheckoutItems.propTypes = {
/** Array of cart items to summarize */
	items: PropTypes.arrayOf(PropTypes.shape({
		/** Item identifier */
		itemID: PropTypes.string.isRequired,
		/** Item detail URL (optional) */
		itemURL: PropTypes.string,
		/** Item title */
		itemTitle: PropTypes.string.isRequired,
		/** Item image URL */
		itemImageURL: PropTypes.string,
		/** Quantity for this item */
		itemQuantity: PropTypes.number.isRequired,
		/** Per-item price */
		itemCost: PropTypes.number.isRequired,
	})).isRequired,
	/** Shipping address object */
	shippingTo: PropTypes.shape({
		name: PropTypes.string.isRequired,
		street1: PropTypes.string.isRequired,
		city: PropTypes.string.isRequired,
		state: PropTypes.string.isRequired,
		zip: PropTypes.string.isRequired,
	}).isRequired,
	/** Discount amount applied to subtotal */
	subtotal_discount: PropTypes.number.isRequired,
	/** Subtotal amount before shipping and taxes */
	subtotal: PropTypes.number.isRequired,
	/** Shipping cost for the order */
	shippingCost: PropTypes.number.isRequired,
	/** Handling fee applied to the order */
	handlingFee: PropTypes.number.isRequired,
	/** Sales tax amount */
	salesTax: PropTypes.number.isRequired,
	/** Final total amount */
	total: PropTypes.number.isRequired,
};
export type CheckoutItemsType = InferProps<typeof CheckoutItems.propTypes>;
export function CheckoutItems(props: CheckoutItemsType) {
	const { items, shippingTo, subtotal_discount, subtotal, shippingCost, handlingFee, salesTax, total } = props;

	const cartItems = (
		<ul>
			{items.map((item: any) => {
				const itm = item as CartItemType;
				return <li key={itm.itemID}>{itm.itemQuantity} X - {itm.itemTitle} ( {formatAsUSD(itm.itemCost)} )</li>;
			})}
		</ul>
	);
	const to = shippingTo;
	const addr = <><div>{to.name}</div><div>{to.street1}</div><div>{to.city}, {to.state} {to.zip}</div></> ;

	let checkoutTableData = [{
		"Name": "Shopping Cart Items : ",
		"Value": cartItems,
	}, {
		"Name": "Subtotal Discount : ",
		"Value": formatAsUSD(subtotal_discount),
	}, {
		"Name": "Subtotal : ",
		"Value": formatAsUSD(subtotal),
	},{
		"Name": "Shipping Address : ",
		"Value": addr,
	},{
		"Name": "Shipping Cost : ",
		"Value": formatAsUSD(shippingCost),
	},{
		"Name": "Handling Fee : ",
		"Value": formatAsUSD(handlingFee),
	}, /* {
		"Name": "Insurance Cost : ",
		"Value": formatAsUSD(checkoutData.insuranceCost ?? 0),
	}, */ /* {
		"Name": "Shipping Discount : ",
		"Value": formatAsUSD(checkoutData.shipping_discount ?? 0),
	}, */{
		"Name": "Sales Tax : ",
		"Value": formatAsUSD(salesTax),
	},{
		"Name": "TOTAL : ",
		"Value": formatAsUSD(total),
	}];

	if (subtotal_discount == 0) {
		checkoutTableData = checkoutTableData.filter(obj => obj.Name !== "Subtotal Discount : ");
	}
	return (
		<Table id="pixCheckout" data={checkoutTableData} />
	);
}


/**
 * CartButton — Render a cart button showing the current cart item count and navigates to the cart page when clicked.
 *
 * @param {string} [props.href] - Destination URL for the cart page.
 */
CartButton.propTypes = {
/** Destination URL for viewing the shopping cart */
	href: PropTypes.string.isRequired,
};
export type CartButtonType = InferProps<typeof CartButton.propTypes>;
export function CartButton(props: CartButtonType) {
	const config = usePixelatedConfig();
	const [ cartCount, setCartCount ] = useState(0);
	useEffect(() => {
		// UPDATE CARTCOUNT STATES IF LOCALSTORAGE CHANGES
		function handleStorageChange(){
			setCartCount( getCartItemCount( getCart() ) );
		}
		window.addEventListener('storage', handleStorageChange);
		window.dispatchEvent(new Event('storage'));
		return () => {
			window.removeEventListener('storage', handleStorageChange);
		};
	}, []);
	useEffect(() => {
		if (cartCount && cartCount > 0) {
			MicroInteractions({cartpulse: true});
		} else {
			MicroInteractions({cartpulse: false});
		}
	}, [cartCount]);
	return (
		<div className="pix-cart">
			<button className="pix-cart-button" type="button" id="pix-cart-button" 
				onClick={()=>window.location.href=props.href} >
				<SmartImage src="/images/icons/cart-icon.png" title="View Shopping Cart" alt="View Shopping Cart" 
					cloudinaryEnv={config?.cloudinary?.product_env}
					cloudinaryDomain={config?.cloudinary?.baseUrl}
					cloudinaryTransforms={config?.cloudinary?.transforms} />
				<span>&nbsp;{`(${cartCount})`}</span>
			</button>
		</div>
	);
}


/**
 * ViewItemDetails — Button to navigate to an item detail page for a given item ID.
 *
 * @param {string} [props.href] - Base URL for the item detail page.
 * @param {string} [props.itemID] - Item identifier appended to the URL when navigating.
 */
ViewItemDetails.propTypes = {
/** Base URL for item details */
	href: PropTypes.string.isRequired,
	/** Item identifier to navigate to */
	itemID: PropTypes.string.isRequired,
};
export type ViewItemDetailsType = InferProps<typeof ViewItemDetails.propTypes>;
export function ViewItemDetails(props: ViewItemDetailsType){
	return (
		<div>
			<FormButton className="pix-cart-button" type="button" 
				id={`btn-item-${props.itemID}`} text="View Item Details"
				onClick={()=>window.location.href = `${props.href}/${props.itemID}`} />
		</div>
	);
}


/**
 * AddToCartButton — Button that adds an item to the shopping cart and displays a confirmation modal.
 *
 * @param {function} [props.handler] - Handler function that performs the add-to-cart action (receives the item object).
 * @param {object} [props.item] - Shopping cart item object to add.
 * @param {string} [props.itemID] - Unique identifier for the item used for modal IDs and button IDs.
 */
AddToCartButton.propTypes = {
/** Handler called to add the item to cart */
	handler: PropTypes.func.isRequired,
	/** Shopping cart item object */
	item: PropTypes.object.isRequired,
	/** Unique item identifier */
	itemID: PropTypes.string.isRequired,
};
export type AddToCartButtonType = InferProps<typeof AddToCartButton.propTypes>;
export function AddToCartButton(props: AddToCartButtonType){
	const [modalContent, setModalContent] = useState<React.ReactNode>();
	useEffect(() => {
		const myContent = <div className="centered"><br /><br />Item {props.itemID} has been added to your cart.<br /><br />{GoToCartButton({href: "/cart", itemID: props.itemID})}<br /><br /></div>;
		setModalContent(myContent);
	}, [props.itemID]);
	function handleClick(e: React.MouseEvent<HTMLButtonElement>){
		props.handler(props.item);
		handleModalOpen(e.nativeEvent, "-" + props.itemID);
	}
	return (
		<div>
			<FormButton className="pix-cart-button" type="button" 
				id={`btn-add-${props.itemID}`} text="Add to Shopping Cart"
				onClick={(e)=>handleClick(e)} />
			{modalContent && <Modal modalContent={modalContent} modalID={"-" + props.itemID} />}
		</div>
	);
}


/**
 * GoToCartButton — Button that navigates the user to the shopping cart page.
 *
 * @param {string} [props.href] - Destination URL for the shopping cart.
 * @param {string} [props.itemID] - ID used to compose button id attributes (not required for navigation).
 */
GoToCartButton.propTypes = {
/** Cart page URL */
	href: PropTypes.string.isRequired,
	/** Item ID used for button id attributes */
	itemID: PropTypes.string.isRequired,
};
export type GoToCartButtonType = InferProps<typeof GoToCartButton.propTypes>;
export function GoToCartButton(props: GoToCartButtonType){
	return (
		<div>
			<FormButton className="pix-cart-button" type="button" 
				id={`btn-cart-${props.itemID}`} text="Go to Shopping Cart"
				onClick={()=>window.location.href=props.href} />
		</div>
	);
}



type ReceiptItem = {
	itemID: string;
	itemTitle: string;
	itemQuantity: number;
	itemCost: number;
};

type ReceiptData = {
	orderId?: string;
	dateTime?: string;
	paymentStatus?: string;
	paymentMethod?: string;
	orderSource?: string;
	amount?: string;
	currency?: string;
	fullName?: string;
	address?: string;
	phone?: string;
	email?: string;
	shipping?: string;
	handling?: string;
	tax?: string;
	creditCardLast4?: string;
	receiptUrl?: string;
	items?: ReceiptItem[];
};

function formatReceiptAddress(shippingTo: any) {
	if (!shippingTo) return '';
	const parts = [
		shippingTo.street1,
		shippingTo.street2,
		shippingTo.city,
		shippingTo.state,
		shippingTo.zip,
		shippingTo.country,
	].filter(Boolean);
	return parts.join(', ');
}

function parseMoney(value: any) {
	if (value === null || value === undefined || value === '') return undefined;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : undefined;
}

function formatMoney(value: any) {
	const parsed = parseMoney(value);
	return parsed !== undefined ? formatAsUSD(parsed) : '';
}

function buildReceiptData(orderData: any, config?: any): ReceiptData | null {
	const payload = orderData?.data ? orderData.data : orderData;
	if (!payload) return null;

	const checkoutData = orderData?.checkoutData || payload?.checkoutData || payload?.purchase_units?.[0]?.shipping || {};
	const purchaseUnit = payload?.purchase_units?.[0] || {};
	const breakdown = purchaseUnit?.amount?.breakdown || {};
	const paymentCapture = payload.captureResponse?.payment || purchaseUnit?.payments?.captures?.[0] || payload;

	const orderId = paymentCapture?.id || payload?.id || payload?.orderID || payload?.order_id;
	const dateTime = paymentCapture?.created_at || paymentCapture?.create_time || paymentCapture?.updated_at || payload?.create_time || payload?.updated_at;
	const paymentStatus = paymentCapture?.status || payload?.status || 'Completed';
	const paymentMethod = payload?.sourceId ? 'Square' : 'PayPal';
	const currency = config?.shoppingcart?.currency || paymentCapture?.amount_money?.currency || paymentCapture?.amount?.currency_code || purchaseUnit?.amount?.currency_code || 'USD';

	const amountValue = parseMoney(checkoutData?.total)
		?? parseMoney(purchaseUnit?.amount?.value)
		?? parseMoney(paymentCapture?.amount?.value)
		?? (paymentCapture?.amount_money?.amount ? paymentCapture.amount_money.amount / 100 : undefined);
	const amount = amountValue !== undefined ? `${formatAsUSD(amountValue)} ${currency}` : '';

	const items: ReceiptItem[] = Array.isArray(checkoutData?.items)
		? checkoutData.items.map((item: any) => ({
			itemID: item.itemID || item.name || item.id || '',
			itemTitle: item.itemTitle || item.description || item.name || '',
			itemQuantity: item.itemQuantity ?? item.quantity ?? 0,
			itemCost: parseMoney(item.itemCost ?? item.unit_amount?.value) ?? 0,
		}))
		: Array.isArray(purchaseUnit?.items)
			? purchaseUnit.items.map((item: any) => ({
				itemID: item.name || item.id || '',
				itemTitle: item.description || item.name || '',
				itemQuantity: parseMoney(item.quantity) ?? 0,
				itemCost: parseMoney(item.unit_amount?.value) ?? 0,
			}))
			: [];

	const shippingTo = checkoutData?.shippingTo || purchaseUnit?.shipping?.address || {};
	const payerName = payload?.payer?.name || {};
	const fullName = checkoutData?.shippingTo?.name
		|| payerName?.full_name
		|| `${payerName?.given_name || ''} ${payerName?.surname || ''}`.trim();

	return {
		orderId,
		dateTime,
		paymentStatus,
		paymentMethod,
		orderSource: paymentMethod,
		amount,
		currency,
		fullName: fullName || 'Unknown',
		address: formatReceiptAddress(checkoutData?.shippingTo || purchaseUnit?.shipping?.address),
		phone: checkoutData?.shippingTo?.phone || payload?.payer?.phone?.phone_number?.national_number || '',
		email: checkoutData?.shippingTo?.email || payload?.payer?.email_address || payload?.buyer_email_address || '',
		shipping: formatMoney(checkoutData?.shippingCost ?? breakdown?.shipping?.value),
		handling: formatMoney(checkoutData?.handlingFee ?? breakdown?.handling?.value),
		tax: formatMoney(checkoutData?.salesTax ?? breakdown?.tax_total?.value),
		creditCardLast4: payload?.card?.details?.card?.last4 || paymentCapture?.card_details?.card?.last_4 || '',
		receiptUrl: paymentCapture?.receipt_url || '',
		items,
	};
}

function renderReceiptTable(receipt: ReceiptData) {
	const rows: Array<{ Field: string; Value: React.ReactNode }> = [
		{ Field: 'Order ID', Value: receipt.orderId || 'Unknown' },
		{ Field: 'Date & Time', Value: receipt.dateTime || 'Unknown' },
		{ Field: 'Payment Status', Value: receipt.paymentStatus || 'Unknown' },
		{ Field: 'Payment Method', Value: receipt.paymentMethod || 'Unknown' },
		{ Field: 'Amount', Value: receipt.amount || 'Unknown' },
		{ Field: 'Full Name', Value: receipt.fullName || 'Unknown' },
		{ Field: 'Address', Value: receipt.address || 'Unknown' },
		{ Field: 'Phone', Value: receipt.phone || 'Unknown' },
		{ Field: 'Email', Value: receipt.email || 'Unknown' },
		{ Field: 'Shipping', Value: receipt.shipping || '0.00' },
		{ Field: 'Handling', Value: receipt.handling || '0.00' },
		{ Field: 'Tax', Value: receipt.tax || '0.00' },
		{ Field: 'Credit Card (Last 4)', Value: receipt.creditCardLast4 || 'N/A' },
	];

	if (receipt.receiptUrl) {
		rows.push({
			Field: 'Receipt URL',
			Value: <a href={receipt.receiptUrl} target="_blank" rel="noreferrer">View receipt</a>,
		});
	}

	if (receipt.items && receipt.items.length > 0) {
		rows.push({
			Field: 'Items',
			Value: (
				<Table
					id="receipt-items-table"
					data={receipt.items.map((item) => ({
						ID: item.itemID,
						Title: item.itemTitle,
						Quantity: item.itemQuantity,
						'Price per item': formatAsUSD(item.itemCost),
					}))}
				/>
			),
		});
	}

	return (
		<div style={{ maxWidth: 768, margin: '0 auto' }}>
			<Table id="receipt-summary-table" data={rows} />
		</div>
	);
}





