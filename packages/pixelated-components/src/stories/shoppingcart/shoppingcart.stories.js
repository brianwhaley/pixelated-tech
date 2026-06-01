import React from 'react';
import { addToShoppingCart, clearShoppingCart, setShippingInfo } from '@/components/shoppingcart/shoppingcart.functions';
import { PixelatedClientConfigProvider } from '@/components/config/config.client';
import { ShoppingCart } from '@/components/shoppingcart/shoppingcart.components';
import { SquareStoreItems, SquareStoreItemDetail } from '@/components/shoppingcart/square.components';

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

const boutiqueItems = [
	{
		itemID: 'boutique-1',
		itemTitle: 'Handmade Linen Scarf',
		itemDescription: 'Soft artisan linen scarf with hand-stitched detail.',
		itemImageURL: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=400&q=80',
		itemImageURLs: ['https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=400&q=80'],
		itemPrice: 62.5,
		itemCurrency: 'USD',
		itemInventory: 8,
		itemIsShippable: true,
		itemURL: '/store/boutique-1',
		properties: { Color: 'Blue', Size: 'One Size' },
	},
	{
		itemID: 'boutique-2',
		itemTitle: 'Artisan Candle Trio',
		itemDescription: 'Three scented candles crafted locally using soy wax.',
		itemImageURL: 'https://images.unsplash.com/photo-1506089676908-3592f7389d4d?auto=format&fit=crop&w=400&q=80',
		itemImageURLs: ['https://images.unsplash.com/photo-1506089676908-3592f7389d4d?auto=format&fit=crop&w=400&q=80'],
		itemPrice: 38.0,
		itemCurrency: 'USD',
		itemInventory: 5,
		itemIsShippable: true,
		itemURL: '/store/boutique-2',
		properties: { Scent: 'Lavender', Size: 'Small' },
	},
];

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

export const SquareStoreListing = () => (
	<SquareStoreItems
		items={boutiqueItems}
		title="Curated Boutique Collection"
		intro="Filter the collection by item detail and add boutique pieces to your shopping cart."
	/>
);

export const SquareStoreItemDetailExample = () => (
	<SquareStoreItemDetail item={boutiqueItems[0]} />
);

SquareStoreListing.storyName = 'Square Boutique Store Listing';
SquareStoreItemDetailExample.storyName = 'Square Boutique Item Detail';