import React from 'react';
import { addToShoppingCart, clearShoppingCart, setShippingInfo } from '@/components/shoppingcart/shoppingcart.functions';
import { PixelatedClientConfigProvider } from '@/components/config/config.client';
import { ShoppingCart } from '@/components/shoppingcart/shoppingcart.components';

export default {
	title: 'ShoppingCart/Shopping Cart',
	component: ShoppingCart,
};

const item1 = { 
	itemImageURL: "https://i.ebayimg.com/images/g/CLoAAOSwYWplGdV6/s-l225.jpg",
    itemID: "123456",
    itemTitle: "Blue Widget with Silver Clips",
    itemQuantity: 1,
    itemCost: 149.00,
	itemURL: "https://www.ebay.com",
}; 
const item2 = { 
	itemImageURL: "https://i.ebayimg.com/images/g/h~cAAOSwY95lSaV~/s-l225.jpg",
    itemID: "246810",
    itemTitle: "Red Widget with Chrome Bits",
    itemQuantity: 1,
    itemCost: 139.00,
	itemURL: "https://www.ebay.com",
}; 
const item3 = { 
	itemImageURL: "https://i.ebayimg.com/images/g/uNMAAOSwzfNj4BN2/s-l225.jpg",
    itemID: "036912",
    itemTitle: "Squishy Widget with Slippery Areas",
    itemQuantity: 1,
    itemCost: 159.00,
	itemURL: "https://www.ebay.com",
}; 

// Parent Component
const ParentShoppingCart = ({ siteInfo } = {}) => {
	return (
	  	<>
			<div>
				<button type="button" onClick={()=>addToShoppingCart(item1)}>Add item1 To Cart</button><br />
				<button type="button" onClick={()=>addToShoppingCart(item2)}>Add item2 To Cart</button><br />
				<button type="button" onClick={()=>addToShoppingCart(item3)}>Add item3 To Cart</button><br />
				<button type="button" onClick={()=>clearShoppingCart()}>Clear Shopping Cart</button><br />
				<button type="button" onClick={()=>setShippingInfo('')}>Clear Shippin Info</button><br />
			</div>
            <br />
			<div>
				<ShoppingCart siteInfo={siteInfo} />
			</div>
		</>
	);
};

export const ShoppingCartPage = () => <ParentShoppingCart />;
ShoppingCartPage.args = { };

const shippingSiteInfo = {
	address: {
		postalCode: '30301',
		addressCountry: 'US',
	},
};

export const ShoppingCartWithUSPS = () => (
	<PixelatedClientConfigProvider config={{
		usps: {
			consumerKey: 'bQH78ecaPH57FDfG4RnArBnFBWX1uyAhSLxQo1aw3gD8wemu',
			consumerSecret: 'RKInU5tI72dFGzPB8OW2xXZlI6WU1Rb4GfB8SqnhIBk8SapzmNpk6r3UZAaXs0pT',
			environment: 'sandbox',
			sandboxBaseURL: 'https://apis-tem.usps.com/ShippingAPI.dll',
		},
	}}>
		<ParentShoppingCart siteInfo={shippingSiteInfo} />
	</PixelatedClientConfigProvider>
);
ShoppingCartWithUSPS.storyName = 'Shopping Cart with USPS';