# How to Update Talent Price via API

## Quick Guide: Change Price for Any Talent

### Step 1: Get the Talent ID
You need the talent's ID from the database. You can find it by:
- Looking at the admin dashboard
- Checking the database directly
- Using the GET endpoint to list all talents

### Step 2: Make the API Call

#### Using cURL (Terminal/Postman)
```bash
curl -X PATCH "http://your-server.com/api/talent/applications/TALENT_ID_HERE" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"price": "€€€€€"}'
```

#### Real Example (Replace with your values):
```bash
curl -X PATCH "https://api.example.com/api/talent/applications/abc123-talent-id" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"price": "€€€"}'
```

---

## Price Options

| Price Value | Meaning | Example Use |
|-------------|---------|-------------|
| `""` (empty) | No price set / Free | New or unrated talents |
| `"€"` | Budget-friendly | Micro-influencers |
| `"€€"` | Moderate | Mid-tier creators |
| `"€€€"` | Premium | Popular influencers |
| `"€€€€"` | Luxury | High-profile creators |
| `"€€€€€"` | Elite | Celebrities / Top tier |

---

## Methods to Execute Price Change

### Method 1: Using cURL (Terminal)
```bash
# Change Pacolino's price to €€€€€
curl -X PATCH "http://localhost:3000/api/talent/applications/talent-id-123" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"price": "€€€€€"}'
```

### Method 2: Using Postman
1. **Method**: PATCH
2. **URL**: `http://localhost:3000/api/talent/applications/TALENT_ID`
3. **Headers**:
   - `Authorization`: `Bearer YOUR_TOKEN`
   - `Content-Type`: `application/json`
4. **Body** (raw JSON):
   ```json
   {
     "price": "€€€€€"
   }
   ```

### Method 3: Using JavaScript/Fetch
```javascript
async function updateTalentPrice(talentId, price) {
  const token = "YOUR_ADMIN_JWT_TOKEN";
  
  const response = await fetch(`http://localhost:3000/api/talent/applications/${talentId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ price: price })
  });
  
  const data = await response.json();
  console.log(data);
  return data;
}

// Examples:
updateTalentPrice('talent-123', '€€€€€');  // Set to elite
updateTalentPrice('talent-456', '€€');     // Set to moderate
updateTalentPrice('talent-789', '');       // Clear price
```

### Method 4: Using Node.js Script
```javascript
// update-price.js
const fetch = require('node-fetch');

async function updatePrice(talentId, price) {
  const token = process.env.ADMIN_TOKEN; // Store token in .env
  const apiUrl = process.env.API_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${apiUrl}/api/talent/applications/${talentId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ price })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Updated ${data.application.fullName} to ${price || '(empty)'}`);
    } else {
      console.log(`❌ Error: ${data.message}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Usage:
// node update-price.js
updatePrice('talent-id-here', '€€€€€');
```

---

## Requirements

### Authentication
- **Must be logged in as admin**
- **Must have valid JWT token**
- Token must have `role: "admin"` in payload

### Getting Your Admin Token
1. Log in to the admin dashboard
2. Open browser DevTools (F12)
3. Go to Application/Storage → Local Storage
4. Find and copy the `authToken` value

OR from API login:
```bash
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@talento.com", "password": "your_password"}'
```

---

## Response Examples

### Success Response
```json
{
  "success": true,
  "application": {
    "id": "talent-123",
    "fullName": "Pacolino",
    "nickname": "Crescino",
    "price": "€€€€€",
    "email": "pacolino@example.com",
    "status": "verified",
    ...
  }
}
```

### Error: Not Admin
```json
{
  "success": false,
  "message": "Only admins can update the price field"
}
```

### Error: Invalid Price Format
```json
{
  "success": false,
  "message": "Price field must contain only € symbols (e.g., \"€\", \"€€\", \"€€€\")"
}
```

### Error: Not Authenticated
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

---

## Common Use Cases

### Set price for new talent
```bash
curl -X PATCH "http://localhost:3000/api/talent/applications/new-talent-id" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"price": "€€"}'
```

### Update existing talent to premium
```bash
curl -X PATCH "http://localhost:3000/api/talent/applications/existing-id" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"price": "€€€€"}'
```

### Clear/remove price
```bash
curl -X PATCH "http://localhost:3000/api/talent/applications/talent-id" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"price": ""}'
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 403 Forbidden | Make sure you're logged in as admin |
| 401 Unauthorized | Check if JWT token is valid and not expired |
| 400 Bad Request | Verify price contains only € symbols |
| 404 Not Found | Check if talent ID exists in database |
| Invalid JSON | Make sure to escape quotes properly in cURL |

---

## Pro Tips

1. **Batch Updates**: Loop through multiple talents in a script
2. **Backup First**: Query current prices before mass updates
3. **Test First**: Try on development/staging environment
4. **Validate**: Always verify the price format before sending
5. **Log Changes**: Keep track of who changed what and when

