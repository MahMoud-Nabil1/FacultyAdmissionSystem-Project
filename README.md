# Faculty Admission System

Faculty Admission System is a university software engineering project built to support academic administration, student registration, and communication workflows inside a faculty environment. The project includes a web dashboard, a mobile application, and a Node.js backend connected to MongoDB.

It is designed to help different roles work in one system, including students, admins, academic guides, coordinators, and reporters.

## What The Project Does

The system provides a central platform for:

- student login and account access
- course and group registration
- academic requests and complaints
- announcements publishing
- student, staff, subject, group, and place management
- academic advisor assignment and follow-up
- registration controls and basic reporting

## Main Features

- Web admin dashboard for managing operational data
- Mobile app for students and staff workflows
- Role-based access control for admins, academic guides, coordinators, reporters, and students
- Group scheduling with place assignment and capacity limits
- Place management for lecture halls, rooms, and labs
- Academic requests / complaints review and response flow
- Announcement management
- Password reset and email-based support utilities
- Arabic and English localization support

## Tech Stack

### Backend

- Node.js
- Express
- TypeScript
- MongoDB with Mongoose
- JWT authentication
- Nodemailer

### Web Frontend

- React
- React Router
- i18next

### Mobile App

- React Native
- Expo
- Expo Router

## Getting Started

### Prerequisites

- Node.js and npm
- MongoDB

### 1. Install dependencies

From the project root:

```bash
npm run install:all
```

If you also want the mobile app dependencies:

```bash
npm install --prefix mobile
```

### 2. Configure environment variables

Create `server/.env` and set at least:

```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your_secret_key
```

Optional mail-related variables used by some flows:

```env
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
ADMIN_EMAIL=
ADMIN_EMAIL_PASS=
IT_EMAIL=
```

Optional frontend environment file:

```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
```

Optional mobile environment variable:

```env
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:5000/api
```

## Running The Project

### Web app + backend

```bash
npm run start-web
```

This starts:

- backend on `http://localhost:5000`
- web frontend on `http://localhost:3000`

### Mobile app + backend

```bash
npm run start-mobile
```

### Android mobile run

```bash
npm run start-mobile:android
```

## Useful Scripts

### Root

- `npm run install:all`
- `npm run start:backend`
- `npm run start:frontend`
- `npm run start-web`
- `npm run start-mobile`
- `npm run start-mobile:android`

### Server

- `npm run start --prefix server`
- `npm run build --prefix server`
- `npm run seed:subjects --prefix server`
- `npm run seed:students --prefix server`
- `npm run seed:fix-groups --prefix server`

### Frontend

- `npm run start --prefix frontend`
- `npm run build --prefix frontend`

### Mobile

- `npm run start --prefix mobile`
- `npm run android --prefix mobile`
- `npm run ios --prefix mobile`

## Database Design

<img width="1125" height="604" alt="Database design" src="https://github.com/user-attachments/assets/8c317895-5aac-4542-81a2-e5d2041c6f83" />

## Team Members

- **Mahmoud Nabil Mohammed** `2327439`
- **Mostafa Mahmoud Ismael** `2327087`
- **Bilal Mohammed Ez El-Din** `2327091`
- **Abdallah Atef Abdallah** `2327220`
- **Mohammed Helmy Abdelsattar** `2328158`
- **Aya Mohammed Abbas** `1830083`

## Course Context

This project was developed as part of the `CS-303 Software Engineering` course.
