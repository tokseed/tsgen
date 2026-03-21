"""
Entry point for Render deployment.
Imports and exposes the FastAPI app from src.main
"""

import sys
from pathlib import Path

# Добавляем src в путь импортов
sys.path.insert(0, str(Path(__file__).parent / "src"))

from main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
