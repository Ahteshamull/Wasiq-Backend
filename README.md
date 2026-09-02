# Wasiq Backend API Documentation

Welcome to the Wasiq Backend. This project is built using Node.js, Express, and Prisma.

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```
2. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```

## Environment Variables
Make sure you have a `.env` file in the root directory with the necessary variables (e.g., `DATABASE_URL`, `JWT_SECRET`, `GOOGLE_MAP_KEY`, etc.).

---

## API Routes Overview

### Auth Routes

- **POST** /login
- **POST** /social-login
- **POST** /login-website
- **POST** /refresh-token
- **POST** /logout
- **PUT** /change-password
- **POST** /forgot-password
- **POST** /verify-otp
- **POST** /reset-password
- **DELETE** /delete-user/:id

### Blog Routes

- **POST** 
- **GET** 
- **GET** /:id
- **PATCH** /:id
- **DELETE** /:id

### Cancel_reservation Routes

- **PATCH** 
- **GET** 

### Customer Contact Routes

- **POST** 
- **GET** 
- **GET** /:id
- **PATCH** /:id
- **DELETE** /:id

### Faq Routes

- **POST** 
- **GET** 
- **GET** /:id
- **PATCH** /:id
- **DELETE** /:id
- **GET** /service/:serviceType

### Memory Routes

- **POST** /create-memory
- **GET** 
- **GET** /:id
- **PATCH** /:id
- **DELETE** /:id

### Message Routes

- **POST** /send-message/:receiverId
- **GET** /channels
- **GET** /my-channel-by-my-id/:userId
- **GET** /support-my-channel
- **GET** /my-channel/:receiverId
- **GET** /get-message/:channelName
- **GET** /user-admin-channels
- **GET** /channel/:channelId

### Navigation Route Routes

- **GET** /get-all-navigation-routes
- **PATCH** /update-navigation-route/:id
- **POST** /seed-default-routes

### Newsletter Routes

- **POST** 
- **GET** 
- **PATCH** /:id/status
- **DELETE** /:id
- **POST** /send-discount
- **POST** /send-discount-single/:email

### Notification Routes

- **GET** /my-notifications
- **POST** /send-notification
- **POST** /send-notifications
- **GET** /all-notifications
- **GET** /get-notification/:notificationId
- **DELETE** /delete-notification/:notificationId
- **PATCH** /mark-all-as-read
- **PATCH** /mark-as-read/:notificationId
- **PATCH** /mark-as-unread/:notificationId

### Payment Routes

- **POST** /stripe-account-onboarding
- **POST** /create-stripe-checkout-session/:tripServiceBookingId
- **POST** /webhook
- **POST** /stripe-cancel-booking/:tripServiceBookingId

### Policy Routes

- **PATCH** 
- **GET** 

### Refund_policy Routes

- **PATCH** 
- **GET** 

### Review Routes

- **POST** /service
- **GET** /service-all-reviews
- **PATCH** /:id/status

### Setting Routes

- **GET** /about
- **POST** /about
- **PATCH** /notification-settings

### Statistics Routes

- **GET** /overview
- **GET** /earnings-bookings-agent-dashboard
- **GET** /agent-bookings
- **GET** /user-bookings
- **GET** /user-dashboard-tab-info
- **GET** /admin-earnings
- **GET** /admin-reviews
- **GET** /admin-bookings

### Stoppage Routes

- **POST** 
- **GET** 
- **GET** /from-location/:location
- **GET** /:id
- **PATCH** /:id
- **DELETE** /:id
- **POST** /search-stoppage
- **POST** /add-extra-stoppage
- **GET** /single-stoppage/:id

### Support Routes

- **GET** 
- **POST** 
- **POST** /support-by-mail
- **GET** /my-report
- **GET** /:id
- **PATCH** /update-my-support/:supportId
- **DELETE** /delete-my-support/:supportId
- **DELETE** /:supportId

### Terms Routes

- **GET** 
- **POST** 

### Trip Service Booking Routes

- **POST** /create-booking
- **POST** /:tripServiceId
- **PATCH** /update-booking/:id
- **GET** /my-bookings
- **GET** /all-bookings
- **GET** /single/:id
- **DELETE** /delete-booking/:id

### Trip Service Routes

- **POST** 
- **GET** 
- **POST** /explore
- **GET** /all/explore
- **GET** /by-the-hour
- **GET** /by-the-hour/popular
- **POST** /day-trip
- **GET** /day-trip
- **GET** /day-trip/popular
- **GET** /day-trip/from-location-group
- **POST** /multi-day-tour
- **GET** /multi-day-tour
- **GET** /multi-day-tour/popular
- **GET** /multi-day-tour/tour-days-group
- **GET** /private-transfer
- **GET** /private-transfer/popular
- **GET** /private-transfer/from-location-group
- **GET** /airport-transfer
- **GET** /transfer
- **GET** /transfer/popular
- **GET** /airport-transfer/popular
- **GET** /airport-transfer/from-location-group
- **GET** /:id
- **PATCH** /:id
- **DELETE** /:id
- **GET** /from-location/:location

### User Routes

- **GET** 
- **GET** /agents
- **GET** /all-admins
- **GET** /inactive-agents
- **GET** /my-profile
- **GET** /dashboard
- **GET** /get-client-by-agent
- **GET** /get-single-client/:id
- **PATCH** /update-client/:id
- **GET** /:id
- **POST** 
- **POST** /agent
- **POST** /create-client
- **POST** /add-role
- **POST** /verify-user
- **PATCH** /update
- **PATCH** /update-user-status-inactive/:id
- **PATCH** /update-user-status-active/:id
- **PATCH** /my-account
- **DELETE** /delete-user/:id

### Vehicle Routes

- **POST** 
- **GET** 
- **GET** /:id
- **PATCH** /:id
- **DELETE** /:id

