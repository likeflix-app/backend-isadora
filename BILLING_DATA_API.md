# Billing Data API Documentation

## Overview
All users now have a `datiDiFatturazione` (billing data) field that can be used to store invoicing information. This field is included in all user responses and can be updated by the user themselves or by admins.

## Database Field
- **Field Name (DB)**: `dati_di_fatturazione` (TEXT)
- **Field Name (API)**: `datiDiFatturazione` (camelCase)
- **Type**: String (TEXT in database)
- **Default**: `null`
- **Description**: Stores billing/invoicing information for the user

## API Endpoints

### 1. Get All Users (includes billing data)
```http
GET /api/users
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user-id",
      "email": "user@example.com",
      "name": "User Name",
      "role": "user",
      "mobile": "+39 123456789",
      "datiDiFatturazione": "Ragione Sociale: Example S.r.l.\nP.IVA: 12345678901\nIndirizzo: Via Roma 123, Milano",
      "createdAt": "2025-10-14T10:00:00.000Z",
      "updatedAt": "2025-10-14T10:00:00.000Z",
      "emailVerified": true
    }
  ],
  "count": 1
}
```

### 2. Get Current User Info (includes billing data)
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "user",
    "emailVerified": true,
    "datiDiFatturazione": "Billing info here..."
  }
}
```

### 3. Update Billing Data (NEW)
```http
PATCH /api/users/:userId/billing
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "datiDiFatturazione": "Ragione Sociale: Example S.r.l.\nP.IVA: 12345678901\nIndirizzo: Via Roma 123, Milano\nCodice Fiscale: ABC123DEF456\nPEC: example@pec.it"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Billing data updated successfully",
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "user",
    "mobile": "+39 123456789",
    "datiDiFatturazione": "Ragione Sociale: Example S.r.l.\nP.IVA: 12345678901\nIndirizzo: Via Roma 123, Milano\nCodice Fiscale: ABC123DEF456\nPEC: example@pec.it",
    "createdAt": "2025-10-14T10:00:00.000Z",
    "updatedAt": "2025-10-14T10:05:00.000Z",
    "emailVerified": true
  }
}
```

**Error Responses:**

- **401 Unauthorized** - No token provided
```json
{
  "success": false,
  "message": "Access token required"
}
```

- **403 Forbidden** - User trying to update someone else's data
```json
{
  "success": false,
  "message": "You can only update your own billing data"
}
```

- **400 Bad Request** - Missing billing data in request
```json
{
  "success": false,
  "message": "Billing data is required"
}
```

- **404 Not Found** - User not found
```json
{
  "success": false,
  "message": "User not found"
}
```

## Permissions

### Users
- ✅ Can view their own billing data via `GET /api/auth/me`
- ✅ Can update their own billing data via `PATCH /api/users/:userId/billing` (where `:userId` is their own ID)
- ❌ Cannot update other users' billing data

### Admins
- ✅ Can view all users' billing data via `GET /api/users`
- ✅ Can update any user's billing data via `PATCH /api/users/:userId/billing`

## Frontend Implementation Examples

### 1. Get Current User's Billing Data
```javascript
// Fetch current user info (includes billing data)
const response = await fetch('https://backend-isadora.onrender.com/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log(data.data.datiDiFatturazione); // User's billing data
```

### 2. Update Billing Data
```javascript
// Update user's billing data
const userId = 'user-id-here'; // Get from authenticated user
const billingData = `Ragione Sociale: Example S.r.l.
P.IVA: 12345678901
Indirizzo: Via Roma 123, Milano
Codice Fiscale: ABC123DEF456
PEC: example@pec.it`;

const response = await fetch(`https://backend-isadora.onrender.com/api/users/${userId}/billing`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    datiDiFatturazione: billingData
  })
});

const result = await response.json();
if (result.success) {
  console.log('Billing data updated successfully!');
}
```

### 3. React Component Example
```jsx
import { useState, useEffect } from 'react';

function BillingDataForm({ userId, token }) {
  const [billingData, setBillingData] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch current billing data
  useEffect(() => {
    async function fetchBillingData() {
      const response = await fetch('https://backend-isadora.onrender.com/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setBillingData(data.data.datiDiFatturazione || '');
    }
    fetchBillingData();
  }, [token]);

  // Update billing data
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `https://backend-isadora.onrender.com/api/users/${userId}/billing`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ datiDiFatturazione: billingData })
        }
      );

      const result = await response.json();
      if (result.success) {
        alert('Dati di fatturazione aggiornati con successo!');
      } else {
        alert('Errore: ' + result.message);
      }
    } catch (error) {
      alert('Errore di rete: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Dati di Fatturazione</h2>
      <textarea
        value={billingData}
        onChange={(e) => setBillingData(e.target.value)}
        placeholder="Inserisci i tuoi dati di fatturazione...&#10;Esempio:&#10;Ragione Sociale: Example S.r.l.&#10;P.IVA: 12345678901&#10;Indirizzo: Via Roma 123, Milano"
        rows="6"
        style={{ width: '100%' }}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Salvando...' : 'Salva Dati di Fatturazione'}
      </button>
    </form>
  );
}
```

## Suggested Billing Data Format

You can store the billing data as free text, but here's a suggested format:

```
Ragione Sociale: [Company Name]
P.IVA: [VAT Number]
Codice Fiscale: [Tax Code]
Indirizzo: [Address]
CAP: [ZIP Code]
Città: [City]
Provincia: [Province]
PEC: [Certified Email]
Codice Univoco: [Unique Code for e-invoicing]
```

## Migration Note

The `dati_di_fatturazione` column is automatically added to the users table when the server starts. Existing users will have this field set to `null` until they update it.

## Testing

### Test the endpoint with curl:
```bash
# Update billing data
curl -X PATCH https://backend-isadora.onrender.com/api/users/YOUR_USER_ID/billing \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "datiDiFatturazione": "Ragione Sociale: Test S.r.l.\nP.IVA: 12345678901"
  }'

# Get user info (to verify the update)
curl https://backend-isadora.onrender.com/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Database Schema Update

The following column was added to the `users` table:
```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS dati_di_fatturazione TEXT;
```

This migration runs automatically when the server starts.

