# CW-Forums

A modern cryptocurrency discussion forum built with React and Firebase.

**Live Demo:** <a href="https://cw-forums.web.app" target="_blank">https://cw-forums.web.app</a>

## About CW-Forums

CW-Forums is a sleek, dark-themed discussion platform designed for cryptocurrency enthusiasts. The application features categorized discussions, user authentication, and a responsive interface.

## Forum Categories

CW-Forums offers comprehensive coverage of the cryptocurrency ecosystem through specialized discussion categories:

- **General Discussion**: Broad crypto talk, market trends, news, and general topics
- **Bitcoin (BTC)**: Dedicated discussions about Bitcoin, the original cryptocurrency
- **Ethereum (ETH) & Smart Contracts**: Focus on Ethereum, its ecosystem, smart contracts, and dApps
- **Altcoins**: Discussions about other major cryptocurrencies (Litecoin, Cardano, Polkadot, etc.)
- **NFTs & Metaverse**: Non-Fungible Tokens, NFT marketplaces, Metaverse concepts, and game tokens
- **DeFi (Decentralized Finance)**: Yield farming, liquidity pools, stablecoins, and DeFi protocols
- **Mining & Staking**: Technical aspects of crypto mining, hardware setups, and proof-of-stake networks
- **Security & Wallets**: Wallet solutions, private keys, hardware wallets, and security best practices
- **Trading & Technical Analysis**: Trading strategies, chart analysis, signals, and market psychology
- **Regulations & Tax**: Discussions about regional crypto regulations, tax implications, and legal updates
- **ICO/IDO/IEO Discussions**: New token sales, launch platforms, and project vetting
- **Jobs & Collaboration**: Job postings and collaboration opportunities on blockchain projects
- **Off-Topic / Lounge**: Community building and general chatter
- **Support & Feedback**: Technical support, bug reports, and feedback on the forum itself

## Features

### User Authentication
- **Login/Registration**: Secure account creation and authentication
- **Profile Management**: Edit profiles and usernames with instant updates
- **Email Verification**: Real-time verification status with helpful feedback
- **Smart Logout**: Preserves user context on public pages after logout

### Forum Structure
- **Categories**: Organized topic-based discussion areas
- **Threads**: User-created discussion threads
- **Posts**: Threaded conversations with inline editing

### UI/UX Features
- **Dark Theme**: Consistent dark styling across all pages (#222, #333, #444 backgrounds with whitesmoke text)
- **Loading States**: Visual feedback for all operations ("Processing...", "Creating...", etc.)
- **Inline Editing**: Edit posts and threads directly without modal dialogs

## Technical Implementation

- **Frontend**: React with Vite, React Router, Context API
- **Backend**: Firebase (Authentication, Firestore, Hosting)
- **Styling**: CSS Modules for component-scoped styling

## Project Architecture

### Component Structure

The application follows a modular component-based architecture:

```
src/
├── components/
│   ├── common/          # Reusable UI components
│   ├── pages/           # Page-level components
│   │   ├── forums/      # Forums, categories, and threads
│   │   ├── login/       # Authentication pages
│   │   ├── profile/     # User profile
│   │   ├── register/    # User registration
│   │   ├── settings/    # User settings
│   │   └── notFound/    # 404 page
├── contexts/            # React Context providers
│   ├── AuthContext.jsx  # Authentication state
│   └── UserContext.jsx  # User profile data
├── guards/              # Route protection
│   ├── AuthGuard.jsx    # Protected routes for authenticated users
│   └── GuestGuard.jsx   # Routes available only to guests
├── layout/              # Application layout components
│   ├── header/          # Navigation header
│   └── footer/          # Page footer
└── services/            # API and data services
    ├── authService.js   # Authentication operations
    ├── forumService.js  # Forum data operations
    └── userService.js   # User profile operations
```

### State Management

The application uses React's Context API for global state management:

- **AuthContext**: Manages authentication state using Firebase's onAuthStateChanged
- **UserContext**: Provides user profile data and update functionality

### Routing

Client-side routing implemented with React Router:

- **Public Routes**: 
  - `/forums` - Main forum listing
  - `/categories/:categoryId` - Threads within a category
  - `/thread/:threadId` - Individual thread with posts
  
- **Protected Routes** (require authentication):
  - `/profile` - Current user's profile
  - `/profile/:userId` - View another user's profile
  - `/settings` - User account settings
  
- **Guest-Only Routes** (unavailable when logged in):
  - `/login` - User login page
  - `/register` - New account registration

### Authentication System

- Firebase Authentication for user management
- Email verification with real-time status updates
- Smart logout functionality that preserves user context
- Route guards to control access to protected pages

### Data Flow

1. **Services Layer**: Communicates with Firebase APIs
2. **Context Providers**: Maintain application state
3. **Components**: Consume context and services to render UI
4. **Forms**: Process user input with validation

## Local Development

```bash
# Clone the repository
git clone [repository-url]

# Install dependencies
npm install

# Start development server
npm run dev
