import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # Server
    APP_ENV = os.getenv("APP_ENV", "development")
    SECRET_KEY = os.getenv("SECRET_KEY", "change-this-in-production")

    # Database - Use absolute path based on current file location
    _current_dir = os.path.dirname(os.path.abspath(__file__))
    DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(_current_dir, 'mia.db')}")

    # Anthropic API
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

    # MCP Server (production server)
    MCP_SERVER_URL = os.getenv("MCP_SERVER_URL", "https://marketing-analytics-mcp-5qj9f.ondigitalocean.app/llm/mcp")
    # MCP_API_KEY removed - MCP uses OAuth authentication, not API keys

    # Frontend
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:8000")

    # CORS - Dynamic origins for development flexibility
    CORS_ORIGINS = ["*"]  # Allow all origins for development


settings = Settings()