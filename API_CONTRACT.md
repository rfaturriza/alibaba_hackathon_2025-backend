# API Contract: Alibaba Hackathon 2025 Backend

Base URL: `/api`

---

## 1. Get Products

**Endpoint:** `GET /api/products`

**Description:**
Get all products in the database.

**Response:**

- `200 OK`

```json
{
  "message": "Products fetched successfully",
  "data": [
    {
      "id": "6831cd71c172276f70d3b5c9",
      "nutrition": {
        "calory": "550 kcal",
        "protein": "25 g",
        "carbohydrate": "80 g",
        "fat": "20 g",
        "sugar": "10 g",
        "fiber": "5 g",
        "allergen_potential": "egg, gluten"
      },
      "_id": "6831cd71c172276f70d3b5c9",
      "images_url": [
        "http://147.139.169.55/static/1748094317105-557766886.jpeg",
        "http://147.139.169.55/static/1748094317181-274086011.jpeg"
      ],
      "title": "Nasi Goreng Spesial 6",
      "description": "Nasi goreng dengan ayam, telur, dan sayur.",
      "price": 25000,
      "merchant_id": "merchant_id",
      "createdAt": "2025-05-24T13:45:21.928Z",
      "updatedAt": "2025-05-24T13:45:21.928Z",
      "__v": 0
    }
  ]
}
```

---

## 2. Create Product

**Endpoint:** `POST /api/products`

**Description:**
Create a new product. Accepts multiple images and generates nutrition info using LLM.

**Request (multipart/form-data):**

- `title`: string (required)
- `description`: string (required)
- `price`: number (required)
- `merchant_id`: string (optional)
- `images`: file[] (required, 1 or more images)

**Response:**

- `201 Created`

```json
{
  "message": "Product added",
  "data": {
    "id": "string",
    "images_url": ["/static/filename1.jpg", ...],
    "title": "string",
    "description": "string",
    "price": 25000,
    "nutrition": {
      "calory": "string",
      "protein": "string",
      "carbohydrate": "string",
      "fat": "string",
      "sugar": "string",
      "fiber": "string",
      "allergen_potential": "string"
    },
    "merchant_id": "string|null",
    "createdAt": "ISODate",
    "updatedAt": "ISODate"
  }
}
```

**Errors:**

- `400 Bad Request` (missing fields, duplicate title, image upload failed)
- `500 Internal Server Error` (nutrition parse error, server error)

---

## 3. Order Product

**Endpoint:** `POST /api/order`

**Description:**
Order a product. Checks daily nutrition limits and saves order if within limits.

**Request (application/json):**

```json
{
  "product_id": "string",
  "force_order": false, // optional, default false, force order even if nutrition limits exceeded
  "user_id": "string"
}
```

**Response:**

- `201 Created` (order placed successfully)

```json
{
  "message": "Order placed successfully",
  "data": {
    "order_id": "string",
    "product": {
      "id": "string",
      "images_url": ["/static/filename1.jpg", ...],
      "title": "string",
      "description": "string",
      "price": 25000,
      "nutrition": {
          "calory": "string",
          "protein": "string",
          "carbohydrate": "string",
          "fat": "string",
          "sugar": "string",
          "fiber": "string",
          "allergen_potential": "string"
      },
      "merchant_id": "string|null",
      "createdAt": "ISODate",
      "updatedAt": "ISODate"
    },
    "user_id": "string",
    "createdAt": "ISODate",
    "updatedAt": "ISODate"
  }
}
```

- `200 OK` (nutrition exceeded)

```json
{
  "alert": true,
  "message": "⚠️ KALORI sudah melebihi batas harian. ...",
  "exceeded": [
    {
      "param": "kalori",
      "total": 2100,
      "limit": 2000
    }
  ]
}
```

- `404 Not Found` (product not found)
- `500 Internal Server Error`

---

## 4. Get Order Histories

**Endpoint:** `GET /api/histories?user_id=string`

**Description:**
Get all order histories for a user, sorted by most recent.

**Response:**

- `200 OK`

```json
{
   "message": "Order histories retrieved successfully",
   "data": [
    {
      "order_id": "string",
      "title": "string",
      "description": "string",
      "price": 25000,
      "product": {
        "id": "string",
        "images_url": ["/static/filename1.jpg", ...],
        "title": "string",
        "description": "string",
        "price": 25000,
        "nutrition": {
            "calory": "string",
            "protein": "string",
            "carbohydrate": "string",
            "fat": "string",
            "sugar": "string",
            "fiber": "string",
            "allergen_potential": "string"
        },
        "merchant_id": "string|null",
        "createdAt": "ISODate",
        "updatedAt": "ISODate"
      },
      "user_id": "string",
      "createdAt": "ISODate",
      "updatedAt": "ISODate"
    },
    ...
  ]
}
```

- `400 Bad Request` (missing user_id)
- `500 Internal Server Error`

---

## 5. Get Products Prompt (LLM Recommendation)

**Endpoint:** `GET /api/products-prompt?prompt=...`

**Description:**
Get product recommendations based on a user prompt, budget, and nutrition constraints using LLM. The LLM will:

- Only answer if the prompt is relevant to the product database.
- Arrange products based on price and daily recommended nutrition.
- Respect user budget and product quantity constraints.
- Return an empty array if no suitable products are found.
- Always return a strict JSON array of products (no extra text/markdown).

**Query Parameters:**

- `prompt`: string (required) — User's query, e.g. "I want 2 meals under 50,000 IDR with high protein"

**Response:**

- `200 OK`

```json
{
  "message": "Products fetched successfully",
  "data": [
    {
      "id": "6831cd71c172276f70d3b5c9",
      "nutrition": {
        "calory": "550 kcal",
        "protein": "25 g",
        "carbohydrate": "80 g",
        "fat": "20 g",
        "sugar": "10 g",
        "fiber": "5 g",
        "allergen_potential": "egg, gluten"
      },
      "_id": "6831cd71c172276f70d3b5c9",
      "images_url": [
        "http://147.139.169.55/static/1748094317105-557766886.jpeg",
        "http://147.139.169.55/static/1748094317181-274086011.jpeg"
      ],
      "title": "Nasi Goreng Spesial 6",
      "description": "Nasi goreng dengan ayam, telur, dan sayur.",
      "price": 25000,
      "merchant_id": "merchant_id",
      "createdAt": "2025-05-24T13:45:21.928Z",
      "updatedAt": "2025-05-24T13:45:21.928Z",
      "__v": 0
    },
    ...
  ]
}
```

- `400 Bad Request` (missing prompt, invalid JSON from LLM)
- `500 Internal Server Error` (OpenAI API error, server error)

---

## 6. Health Check

**Endpoint:** `GET /api`

**Response:**

- `200 OK`

```json
{ "message": "I am a live" }
```

---

## Notes

- All endpoints return JSON.
- For file uploads, use `multipart/form-data` with the field name `images`.
- Nutrition info (`nutrition`) is generated by LLM and may vary in structure.
- All times are in ISO 8601 format.
