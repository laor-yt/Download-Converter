# Download & Convert Tool

A powerful, local web application that allows you to download and transcode media via URLs (like YouTube) or upload local files. It features real-time progress tracking, format conversion, and orientation adjustments (Portrait/Landscape cropping).

## Requirements
To run this project locally, you must have the following installed on your system:
- **Node.js** (v18 or higher)
- **Python 3** (required for `yt-dlp` to fetch media)
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

---

## How to Update the Project on GitHub

If you make changes to the code (like modifying the UI or updating the backend logic), you need to push those changes to GitHub so they are safely backed up.

1. Open your terminal in the main root project folder (`D:\New folder (2)`).
2. Add all your modified files to the "staging" area:
   ```bash
   git add .
   ```
3. Commit your changes with a descriptive message explaining what you changed:
   ```bash
   git commit -m "Describe your changes here"
   ```
4. Push the changes to GitHub:
   ```bash
   git push origin master
   ```
