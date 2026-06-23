# Download & Convert Tool

A powerful, local web application that allows you to download and transcode media via URLs (like YouTube) or upload local files. It features real-time progress tracking, format conversion, and orientation adjustments (Portrait/Landscape cropping).

## Requirements
To run this project locally, you must have the following installed on your system:
- **Node.js** (v18 or higher)
   Install
   ```bash
   winget install OpenJS.NodeJS.LTS
   ```
- **Python 3** (required for `yt-dlp` to fetch media)
   Install
   ```bash
   winget install Python.Python.3.10
   ```
- **FFmpeg** (installed automatically by the backend)

## How to Run the Project Locally

Because this project is separated into a **Backend** (Node.js) and a **Frontend** (React), you need to start both of them in two separate terminal windows.

### 1. Start the Backend Server
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install the necessary dependencies (only needed the very first time):
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   node server.js
   ```
   *(You should see "Server is running on port 5000" in the terminal)*

### 2. Start the Frontend Application
1. Open a **second, new terminal window** and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install the necessary dependencies (only needed the very first time):
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm run dev
   ```
4. Open your web browser and navigate to the Local URL provided in the terminal (usually `http://localhost:5173`).

