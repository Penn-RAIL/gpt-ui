# RailGPT API Plugin

This project demonstrates a basic setup for a web application with a FastAPI backend and a React frontend, designed to interact with an AI model (like Azure OpenAI).

## Prerequisites

*   **Python**: Version 3.8 or higher. [https://www.python.org/](https://www.python.org/)
*   **Pip**: Python package installer (usually comes with Python).
*   **Bun**: A fast JavaScript runtime, package manager, and bundler. [https://bun.sh/](https://bun.sh/)
    *   Alternatively, you can use **Node.js** (v18 or higher) and **npm** or **yarn** if you prefer, but the frontend instructions assume Bun.

## Setup & Running

Follow these steps to get the application running locally:

### 1. Backend (FastAPI - Port 8000)

   Navigate to the backend directory:
   ```bash
   cd railgptbackend
   ```

   Create a Python virtual environment (recommended):
   ```bash
   python -m venv venv 
   ```

   Activate the virtual environment:
   *   **macOS/Linux:**
       ```bash
       source venv/bin/activate
       ```
   *   **Windows (cmd/powershell):**
       ```bash
       .\venv\Scripts\activate 
       ```

   Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

   Run the FastAPI development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   The backend API will be accessible at `http://localhost:8000`.

### 2. Frontend (React/Vite - Port 5173)

   Open a **new terminal window/tab**. Navigate to the frontend directory:
   ```bash
   cd ../railgptfrontend 
   # Or from the root: cd railgptfrontend
   ```

   Install Node.js dependencies using Bun:
   ```bash
   bun install
   ```
   *(If using npm: `npm install`)*
   *(If using yarn: `yarn install`)*


   Run the Vite development server:
   ```bash
   bun run dev
   ```
   *(If using npm: `npm run dev`)*
   *(If using yarn: `yarn dev`)*

   The frontend application will start and be accessible in your browser at `http://localhost:5173`.

## Accessing the Application

Once both the backend and frontend servers are running, open your web browser and navigate to:

[http://localhost:5173](http://localhost:5173)

## Configuration

*   **API Keys**: You will need to configure your Azure OpenAI endpoint and API key within the application's settings UI (accessible via the gear icon in the frontend) for the chat functionality to work correctly.
*   **CORS**: The backend is configured to allow requests from `http://localhost:5173`. If you run the frontend on a different port, you'll need to update the `origins` list in `railgptbackend/main.py`. 