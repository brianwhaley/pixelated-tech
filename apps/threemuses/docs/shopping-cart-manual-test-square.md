# The Three Muses Shopping Cart Manual Test

Use this guide to test the Three Muses boutique and event checkout without creating a live Square transaction.

## Important Safety Rules

- Use Square **Sandbox** only.
- The checkout email must exactly match the configured sandbox email:
  - `pixelvivid@personal.example.com`
- Do not use a real customer email, real Square account, or real payment card.
- The site has production Square configuration available. A checkout email that does not match the sandbox email can select the production Square application and location.
- Do not copy Square application IDs, access tokens, app secrets, or other API credentials into this document, a ticket, or a browser field.
- The Square sandbox account password is maintained separately. Do not store it in the repository.

## Test Data

Use synthetic customer information:

- Name: `Brian T Whaley` or `Jane Buyer`
- Email: `pixelvivid@personal.example.com`
- Phone: `5551234567`
- Address, when requested: `10 Jade Circle`, `Denville`, `NJ 07834`, `US`
- Event child name, when requested: `OMGChild`
- Event child birth date, when requested: `2026-05-01`
- Food allergies: `cats` only when intentionally testing that field

The repository contains a successful Square sandbox response for a Visa card ending in `1111`, with an expiration month/year of `11/2031`, billing postal code `11111`, and a captured payment status. The complete browser card number is not verified in the site source. Use the approved Square Sandbox test card from the Square test account or Square documentation, and confirm the resulting receipt ends in `1111` when applicable.

A separate PayPal fixture contains `4111 1111 1111 1111`, expiration `12/2028`, and security code `123`. That fixture is not a verified Square browser card and must not be substituted for the Square test card without confirmation.

## Before Testing

1. Open the Three Muses site and confirm it is the intended environment.
2. Use a private browser window or clear the existing cart and checkout data.
3. Confirm the checkout email is exactly `pixelvivid@personal.example.com` before entering payment details.
4. Confirm the page is loading the Square Sandbox checkout, not the production checkout.
5. Have access to the configured order mailboxes so the confirmation can be verified.

## Basic Boutique Cart Test

1. Open `/boutique` or `/store`.
2. Confirm products display with the expected title, price, image, and availability.
3. Add one product to the cart.
4. Open `/cart`.
5. Confirm the cart contains the selected item, quantity, price, subtotal, handling fee, tax, and total.
6. Increase and decrease the quantity and confirm all applicable totals update.
7. Remove the item and confirm the empty-cart state.
8. Add the item again before continuing.

## Event Checkout Test

Use an event or summer-camp item for this test because event categories control the additional registration form.

1. Open `/events` or the appropriate event detail page.
2. Add an adult event, youth event, or summer-camp item to the cart.
3. Open `/cart`.
4. Confirm the additional checkout form appears for the event item.
5. Confirm adult fields appear for an adult event and youth fields appear for a youth or summer-camp event.
6. Complete the legal and registration fields with synthetic values.
7. Confirm required acknowledgements prevent checkout when left empty.
8. Add multiple event categories, if available, and confirm the form contains the fields required by all selected categories.
9. Confirm non-shippable event items do not require a shipping rate.

## Totals and Discount Test

The configured Three Muses checkout uses USD, a 3% handling fee, and a 6% sales-tax rate.

1. Record the item subtotal before any discount.
2. Confirm the configured discount behavior for the selected event or product.
3. Confirm the handling fee is calculated from the expected amount and displayed in USD.
4. Confirm sales tax is displayed and included in the final total.
5. Confirm the final amount sent to Square matches the amount shown in the cart.
6. If a valid discount scenario is available, verify the subtotal discount and recalculate the expected handling fee and tax.
7. Do not invent a discount code or treat a stale event promotion as valid.

## Square Sandbox Payment Test

1. Confirm the checkout email is exactly `pixelvivid@personal.example.com`.
2. Confirm the Square card form has loaded from the Sandbox SDK.
3. Enter the approved Square Sandbox test card.
4. Use the synthetic billing/contact data from the test data section.
5. Submit the payment.
6. Confirm card tokenization succeeds and the server capture request completes.
7. Confirm the thank-you or receipt state appears.
8. Confirm the receipt includes the payment/order identifier, captured status, amount, items, and card last four digits when provided by Square.
9. Confirm the order confirmation email is sent to the configured recipients.
10. Confirm the Square transaction is visible only in the Square Sandbox account and not in the production account.

## Cancellation and Failure Tests

- Leave a required registration or legal field empty and confirm no payment is attempted.
- Enter an invalid card value and confirm the Square form displays a validation error.
- Cancel or interrupt the payment before submission and confirm no completed order appears.
- Submit with an invalid checkout payload only in an approved non-production environment and confirm the API rejects it.
- Confirm a failed server capture displays a user-facing error and leaves the cart recoverable.
- Never test with an email other than the configured sandbox email. That can route the payment to production.

## Expected Results

- Cart quantities and item removal work correctly.
- Event-specific registration fields appear based on the selected item categories.
- Required legal and registration fields block incomplete checkout.
- Handling fee, tax, discount, and final total are internally consistent.
- Square loads in Sandbox and captures only a sandbox payment.
- The receipt and order email contain the expected order details.
- Failed or cancelled payments do not produce a completed order.
- No production charge is made during this test.

## Troubleshooting

### The Square form does not load

Confirm the page has loaded the Square Sandbox SDK and that the sandbox email is exact. Reload after clearing the cart and checkout state.

### The checkout appears to be production

Stop immediately and do not submit the payment. Correct the email to `pixelvivid@personal.example.com`, verify the Sandbox SDK, and restart the test.

### The registration form is missing

Confirm the selected cart item has an event-related category such as `event`, `adult`, `youth`, or `summer camp`. Remove unrelated items and add the event again.

### The total is unexpected

Record the item prices, quantity, discount, handling fee, tax, and shipping values separately. Compare them with the cart summary before attempting payment.

### Capture fails after card tokenization

Record the visible error, cart total, event/product IDs, and whether tokenization succeeded. Do not retry against production and do not include API credentials or full card data in the report.
