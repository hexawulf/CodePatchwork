# CodePatchwork 🧩
<div align="center">

[![GitHub stars](https://img.shields.io/github/stars/hexawulf/CodePatchwork?style=social)](https://github.com/hexawulf/CodePatchwork/stargazers)
[![Live Demo](https://img.shields.io/badge/🚀_Demo-Live-success?style=flat-square)](https://www.codepatchwork.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**Transform your scattered code snippets into a beautiful, searchable visual library**

*A visual code snippet manager that combines the visual appeal of Pinterest with the functionality of GitHub Gists.*

![CodePatchwork Banner](codepatchwork-banner.png)

</div>

## 🌟 **Try CodePatchwork Live!**

<div align="center">

### **👉 [🚀 EXPERIENCE THE DEMO](https://www.codepatchwork.com) 👈**

*See CodePatchwork in action - no installation required!*

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-CodePatchwork.com-blue?style=for-the-badge&logoColor=white)](https://www.codepatchwork.com)

</div>

---

## 📋 Table of Contents
- [🌟 Live Demo](#-try-codepatchwork-live)
- [✨ Features](#-features)
- [🚀 Getting Started](#-getting-started)
- [🔧 Usage](#-usage)
- [🛠️ Technologies](#️-technologies-used)
- [🤝 Contributing](#-contributing)

## ⚡ Quick Start

Want to jump right in? **[Try the live demo](https://www.codepatchwork.com)** - no installation needed!

For local development, you'll need Node.js 18+ and PostgreSQL. See detailed setup below ⬇️

## ✨ Features

### 🎨 **Visual Experience**
- **Pinterest-Style Interface** - Visually appealing snippet organization
- **Syntax Highlighting** - Beautiful code display for 100+ languages
- **Dark/Light Themes** - Customizable visual experience
- **Responsive Design** - Perfect on desktop, tablet, and mobile

### 🔍 **Organization & Discovery**
- **Smart Search & Filtering** - Find snippets by language, tags, or content
- **Custom Collections** - Organize snippets into themed groups
- **Tags & Metadata** - Rich categorization and discovery
- **Import/Export** - Easy backup and migration

### 🤝 **Collaboration & Sharing**
- **Public Sharing** - Share snippets with customizable links
- **Comment System** - Collaborate and discuss code
- **Secure Authentication** - Google OAuth or email/password

## 📸 Screenshots

![Main Interface](screenshots/main-interface.png)
*Beautiful Pinterest-style code snippet organization*

![Dark Mode](screenshots/dark-mode.png)
*Elegant dark theme for comfortable coding*

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
- `npm run test:logger` - Verify Winston file logging in `dist`
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio to manage database

### Quick Logger Test

After running `npm run build`, execute `npm run test:logger` to verify that
`/home/zk/logs/codepatchwork.log` is created. The test script writes a few
messages using the bundled logger to ensure file logging works in production.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to this project.

## 📧 Contact

For questions or support, please open an issue on the GitHub repository.

## 🌟 **Ready to Transform Your Code Snippets?**

<div align="center">

### **[🚀 Try CodePatchwork Now](https://www.codepatchwork.com)**

[![Star this repo](https://img.shields.io/badge/⭐_Star_this_repo-black?style=for-the-badge&logo=github)](https://github.com/hexawulf/CodePatchwork)
[![Report Bug](https://img.shields.io/badge/🐛_Report_Bug-red?style=for-the-badge)](https://github.com/hexawulf/CodePatchwork/issues)
[![Request Feature](https://img.shields.io/badge/💡_Request_Feature-blue?style=for-the-badge)](https://github.com/hexawulf/CodePatchwork/issues)

</div>

---

Made with ❤️ by [hexawulf](https://github.com/hexawulf)
