# CodePatchwork 🧩

A visual code snippet manager that combines the visual appeal of Pinterest with the functionality of GitHub Gists. CodePatchwork transforms how developers manage code snippets by replacing scattered text files and notes with a visually appealing, searchable repository.

![CodePatchwork Banner](codepatchwork-banner.png)

## ✨ Features

- **Visual Organization**: Manage code snippets with a Pinterest-style visual interface
- **Syntax Highlighting**: Automatic code highlighting for 100+ programming languages
- **Powerful Search & Filtering**: Find snippets by language, tags, or full-text search
- **Collections**: Organize snippets into custom collections for better categorization
- **Tags & Metadata**: Add tags and descriptions to make snippets more discoverable
- **Authentication**: Secure sign-in with Google OAuth or email/password
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Sharing**: Share snippets publicly with customizable links
- **Import/Export**: Easily backup or migrate your snippets
- **Dark/Light Themes**: Choose your preferred visual theme for better readability
- **Comment System**: Collaborate and discuss code with other users

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL database
- Firebase project (for authentication)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/hexawolf/CodePatchwork.git
   cd CodePatchwork
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   # PostgreSQL Database
   DATABASE_URL=postgres://username:password@localhost:5432/codepatchwork
   
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

4. Set up Firebase for authentication:
   - Create a Firebase project at [firebase.google.com](https://firebase.google.com/)
   - Enable Authentication with Google and Email/Password providers
   - Add your domain to Authorized Domains in Firebase Console (Authentication > Settings)
   - Copy your Firebase configuration values to the `.env` file

5. Set up the database:
   ```bash
   npm run db:push
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

## 🔧 Usage

### Adding a Snippet

1. Click the "+" button in the navigation bar
2. Enter the snippet title, code, and select the language
3. Add optional tags and description
4. Click "Save" to add the snippet to your collection

### Creating Collections

1. Navigate to the Collections page
2. Click "Create Collection"
3. Name your collection and add an optional description
4. Add snippets to your collection from the snippet context menu

### Searching Snippets

1. Use the search bar at the top of the page
2. Filter by language, tags, or full-text search
3. Toggle between grid and list views for different visualization options

### Sharing Snippets

1. Click the "Share" button on any snippet
2. Toggle the "Public" switch to make the snippet publicly accessible
3. Copy the generated link to share with others

## 🛠️ Technologies Used

- **Frontend**:
  - React.js 18 (Functional components & hooks)
  - TypeScript
  - TailwindCSS (with light/dark mode)
  - Vite (for fast development & builds)
  - Shadcn UI (for accessible UI components)
  - Prism.js (for code syntax highlighting)
  - TanStack Query (for data fetching)
  - Zod (for validation)

- **Backend**:
  - Node.js
  - Express.js
  - PostgreSQL (for data storage)
  - Drizzle ORM (for type-safe database queries)
  - Firebase Authentication (for user management)

## 🧪 Development

### Project Structure

```
├── client/             # Frontend React application
│   ├── public/         # Static assets
│   └── src/            # React source code
│       ├── components/ # UI components
│       ├── contexts/   # React contexts
│       ├── hooks/      # Custom React hooks
│       ├── lib/        # Utilities and constants
│       └── pages/      # Application pages
├── server/             # Backend Express server
│   ├── index.ts        # Server entry point
│   ├── routes.ts       # API routes
│   ├── storage.ts      # Database operations
│   └── vite.ts         # Vite development server setup
└── shared/             # Shared code between client and server
    └── schema.ts       # Database schema and types
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio to manage database

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to this project.

## 📧 Contact

For questions or support, please open an issue on the GitHub repository.

---

Made with ❤️ by [hexawolf](https://github.com/hexawolf)
