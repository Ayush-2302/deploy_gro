#!/usr/bin/env python3
"""
Local development startup script
"""
import os
import sys
import uvicorn

# Set environment variables for local development
os.environ["OPENAI_API_KEY"] = "your_openai_api_key_here"
os.environ["ALLOWED_ORIGIN"] = "http://localhost:5173"
os.environ["WHISPER_MODEL"] = "small"
os.environ["WHISPER_DEVICE"] = "cpu"
os.environ["OPENAI_MODEL"] = "gpt-4o-mini"

def main():
    """Start the FastAPI application for local development"""
    try:
        print("🚀 Starting GrowIt Medical Backend (Local Development)")
        print("📊 Environment: local development")
        print("🔗 Frontend: http://localhost:5173")
        print("🔗 Backend: http://localhost:8000")
        print("🔗 Health check: http://localhost:8000/api/health")
        print("🔗 API docs: http://localhost:8000/docs")
        
        # Add backend directory to Python path
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
        
        # Import the FastAPI app
        from main import app
        
        # Start the server
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=8000,
            reload=True,  # Enable auto-reload for development
            log_level="info"
        )
        
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
