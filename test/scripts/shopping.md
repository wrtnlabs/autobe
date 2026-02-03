# E-Commerce Shopping Mall Platform

I want to create an e-commerce shopping mall platform.

## Customer Account

- This platform requires registration to use any features (no guest browsing)
- Customers sign up with email and password
- Customers log in with email and password
- Customers can change their password
- Customers can delete their account
- When a customer deletes their account:
  - Their profile information is deleted
  - Their orders and order history are preserved (for seller records and legal purposes)
  - Their reviews are preserved but shown as "deleted user"

## Customer Profile

- Each customer has a profile with: display name and phone number
- Customers can edit their display name and phone number

## Address Management

- Customers can add multiple shipping addresses
- Each address has: recipient name, phone number, street address, city, state/province, postal code, country
- Customers can edit their addresses
- Customers can delete their addresses
- Customers can set one address as the default shipping address

## Seller Account

- Sellers sign up with email and password
- Sellers log in with email and password
- Sellers can change their password
- Seller accounts require administrator approval before they can sell
- Sellers can view their approval status (pending, approved, rejected)
- If rejected, sellers can view the rejection reason
- Rejected sellers can submit a new registration request
- Sellers can delete their account only if:
  - They have no pending orders (paid or shipped status)
  - They have no pending cancellation or refund requests
- When a seller deletes their account:
  - Their products are deleted from listings
  - Order history and snapshots are preserved
  - Their shop name in past orders is preserved

## Seller Profile

- Each seller has a profile with: shop name, shop description, and logo image
- Sellers can edit their shop name, description, and logo
- Every edit creates a snapshot
- Customers can view seller profiles

## Categories

- Products are organized into categories
- Categories can have subcategories (one level of nesting only)
- Each category has: name and description
- Categories are created and managed by administrators only
- Customers can browse the list of all categories
- Customers can view products within a category

## Snapshot Principle

- This is a platform where money is exchanged, so all data modifications must be recorded
- Whenever editable data is modified, a snapshot is created to preserve the previous state
- Snapshots record: when the change was made, what was changed, and the values before and after
- Snapshots are immutable and cannot be deleted
- Snapshots can be viewed by relevant parties (owners, administrators) for dispute resolution

**Product Snapshot Structure**
- When a product is edited, a product snapshot is created
- The product snapshot includes all product fields (name, description, category, base price, images)
- The product snapshot also includes snapshots of all variants at that moment (product-snapshot → product-snapshot-SKU)
- This preserves the complete state of a product and its variants at any point in time

**Snapshot applies to:**
- Products (all fields including images)
- Product variants (SKU code, option values, price)
- Seller profiles (shop name, description, logo)
- Order items (product, variant, and seller profile at time of purchase)
- Reviews (rating, text content)
- Cancellation requests (reason, status changes)
- Refund requests (reason, status changes)

## Products

- Sellers can create products
- Every product has:
  - Name (required)
  - Description (required)
  - Category (required, can select a subcategory)
  - Base price (required)
- Products belong to the seller who created them
- Sellers can edit their own products
- Every edit creates a snapshot
- Sellers can delete their own products only if:
  - There are no pending order items (paid or shipped status) for any variant of the product
  - There are no pending cancellation or refund requests for any variant of the product
- Deleting a product also deletes all its variants and inventory records
- Deleted products no longer appear in search or category listings
- Sellers can view snapshots of their own products
- Administrators can view snapshots of any product
- Snapshots are preserved even after product deletion

## Product Images

- Sellers can upload multiple images for each product
- Images can be reordered (first image is the main/thumbnail image)
- Sellers can delete images from their products
- Image changes are included in product snapshots

## Product Variants (SKU)

- A product can have multiple variants
- Each variant represents a specific combination of options (e.g., "Red / Large", "Blue / Small")
- Each variant has:
  - SKU code (unique identifier, required)
  - Option values (e.g., color: "Red", size: "Large")
  - Price (can override the base price, optional)
  - Stock quantity (required, starts at 0)
- Sellers can add variants to their products
- Sellers can edit variants (SKU code, option values, price)
- Every variant edit creates a snapshot
- Sellers can delete variants only if:
  - There are no pending order items (paid or shipped status) for that variant
  - There are no pending cancellation or refund requests for that variant
- A product must have at least one variant to be purchasable
- Products with no variants are visible in search but shown as "unavailable"

## Inventory Management

