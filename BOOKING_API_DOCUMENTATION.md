# Booking System API Documentation

## Database Schema

### Bookings Table

```sql
CREATE TABLE bookings (
  id VARCHAR(255) PRIMARY KEY,              -- Format: BOOK-{timestamp}
  user_id VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(255),
  time_slot_date VARCHAR(255) NOT NULL,     -- e.g., "martedì 14 ottobre"
  time_slot_time VARCHAR(255) NOT NULL,     -- e.g., "10:00"
  time_slot_datetime TIMESTAMP NOT NULL,    -- ISO datetime string
  talents JSONB NOT NULL,                   -- Array of talent objects
  price_range VARCHAR(50) NOT NULL,         -- e.g., "€€€", "€€€€"
  user_idea TEXT,                           -- Personal note from user
  status VARCHAR(50) DEFAULT 'confirmed',   -- pending/confirmed/completed/cancelled
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_bookings_user_id` - For fast user lookup
- `idx_bookings_status` - For status filtering
- `idx_bookings_created_at` - For date sorting

---

## API Endpoints

### 1. Create Booking

**POST** `/api/bookings`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "userId": "user123",
  "userEmail": "user@example.com",
  "userName": "John Doe",
  "phoneNumber": "+39 123 456 7890",
  "timeSlot": {
    "date": "martedì 14 ottobre",
    "time": "10:00",
    "datetime": "2024-10-14T10:00:00.000Z"
  },
  "talents": [
    {
      "id": "talent1",
      "name": "Francesca Oliva",
      "category": "Moda",
      "price": "€€€"
    }
  ],
  "priceRange": "€€€",
  "userIdea": "Voglio creare una collezione di abiti per il prossimo anno"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "BOOK-1234567890",
    "userId": "user123",
    "userEmail": "user@example.com",
    "userName": "John Doe",
    "phoneNumber": "+39 123 456 7890",
    "timeSlot": {
      "date": "martedì 14 ottobre",
      "time": "10:00",
      "datetime": "2024-10-14T10:00:00.000Z"
    },
    "talents": [
      {
        "id": "talent1",
        "name": "Francesca Oliva",
        "category": "Moda",
        "price": "€€€"
      }
    ],
    "priceRange": "€€€",
    "userIdea": "Voglio creare una collezione di abiti per il prossimo anno",
    "status": "confirmed",
    "createdAt": "2024-10-07T10:00:00.000Z",
    "updatedAt": "2024-10-07T10:00:00.000Z"
  }
}
```

**Validation:**
- All fields marked as required must be present
- `timeSlot` must include `date`, `time`, and `datetime`
- `talents` must be a non-empty array
- User must be authenticated

---

### 2. Get All Bookings (Admin Only)

**GET** `/api/bookings`

**Authentication:** Required (Admin role)

**Query Parameters:**
- `status` (optional) - Filter by status: `pending`, `confirmed`, `completed`, `cancelled`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "BOOK-1234567890",
      "userId": "user123",
      "userEmail": "user@example.com",
      "userName": "John Doe",
      "phoneNumber": "+39 123 456 7890",
      "timeSlot": {
        "date": "martedì 14 ottobre",
        "time": "10:00",
        "datetime": "2024-10-14T10:00:00.000Z"
      },
      "talents": [...],
      "priceRange": "€€€",
      "userIdea": "...",
      "status": "confirmed",
      "createdAt": "2024-10-07T10:00:00.000Z",
      "updatedAt": "2024-10-07T10:00:00.000Z"
    }
  ],
  "count": 1,
  "stats": {
    "total": 10,
    "pending": 2,
    "confirmed": 5,
    "completed": 2,
    "cancelled": 1
  }
}
```

---

### 3. Get Booking by ID

**GET** `/api/bookings/:bookingId`

**Authentication:** Required

**Permissions:** 
- Any authenticated user can view any booking

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "BOOK-1234567890",
    "userId": "user123",
    "userEmail": "user@example.com",
    "userName": "John Doe",
    "phoneNumber": "+39 123 456 7890",
    "timeSlot": {
      "date": "martedì 14 ottobre",
      "time": "10:00",
      "datetime": "2024-10-14T10:00:00.000Z"
    },
    "talents": [...],
    "priceRange": "€€€",
    "userIdea": "...",
    "status": "confirmed",
    "createdAt": "2024-10-07T10:00:00.000Z",
    "updatedAt": "2024-10-07T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `404 Not Found` - Booking doesn't exist

