# Fyora - RAG-Powered Chat Application

A modern, AI-powered chat application that combines Retrieval Augmented Generation (RAG) with web search capabilities. Upload documents, ask questions, and get intelligent answers backed by your documents and real-time web search results.

![Next.js](https://img.shields.io/badge/Next.js-16.1-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![ChromaDB](https://img.shields.io/badge/ChromaDB-3.2-green)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-brightgreen)

## ✨ Features

- 📄 **Document Upload & Processing**: Upload PDF, DOCX, TXT, and Markdown files
- 🔍 **RAG (Retrieval Augmented Generation)**: Get answers from your uploaded documents with source citations
- 🌐 **Web Search Integration**: Optional Tavily web search for real-time information
- 💬 **Multi-Thread Conversations**: Manage multiple conversation threads
- 🎨 **Modern UI**: Beautiful, responsive dark-mode interface with smooth animations
- 🔐 **Source Citations**: See exactly which documents and URLs were used in answers
- 📱 **Fully Responsive**: Works seamlessly on desktop, tablet, and mobile devices
- ⚡ **Fast & Efficient**: Powered by Groq LLM and Hugging Face embeddings

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** components
- **Framer Motion** for animations
- **Lucide React** icons

### Backend
- **Next.js API Routes**
- **MongoDB** with Mongoose
- **ChromaDB** (vector database)
- **LangChain** (document processing)
- **Groq LLM** (llama-3.3-70b-versatile)
- **Hugging Face** (sentence-transformers/all-MiniLM-L6-v2)
- **Tavily** (web search)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ and npm
- **Docker** (for local ChromaDB)  **Render account** (for hosted ChromaDB)
- **MongoDB** 
- API Keys:
  - [Groq API Key](https://console.groq.com/)
  - [Hugging Face API Key](https://huggingface.co/settings/tokens)
  - [Tavily API Key](https://tavily.com/) (optional, for web search)
  - MongoDB connection string

## 🚀 Installation

1. **Clone the repository**h
   git clone https://github.com/yourusername/fyora-chat-app.git
   cd fyora-chat-app
   2. **Install dependencies**h
   npm install
   3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   # MongoDB
   MONGODB_URI=mongodb://localhost:27017/fyora-chat
   # Or use MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fyora-chat

   # ChromaDB (choose one option below)
   # Option 1: Local Docker (default)
   CHROMA_SERVER_URL=http://localhost:8000
 

   # Groq API
   GROQ_API_KEY=your_groq_api_key_here

   # Hugging Face API
   HUGGINGFACE_API_KEY=your_huggingface_api_key_here

   # Tavily API (optional, for web search)
   TAVILY_API_KEY=your_tavily_api_key_here
   ## 🐳 Running ChromaDB

### Option 1: Local Development with Docker

1. **Pull and run ChromaDB Docker container**
 
   docker pull chromadb/chroma:latest
   docker run -d \
     --name chromadb \
     -p 8000:8000 \
     chromadb/chroma:latest
   2. **Verify ChromaDB is running**
 
   curl http://localhost:8000/api/v1/heartbeat
   3. **Stop ChromaDB (when needed)**
 
   docker stop chromadb
   docker rm chromadb
   ### Option 2: Hosted ChromaDB on Render

1. **Create a new Web Service on Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"

2. **Configure the service**
   - **Name**: `chromadb-deployment` (or your preferred name)
   - **Environment**: Docker
   - **Docker Image**: `chromadb/chroma:latest`
   - **Port**: `8000`

3. **Add environment variables (optional)**
   - `IS_PERSISTENT=TRUE` (if you want data persistence)
   - `ANONYMIZED_TELEMETRY=FALSE` (optional)

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Copy the service URL (e.g., `https://chromadb-deployment.onrender.com`)

5. **Update your `.env.local`**
   CHROMA_SERVER_URL=https://chromadb-deployment.onrender.com
   6. **Verify the deployment**
   curl https://chromadb-deployment.onrender.com/api/v1/heartbeat
   ## 🏃 Running the Application

1. **Start the development server**
   npm run dev
   2. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

3. **Build for production**
   npm run build
   npm start
   ## 📚 Usage

### Uploading Documents

1. Click the **upload button** (floating button in bottom-right)
2. Select a file (PDF, DOCX, TXT, or MD)
3. Wait for processing to complete
4. Your document is now searchable!

### Chatting with Documents

1. Click **"New Chat"** to start a conversation
2. Type your question
3. Toggle **"Enable Web Search"** if you want real-time web results
4. Get answers with source citations

### Managing Threads

- **Search**: Use the search bar in the sidebar
- **Rename**: Click settings icon → "Rename Thread"
- **Delete**: Click settings icon → "Delete Thread"
- **Switch**: Click any thread in the sidebar

## 🌐 Deployment

### Deploying to Vercel

1. **Push your code to GitHub**

2. **Import project in Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" → "Project"
   - Import your GitHub repository

3. **Configure environment variables**
   Add all environment variables from your `.env.local`:
   - `MONGODB_URI`
   - `CHROMA_SERVER_URL` (use your Render ChromaDB URL)
   - `GROQ_API_KEY`
   - `HUGGINGFACE_API_KEY`
   - `TAVILY_API_KEY` (optional)

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete

### Important Notes for Vercel

- Files are automatically saved to `/tmp` (Vercel-compatible)
- ChromaDB must be hosted externally (use Render)
- MongoDB should use Atlas (not local MongoDB)

## 📡 API Endpoints

### Chat
- `POST /api/chat` - Send a message and get AI response

### Threads
- `GET /api/threads` - List all threads (with pagination)
- `POST /api/threads` - Create a new thread
- `GET /api/threads/[id]` - Get thread messages (with pagination)
- `PATCH /api/threads/[id]` - Update thread title
- `DELETE /api/threads/[id]` - Delete a thread

### Documents
- `GET /api/documents` - List all uploaded documents
- `POST /api/documents/upload` - Upload a document
