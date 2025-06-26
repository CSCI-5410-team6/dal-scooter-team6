# DALScooter Frontend

A modern React TypeScript frontend for the DALScooter serverless web application with 3-factor authentication and role-based dashboards.

## Features

### 🔐 3-Factor Authentication

1. **User ID / Password** - Cognito-compatible login
2. **Security Question & Answer** - DynamoDB-stored security questions
3. **Caesar Cipher Puzzle** - Static form with input validation

### 👥 Role-Based Access

- **Guest**: View scooters, tariffs, feedback, chatbot
- **Customer**: All guest features + booking, feedback submission, messaging
- **Admin**: All customer features + scooter management, analytics, customer messages

### 🤖 Chatbot

- Floating chat button on all pages
- Dummy Q&A responses
- Quick question buttons
- Real-time chat interface

### 📱 Modern UI

- Responsive design with Tailwind CSS
- Mobile-friendly interface
- Clean, modern components
- Role-based color coding

## Demo Credentials

### Guest User

- **User ID**: `guest1`
- **Password**: `guestpass`
- **Security Answer**: `blue`
- **Caesar Answer**: `hello world`

### Customer User

- **User ID**: `cust1`
- **Password**: `custpass`
- **Security Answer**: `buddy`
- **Caesar Answer**: `hello world`

### Admin User

- **User ID**: `admin1`
- **Password**: `adminpass`
- **Security Answer**: `toronto`
- **Caesar Answer**: `hello world`

## Tech Stack

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Context API** for state management
- **Headless UI** for accessible components
- **Heroicons** for icons

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start development server:**

   ```bash
   npm start
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── auth/                 # Authentication components
│   │   ├── AuthFlow.tsx      # Main auth flow
│   │   ├── AuthStep1Credentials.tsx
│   │   ├── AuthStep2SecurityQuestion.tsx
│   │   └── AuthStep3CaesarCipher.tsx
│   ├── dashboard/            # Dashboard components
│   │   ├── DashboardLayout.tsx
│   │   ├── GuestDashboard.tsx
│   │   ├── CustomerDashboard.tsx
│   │   └── AdminDashboard.tsx
│   └── chatbot/              # Chatbot component
│       └── Chatbot.tsx
├── contexts/
│   └── AuthContext.tsx       # Authentication context
├── data/
│   └── dummyData.ts          # Mock data (DynamoDB simulation)
├── types/
│   └── index.ts              # TypeScript interfaces
└── App.tsx                   # Main app component
```

## Key Components

### Authentication Flow

- **AuthFlow**: Orchestrates the 3-step authentication process
- **AuthStep1Credentials**: User ID and password input
- **AuthStep2SecurityQuestion**: Security question validation
- **AuthStep3CaesarCipher**: Caesar cipher puzzle

### Dashboards

- **GuestDashboard**: View scooters, tariffs, feedback
- **CustomerDashboard**: Booking, feedback, messaging features
- **AdminDashboard**: Scooter management, analytics, customer messages

### Chatbot

- **Chatbot**: Floating chat interface with dummy Q&A
- Quick question buttons
- Real-time message simulation

## Features by User Type

### Guest Features

- ✅ View available scooters
- ✅ See pricing tariffs
- ✅ View customer feedback
- ✅ Access chatbot
- ❌ Book scooters
- ❌ Submit feedback
- ❌ Message admin

### Customer Features

- ✅ All guest features
- ✅ Book scooters
- ✅ View booking references & codes
- ✅ Submit feedback
- ✅ Message admin
- ❌ Manage scooters
- ❌ View analytics

### Admin Features

- ✅ All customer features
- ✅ Add/Edit/Delete scooters
- ✅ View dashboard analytics
- ✅ Manage customer messages
- ✅ View all bookings

## Dummy Data

The application uses mock data that simulates DynamoDB structure:

- **Users**: Guest, Customer, Admin with security questions
- **Scooters**: Gyroscooters, E-Bikes, Segways with features
- **Bookings**: Sample booking data with references
- **Feedback**: Customer reviews and ratings
- **Messages**: Customer-to-admin communications

## Styling

Built with **Tailwind CSS** for:

- Responsive design
- Modern UI components
- Consistent spacing and colors
- Mobile-first approach

## State Management

Uses **React Context API** for:

- Authentication state
- User role management
- 3-factor auth flow
- Global app state

## Routing

**React Router** handles:

- Protected routes
- Authentication redirects
- Role-based access
- Clean URL structure

## Development Notes

- All data is dummy/mock data
- No real API calls
- Authentication is simulated
- Success notifications are alerts
- Responsive design for all screen sizes

## Future Enhancements

- Real API integration
- Payment processing
- Real-time notifications
- Advanced analytics
- User profile management
- Email notifications
- Push notifications
- Offline support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the DALScooter serverless application.
