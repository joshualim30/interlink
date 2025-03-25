# Interlink

A real-time global game where players aim to avoid thinking of the same word or phrase as anyone else during a set timeframe. The twist: if you are the only one to choose a word or phrase within your wagered time, you earn points equal to the seconds wagered. However, if someone else submits the same word or phrase within that period, your score resets.

## Features

-   Real-time word/phrase submission and validation
-   Wager system with customizable timeframes (30s, 60s, 120s, 300s)
-   Global leaderboard with top players and popular words
-   User authentication with email/password
-   Modern, responsive UI with smooth animations
-   Real-time score tracking and game state management
-   Profanity filter with user preferences
-   Comprehensive user profiles with:
    -   Game statistics (wins, losses, highest score)
    -   Average wager tracking
    -   Username management
    -   Account deletion
    -   Profanity filter preferences
-   Live feed of active words
-   Mobile-responsive design
-   AdSense integration for monetization

## Tech Stack

-   React + TypeScript
-   Firebase (Auth & Firestore)
-   TailwindCSS
-   Framer Motion
-   Vite

## Prerequisites

-   Node.js (v14 or higher)
-   npm or yarn
-   Firebase account and project
-   Google AdSense account (optional, for monetization)

## Setup

1. Clone the repository:

    ```bash
    git clone https://github.com/yourusername/interlink.git
    cd interlink
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Create a Firebase project and enable:

    - Authentication (Email/Password)
    - Firestore Database
    - AdSense (optional)

4. Copy the Firebase configuration values from your Firebase project settings and create a `.env` file in the root directory:

    ```
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    VITE_ADSENSE_CLIENT_ID=your_adsense_client_id  # Optional
    ```

5. Start the development server:

    ```bash
    npm run dev
    ```

6. Open your browser and navigate to `http://localhost:5173`

## Game Rules

1. Create an account or log in to start playing
2. Enter a word or phrase
3. Select a wager time (30s, 60s, 120s, or 300s)
4. Submit your entry
5. If no one else submits the same word/phrase within your wager time:
    - You earn points equal to your wager time
6. If someone else submits the same word/phrase:
    - Your score resets to 0
    - Their score also resets to 0

## User Features

### Profile Management

-   Edit username (disabled during active games)
-   View comprehensive game statistics
-   Toggle profanity filter preferences
-   Delete account (disabled during active games)
-   Sign out functionality

### Game Features

-   Real-time word validation
-   Live feed of active words
-   Wager system with multiple time options
-   Score tracking and leaderboard
-   Profanity filtering (optional)
