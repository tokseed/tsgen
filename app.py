"""
Entry point for Render deployment.
Imports and exposes the FastAPI app from src.main
"""

import sys
import os
from pathlib import Path

# Добавляем корень проекта в путь импортов
ROOT_DIR = Path(__file__).parent
sys.path.insert(0, str(ROOT_DIR / "src"))

# Устанавливаем рабочую директорию для импортов из src
os.chdir(ROOT_DIR / "src")

from main import app

if __name__ == "__main__":
    import uvicorn
    import dotenv
    dotenv.load_dotenv(ROOT_DIR / ".env")
    uvicorn.run(app, host="0.0.0.0", port=8000)