- Each variant has its own stock quantity
- Stock quantity is managed through inventory history records (not snapshots)
- Each inventory record contains: quantity change (positive for restocking, negative for orders/adjustments), reason, and timestamp
- Current stock is calculated by summing all inventory records
- Sellers can add inventory (restock) with a quantity and reason
- Sellers can subtract inventory (adjustment/loss) with a quantity and reason
- Order placement automatically creates a negative inventory record
- Order cancellation/refund automatically creates a positive inventory record
- Sellers can view the full inventory history of each variant
- When stock reaches 0, the variant is shown as "out of stock"
- Out of stock variants cannot be added to cart

## Product Search

- Customers can search products by name
- Search results show products from all sellers
- Search results are paginated
- Customers can filter search results by:
  - Category
  - Price range (minimum and maximum)
  - In-stock only
- Customers can sort search results by:
  - Newest first
  - Price (low to high)
  - Price (high to low)

## Product Listing

- When viewing a list of products (search results, category page), each product shows:
  - Main image (thumbnail)
  - Name
  - Base price (or price range if variants have different prices)
  - Seller shop name
  - Average rating (if reviews exist)

## Product Detail Page

- Customers can view a single product's full details
- The page shows:
  - All images
  - Name and description
  - Category
  - Seller shop name (links to seller profile)
  - All available variants with prices and stock status
  - Average rating and total review count
  - All reviews

## Wishlist

- Customers can add products to their wishlist
- Customers can view their wishlist
- The wishlist is paginated
- Wishlist shows products (not specific variants)
- Customers can remove products from their wishlist
- If a product is deleted by the seller, it is automatically removed from all wishlists

## Shopping Cart

- Customers can add variants to their cart (must select a specific variant, not just a product)
- When adding to cart, customers specify the quantity
- If the same variant is already in the cart, the quantities are combined (not added as a separate line)
- Customers can view their cart
- Cart shows each item with: product name, variant options, price, quantity, and subtotal
- Customers can change the quantity of items in their cart
- Customers can remove items from their cart
- Cart shows the total price of all items
- If a variant's stock is less than the cart quantity, a warning is shown
- If a variant is deleted or out of stock, it is marked as unavailable in the cart

## Checkout

- Customers can proceed to checkout from their cart
- Unavailable items cannot be checked out
- Customers must select a shipping address (or use default)
- Customers can review the order summary before placing the order:
  - List of items with prices
  - Shipping address
  - Total price
- Once an order is placed, the shipping address cannot be changed

## Payment

- After reviewing, customers confirm and place the order
- Payment is processed (assume external payment gateway integration)
- Payment can succeed or fail
- If payment fails, the order is not created and customers can retry
- If payment succeeds, the order is created

## Order Creation

- When an order is placed successfully:
  - Stock quantities are decreased for each purchased variant
  - Items are removed from the customer's cart
  - An order record is created
  - Each purchased variant becomes an order item with status "paid"
  - A snapshot of each purchased product and variant is saved with the order item (preserves product name, description, variant options, and price at the time of purchase)
  - A snapshot of each seller's profile is saved with the order item (preserves shop name and logo at the time of purchase)

## Order Structure

- An order contains one or more order items
- Each order item represents a purchased product variant with a quantity
- If a customer buys 3 of the same variant, it becomes one order item with quantity 3
- Order items can be from different sellers
- Each order item has its own status
- Each order item can be individually cancelled or refunded
- Order items are grouped into shipments when shipped (see Shipping and Tracking)

## Order History

- Customers can view a list of all their orders
- The list is paginated and sorted by newest first
- Each order in the list shows: order number, date, total price, and overall order status
- Customers can view the full details of an order:
  - List of items with: product name, variant, quantity, price, and item status
  - Shipping address
  - List of shipments with tracking information (each shipment shows which items are included)

## Order Status

**Order Item Status**
- Each item in an order has its own status
- Item statuses:
  - Paid: payment completed, waiting for seller to ship
  - Shipped: seller has shipped the item
  - Delivered: item has been delivered
  - Cancelled: item was cancelled
  - Refunded: item was refunded

**Order Status**
- The overall order status is derived from its items
- If all items are paid → order is "paid"
- If any item is shipped (and none delivered yet) → order is "shipped"
- If all items are delivered → order is "delivered"
- If all items are cancelled → order is "cancelled"
- If all items are refunded → order is "refunded"
- Mixed states (e.g., some delivered, some refunded) → order is "partially completed"

