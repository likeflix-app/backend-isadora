# Premium Packages API Documentation

## Overview

The Premium Packages API allows administrators to create, manage, and display curated packages of verified talents. These packages are designed to offer bundled talent selections that users can browse and book together.

## Features

- ✅ **Admin-Only Creation**: Only administrators can create and manage premium packages
- ✅ **Verified Talents Only**: Packages can only contain verified talents
- ✅ **Auto-Sync Data**: Talent information is automatically synced when creating/updating packages
- ✅ **Soft Delete**: Packages can be deactivated without permanent deletion
- ✅ **Public Access**: Anyone can view active premium packages
- ✅ **Rich Talent Data**: Each package includes full talent details (name, price, social channels, categories, celebrity status)

---

## Table of Contents

1. [Data Structure](#data-structure)
2. [Endpoints](#endpoints)
   - [Create Premium Package](#1-create-premium-package-admin-only)
   - [Get All Premium Packages](#2-get-all-premium-packages-public)
   - [Get Single Premium Package](#3-get-single-premium-package-public)
   - [Update Premium Package](#4-update-premium-package-admin-only)
   - [Delete Premium Package](#5-delete-premium-package-admin-only)
   - [Get Statistics](#6-get-premium-package-statistics-admin-only)
3. [Examples](#examples)
4. [Error Handling](#error-handling)

---

## Data Structure

### Premium Package Object

```json
{
  "id": "PKG-1697123456789",
  "nomePacchetto": "Influencer Fashion Package",
  "talentIds": [
    "talent-id-1",
    "talent-id-2",
    "talent-id-3"
  ],
  "talentsData": [
    {
      "id": "talent-id-1",
      "fullName": "Maria Rossi",
      "price": "€€€",
      "socialChannels": ["Instagram", "TikTok"],
      "contentCategories": ["Fashion", "Lifestyle"],
      "isCelebrity": true
    },
    {
      "id": "talent-id-2",
      "fullName": "Luca Bianchi",
      "price": "€€",
      "socialChannels": ["Instagram", "YouTube"],
      "contentCategories": ["Fashion", "Beauty"],
      "isCelebrity": false
    }
  ],
  "isActive": true,
  "createdBy": "admin-user-id",
  "createdAt": "2024-10-14T10:30:00.000Z",
  "updatedAt": "2024-10-14T10:30:00.000Z"
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Unique package identifier (format: `PKG-{timestamp}`) |
| `nomePacchetto` | String | Name/title of the premium package |
| `talentIds` | Array<String> | Array of talent IDs included in the package |
| `talentsData` | Array<Object> | Full data for each talent (auto-synced) |
| `isActive` | Boolean | Whether the package is active/visible |
| `createdBy` | String | User ID of the admin who created the package |
| `createdAt` | DateTime | Package creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

### Talent Data Object (within package)

Each talent in `talentsData` contains:

```json
{
  "id": "talent-id",
  "fullName": "Full Name",
  "price": "€€€",
  "socialChannels": ["Instagram", "TikTok", "YouTube"],
  "contentCategories": ["Fashion", "Lifestyle", "Beauty"],
  "isCelebrity": true
}
```

---

## Endpoints

### 1. Create Premium Package (Admin Only)

**POST** `/api/premium-packages`

Creates a new premium package with selected talents.

#### Authentication Required
- **Headers**: `Authorization: Bearer {admin-token}`
- **Role**: Admin only

#### Request Body

```json
{
  "nomePacchetto": "Influencer Fashion Package",
  "talentIds": [
    "talent-id-1",
    "talent-id-2",
    "talent-id-3"
  ]
}
```

#### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `nomePacchetto` | String | Yes | Name of the package |
| `talentIds` | Array<String> | Yes | Array of verified talent IDs (must be non-empty) |

#### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Premium package created successfully",
  "data": {
    "id": "PKG-1697123456789",
    "nomePacchetto": "Influencer Fashion Package",
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
    "isActive": true,
    "createdBy": "admin-user-id",
    "createdAt": "2024-10-14T10:30:00.000Z",
    "updatedAt": "2024-10-14T10:30:00.000Z"
  }
}
```

#### Error Responses

- **400 Bad Request**: Missing required fields or invalid data
  ```json
  {
    "success": false,
    "message": "nomePacchetto and talentIds (array) are required"
  }
  ```

- **400 Bad Request**: Talent not verified
  ```json
  {
    "success": false,
    "message": "Talent Maria Rossi is not verified. Only verified talents can be added to premium packages."
  }
  ```

- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: User is not an admin
- **404 Not Found**: Talent ID not found

---

### 2. Get All Premium Packages (Public)

**GET** `/api/premium-packages`

Retrieves all premium packages. By default, only active packages are returned.

#### Authentication
- **Not required** (public endpoint)

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `includeInactive` | String | `false` | Set to `"true"` to include inactive packages |

#### Examples

```bash
# Get only active packages
GET /api/premium-packages

# Get all packages (including inactive)
GET /api/premium-packages?includeInactive=true
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "PKG-1697123456789",
      "nomePacchetto": "Influencer Fashion Package",
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
      "isActive": true,
      "createdBy": "admin-user-id",
      "createdAt": "2024-10-14T10:30:00.000Z",
      "updatedAt": "2024-10-14T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 3. Get Single Premium Package (Public)

**GET** `/api/premium-packages/:id`

Retrieves a specific premium package by ID.

#### Authentication
- **Not required** (public endpoint)

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | Premium package ID |

#### Example

```bash
GET /api/premium-packages/PKG-1697123456789
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "PKG-1697123456789",
    "nomePacchetto": "Influencer Fashion Package",
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
    "isActive": true,
    "createdBy": "admin-user-id",
    "createdAt": "2024-10-14T10:30:00.000Z",
    "updatedAt": "2024-10-14T10:30:00.000Z"
  }
}
```

#### Error Response (404 Not Found)

```json
{
  "success": false,
  "message": "Premium package not found"
}
```

---

### 4. Update Premium Package (Admin Only)

**PATCH** `/api/premium-packages/:id`

Updates an existing premium package.

#### Authentication Required
- **Headers**: `Authorization: Bearer {admin-token}`
- **Role**: Admin only

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | Premium package ID |

#### Request Body

All fields are optional. Only provide the fields you want to update.

```json
{
  "nomePacchetto": "Updated Package Name",
  "talentIds": ["new-talent-id-1", "new-talent-id-2"],
  "isActive": false
}
```

#### Parameters

| Field | Type | Description |
|-------|------|-------------|
| `nomePacchetto` | String | New package name |
| `talentIds` | Array<String> | New array of talent IDs (must be verified) |
| `isActive` | Boolean | Package active status |

**Note**: When updating `talentIds`, the `talentsData` is automatically re-synced with the latest talent information.

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Premium package updated successfully",
  "data": {
    "id": "PKG-1697123456789",
    "nomePacchetto": "Updated Package Name",
    "talentIds": ["new-talent-id-1"],
    "talentsData": [
      {
        "id": "new-talent-id-1",
        "fullName": "New Talent",
        "price": "€€",
        "socialChannels": ["Instagram"],
        "contentCategories": ["Fashion"],
        "isCelebrity": false
      }
    ],
    "isActive": false,
    "createdBy": "admin-user-id",
    "createdAt": "2024-10-14T10:30:00.000Z",
    "updatedAt": "2024-10-14T11:30:00.000Z"
  }
}
```

#### Error Responses

- **400 Bad Request**: Invalid talent IDs
- **401 Unauthorized**: Missing or invalid token
- **403 Forbidden**: User is not an admin
- **404 Not Found**: Package or talent not found

---

### 5. Delete Premium Package (Admin Only)

**DELETE** `/api/premium-packages/:id`

Deletes a premium package. By default, performs a soft delete (sets `isActive` to `false`).

#### Authentication Required
- **Headers**: `Authorization: Bearer {admin-token}`
- **Role**: Admin only

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | Premium package ID |

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `hardDelete` | String | `false` | Set to `"true"` for permanent deletion |

#### Examples

```bash
# Soft delete (deactivate)
DELETE /api/premium-packages/PKG-1697123456789

# Hard delete (permanent)
DELETE /api/premium-packages/PKG-1697123456789?hardDelete=true
```

#### Success Response (200 OK)

**Soft Delete:**
```json
{
  "success": true,
  "message": "Premium package deactivated",
  "deletedPackage": {
    "id": "PKG-1697123456789",
    "nomePacchetto": "Influencer Fashion Package",
    "isActive": false
  }
}
```

**Hard Delete:**
```json
{
  "success": true,
  "message": "Premium package permanently deleted",
  "deletedPackage": {
    "id": "PKG-1697123456789",
    "nomePacchetto": "Influencer Fashion Package",
    "isActive": false
  }
}
```

#### Error Responses

- **401 Unauthorized**: Missing or invalid token
- **403 Forbidden**: User is not an admin
- **404 Not Found**: Package not found

---

### 6. Get Premium Package Statistics (Admin Only)

**GET** `/api/premium-packages-stats`

Retrieves statistics about premium packages.

#### Authentication Required
- **Headers**: `Authorization: Bearer {admin-token}`
- **Role**: Admin only

#### Success Response (200 OK)

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

#### Error Responses

- **401 Unauthorized**: Missing or invalid token
- **403 Forbidden**: User is not an admin

---

## Examples

### Example 1: Create a Premium Package

**Step 1: Get Verified Talents**
```bash
GET /api/talents?status=verified
```

**Step 2: Create Package with Selected Talents**
```bash
POST /api/premium-packages
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "nomePacchetto": "Beauty Influencers Pack",
  "talentIds": [
    "talent-abc123",
    "talent-def456",
    "talent-ghi789"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Premium package created successfully",
  "data": {
    "id": "PKG-1697123456789",
    "nomePacchetto": "Beauty Influencers Pack",
    "talentIds": ["talent-abc123", "talent-def456", "talent-ghi789"],
    "talentsData": [
      {
        "id": "talent-abc123",
        "fullName": "Emma Bellezza",
        "price": "€€€",
        "socialChannels": ["Instagram", "YouTube", "TikTok"],
        "contentCategories": ["Beauty", "Skincare", "Makeup"],
        "isCelebrity": true
      },
      {
        "id": "talent-def456",
        "fullName": "Sofia Glamour",
        "price": "€€",
        "socialChannels": ["Instagram", "TikTok"],
        "contentCategories": ["Beauty", "Fashion"],
        "isCelebrity": false
      },
      {
        "id": "talent-ghi789",
        "fullName": "Alessia Style",
        "price": "€€",
        "socialChannels": ["Instagram", "YouTube"],
        "contentCategories": ["Beauty", "Lifestyle"],
        "isCelebrity": false
      }
    ],
    "isActive": true,
    "createdBy": "admin-user-123",
    "createdAt": "2024-10-14T10:30:00.000Z",
    "updatedAt": "2024-10-14T10:30:00.000Z"
  }
}
```

### Example 2: Update Package Talents

```bash
PATCH /api/premium-packages/PKG-1697123456789
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "talentIds": [
    "talent-abc123",
    "talent-new999"
  ]
}
```

**Response:**
The package is updated with new talent data automatically synced from the database.

### Example 3: Get Active Packages for Public Display

```bash
GET /api/premium-packages
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "PKG-1697123456789",
      "nomePacchetto": "Beauty Influencers Pack",
      "talentsData": [...],
      "isActive": true
    },
    {
      "id": "PKG-1697123456790",
      "nomePacchetto": "Fashion Icons Collection",
      "talentsData": [...],
      "isActive": true
    }
  ],
  "count": 2
}
```

---

## Error Handling

### Common Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (in development mode only)"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created successfully |
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Missing or invalid authentication |
| 403 | Forbidden - Insufficient permissions (not admin) |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

### Common Error Scenarios

1. **Creating package with unverified talent**
   - Status: 400
   - Message: "Talent {name} is not verified. Only verified talents can be added to premium packages."

2. **Updating package with invalid talent ID**
   - Status: 404
   - Message: "Talent with ID {id} not found"

3. **Non-admin trying to create/update package**
   - Status: 403
   - Message: "Admin access required"

4. **Empty talent array**
   - Status: 400
   - Message: "talentIds must be a non-empty array"

---

## Data Synchronization

### Automatic Talent Data Sync

When creating or updating a premium package with `talentIds`, the system automatically:

1. ✅ Validates each talent ID exists
2. ✅ Checks each talent is verified
3. ✅ Fetches current talent data (name, price, social channels, categories, celebrity status)
4. ✅ Stores complete talent data in `talentsData` field

This ensures:
- **Data Integrity**: Package always contains current talent information
- **No Broken References**: Invalid talent IDs are rejected immediately
- **Rich Display Data**: Frontend can display complete package details without additional API calls

### Example: Talent Data Before/After Price Update

**Scenario**: Admin updates a talent's price from "€€" to "€€€"

1. **Before Update** - Package shows:
   ```json
   {
     "talentsData": [
       { "id": "talent-1", "fullName": "Maria", "price": "€€" }
     ]
   }
   ```

2. **Admin updates talent price** in talent management

3. **To sync package data**, admin must:
   - Either: Update the package with same `talentIds` (triggers re-sync)
   - Or: Package data remains as-is until next update

**Note**: Talent data in packages is snapshot-based. To reflect talent updates, re-save the package.

---

## Best Practices

### For Administrators

1. **Curate Carefully**: Only include verified, active talents
2. **Meaningful Names**: Use descriptive package names (e.g., "Top Fashion Influencers", "Beauty Experts Pack")
3. **Regular Updates**: Periodically review and update packages to reflect current talent roster
4. **Soft Delete First**: Use soft delete to deactivate packages before permanent deletion
5. **Monitor Stats**: Check package statistics regularly

### For Frontend Integration

1. **Display Talents Individually**: Use `talentsData` array to show each talent's details
2. **Show Package as Bundle**: Display all talents together with package name
3. **Filter by Category**: Allow users to filter packages by talent categories
4. **Price Indication**: Show combined price range based on talent prices
5. **Handle Inactive**: Don't display packages with `isActive: false`

### Example Frontend Display

```jsx
// Display Premium Package
{package.talentsData.map(talent => (
  <TalentCard
    key={talent.id}
    name={talent.fullName}
    price={talent.price}
    channels={talent.socialChannels}
    categories={talent.contentCategories}
    isCelebrity={talent.isCelebrity}
  />
))}
```

---

## Security Considerations

1. **Admin-Only Operations**: All write operations (CREATE, UPDATE, DELETE) require admin authentication
2. **Public Read Access**: Anyone can view active packages (supports public browsing)
3. **Token Validation**: All admin endpoints verify JWT token validity and admin role
4. **Input Validation**: All inputs are validated before database operations
5. **SQL Injection Prevention**: Uses parameterized queries
6. **XSS Protection**: JSON responses are properly escaped

---

## Database Schema

### premium_packages Table

```sql
CREATE TABLE premium_packages (
  id VARCHAR(255) PRIMARY KEY,
  nome_pacchetto VARCHAR(255) NOT NULL,
  talent_ids JSONB NOT NULL,
  talents_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_premium_packages_is_active ON premium_packages(is_active);
CREATE INDEX idx_premium_packages_created_at ON premium_packages(created_at);
```

---

## Changelog

### Version 1.0.0 (2024-10-14)
- ✨ Initial release
- ✅ Create, Read, Update, Delete premium packages
- ✅ Automatic talent data synchronization
- ✅ Soft delete functionality
- ✅ Admin-only write operations
- ✅ Public read access for active packages
- ✅ Statistics endpoint

---

## Support

For issues or questions about the Premium Packages API:
- Check the main API documentation
- Review error messages carefully
- Ensure talents are verified before adding to packages
- Contact backend team for technical support

