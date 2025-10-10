# Talent Application API Documentation

## Overview

Complete API for managing talent applications including submission, review, approval/rejection, and statistics.

---

## 📋 Talent Application Schema

### Complete Application Object

```json
{
  "id": "uuid-v4",
  "userId": "user-id",
  "email": "talent@example.com",
  "status": "pending | verified | rejected",
  
  // Personal Information
  "fullName": "Giulia Rossi",
  "birthYear": 1995,
  "city": "Milano",
  "nickname": "GiuliaStyle",
  "phone": "+39 333 123 4567",
  "bio": "Content creator specializzata in moda...",
  
  // Profile Information
  "socialChannels": ["Instagram", "TikTok", "YouTube"],
  "socialLinks": "@giuliarossi\nhttps://linktr.ee/giulia",
  "mediaKitUrls": [
    "https://backend-isadora.onrender.com/uploads/media-kits/talent-123.jpg"
  ],
  "contentCategories": ["Moda", "Lifestyle", "Beauty"],
  
  // Availability Information
  "availableForProducts": "Si | No",
  "shippingAddress": "Via Roma 123, 20100 Milano",
  "availableForReels": "Si | No",
  "availableNext3Months": "Si | No",
  "availabilityPeriod": "Da subito | A partire da gennaio",
  
  // Experience
  "collaboratedAgencies": "Si | No",
  "agenciesList": "Agency 1, Agency 2",
  "collaboratedBrands": "Si | No",
  "brandsList": "Nike, Adidas, H&M",
  
  // Fiscal Information
  "hasVAT": "Si | No",
  "paymentMethods": ["Bonifico", "PayPal", "Crypto"],
  
  // Terms
  "termsAccepted": true,
  
  // System Information
  "createdAt": "2025-10-10T10:30:00.000Z",
  "updatedAt": "2025-10-10T10:30:00.000Z",
  "reviewedAt": "2025-10-10T15:00:00.000Z",
  "reviewedBy": "admin-user-id",
  "reviewNotes": "Great profile, approved!"
}
```

---

## 🌐 API Endpoints

### 1. Submit Talent Application

**POST** `/api/talent/applications`

Submit a new talent application with all required information.

**Authentication:** Required (User JWT token)

**Request Body:**

```json
{
  // Required fields
  "fullName": "Giulia Rossi",
  "birthYear": 1995,
  "city": "Milano",
  "phone": "+39 333 123 4567",
  "termsAccepted": true,
  
  // Optional fields
  "nickname": "GiuliaStyle",
  "bio": "Content creator...",
  
  // Profile
  "socialChannels": ["Instagram", "TikTok"],
  "socialLinks": "@giuliarossi",
  "mediaKitUrls": [
    "https://backend-isadora.onrender.com/uploads/media-kits/talent-123.jpg"
  ],
  "contentCategories": ["Moda", "Lifestyle"],
  
  // Availability
  "availableForProducts": "Si",
  "shippingAddress": "Via Roma 123, Milano",
  "availableForReels": "Si",
  "availableNext3Months": "Si",
  "availabilityPeriod": "Da subito",
  
  // Experience
  "collaboratedAgencies": "No",
  "agenciesList": "",
  "collaboratedBrands": "Si",
  "brandsList": "Nike, Adidas",
  
  // Fiscal
  "hasVAT": "No",
  "paymentMethods": ["PayPal", "Bonifico"]
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Talent application submitted successfully",
  "data": {
    "id": "app-uuid",
    "userId": "user-id",
    "email": "talent@example.com",
    "status": "pending",
    // ... all application data
    "createdAt": "2025-10-10T10:30:00.000Z"
  }
}
```

**Error Responses:**

*Missing Required Fields (400):*
```json
{
  "success": false,
  "message": "Missing required fields: fullName, birthYear, city, phone, termsAccepted"
}
```

*Already Applied (409):*
```json
{
  "success": false,
  "message": "You already have a pending application",
  "existingApplication": {
    "id": "app-uuid",
    "status": "pending",
    "submittedAt": "2025-10-09T10:00:00.000Z"
  }
}
```

**cURL Example:**

```bash
curl -X POST https://backend-isadora.onrender.com/api/talent/applications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -d '{
    "fullName": "Giulia Rossi",
    "birthYear": 1995,
    "city": "Milano",
    "phone": "+39 333 123 4567",
    "mediaKitUrls": ["https://backend-isadora.onrender.com/uploads/media-kits/talent-123.jpg"],
    "termsAccepted": true
  }'
```

**JavaScript Example:**

```javascript
const submitApplication = async (applicationData, userToken) => {
  const response = await fetch('https://backend-isadora.onrender.com/api/talent/applications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify(applicationData)
  });
  
  const result = await response.json();
  return result;
};
```

---

### 2. Get All Applications (Admin)

**GET** `/api/talent/applications`

Get all talent applications with optional status filtering.

