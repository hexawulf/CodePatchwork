# Contributing to CodePatchwork

Thank you for considering contributing to CodePatchwork! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to uphold our Code of Conduct, which expects all contributors to be respectful, inclusive, and considerate.

## How Can I Contribute?

### Reporting Bugs

Before submitting a bug report:
- Check the issue tracker to see if the problem has already been reported
- Ensure the bug is related to the CodePatchwork application

When submitting a bug report, please include:
- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior vs. actual behavior
- Screenshots if applicable
- Any relevant details about your environment (browser, OS, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When suggesting an enhancement:
- Use a clear and descriptive title
- Provide a detailed description of the suggested enhancement
- Explain why this enhancement would be useful to users
- Include mockups or examples if applicable

### Pull Requests

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (if applicable)
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Pull Request Guidelines

- Update the README.md with details of changes to the interface, if applicable
- Update the documentation when changing functionality
- The PR should work for all browsers listed in the project specs
- Follow the existing coding style
- Include appropriate tests if you're adding or modifying functionality
- Ensure all tests pass before submitting your PR

## Development Setup

### Prerequisites

- Node.js (v18+)
- PostgreSQL database
- Firebase project (for authentication)

### Getting Started

1. Clone the repository
   ```bash
   git clone https://github.com/hexawolf/CodePatchwork.git
   cd CodePatchwork
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables (see README.md)

4. Start the development server
   ```bash
   npm run dev
   ```

### Code Style

- Follow the existing code style in the project
- Use consistent naming conventions
- Write clear comments for complex logic
- Use TypeScript types for all variables and function parameters

### Testing

- Write tests for new features
- Ensure existing tests pass before submitting pull requests

## License

By contributing to CodePatchwork, you agree that your contributions will be licensed under the project's MIT License.