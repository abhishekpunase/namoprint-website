# OMGS Print Backend

Node.js + Express + MongoDB backend for a personalized print-on-demand store.

## Setup

```bash
cp .env.example .env
npm install
npm run seed
npm run dev
```

Demo catalog, admin user, and homepage content are **not** created when the API starts. Run `npm run seed` when you want that data.

Required before real payment/upload production:

- Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
- Add AWS S3 env keys for cloud uploads. Without them, uploads are stored in local `uploads/`.
- Add Shiprocket credentials when shipping automation is ready.
- Change `JWT_*` secrets and `ADMIN_SETUP_SECRET` before production.
- Add SMTP env keys for real forgot-password emails. Without SMTP, the API returns a dev reset URL and logs it.

## Main APIs

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/admin/register` requires `setupSecret`
- `POST /api/auth/admin/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/account/profile`
- `PATCH /api/account/profile`
- `POST /api/account/addresses`
- `DELETE /api/account/addresses/:addressId`
- `GET /api/account/orders`
- `GET /api/account/payments`
- `GET /api/categories`
- `POST /api/categories`
- `PATCH /api/categories/:id`
- `DELETE /api/categories/:id`
- `GET /api/products`
- `GET /api/products/:slug`
- `POST /api/products`
- `PATCH /api/products/:id`
- `DELETE /api/products/:id`
- `POST /api/uploads/presigned-url` (alias: `/presign`) JSON `{ kind, fileName, contentType, sizeBytes }` — signed PUT URL
- `POST /api/uploads/complete` JSON `{ kind, key, fileName, contentType }` — saves S3 key, returns `{ asset }` with signed GET `url`
- `GET /api/uploads/:id/preview` — signed GET URL for `preview.webp` / original
- `POST /api/uploads/photo` multipart fallback when S3 is unset
- `POST /api/uploads/preview`
- `GET /api/cart`
- `POST /api/cart/items`
- `PATCH /api/cart/items/:itemId`
- `DELETE /api/cart/items/:itemId`
- `POST /api/orders/checkout`
- `GET /api/orders/my`
- `GET /api/orders/:id`
- `POST /api/payments/razorpay/order`
- `POST /api/payments/razorpay/verify`
- `POST /api/payments/webhook`
- `GET /api/admin/dashboard`
- `GET /api/admin/orders`
- `GET /api/admin/orders/:id`
- `PATCH /api/admin/orders/:id/status`
- `GET /api/admin/users`
- `GET /api/admin/users/:id`
- `PATCH /api/admin/users/:id/status`
- `GET /api/admin/products`
- `POST /api/admin/products`
- `PATCH /api/admin/products/:id`
- `DELETE /api/admin/products/:id`
- `GET /api/admin/categories`
- `POST /api/admin/categories`
- `PATCH /api/admin/categories/:id`
- `DELETE /api/admin/categories/:id`

Cart, upload, checkout, payment, account, and admin routes require JWT Bearer auth. Product and category listing remain public for browsing.

## Image Upload To Preview Logic

Direct-to-S3 with a **private** bucket (no AWS SDK in React):

1. React `POST /api/uploads/presigned-url` with file metadata only (not the bytes).
2. Express creates a short-lived **PUT** URL (`PutObject` + `getSignedUrl`). Keys stay on the server.
3. React `PUT`s the file straight to S3.
4. React `POST /api/uploads/complete` with the S3 `key`. Express verifies the object, for photos builds `preview.webp`, and stores **key** (not the file) in MongoDB.
5. Every API JSON response rewrites stored S3 URLs to short-lived **GET** signed URLs. React uses `<img src={url} />`.
6. `GET /api/uploads/:id/preview` refreshes a signed GET URL for one asset.

Local fallback: if AWS keys are missing, presign returns `directUpload: false` and the client uses multipart to disk.

### AWS setup (required once)

The bucket stays **private** — no public-read policy.

1. **IAM** — attach `deploy/iam-backend-s3-policy.json` to the IAM user in `AWS_ACCESS_KEY_ID`.
   A presigned URL only carries the signer's own permissions, so without `s3:PutObject`
   every upload fails with `AccessDenied`.
2. **Bucket CORS** — apply `deploy/s3-cors.json` so the browser is allowed to `PUT` and `GET`.

```bash
aws iam put-user-policy --user-name namoprint-backend \
  --policy-name namoprint-s3 --policy-document file://deploy/iam-backend-s3-policy.json
aws s3api put-bucket-cors --bucket namoprint-uploads \
  --cors-configuration file://deploy/s3-cors.json --region ap-south-1
```
