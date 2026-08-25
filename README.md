# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## How this app works

Divine Calendar is a React Native app (Expo + Expo Router) covering multiple
deities (Murugan, Vishnu, Shiva, Durga Devi), each with their own festivals,
vrathams, and monthly observances for 2026–2035.

All event data is fully static, not server-fetched:

1. `data-engine/` (astronomy/panchangam calculations) runs offline, once, as
   a build-time script (`npx tsx data-engine/generate.ts`) - not inside the
   app.
2. It writes one JSON file per deity to `assets/data/` (e.g.
   `murugan-events.json`, `vishnu-events.json`), checked into the repo.
3. `src/data/events.ts` statically imports each dataset and registers it in
   the `DEITIES` array. Adding another deity means writing its rules in
   `data-engine/deities/<name>.ts` and registering the generated dataset
   there.

So at runtime there's no API, no backend, no network request for event data -
it's all baked into the app and works fully offline. Same story for the
reminder companion: notifications are scheduled locally on-device
(`expo-notifications`), and its voice uses the phone's own TTS engine
(`expo-speech`) - nothing calls out to a server for those either.

The only place this app talks to anything external is "Add to
Calendar"/"Export to Calendar (.ics)", which hands off to the device's own
Calendar/Sharing system - not a network call either.