**Authentication:** Required (Admin JWT token)

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `verified`, `rejected`)

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "app-uuid-1",
      "fullName": "Giulia Rossi",
      "status": "pending",
      // ... all application data
    },
    {
      "id": "app-uuid-2",
      "fullName": "Marco Bianchi",
      "status": "verified",
      // ... all application data
    }
  ],
  "count": 2,
  "stats": {
    "total": 10,
    "pending": 5,
    "verified": 3,
    "rejected": 2
  }
}
```

**cURL Examples:**

```bash
# Get all applications
curl -X GET https://backend-isadora.onrender.com/api/talent/applications \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Get only pending applications
curl -X GET "https://backend-isadora.onrender.com/api/talent/applications?status=pending" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Get only verified applications
curl -X GET "https://backend-isadora.onrender.com/api/talent/applications?status=verified" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**JavaScript Example:**

```javascript
const getApplications = async (adminToken, status = null) => {
  const url = status 
    ? `https://backend-isadora.onrender.com/api/talent/applications?status=${status}`
    : 'https://backend-isadora.onrender.com/api/talent/applications';
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  
  return await response.json();
};
```

---

### 3. Get My Application

**GET** `/api/talent/applications/me`

Get the current user's talent application.

**Authentication:** Required (User JWT token)

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "app-uuid",
    "userId": "user-id",
    "status": "pending",
    // ... all application data
  }
}
```

**Error Response (404):**

```json
{
  "success": false,
  "message": "No application found for this user"
}
```

**cURL Example:**

```bash
curl -X GET https://backend-isadora.onrender.com/api/talent/applications/me \
  -H "Authorization: Bearer USER_TOKEN"
```

**JavaScript Example:**

```javascript
const getMyApplication = async (userToken) => {
  const response = await fetch('https://backend-isadora.onrender.com/api/talent/applications/me', {
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  });
  
  if (response.status === 404) {
    return null; // No application yet
  }
  
  return await response.json();
};
```

---

### 4. Get Specific Application (Admin)

**GET** `/api/talent/applications/:id`

Get details of a specific talent application.

**Authentication:** Required (Admin JWT token)

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "app-uuid",
    "fullName": "Giulia Rossi",
    // ... all application data
  }
}
```

**cURL Example:**

```bash
curl -X GET https://backend-isadora.onrender.com/api/talent/applications/app-uuid \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

### 5. Approve/Reject Application (Admin)

**PATCH** `/api/talent/applications/:id/status`

Update the status of a talent application (approve or reject).

**Authentication:** Required (Admin JWT token)

**Request Body:**

```json
{
  "status": "verified",  // or "rejected"
  "reviewNotes": "Great profile, excellent content quality!"  // optional
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Application verified successfully",
  "data": {
    "id": "app-uuid",
    "status": "verified",
    "reviewedAt": "2025-10-10T15:00:00.000Z",
    "reviewedBy": "admin-user-id",
    "reviewNotes": "Great profile...",
    // ... all application data
  }
}
```

**Error Responses:**

*Invalid Status (400):*
```json
{
  "success": false,
  "message": "Invalid status. Must be \"verified\" or \"rejected\""
}
```

*Application Not Found (404):*
```json
{
  "success": false,
  "message": "Application not found"
}
```

**cURL Examples:**

```bash
# Approve application
curl -X PATCH https://backend-isadora.onrender.com/api/talent/applications/app-uuid/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "status": "verified",
    "reviewNotes": "Approved - great content!"
  }'

# Reject application
curl -X PATCH https://backend-isadora.onrender.com/api/talent/applications/app-uuid/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "status": "rejected",
    "reviewNotes": "Does not meet requirements"
  }'
```

**JavaScript Example:**

```javascript
const updateApplicationStatus = async (appId, status, notes, adminToken) => {
  const response = await fetch(
    `https://backend-isadora.onrender.com/api/talent/applications/${appId}/status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: status,
        reviewNotes: notes
      })
    }
  );
  
  return await response.json();
};

// Usage
await updateApplicationStatus('app-uuid', 'verified', 'Great profile!', adminToken);
```

---

### 6. Delete Application (Admin)

**DELETE** `/api/talent/applications/:id`

Delete a talent application permanently.

**Authentication:** Required (Admin JWT token)

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Application deleted successfully",
  "deletedApplication": {
    "id": "app-uuid",
    "fullName": "Giulia Rossi",
    "status": "rejected"
  }
}
```

**cURL Example:**

```bash
curl -X DELETE https://backend-isadora.onrender.com/api/talent/applications/app-uuid \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

### 7. Get Talent Statistics (Admin)

**GET** `/api/talent/stats`

Get statistics about talent applications.

**Authentication:** Required (Admin JWT token)

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "totalApplications": 25,
    "pending": 10,
    "verified": 12,
    "rejected": 3,
    "recentApplications": [
      {
        "id": "app-uuid-1",
        "fullName": "Giulia Rossi",
        "status": "pending",
        "createdAt": "2025-10-10T10:00:00.000Z"
      },
      // ... up to 5 most recent
    ]
  }
}
```

