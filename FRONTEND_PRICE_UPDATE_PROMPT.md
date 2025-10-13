# Frontend Feature Request: Admin Price Update for Talent Profiles

## Overview
Implement a UI feature that allows **admin users only** to update the "price" field for talent profiles. The price is displayed as euro symbols (€) ranging from empty to €€€€€.

---

## Backend API Details

### Endpoint
```
PATCH /api/talent/applications/:id
```

### Authentication
- **Required**: Yes (JWT token in Authorization header)
- **Role Required**: `admin` (only admins can update the price field)

### Request Headers
```json
{
  "Authorization": "Bearer <JWT_TOKEN>",
  "Content-Type": "application/json"
}
```

### Request Body
```json
{
  "price": "€€€€€"
}
```

### Price Field Rules
1. **ADMIN ONLY**: Regular users will get a 403 Forbidden error
2. **Validation**: Must contain ONLY € symbols (e.g., "", "€", "€€", "€€€", "€€€€", "€€€€€")
3. **Format**: String of 0-5 euro symbols
4. **Empty value**: Use empty string `""` to clear the price

### Response Examples

**Success (200):**
```json
{
  "success": true,
  "application": {
    "id": "talent-123",
    "fullName": "Pacolino",
    "nickname": "Crescino",
    "price": "€€€€€",
    "status": "verified",
    // ... other fields
  }
}
```

**Error - Not Admin (403):**
```json
{
  "success": false,
  "message": "Only admins can update the price field"
}
```

**Error - Invalid Format (400):**
```json
{
  "success": false,
  "message": "Price field must contain only € symbols (e.g., \"€\", \"€€\", \"€€€\")"
}
```

---

## UI Implementation Requirements

### 1. Where to Display
- **Admin Dashboard**: Add a "Price" field in the talent profile view/edit page
- **Only show to admins**: Check if `user.role === 'admin'` before rendering

### 2. UI Component Suggestions

#### Option A: Dropdown Select
```jsx
<select value={price} onChange={(e) => setPrice(e.target.value)}>
  <option value="">No price set</option>
  <option value="€">€ (Budget-friendly)</option>
  <option value="€€">€€ (Moderate)</option>
  <option value="€€€">€€€ (Premium)</option>
  <option value="€€€€">€€€€ (Luxury)</option>
  <option value="€€€€€">€€€€€ (Elite)</option>
</select>
```

#### Option B: Star/Euro Rating System
```jsx
{/* Visual rating system where clicking adds/removes € symbols */}
<div className="price-rating">
  {[1, 2, 3, 4, 5].map(level => (
    <span
      key={level}
      onClick={() => setPrice('€'.repeat(level))}
      className={price.length >= level ? 'active' : 'inactive'}
    >
      €
    </span>
  ))}
  <button onClick={() => setPrice('')}>Clear</button>
</div>
```

### 3. API Call Example

```javascript
async function updateTalentPrice(talentId, priceValue) {
  try {
    const token = localStorage.getItem('authToken'); // or however you store it
    
    const response = await fetch(
      `${API_BASE_URL}/api/talent/applications/${talentId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          price: priceValue // e.g., "€€€€€"
        })
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update price');
    }
    
    console.log('Price updated successfully:', data.application.price);
    return data.application;
    
  } catch (error) {
    console.error('Error updating price:', error);
    alert(error.message);
    throw error;
  }
}

// Usage
await updateTalentPrice('talent-123', '€€€€€');
```

---

## User Flow

1. **Admin logs in** to the dashboard
2. **Views talent profile** (e.g., Pacolino/Crescino)
3. **Sees current price** (displayed as empty or € symbols)
4. **Clicks to edit** price field (via dropdown/rating/input)
5. **Selects new price** (e.g., €€€€€)
6. **Clicks Save/Update**
7. **API call is made** with the new price value
8. **Success message shown** and UI updates to reflect new price
9. **If user is not admin**: price field is hidden or read-only

---

## Testing Checklist

- [ ] Admin can see and edit the price field
- [ ] Non-admin users cannot see or edit the price field
- [ ] Price updates successfully when admin saves
- [ ] UI shows current price value correctly
- [ ] Can set price from empty to any € level (1-5)
- [ ] Can clear price back to empty
- [ ] Error messages display properly for validation failures
- [ ] Success feedback shows after successful update

---

## Design Notes

- **Visual**: Consider using gold/yellow colors for the € symbols to indicate price tiers
- **UX**: Make it clear this is an "admin only" field (maybe with a badge/icon)
- **Accessibility**: Ensure proper labels and ARIA attributes
- **Mobile**: Ensure the price selector works well on mobile devices

---

## Example Full Implementation (React)

```jsx
import { useState, useEffect } from 'react';

function TalentPriceEditor({ talentId, currentPrice, userRole }) {
  const [price, setPrice] = useState(currentPrice || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Only render for admins
  if (userRole !== 'admin') {
    return null;
  }

  const handlePriceUpdate = async (newPrice) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `/api/talent/applications/${talentId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ price: newPrice })
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message);
      }
      
      setPrice(newPrice);
      alert('Price updated successfully!');
      
    } catch (err) {
      setError(err.message);
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="price-editor">
      <label className="admin-badge">
        <span>💰 Price Tier (Admin Only)</span>
      </label>
      
      <div className="euro-selector">
        {[0, 1, 2, 3, 4, 5].map(level => (
          <button
            key={level}
            onClick={() => handlePriceUpdate('€'.repeat(level))}
            disabled={loading}
            className={price.length === level ? 'active' : ''}
          >
            {level === 0 ? 'None' : '€'.repeat(level)}
          </button>
        ))}
      </div>
      
      <div className="current-price">
        Current: <strong>{price || '(not set)'}</strong>
      </div>
      
      {error && <div className="error">{error}</div>}
    </div>
  );
}

export default TalentPriceEditor;
```

---

## Questions?

If you have questions about implementation, check:
1. Backend is running at the correct URL
2. JWT token is being sent correctly in headers
3. User has `role: "admin"` in their token payload
4. Price value is a string of only € symbols

**Backend Contact**: The API is already implemented and working. Just use the PATCH endpoint as documented above.

