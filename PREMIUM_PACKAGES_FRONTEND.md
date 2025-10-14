# Premium Packages - Frontend Integration Guide

## 🚀 Quick Commands & Code Snippets

### Base Configuration

```javascript
// config.js
const API_BASE_URL = 'http://localhost:3001/api';
// or for production:
// const API_BASE_URL = 'https://your-backend.onrender.com/api';

export default API_BASE_URL;
```

---

## 📦 1. Get All Premium Packages (Public)

### Using Fetch

```javascript
// Get all active premium packages
async function getPremiumPackages() {
  try {
    const response = await fetch('http://localhost:3001/api/premium-packages');
    const data = await response.json();
    
    if (data.success) {
      console.log('Premium Packages:', data.data);
      return data.data;
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Usage
const packages = await getPremiumPackages();
```

### Using Axios

```javascript
import axios from 'axios';

// Get all active premium packages
async function getPremiumPackages() {
  try {
    const response = await axios.get('http://localhost:3001/api/premium-packages');
    console.log('Premium Packages:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}
```

### React Hook

```javascript
import { useState, useEffect } from 'react';

function usePremiumPackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPackages() {
      try {
        const response = await fetch('http://localhost:3001/api/premium-packages');
        const data = await response.json();
        
        if (data.success) {
          setPackages(data.data);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPackages();
  }, []);

  return { packages, loading, error };
}

// Usage in component
function PremiumPackagesPage() {
  const { packages, loading, error } = usePremiumPackages();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {packages.map(pkg => (
        <div key={pkg.id}>
          <h2>{pkg.nomePacchetto}</h2>
          {/* Display package details */}
        </div>
      ))}
    </div>
  );
}
```

---

## 🔍 2. Get Single Premium Package (Public)

### Fetch Example

