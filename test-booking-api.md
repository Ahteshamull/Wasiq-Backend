# Trip Service Booking API Test

## Endpoint
POST `/trip-service-booking`

## Headers
- Authorization: `<JWT_TOKEN>`
- Content-Type: application/json

## Request Body Example
```json
{
  "tripServiceId": "your-trip-service-id",
  "from": "New York",
  "fromLat": 40.7128,
  "fromLng": -74.0060,
  "to": "Boston",
  "toLat": 42.3601,
  "toLng": -71.0589,
  "travelDate": "2024-12-25T10:00:00.000Z",
  "passengers": 2,
  "luggage": 2,
  "isReturn": false,
  "bookingVehicles": [
    {
      "vehicleId": "your-vehicle-id",
      "quantity": 1
    }
  ],
  "bookingStoppages": [
    {
      "stoppageId": "your-stoppage-id",
      "quantity": 1
    }
  ]
}
```

## Expected Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Trip service booking created successfully",
  "data": {
    "id": "booking-id",
    "from": "New York",
    "to": "Boston",
    "travelDate": "2024-12-25T10:00:00.000Z",
    "passengers": 2,
    "basePrice": 100.00,
    "vehiclePrice": 50.00,
    "stoppagePrice": 20.00,
    "totalPrice": 170.00,
    "status": "PENDING",
    "userId": "user-id",
    "tripServiceId": "trip-service-id",
    "createdAt": "2024-02-02T04:50:00.000Z",
    "updatedAt": "2024-02-02T04:50:00.000Z"
  }
}
```

## Features Implemented
✅ Authentication with JWT token
✅ Request validation with Zod
✅ Complete pricing calculation (base + vehicle + stoppage)
✅ Transaction-based booking creation
✅ Vehicle and stoppage validation
✅ Booking count increment on trip service
✅ Error handling for invalid data
✅ Support for return trips
✅ Time slot support (JSON field)

## Required Prerequisites
1. Valid JWT token for authenticated user
2. Existing TripService with ACTIVE status
3. Optional: Valid Vehicle IDs (must be active)
4. Optional: Valid Stoppage IDs