## Shipping and Tracking

**Shipment Concept**
- A shipment is a package sent by a seller
- A shipment can contain one or more order items from the same seller
- Different sellers always ship separately (different shipments)
- A seller can choose to ship items individually or bundle multiple items into one shipment

**Shipping Process**
- Sellers can view order items for their products that need shipping
- When shipping, sellers select one or more of their items to include in a shipment
- Sellers enter tracking information for the shipment (carrier name, tracking number)
- All items in the same shipment share the same tracking information
- When a shipment is created, all items in it change to status "shipped"

**Delivery Confirmation**
- Customers can view tracking information for each shipment
- Customers confirm delivery per shipment (not per item)
- When the customer confirms delivery, all items in that shipment change to status "delivered"
- If the customer does not confirm, items automatically change to "delivered" after 14 days from shipping

## Order Cancellation

- Cancellation is handled per order item, not per entire order
- Customers can request cancellation for individual items with status "paid" (not yet shipped)
- Cancellation requests include a reason (text)
- The seller of that item can approve or reject the cancellation request
- When a seller responds, a snapshot of the request state is created
- If approved, that item is cancelled and refund is processed for that item only
- Cancelled items restore their stock quantities (via inventory record)
- The remaining items in the order continue processing normally
- If all items in an order are cancelled, the entire order status becomes "cancelled"

## Refund Requests

- Refund is handled per order item, not per entire order
- Customers can request a refund for individual items with status "delivered"
- Refund requests include a reason (text)
- Refund can be requested within 7 days of that item being delivered
- The seller of that item can approve or reject the refund request
- When a seller responds, a snapshot of the request state is created
- If approved, that item is refunded
- Refunded items restore their stock quantities (via inventory record)
- The remaining items in the order are unaffected
- If all items in an order are refunded, the entire order status becomes "refunded"

## Reviews and Ratings

- Customers can write a review for products they have purchased
- A review can only be written after that item's status is "delivered"
- Customers can write one review per product per order
- Each review has:
  - Rating (1 to 5 stars, required)
  - Text content (optional)
- Reviews are displayed on the product detail page
- Reviews are sorted by newest first
- Customers can edit their own reviews
- Every review edit creates a snapshot
- Customers can delete their own reviews (but snapshots are preserved)
- Product's average rating is calculated from all non-deleted reviews

## Seller Dashboard

- Sellers can view a summary of their shop:
  - Total number of products
  - Total number of order items (for their products)
  - Number of pending cancellation requests
  - Number of pending refund requests
- Sellers can view a list of all order items for their products
- Sellers can filter order items by status

## Administrator System

**Becoming an Administrator**
- Any user (customer or seller) can submit a request to become an administrator
- The request includes a reason (text)
- Super administrators can view the list of pending requests
- Super administrators can approve or reject requests
- When approved, the user becomes a regular administrator

**Administrator Grades**
- There are two grades: regular administrator and super administrator
- Super administrators can promote regular administrators to super administrator
- Super administrators can demote other super administrators to regular administrator
- Super administrators cannot demote themselves

**Seller Management**
- Administrators can view the list of pending seller approvals
- Administrators can approve or reject seller registrations
- When rejecting, administrators must provide a reason
- Rejected sellers can submit a new registration request
- Administrators can suspend seller accounts
- When a seller is suspended:
  - Their products are hidden from search and category listings
  - Their products cannot be purchased
  - They can still process existing orders (ship items, respond to cancellation/refund requests)
  - They cannot create new products or edit existing products
- Administrators can unsuspend seller accounts (products become visible again)

**Category Management**
- Administrators can create categories and subcategories
- Administrators can edit category names and descriptions
- Administrators can delete categories (products in deleted categories become uncategorized)

**Product Oversight**
- Administrators can view all products on the platform
- Administrators can view snapshots of any product
- Administrators can delete any product (for policy violations)

**Order Oversight**
- Administrators can view all orders on the platform
- Administrators can force-cancel individual items or entire orders (refunds the customer, restores stock)
- Administrators can force-refund individual items or entire orders

**User Management**
- Administrators can view all customer accounts
- Administrators can ban customers (banned customers cannot log in)
- Administrators can unban customers
- Administrators can view all seller accounts
- Administrators can ban sellers (banned sellers cannot log in, existing orders remain)

Please analyze these requirements and create a detailed requirements specification document.