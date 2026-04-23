# SneakerHead — UI Interaction Guide

## Prerequisites
Make sure all containers are running:
```bash
docker compose ps
```
All 6 services should show **healthy** status.

---

## Step 1: Seed Product Data
Run the seed script inside the product-service container:
```bash
docker exec sneakerhead-product-service python seed.py
```
Expected output: `✅ Seeded 30 products successfully.`

---

## Step 2: Open the Application
Open your browser and navigate to:
```
http://<your-server-ip>
```
You should see the **SneakerHead** homepage with:
- A hero section with a real sneaker background image
- "STEP INTO THE CULTURE" headline
- Brand carousel (Nike, Adidas, Jordan, etc.)
- Latest Drops section with 4 featured products
- Category tiles (Running, Basketball, Lifestyle, Skate, Training)
- Trending section with horizontally scrollable product cards

---

## Step 3: Browse Products
1. Click **"Shop Now"** on the hero or **"Shop"** in the navbar
2. You'll see the **Product Listing** page with:
   - Left sidebar with filters (Brand, Size, Price Range, Category)
   - Product grid showing 30 seeded sneakers with real images
   - Sort dropdown (Featured, Price Low→High, Price High→Low, Newest, Popular)
3. Try applying filters:
   - Select a brand like **Nike**
   - Toggle a size like **US 10**
   - Set a price range
   - Notice the filter chips appear above the grid

---

## Step 4: View Product Details
1. Click on any product card
2. The **Product Detail** page shows:
   - Image gallery with thumbnails
   - Brand, name, colorway, SKU
   - Star rating and review count
   - Price in ₹ (with sale price if applicable)
   - Size selector grid (US 7–13)
   - Quantity selector
   - "Add to Cart" button
   - Accordion with Description, Materials, Care, Shipping info
   - Related products section

---

## Step 5: Register an Account
1. Click **"Sign Up"** in the navbar
2. Fill in:
   - **Name**: Your full name
   - **Email**: e.g., `test@example.com`
   - **Password**: At least 6 characters
3. Click **"Create Account"**
4. You'll be redirected to the homepage, now logged in

---

## Step 6: Add Items to Cart
1. Go to any product detail page
2. Select a **size** (e.g., US 10)
3. Choose **quantity** (1–10)
4. Click **"Add to Cart"** → Button turns green showing "✓ Added to Cart"
5. The **cart badge** on the navbar updates with item count
6. Click the **cart icon** in the navbar to open the slide-out **Cart Drawer**

---

## Step 7: Review Cart
1. Click the **cart icon** to open the Cart Drawer showing:
   - Product image, name, size, price
   - Quantity controls (+/−)
   - Remove button (trash icon)
   - Subtotal, Shipping (free over ₹150), Total
2. Click **"View Full Cart"** to see the full Cart page
3. On the Cart page you can:
   - Adjust quantities
   - Remove items
   - Enter a promo code
   - See the Order Summary with tax calculation

---

## Step 8: Checkout
1. Click **"Proceed to Checkout"** from the Cart
2. **Step 1 – Shipping**: Fill in shipping details
   - Full Name, Email, Phone
   - Address Line 1, City, State, ZIP, Country
   - Click **"Continue to Payment →"**
3. **Step 2 – Payment**: Enter demo card details
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/28`
   - CVV: `123`
   - Click **"Review Order →"**
4. **Step 3 – Review**: Verify shipping address and items
   - Click **"Place Order"**

---

## Step 9: Order Confirmation
After placing the order:
- You'll see a **green success banner** with "🎉 Order Placed Successfully!"
- Order details with items, shipping address, and summary
- Order status badge (Pending)

---

## Step 10: View Order History
1. Click **"Orders"** in the navbar
2. The **Order History** page shows all past orders with:
   - Order ID, date, status badge
   - Product thumbnails
   - Total amount in ₹
3. Click on any order to expand and see items
4. Click **"View Full Details →"** for the complete order page

---

## Step 11: Manage Profile
1. Click **"Profile"** in the navbar
2. View your account details (name, email)
3. Manage your saved addresses

---

## Step 12: Search
1. Use the **search bar** in the navbar
2. Type a keyword like "Air Max" or "Jordan"
3. Press Enter to see filtered results

---

## Step 13: Logout
Click **"Logout"** in the navbar to sign out. You'll be redirected to the homepage.

---

## Quick API Health Checks (Optional)
```bash
# Gateway health
curl http://<server-ip>/health

# Auth endpoint (should return 422 - missing body)
curl http://<server-ip>/api/v1/auth/login

# Products list
curl http://<server-ip>/api/v1/products

# Featured products
curl http://<server-ip>/api/v1/products/featured?limit=4
```
