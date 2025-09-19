#!/usr/bin/env python3
"""
Startup script for DigitalOcean App Platform deployment
Ensures proper configuration for containerized environment
"""
import os
import uvicorn
from simple_adk_server import app

if __name__ == "__main__":
    # DigitalOcean App Platform configuration
    port = int(os.environ.get("PORT", 8080))  # DigitalOcean default port
    host = "0.0.0.0"  # Listen on all interfaces

    print(f"Starting MIA Backend on {host}:{port}")
    print(f"Health check available at: http://{host}:{port}/health")
    print(f"Root health check available at: http://{host}:{port}/")

    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info"
    )