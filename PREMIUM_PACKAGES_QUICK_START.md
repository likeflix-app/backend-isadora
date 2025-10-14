# Premium Packages - Quick Start Guide

## 📦 What is Premium Packages?

Premium Packages allows **admins** to create curated bundles of verified talents that users can browse and book together. Each package automatically includes complete talent information (name, price, social channels, categories, celebrity status).

---

## 🚀 Quick Start

### 1. Create a Premium Package (Admin Only)

**Endpoint**: `POST /api/premium-packages`

```bash
curl -X POST http://localhost:3001/api/premium-packages \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "nomePacchetto": "Fashion Influencers Pack",
    "talentIds": ["talent-id-1", "talent-id-2", "talent-id-3"]
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Premium package created successfully",
  "data": {
    "id": "PKG-1697123456789",
    "nomePacchetto": "Fashion Influencers Pack",
    "talentIds": ["talent-id-1", "talent-id-2"],
    "talentsData": [
      {
        "id": "talent-id-1",
        "fullName": "Maria Rossi",
        "price": "€€€",
        "socialChannels": ["Instagram", "TikTok"],
        "contentCategories": ["Fashion", "Lifestyle"],
        "isCelebrity": true
      }
    ],
    "isActive": true
  }
}
```

---

### 2. Get All Active Packages (Public)

**Endpoint**: `GET /api/premium-packages`

```bash
# Anyone can view active packages (no auth required)
curl http://localhost:3001/api/premium-packages
```

---

### 3. Get Single Package (Public)

**Endpoint**: `GET /api/premium-packages/:id`

```bash
curl http://localhost:3001/api/premium-packages/PKG-1697123456789
```

---

### 4. Update Package (Admin Only)

**Endpoint**: `PATCH /api/premium-packages/:id`

```bash
curl -X PATCH http://localhost:3001/api/premium-packages/PKG-1697123456789 \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "nomePacchetto": "Updated Package Name",
    "talentIds": ["new-talent-1", "new-talent-2"]
  }'
```

---

### 5. Delete Package (Admin Only)

**Soft Delete (Deactivate)**:
```bash
curl -X DELETE http://localhost:3001/api/premium-packages/PKG-1697123456789 \
  -H "Authorization: Bearer {ADMIN_TOKEN}"
```

**Hard Delete (Permanent)**:
```bash
curl -X DELETE "http://localhost:3001/api/premium-packages/PKG-1697123456789?hardDelete=true" \
  -H "Authorization: Bearer {ADMIN_TOKEN}"
```

---

### 6. Get Statistics (Admin Only)

**Endpoint**: `GET /api/premium-packages-stats`

```bash
curl http://localhost:3001/api/premium-packages-stats \
  -H "Authorization: Bearer {ADMIN_TOKEN}"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "totalPackages": 15,
    "activePackages": 12,
    "inactivePackages": 3
  }
}
```

---

## 📋 All Available Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/premium-packages` | Admin | Create new package |
| GET | `/api/premium-packages` | Public | Get all active packages |
| GET | `/api/premium-packages/:id` | Public | Get single package |
| PATCH | `/api/premium-packages/:id` | Admin | Update package |
| DELETE | `/api/premium-packages/:id` | Admin | Delete package |
| GET | `/api/premium-packages-stats` | Admin | Get statistics |

---

## 🎯 Key Features

### ✅ Automatic Talent Data Sync
When you create or update a package with talent IDs, the system automatically:
- Validates each talent exists
- Checks each talent is verified
- Fetches complete talent data
- Stores it in the package

### ✅ Rich Talent Information
Each package includes:
- **fullName**: Talent's full name
- **price**: Price tier (€, €€, €€€)
- **socialChannels**: Array of social platforms
- **contentCategories**: Array of content types
- **isCelebrity**: Celebrity status

### ✅ Soft Delete
- Default delete deactivates the package (`isActive: false`)
- Use `?hardDelete=true` for permanent deletion

---

## 🔐 Security

- **Admin Only**: Create, Update, Delete require admin authentication
- **Public Read**: Anyone can view active packages
- **Verified Talents Only**: Only verified talents can be added to packages

---

## 💡 Frontend Integration Example

### Display Premium Package

```jsx
// React/Vue/Angular example
function PremiumPackageCard({ packageData }) {
  return (
    <div className="package-card">
      <h2>{packageData.nomePacchetto}</h2>
      
      <div className="talents-grid">
        {packageData.talentsData.map(talent => (
          <div key={talent.id} className="talent-item">
            <h3>{talent.fullName}</h3>
            <p>Price: {talent.price}</p>
            
            <div className="social-channels">
              {talent.socialChannels.map(channel => (
                <span key={channel}>{channel}</span>
              ))}
            </div>
            
            <div className="categories">
              {talent.contentCategories.map(category => (
                <span key={category}>{category}</span>
              ))}
            </div>
            
            {talent.isCelebrity && <span className="celebrity-badge">⭐ Celebrity</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 📊 Data Structure

### Package Object
```typescript
interface PremiumPackage {
  id: string;                    // "PKG-{timestamp}"
  nomePacchetto: string;         // Package name
  talentIds: string[];           // Array of talent IDs
  talentsData: TalentData[];     // Full talent information
  isActive: boolean;             // Active status
  createdBy: string;             // Admin user ID
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
}

interface TalentData {
  id: string;
  fullName: string;
  price: string;                 // "€", "€€", or "€€€"
  socialChannels: string[];      // ["Instagram", "TikTok", etc.]
  contentCategories: string[];   // ["Fashion", "Beauty", etc.]
  isCelebrity: boolean;
}
```

---

## 🔄 Workflow Example

### Admin Creates Package

1. **Get verified talents**:
   ```bash
   GET /api/talents?status=verified
   ```

2. **Select talents and create package**:
   ```bash
   POST /api/premium-packages
   {
     "nomePacchetto": "Top Beauty Influencers",
     "talentIds": ["abc123", "def456", "ghi789"]
   }
   ```

3. **System automatically fetches and stores talent data**

4. **Package is now available publicly**:
   ```bash
   GET /api/premium-packages
   ```

### User Views Package

1. **Frontend fetches packages**:
   ```bash
   GET /api/premium-packages
   ```

2. **Display each talent with full details** (no additional API calls needed)

3. **User can book the entire package** using the talent IDs

---

## 🐛 Common Issues & Solutions

### Issue: "Talent not verified"
**Solution**: Only verified talents can be added. Check talent status first:
```bash
GET /api/talents/:talentId
```

### Issue: "Package not found"
**Solution**: Check if package is active:
```bash
GET /api/premium-packages?includeInactive=true
```

### Issue: "Admin access required"
**Solution**: Ensure you're using an admin token in the Authorization header

---

## 📚 Full Documentation

For complete API documentation, see: [PREMIUM_PACKAGES_API.md](./PREMIUM_PACKAGES_API.md)

---

## 🎉 That's It!

You now have a complete Premium Packages system where admins can create curated talent bundles that users can browse and book!

