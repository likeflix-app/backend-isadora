# Backend API Requirements for Celebrity Status & Click Tracking

## Overview
This document outlines the backend API endpoints needed to support the celebrity status toggle and click tracking functionality in production.

## Required Database Schema Updates

### BackendTalent Table
Add the following fields to your talent/application table:

```sql
ALTER TABLE talents ADD COLUMN is_celebrity BOOLEAN DEFAULT FALSE;
ALTER TABLE talents ADD COLUMN click_count INTEGER DEFAULT 0;
```

## Required API Endpoints

### 1. Toggle Celebrity Status
**Endpoint:** `PATCH /api/talents/{talentId}/celebrity-status`

**Request:**
```json
{
  "isCelebrity": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "talent-123",
    "fullName": "John Doe",
    "isCelebrity": true,
    "clickCount": 5,
    // ... other talent fields
  }
}
```

**Implementation Notes:**
- Toggle the `is_celebrity` field in the database
- Return the updated talent object
- Add audit logging for admin actions

### 2. Track Talent Click
**Endpoint:** `POST /api/talents/{talentId}/track-click`

**Request:**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "userAgent": "Mozilla/5.0...",
  "ipAddress": "192.168.1.1"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Click tracked successfully"
}
```

**Implementation Notes:**
- Increment the `click_count` field
- Optionally track additional analytics (IP, timestamp, user agent)
- Consider rate limiting to prevent spam

### 3. Get Talents with Click Data
**Endpoint:** `GET /api/talents`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "talent-123",
      "fullName": "John Doe",
      "isCelebrity": true,
      "clickCount": 15,
      "createdAt": "2024-01-01T00:00:00Z",
      // ... other talent fields
    }
  ]
}
```

## Production Benefits

### ✅ Scalability
- Multiple admin users can manage celebrity status
- Data persists across sessions and devices
- Supports concurrent users

### ✅ Data Integrity
- Database transactions ensure consistency
- Audit trail of all changes
- Backup and recovery capabilities

### ✅ Performance
- Efficient database queries
- Caching strategies possible
- Optimized for high traffic

### ✅ Security
- Proper authentication and authorization
- Rate limiting for click tracking
- Input validation and sanitization

## Migration Strategy

### Phase 1: Database Updates
1. Add new columns to existing table
2. Set default values for existing records
3. Update any existing queries

### Phase 2: API Implementation
1. Implement the three endpoints above
2. Add proper error handling
3. Include authentication checks

### Phase 3: Frontend Deployment
1. Deploy updated frontend code
2. Test with backend integration
3. Monitor for any issues

## Testing Checklist

- [ ] Celebrity status toggle works for admin users
- [ ] Click tracking increments correctly
- [ ] Data persists across browser sessions
- [ ] Multiple admin users can work simultaneously
- [ ] Error handling works properly
- [ ] Performance is acceptable under load

## Security Considerations

1. **Authentication**: Only admin users can toggle celebrity status
2. **Rate Limiting**: Prevent spam clicking on talent cards
3. **Input Validation**: Sanitize all inputs
4. **Audit Logging**: Track who changed what and when
5. **CORS**: Configure properly for frontend domain

## Monitoring & Analytics

Consider tracking:
- Celebrity status changes (who, when, what)
- Click patterns and popular talents
- Admin panel usage statistics
- API performance metrics

This backend implementation ensures the celebrity and click tracking features will work reliably in production for years to come.

