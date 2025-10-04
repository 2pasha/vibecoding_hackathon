# ETI HR Manual Chat Frontend

A modern React + TypeScript frontend for the ETI HR Manual Chat system.

## Features

- 🔐 **Token Authentication**: Secure API token validation
- 💬 **Real-time Chat**: Interactive chat interface with message history
- 📚 **Smart Citations**: Accurate source citations for all responses
- ⚡ **Performance Metrics**: Response time and retrieval statistics
- 🎨 **Modern UI**: Clean, responsive design with dark mode support
- 🔍 **API Health Monitoring**: Real-time API status checking
- ⚙️ **Configurable Settings**: Adjustable response length and other options

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Axios** for API communication
- **Lucide React** for icons
- **Context API** for state management

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Running ETI HR Manual API backend

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Configuration

The frontend connects to the API backend at `http://127.0.0.1:8080` by default. This can be configured in the Vite config file.

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── ChatMessage.tsx # Individual chat message
│   ├── ChatInput.tsx   # Message input component
│   ├── ChatHistory.tsx # Message history display
│   ├── SettingsPanel.tsx # Settings and configuration
│   └── ExampleQuestions.tsx # Predefined questions
├── contexts/           # React contexts
│   └── AppContext.tsx # Main application state
├── services/           # API and external services
│   └── api.ts         # API client
├── types/             # TypeScript type definitions
│   └── index.ts       # All type definitions
├── utils/             # Utility functions
│   └── index.ts       # Helper functions
├── App.tsx            # Main application component
├── main.tsx           # Application entry point
└── index.css          # Global styles
```

## API Integration

The frontend integrates with the following API endpoints:

- `POST /ask` - Send chat messages
- `POST /validate-token` - Validate API tokens
- `GET /healthz` - Check API health

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run type-check` - Run TypeScript type checking

### Code Style

The project uses ESLint with TypeScript and React rules. Prettier is recommended for code formatting.

## Deployment

The frontend can be deployed as a static site to any hosting service that supports static files:

- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Any CDN

Make sure to configure the API base URL for your production environment.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is part of the ETI HR Manual RAG System.

