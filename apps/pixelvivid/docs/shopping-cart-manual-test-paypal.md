# PixelVivid Shopping Cart Manual Test

Use this guide to test the PixelVivid store without creating a live PayPal transaction.

## Important Safety Rules

- Use a PayPal **Sandbox** buyer account only.
- The checkout email must exactly match one of the configured sandbox buyer emails:
  - `pixelvivid@personal.example.com`
  - `pixelvivid@business.example.com`
- Do not use a personal PayPal account or a real payment card.
- Do not copy PayPal client IDs, secrets, or other API credentials into this document, a ticket, or a browser field.
- The sandbox account password is maintained separately. Do not store it in the repository.
- If the checkout email does not match a configured sandbox email, stop before clicking the PayPal payment button. That checkout can use the production PayPal configuration.

## Test Data

Use clearly synthetic customer information when the cart asks for shipping or contact details:

- Name: `Jane Buyer`
- Email: the selected PayPal sandbox email above
- Address: `123 Market St`, `San Francisco`, `CA 94103`, `US`
- Phone: `5551234567`

The repository contains a PayPal API fixture with the following safe test card values:

- Number: `4111 1111 1111 1111`
- Expiration: `12/2028`
- Security code: `123`
- Name: `Jane Buyer`

That card fixture is for the PayPal sandbox API test. PayPal browser checkout normally uses the sandbox buyer account rather than entering this card directly. Do not use this fixture against a production checkout.

## Before Testing

1. Open the PixelVivid site and confirm the site is the intended environment.
2. Use a private browser window or clear the existing cart and checkout data.
3. Sign in to the PayPal Sandbox buyer account in a separate tab if the sandbox flow requests authentication.
4. Confirm the checkout email will be one of the two sandbox emails listed above.
5. Have access to the order mailbox so the order confirmation can be verified.

## Basic Cart Test

1. Open `/store`.
2. Open a product detail page.
3. Confirm the product title, image, price, and availability are correct.
4. Add one item to the cart.
5. Open `/cart` using the cart button.
6. Confirm the cart contains the selected item, quantity, unit price, subtotal, and total.
7. Increase the quantity and confirm the subtotal and total update.
8. Decrease the quantity and confirm the values update again.
9. Remove the item and confirm the empty-cart state appears.
10. Add the item again before continuing.

## Checkout Form Test

1. Enter the synthetic name, sandbox email, phone, and address from the test data section.
2. Confirm required fields prevent checkout when left empty.
3. Enter an invalid email and confirm the form rejects it.
4. Correct the email to the selected sandbox buyer email.
5. If a valid discount code has been supplied for the release, apply it and verify the discount appears in the totals. Do not invent a discount code.
6. Enter an invalid discount code and confirm the checkout handles it without changing the total.
7. For a shippable item, select a shipping rate and verify the selected rate appears in the summary.
8. Confirm the final total before opening PayPal.

## PayPal Sandbox Payment Test

1. Confirm the shipping/contact email still exactly matches the selected sandbox email.
2. Click the PayPal checkout button.
3. Confirm the PayPal flow opens in the sandbox environment.
4. Sign in with the sandbox buyer account, if requested.
5. Confirm the PayPal order amount matches the PixelVivid cart total.
6. Approve the payment in the sandbox account.
7. Return to PixelVivid and confirm the thank-you or receipt state appears.
8. Confirm the receipt includes the order/payment identifier, amount, payment status, date, and purchased items.
9. Confirm the order confirmation email is sent to the configured order mailbox.
10. Confirm no real PayPal transaction was created.

## Cancellation and Failure Tests

Run these before a successful payment if the cart must be preserved for another test.

- Cancel the PayPal approval and confirm the user returns to the cart without a completed order.
- Close the PayPal window and confirm the cart remains usable.
- Submit the checkout with missing required fields and confirm no payment window opens.
- Use an invalid discount code and confirm the cart remains stable.
- Temporarily test an invalid or unavailable product only in an approved non-production environment.
- Never test a non-sandbox email by clicking PayPal. A non-matching email can select the production PayPal credentials.

## Expected Results

- Cart quantities, removals, discounts, shipping, and totals remain consistent.
- Validation errors are visible and do not create an order.
- PayPal opens with the sandbox buyer account when the email matches the allowlist.
- A successful sandbox payment produces a receipt and order confirmation.
- A cancelled or failed payment does not produce a completed order.
- No production charge is made during this test.

## Troubleshooting

### PayPal does not appear

Confirm the cart has a configured payment provider and reload the page. Check that the checkout form has completed successfully.

### PayPal opens the wrong environment

Stop immediately. Confirm the checkout email exactly matches one of the sandbox emails. Do not approve the payment. Clear the cart, correct the email, and restart the test.

### The sandbox payment succeeds but no receipt appears

Record the checkout time, sandbox email, cart total, and any visible payment/order identifier. Check the browser console and the order mailbox, then report the details without including credentials or full card data.

### The payment fails

Record the visible error, whether the cart total was correct, and whether the failure occurred before or after PayPal approval. Do not retry with a real account or card.
