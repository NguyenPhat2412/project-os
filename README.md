
# Getting Started

## Setup Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Create a new project (e.g., "Project OS").
3. In the project dashboard, navigate to "Project Settings" > "General".
4. Scroll down to "Your apps" and click on the web icon (</>) to register a new web app.
5. Follow the prompts to register the app (e.g., "Project OS Web").
6. After registration, you will see the Firebase SDK configuration object. Copy this configuration as you will need it in the next step.

## Configure Environment Variables  

1. In the root of the project, create a `.env.local` file.
2. Add the following environment variables to the `.env.local` file, replacing the placeholders with the values from your Firebase SDK configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id   
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

NEXT_PUBLIC_PROJECT_ID=default
```

## Run the Application

1. Install dependencies:

```bash
npm install
```

1. Start the development server:

```bash
npm run dev
```

1. Open your browser and navigate to `http://localhost:3000` to see the application in action.

## Deploying to Vercel

1. Push your code to a GitHub repository.
2. Go to [Vercel](https://vercel.com/) and sign up or log in.
3. Click on "New Project" and import your GitHub repository.
4. During the setup, add the same environment variables you defined in your `.env.local` file to the Vercel environment variables section.
5. Complete the setup and deploy your application. After deployment, you will receive a live URL where your application is hosted.  
