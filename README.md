# Budget App

A budget management application built with [Expo](https://expo.dev) and React Native.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Configure environment variables

   Create a `.env` file in the root directory:

   ```bash
   cp .env.example .env
   ```

   Update the `API_BASE_URL` in `.env` to match your backend server:

   ```env
   API_BASE_URL=http://localhost:8000/api
   ```

   **Important**: The `.env` file is required for the app to connect to the backend API. All API calls use the `API_BASE_URL` from the `.env` file.

3. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Deployment to Vercel

This project can be deployed to Vercel for web hosting. Follow these steps:

### Prerequisites

1. Create a [Vercel account](https://vercel.com/signup) if you don't have one
2. Install Vercel CLI (optional, for local testing):
   ```bash
   npm i -g vercel
   ```

### Deploy to Vercel

#### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push
   ```

2. **Import project in Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import your Git repository
   - Vercel will auto-detect the project settings

3. **Configure Environment Variables**
   - In Vercel project settings, go to "Environment Variables"
   - Add `API_BASE_URL` with your production API URL:
     ```
     API_BASE_URL=https://your-api-domain.com/api
     ```
   - Make sure to add it for all environments (Production, Preview, Development)

4. **Configure Build Settings**
   - Framework Preset: Other
   - Build Command: `npm run build:web`
   - Output Directory: `dist`
   - Install Command: `npm install`
   - Root Directory: `.` (leave empty or use current directory)

5. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete
   - Your app will be live at `https://your-project.vercel.app`

#### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add API_BASE_URL
   # Enter your production API URL when prompted
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

### Environment Variables

Make sure to set the following environment variables in Vercel:

- `API_BASE_URL`: Your production API base URL (e.g., `https://your-api-domain.com/api`)

**Important Notes:**
- Never commit `.env` file to Git (it's already in `.gitignore`)
- Always use Vercel's Environment Variables for production
- Update `API_BASE_URL` in Vercel to point to your production backend API
- The app will read `API_BASE_URL` from Vercel's environment variables during build

### Troubleshooting

1. **Build fails**: Make sure all dependencies are in `package.json`
2. **API calls fail**: Check that `API_BASE_URL` is set correctly in Vercel
3. **404 errors**: The `vercel.json` file includes rewrite rules for client-side routing
4. **CORS errors**: Make sure your backend API allows requests from your Vercel domain

### Custom Domain

1. Go to your Vercel project settings
2. Click "Domains"
3. Add your custom domain
4. Follow the DNS configuration instructions

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.
- [Vercel documentation](https://vercel.com/docs): Learn how to deploy and configure your project on Vercel.
