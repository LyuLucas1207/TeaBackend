# Backend Project

## Project Overview

This is a Node.js backend project designed for handling user authentication, email verification, and data management. The project includes several modules for serving requests, managing user data, and handling secure connections using HTTPS. JWT (JSON Web Tokens) is used for authentication, and the project is containerized with Docker.

## Project Structure

```plaintext
backend/
├── config/
│   └── server.json               # Server configuration (e.g., token expiration, secret keys)
├── src/
│   ├── html/
│   │   └── email.html            # Email template for user verification
│   ├── pic/                      # Folder for storing pictures used in emails
│   ├── http.js                   # HTTP server setup (with HTTPS support)
│   ├── init.js                   # Initializes server settings from configuration
│   ├── memberService.js          # Handles user-related services (e.g., signup, login, email verification)
│   ├── requestHandler.js         # Main request handling logic (routes POST requests)
│   ├── resourceService.js        # Handles static resources or files
│   └── utility.js                # Utility functions (e.g., token verification, sending responses)
├── node_modules/                 # Project dependencies (managed by npm)
├── server/
│   ├── admin/
│   │   ├── private/
│   │   │   └── specificInfo.json  # Private user information (admin level)
│   │   └── baseInfo.json          # General user data
│   └── data/
│       └── images/               # Stores user-uploaded or server images
├── .dockerignore                 # Files to ignore when building Docker images
├── .gitignore                    # Files to ignore in git version control
├── Dockerfile                    # Dockerfile for containerizing the backend
├── package.json                  # Node.js project dependencies and scripts
├── package-lock.json             # Lockfile for ensuring consistent dependency versions
├── ssl.crt                       # SSL certificate for HTTPS
├── ssl.key                       # SSL key for HTTPS
```

# Backend Project

## Getting Started

### Prerequisites
Before running the project, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/) (Node Package Manager)
- [Docker](https://www.docker.com/) (if using Docker for deployment)

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repository-url>
2. Navigate to the project directory:
    ```bash
    cd <your-repository-url>
3. Install dependencies:
    ```bash
    npm install

## Environment Setup

Make sure you have the correct configuration in the `config/server.json` file. This file includes essential settings like token expiration time, secret keys, and email credentials.

### Example `server.json`:

```json
{
    "expiresIn": "10m",
    "SECRET_KEY": "your-secret-key",
    "GOOGLE_EMAIL": "your-email@gmail.com",
    "GOOGLE_PASS": "your-email-password",
    "providedInviteCode": "your-invite-code",
    "headers": {
        "Content-Type": "application/json"
    }
}
```

### Running the Server

You can start the server with the following command:

```bash
node src/http.js
```

The server will start using the HTTPS protocol. Make sure you have valid SSL certificates (ssl.crt and ssl.key) placed in the root directory for secure communication.

### Using Docker

To run the project in a Docker container:

1. **Build the Docker image:**
   ```bash
   docker build -t backend-image .
2. **Run the Docker container:**
    ```bash
    docker run -d -p 10002:10002 --name backend-container backend-image