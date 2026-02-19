# Expense Tracker API

A production-ready Node.js/TypeScript REST API foundation.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose)
- **Validation**: Zod
- **Logging**: Pino
- **Documentation**: Swagger UI
- **Security**: Helmet, Cors
- **Linting & Formatting**: ESLint, Prettier, CSpell

## Prerequisites

- Node.js (v18+ recommended)
- MongoDB

## Getting Started

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Setup**:
    Copy `sample.env` to `.env` and update the values.
    ```bash
    cp sample.env .env
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

4.  **Build**:
    ```bash
    npm run build
    ```

5.  **Start Production Server**:
    ```bash
    npm start
    ```

## Development Commands

- `npm run dev`: Start the server with `nodemon` for hot-reloading.
- `npm run lint`: Run ESLint.
- `npm run format`: Format code with Prettier.
- `npm run cspell`: Check spelling.
- `npm test`: Run tests (currently placeholder).

## Project Structure

- `src/config`: Environment configuration.
- `src/controller`: Request handlers.
- `src/service`: Business logic.
- `src/db`: Database connection and models.
- `src/middleware`: Custom middleware (Error handler, Validator).
- `src/routes`: API definitions.
- `src/schemas`: Zod validation schemas.
- `src/utils`: Helper functions.

## API Documentation

Access Swagger UI at `/api-docs` when the server is running.
