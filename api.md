# API Wireframe

## 1. Overview

**Name:** _API Name_  
**Description:** _Short description of what this API does_  
**Base URL:** `https://localhost:5000/api`  
**Auth:** _API Key / OAuth2 / None_  

---

## 2. Authentication

### 🔐 Method

- **Type:** _API Key | Bearer Token | OAuth2 | etc._
- **Header Example:**

```http
Authorization: Bearer <token>
```

---

## 3. Endpoints

### User Authentication

Logging in a user.

**Request**

```bash
POST /auth/login

{
    username: "John",
    password: "bbb2c5e63d2ef893106fdd0d797aa97a",
}
```
**Response**

```bash 
{
    message: "Login successful", 
    userToken: "Token"
}
```

### 3.1. GET /resource

Fetch all resources with optional filtering.

**Request:**

```bash
GET /resource?limit=10&sort=asc
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| limit | int | no | Number of items |
| sort | string | no | Sort order |

**Response:**

```json
{
    "data": [],
    "meta": {
        "count": 0
    }
}
```

### 3.2. GET /resource/{id}

Fetch a single item by ID.

**Request:**

```bash
GET /resource/{id}
```

**Response:**

```json
{
    "id": 1,
    "name": "Item name",
    "created_at": "2025-01-01T10:00:00Z"
}
```

### 3.3. POST /resource

Create a new item.

**Request Body:**

```json
{
    "name": "Example item",
    "value": 123
}
```

**Response:**

```json
{
    "id": 2,
    "name": "Example item",
    "value": 123,
    "created_at": "2025-01-01T10:00:00Z"
}
```

### 3.4. PUT /resource/{id}

Update an existing item.

**Request Body:**

```json
{
    "name": "Updated item",
    "value": 999
}
```

**Response:**

```json
{
    "id": 2,
    "name": "Updated item",
    "value": 999
}
```

### 3.5. DELETE /resource/{id}

Delete an item.

**Response:**

```json
{
    "status": "deleted",
    "id": 2
}
```

---

## 4. Error Format

```json
{
    "error": {
        "code": 400,
        "message": "Invalid request"
    }
}
```

---

## 5. Rate Limits

| Limit Type | Value |
|-----------|-------|
| Requests/minute | 60 |
| Burst limit | 10 |

---

## 6. Example cURL Requests

**Create:**

```bash
curl -X POST https://api.example.com/v1/resource \
    -H "Authorization: Bearer TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name": "Item"}'
```

**Fetch All:**

```bash
curl https://api.example.com/v1/resource \
    -H "Authorization: Bearer TOKEN"
```