```javascript
async function getPremiumPackageById(packageId) {
  try {
    const response = await fetch(`http://localhost:3001/api/premium-packages/${packageId}`);
    const data = await response.json();
    
    if (data.success) {
      console.log('Package:', data.data);
      return data.data;
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Usage
const package = await getPremiumPackageById('PKG-1697123456789');
```

### React Hook

```javascript
import { useState, useEffect } from 'react';

function usePremiumPackage(packageId) {
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!packageId) return;

    async function fetchPackage() {
      try {
        const response = await fetch(`http://localhost:3001/api/premium-packages/${packageId}`);
        const data = await response.json();
        
        if (data.success) {
          setPackageData(data.data);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPackage();
  }, [packageId]);

  return { packageData, loading, error };
}
```

---

## 👑 3. Create Premium Package (Admin Only)

### Fetch Example

```javascript
async function createPremiumPackage(nomePacchetto, talentIds, adminToken) {
  try {
    const response = await fetch('http://localhost:3001/api/premium-packages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        nomePacchetto,
        talentIds
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('Package created:', data.data);
      return data.data;
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Usage
const newPackage = await createPremiumPackage(
  'Fashion Influencers Pack',
  ['talent-id-1', 'talent-id-2', 'talent-id-3'],
  'admin-token-here'
);
```

### Axios Example

```javascript
import axios from 'axios';

async function createPremiumPackage(nomePacchetto, talentIds, adminToken) {
  try {
    const response = await axios.post(
      'http://localhost:3001/api/premium-packages',
      {
        nomePacchetto,
        talentIds
      },
      {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      }
    );

    console.log('Package created:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}
```

### React Component Example

```javascript
import { useState } from 'react';

function CreatePremiumPackageForm({ adminToken, onSuccess }) {
  const [nomePacchetto, setNomePacchetto] = useState('');
  const [selectedTalents, setSelectedTalents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/premium-packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          nomePacchetto,
          talentIds: selectedTalents
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Package created successfully!');
        onSuccess?.(data.data);
        // Reset form
        setNomePacchetto('');
        setSelectedTalents([]);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={nomePacchetto}
        onChange={(e) => setNomePacchetto(e.target.value)}
        placeholder="Package Name"
        required
      />
      
      {/* Talent selection component */}
      <TalentSelector
        selectedTalents={selectedTalents}
        onChange={setSelectedTalents}
      />

      {error && <div className="error">{error}</div>}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Package'}
      </button>
    </form>
  );
}
```

---

## ✏️ 4. Update Premium Package (Admin Only)

### Fetch Example

```javascript
async function updatePremiumPackage(packageId, updates, adminToken) {
  try {
    const response = await fetch(`http://localhost:3001/api/premium-packages/${packageId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(updates)
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('Package updated:', data.data);
      return data.data;
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Usage examples:

// Update package name only
await updatePremiumPackage(
  'PKG-1697123456789',
  { nomePacchetto: 'New Package Name' },
  'admin-token'
);

// Update talents
await updatePremiumPackage(
  'PKG-1697123456789',
  { talentIds: ['new-talent-1', 'new-talent-2'] },
  'admin-token'
);

// Deactivate package
await updatePremiumPackage(
  'PKG-1697123456789',
  { isActive: false },
  'admin-token'
);
```

---

## 🗑️ 5. Delete Premium Package (Admin Only)

### Soft Delete (Deactivate)

```javascript
async function deactivatePremiumPackage(packageId, adminToken) {
  try {
    const response = await fetch(`http://localhost:3001/api/premium-packages/${packageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('Package deactivated:', data.message);
      return true;
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Usage
await deactivatePremiumPackage('PKG-1697123456789', 'admin-token');
```

### Hard Delete (Permanent)

```javascript
async function deletePremiumPackage(packageId, adminToken) {
  try {
    const response = await fetch(
      `http://localhost:3001/api/premium-packages/${packageId}?hardDelete=true`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      }
    );

    const data = await response.json();
    
    if (data.success) {
      console.log('Package deleted permanently:', data.message);
      return true;
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Usage
await deletePremiumPackage('PKG-1697123456789', 'admin-token');
```

---

## 📊 6. Get Statistics (Admin Only)

```javascript
async function getPremiumPackageStats(adminToken) {
  try {
    const response = await fetch('http://localhost:3001/api/premium-packages-stats', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('Stats:', data.data);
      // { totalPackages: 15, activePackages: 12, inactivePackages: 3 }
      return data.data;
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
```

---

## 🎨 Complete React Components

> **📸 Note**: Each talent in a package includes `mediaKitUrl` - the first media kit photo/video URL from Cloudinary. Display it as an image or video thumbnail!

### Display Premium Packages List

```javascript
import { useState, useEffect } from 'react';

function PremiumPackagesList() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPackages() {
      try {
        const response = await fetch('http://localhost:3001/api/premium-packages');
        const data = await response.json();
        
        if (data.success) {
          setPackages(data.data);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPackages();
  }, []);

  if (loading) return <div>Loading packages...</div>;

  return (
    <div className="premium-packages-grid">
      {packages.map(pkg => (
        <PremiumPackageCard key={pkg.id} package={pkg} />
      ))}
    </div>
  );
}

function PremiumPackageCard({ package: pkg }) {
  return (
    <div className="package-card">
      <h2>{pkg.nomePacchetto}</h2>
      
      <div className="talents-grid">
        {pkg.talentsData.map(talent => (
          <div key={talent.id} className="talent-item">
            {talent.mediaKitUrl && (
              <img 
                src={talent.mediaKitUrl} 
                alt={talent.fullName}
                className="talent-photo"
              />
            )}
            <h3>{talent.fullName}</h3>
            <p>📍 {talent.city}</p>
            <p>💰 {talent.price}</p>
            
            <div className="social-channels">
              {talent.socialChannels.map(channel => (
                <span key={channel} className="channel-badge">
                  {channel}
                </span>
              ))}
            </div>
            
            <div className="categories">
              {talent.contentCategories.map(category => (
                <span key={category} className="category-badge">
                  {category}
                </span>
              ))}
            </div>
            
            {talent.isCelebrity && (
              <span className="celebrity-badge">⭐ Celebrity</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PremiumPackagesList;
```

### Admin Package Management

```javascript
import { useState, useEffect } from 'react';

function AdminPackageManager({ adminToken }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      // Include inactive packages for admin view
      const response = await fetch('http://localhost:3001/api/premium-packages?includeInactive=true');
      const data = await response.json();
      
      if (data.success) {
        setPackages(data.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (packageId) => {
    if (!confirm('Are you sure you want to deactivate this package?')) return;

    try {
      const response = await fetch(`http://localhost:3001/api/premium-packages/${packageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Package deactivated successfully');
        fetchPackages(); // Refresh list
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleToggleActive = async (packageId, currentStatus) => {
    try {
      const response = await fetch(`http://localhost:3001/api/premium-packages/${packageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          isActive: !currentStatus
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Package status updated');
        fetchPackages();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="admin-packages">
      <h1>Premium Packages Management</h1>
      
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Talents</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {packages.map(pkg => (
            <tr key={pkg.id}>
              <td>{pkg.id}</td>
              <td>{pkg.nomePacchetto}</td>
              <td>{pkg.talentIds.length} talents</td>
              <td>
                <span className={pkg.isActive ? 'active' : 'inactive'}>
                  {pkg.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <button onClick={() => handleToggleActive(pkg.id, pkg.isActive)}>
                  {pkg.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => handleDelete(pkg.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 🔧 Utility Functions

### API Service (Recommended Pattern)

```javascript
// services/premiumPackages.js
const API_BASE_URL = 'http://localhost:3001/api';

class PremiumPackagesService {
  // Get all packages (public)
  static async getAll(includeInactive = false) {
    const url = includeInactive 
      ? `${API_BASE_URL}/premium-packages?includeInactive=true`
      : `${API_BASE_URL}/premium-packages`;
      
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.success) throw new Error(data.message);
    return data.data;
  }

  // Get single package (public)
  static async getById(packageId) {
    const response = await fetch(`${API_BASE_URL}/premium-packages/${packageId}`);
    const data = await response.json();
    
    if (!data.success) throw new Error(data.message);
    return data.data;
  }

  // Create package (admin)
  static async create(nomePacchetto, talentIds, adminToken) {
    const response = await fetch(`${API_BASE_URL}/premium-packages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ nomePacchetto, talentIds })
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  }

  // Update package (admin)
  static async update(packageId, updates, adminToken) {
    const response = await fetch(`${API_BASE_URL}/premium-packages/${packageId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(updates)
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  }

  // Delete package (admin)
  static async delete(packageId, adminToken, hardDelete = false) {
    const url = hardDelete 
      ? `${API_BASE_URL}/premium-packages/${packageId}?hardDelete=true`
      : `${API_BASE_URL}/premium-packages/${packageId}`;
      
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data;
  }

  // Get statistics (admin)
  static async getStats(adminToken) {
    const response = await fetch(`${API_BASE_URL}/premium-packages-stats`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  }
}

export default PremiumPackagesService;
```

### Usage of Service

```javascript
import PremiumPackagesService from './services/premiumPackages';

// Get all packages
const packages = await PremiumPackagesService.getAll();

// Create package
const newPackage = await PremiumPackagesService.create(
  'Fashion Pack',
  ['talent-1', 'talent-2'],
  adminToken
);

// Update package
await PremiumPackagesService.update(
  'PKG-123',
  { nomePacchetto: 'New Name' },
  adminToken
);

// Delete package
await PremiumPackagesService.delete('PKG-123', adminToken);
```

---

## 🌐 CORS Note

If you get CORS errors, make sure your backend includes your frontend URL in the CORS configuration:

```javascript
// Backend server.js already has:
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'https://frontend-isadora.onrender.com',
    'http://localhost:8084',
    'http://localhost:8083'
  ],
  credentials: true
}));
```

Add your frontend URL to the allowed origins!

---

## 📱 Quick Copy-Paste Commands

### Fetch All Packages

```javascript
fetch('http://localhost:3001/api/premium-packages')
  .then(res => res.json())
  .then(data => console.log(data.data));
```

### Create Package (Admin)

```javascript
fetch('http://localhost:3001/api/premium-packages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ADMIN_TOKEN'
  },
  body: JSON.stringify({
    nomePacchetto: 'Test Package',
    talentIds: ['talent-id-1', 'talent-id-2']
  })
})
  .then(res => res.json())
  .then(data => console.log(data));
```

### Update Package (Admin)

```javascript
fetch('http://localhost:3001/api/premium-packages/PKG-123', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ADMIN_TOKEN'
  },
  body: JSON.stringify({
    nomePacchetto: 'Updated Name'
  })
})
  .then(res => res.json())
  .then(data => console.log(data));
```

### Delete Package (Admin)

```javascript
// Soft delete
fetch('http://localhost:3001/api/premium-packages/PKG-123', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer YOUR_ADMIN_TOKEN'
  }
})
  .then(res => res.json())
  .then(data => console.log(data));

// Hard delete
fetch('http://localhost:3001/api/premium-packages/PKG-123?hardDelete=true', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer YOUR_ADMIN_TOKEN'
  }
})
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## 🎯 Common Patterns

### Loading State

```javascript
const [loading, setLoading] = useState(true);
const [data, setData] = useState(null);
const [error, setError] = useState(null);

useEffect(() => {
  setLoading(true);
  fetch('http://localhost:3001/api/premium-packages')
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setData(data.data);
      } else {
        setError(data.message);
      }
    })
    .catch(err => setError(err.message))
    .finally(() => setLoading(false));
}, []);
```

### Error Handling

```javascript
async function handleApiCall() {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    // Show user-friendly error message
    alert(error.message);
  }
}
```

---

## 🚀 Ready to Use!

All the commands and code snippets above are ready to copy and paste into your frontend application. Just replace:
- `http://localhost:3001` with your actual backend URL
- `YOUR_ADMIN_TOKEN` with the actual admin JWT token

Happy coding! 🎉