---

### 4. Update Booking Status (Admin Only)

**PATCH** `/api/bookings/:bookingId/status`

**Authentication:** Required (Admin role)

**Request Body:**
```json
{
  "status": "completed"
}
```

**Valid Status Values:**
- `pending`
- `confirmed`
- `completed`
- `cancelled`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Booking status updated to completed",
  "data": {
    "id": "BOOK-1234567890",
    "userId": "user123",
    "userEmail": "user@example.com",
    "userName": "John Doe",
    "phoneNumber": "+39 123 456 7890",
    "timeSlot": {
      "date": "martedì 14 ottobre",
      "time": "10:00",
      "datetime": "2024-10-14T10:00:00.000Z"
    },
    "talents": [...],
    "priceRange": "€€€",
    "userIdea": "...",
    "status": "completed",
    "createdAt": "2024-10-07T10:00:00.000Z",
    "updatedAt": "2024-10-07T12:30:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid status value
- `404 Not Found` - Booking doesn't exist

---

### 5. Get User's Bookings

**GET** `/api/bookings/user/:userId`

**Authentication:** Required

**Permissions:**
- Any authenticated user can view any user's bookings

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "BOOK-1234567890",
      "userId": "user123",
      "userEmail": "user@example.com",
      "userName": "John Doe",
      "phoneNumber": "+39 123 456 7890",
      "timeSlot": {
        "date": "martedì 14 ottobre",
        "time": "10:00",
        "datetime": "2024-10-14T10:00:00.000Z"
      },
      "talents": [...],
      "priceRange": "€€€",
      "userIdea": "...",
      "status": "confirmed",
      "createdAt": "2024-10-07T10:00:00.000Z",
      "updatedAt": "2024-10-07T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

## Authentication

All endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer {jwt_token}
```

### Token Generation
Tokens are generated via the `/api/auth/login` endpoint.

### User Roles
- **user** - Can create bookings and view any user's bookings
- **admin** - Can view all bookings and update booking statuses

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Missing required fields: userId, userEmail, userName, timeSlot, talents, priceRange"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access token required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Admin access required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Booking not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error creating booking",
  "error": "Detailed error message"
}
```

---

## Example Usage

### Create a Booking (cURL)
```bash
curl -X POST https://your-api.com/api/bookings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "userEmail": "user@example.com",
    "userName": "John Doe",
    "phoneNumber": "+39 123 456 7890",
    "timeSlot": {
      "date": "martedì 14 ottobre",
      "time": "10:00",
      "datetime": "2024-10-14T10:00:00.000Z"
    },
    "talents": [
      {
        "id": "talent1",
        "name": "Francesca Oliva",
        "category": "Moda",
        "price": "€€€"
      }
    ],
    "priceRange": "€€€",
    "userIdea": "Voglio creare una collezione di abiti"
  }'
```

### Get All Bookings (Admin)
```bash
curl -X GET https://your-api.com/api/bookings \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Update Booking Status (Admin)
```bash
curl -X PATCH https://your-api.com/api/bookings/BOOK-1234567890/status \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
```

---

## Database Query Functions

The following helper functions are available in `db.js`:

```javascript
// Create booking
bookingQueries.create(bookingData)

// Get all bookings (with optional status filter)
bookingQueries.getAll(statusFilter)

// Find booking by ID
bookingQueries.findById(bookingId)

// Find bookings by user ID
bookingQueries.findByUserId(userId)

// Update booking status
bookingQueries.updateStatus(bookingId, status)

// Update booking
bookingQueries.update(bookingId, updates)

// Delete booking
bookingQueries.delete(bookingId)

// Get booking statistics
bookingQueries.getStats()
```

---

## Notes

- Booking IDs are auto-generated with the format `BOOK-{timestamp}`
- All timestamps are stored in PostgreSQL `TIMESTAMP` format
- The `talents` field is stored as JSONB in PostgreSQL for efficient querying
- The `updated_at` field is automatically updated on every modification
- Phone number is optional
- User idea/note is optional
- Default status is `confirmed` when creating a new booking