**cURL Example:**

```bash
curl -X GET https://backend-isadora.onrender.com/api/talent/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## 🔄 Complete Application Flow

### Frontend to Backend Flow

```javascript
// 1. User uploads photos first
const uploadPhotos = async (files) => {
  const formData = new FormData();
  files.forEach(file => formData.append('mediaKit', file));
  
  const response = await fetch('/api/upload/media-kit', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  return result.urls; // Array of photo URLs
};

// 2. Submit application with photo URLs
const submitTalentApplication = async (formData, photoUrls, userToken) => {
  const applicationData = {
    // Personal
    fullName: formData.fullName,
    birthYear: formData.birthYear,
    city: formData.city,
    phone: formData.phone,
    
    // Photos from step 1
    mediaKitUrls: photoUrls,
    
    // Other data
    socialChannels: formData.socialChannels,
    contentCategories: formData.contentCategories,
    termsAccepted: true
  };
  
  const response = await fetch('/api/talent/applications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify(applicationData)
  });
  
  return await response.json();
};

// Complete flow
const handleTalentApplicationSubmit = async () => {
  try {
    // Step 1: Upload photos
    const photoUrls = await uploadPhotos(selectedFiles);
    
    // Step 2: Submit application
    const result = await submitTalentApplication(formData, photoUrls, userToken);
    
    if (result.success) {
      console.log('Application submitted!', result.data.id);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

## 📊 Admin Review Flow

```javascript
// 1. Get all pending applications
const pendingApps = await fetch('/api/talent/applications?status=pending', {
  headers: { 'Authorization': `Bearer ${adminToken}` }
}).then(r => r.json());

// 2. View specific application
const app = await fetch(`/api/talent/applications/${appId}`, {
  headers: { 'Authorization': `Bearer ${adminToken}` }
}).then(r => r.json());

// 3. View application photos
app.data.mediaKitUrls.forEach(url => {
  console.log('Photo:', url);
  // Display in UI: <img src={url} />
});

// 4. Approve or reject
await fetch(`/api/talent/applications/${appId}/status`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    status: 'verified',
    reviewNotes: 'Approved!'
  })
}).then(r => r.json());
```

---

## 🔒 Validation Rules

### Required Fields

- `fullName` - String, not empty
- `birthYear` - Number, valid year
- `city` - String, not empty
- `phone` - String, not empty
- `termsAccepted` - Boolean, must be `true`

### Business Rules

1. **One Application Per User**: Users can only have one active (pending or verified) application
2. **Status Transitions**: Only pending → verified or pending → rejected (admin only)
3. **Photo URLs**: Should be from `/api/upload/media-kit` endpoint
4. **Review Tracking**: reviewedBy and reviewedAt set automatically on status change

---

## 📋 Field Reference

### Italian Province/City Options

```javascript
const italianProvinces = [
  "Milano", "Roma", "Torino", "Napoli", "Bologna", 
  "Firenze", "Venezia", "Genova", "Palermo", 
  // ... all Italian provinces
  "Canton Ticino (Svizzera)"
];
```

### Social Channels

```javascript
const socialChannels = [
  "Facebook", "Instagram", "LinkedIn", "TikTok",
  "Twitch", "X", "WhatsApp Stories", "YouTube", "Other"
];
```

### Content Categories

```javascript
const contentCategories = [
  "Arte", "Beauty", "Benessere", "Comicità", "Educazione",
  "Fitness", "Food", "Gaming", "Genitorialità", "Lifestyle",
  "Medicina Estetica", "Moda", "Musica", "Tech", "Viaggi", "Other"
];
```

### Payment Methods

```javascript
const paymentMethods = [
  "Bonifico", "PayPal", "Crypto", "Amazon Vouchers", "Other"
];
```

---

## 🧪 Testing

### Test Application Submission

```bash
# 1. Login as user
USER_TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"password"}' \
  | jq -r '.data.token')

# 2. Submit application
curl -X POST http://localhost:3001/api/talent/applications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "fullName": "Test Talent",
    "birthYear": 1995,
    "city": "Milano",
    "phone": "+39 333 123 4567",
    "termsAccepted": true
  }'
```

### Test Admin Review

```bash
# 1. Login as admin
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@talento.com","password":"password"}' \
  | jq -r '.data.token')

# 2. List applications
curl http://localhost:3001/api/talent/applications \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 3. Approve application
curl -X PATCH http://localhost:3001/api/talent/applications/APP_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status":"verified","reviewNotes":"Approved!"}'
```

---

## 📝 Summary

The Talent Application API provides:

✅ **Complete application submission** with all talent data + photos  
✅ **Admin review system** with approve/reject workflow  
✅ **Status tracking** (pending → verified/rejected)  
✅ **Photo integration** via media kit upload  
✅ **Statistics** for admin dashboard  
✅ **User application check** to prevent duplicates  

Ready for production! 🚀

