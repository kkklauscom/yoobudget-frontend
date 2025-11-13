// Load environment variables from .env file
// Note: dotenv will show (0) if variables already exist in the environment
// This is normal behavior and doesn't affect functionality
require("dotenv").config();

module.exports = {
  expo: {
    name: "budget-app",
    slug: "budget-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "budgetapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      // API base URL from .env file or Vercel environment variables
      // This is loaded via dotenv.config() at the top of this file
      // The value comes from:
      // 1. .env file: API_BASE_URL=http://localhost:8000/api (for local development)
      // 2. Vercel Environment Variables: API_BASE_URL (for production)
      // If not set, config/api.ts will use a default value
      apiBaseUrl: process.env.API_BASE_URL,
    },
  },
};
