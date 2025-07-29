# BrainDash - Flashcard Learning App 🧠

A modern, cross-platform flashcard application built with React Native and Expo. BrainDash helps you create, organize, and study flashcards for effective learning.

## Features

- 📱 **Cross-platform**: Works on iOS, Android, and Web
- 🎯 **Smart Learning**: Create and organize flashcards by sets
- 🎨 **Modern UI**: Clean, intuitive interface with smooth animations
- 📊 **Progress Tracking**: Monitor your learning progress
- 🔄 **Offline Support**: Study without internet connection
- 🌐 **Web Version**: Access your flashcards from any browser

## Screenshots

*Add screenshots of your app here*

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/brain-dash.git
   cd brain-dash
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

## Usage

### Development

- **iOS Simulator**: Press `i` in the terminal or scan QR code
- **Android Emulator**: Press `a` in the terminal or scan QR code
- **Web Browser**: Press `w` in the terminal or visit `http://localhost:8081`
- **Physical Device**: Scan the QR code with Expo Go app

### Building for Production

#### Web Version (No Developer Account Required)
```bash
npx expo export --platform web
cd dist
python3 -m http.server 8000
```
Then visit `http://localhost:8000` in your browser.

#### iOS App
```bash
npx expo run:ios
```

#### Android App
```bash
npx expo run:android
```

## Project Structure

```
brain-dash/
├── app/                 # Main application screens
│   ├── (tabs)/         # Tab navigation screens
│   ├── set/            # Flashcard set screens
│   └── _layout.tsx     # Root layout
├── components/          # Reusable UI components
├── constants/           # App constants and configuration
├── hooks/              # Custom React hooks
├── store/              # State management
└── assets/             # Images, fonts, and static files
```

## Technologies Used

- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tools
- **Expo Router**: File-based navigation
- **TypeScript**: Type-safe JavaScript
- **React Native Reanimated**: Smooth animations
- **AsyncStorage**: Local data persistence

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions:

1. Check the [Expo documentation](https://docs.expo.dev/)
2. Search existing [GitHub issues](https://github.com/yourusername/brain-dash/issues)
3. Create a new issue with detailed information

## Acknowledgments

- Built with [Expo](https://expo.dev)
- Icons and design inspiration from the React Native community
- Special thanks to all contributors and users

---

Made with ❤️ for effective learning
