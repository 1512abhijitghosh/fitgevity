# Limitless Home Workout - PRD

## Vision
A best-in-class home workout app inspired by the "Home Workout" Play Store app: animated exercise demonstrations, body-part categories, daily plans, progress tracking, and a clean Premium upgrade path.

## Tech Stack
- Frontend: Expo (SDK 54), Expo Router, React Native, Lottie, expo-image, expo-linear-gradient
- Backend: FastAPI + MongoDB (motor)
- Auth: JWT email/password + Emergent Google Login (both supported)
- Payments: Stripe (PaymentIntent for one-time lifetime Premium $9.99)
- Animations: lottie-react-native with CDN-hosted Lottie JSONs

## Core Features
1. **Authentication**: Email/password signup-login and Google one-tap (Emergent)
2. **Home dashboard**: Streak, workout count, minutes, calories; body-part categories; workout plans
3. **Workouts tab**: Full catalog filterable by level (Beginner/Intermediate/Advanced)
4. **Body-part categories**: Abs, Arms, Chest, Legs, Shoulders, Full Body, Warm Up, Stretching (8 categories, 35+ exercises seeded)
5. **Workout detail / Active session**: Lottie animation, work/rest timer with circular progress ring, audio + haptic cues, skip & pause, per-exercise instructions
6. **Progress tab**: Stat cards, weekly bars, 5-week activity calendar, recent session list
7. **Profile tab**: User info, premium badge, settings, sign-out
8. **Premium paywall**: Stripe PaymentSheet (native), benefit list, $9.99 lifetime
9. **Premium gating**: Premium plans require upgrade

## Backend Endpoints (all under /api)
- `POST /auth/signup`, `POST /auth/login`, `POST /auth/google`, `GET /auth/me`, `POST /auth/logout`
- `GET /categories`, `GET /categories/{id}/exercises`, `GET /plans`, `GET /plans/{id}`
- `POST /workouts/log`, `GET /workouts/history`, `GET /workouts/stats`
- `POST /stripe/create-payment-sheet`, `POST /stripe/confirm-premium`, `POST /stripe/webhook`

## Design Tokens
- Dark obsidian surface `#0F0F11`
- Ember/Signal red brand `#FF4500`
- Neon green rest timer `#32D74B`
- Gold premium `#FFD700`

## Known Constraints
- Stripe PaymentSheet works only on iOS/Android (Expo Go or build). Web shows an "open on mobile" notice.
- Lottie animations load from public LottieFiles CDN.

## Next Roadmap
- Push notifications for reminders
- Custom workout builder
- Apple Health / Google Fit integration
