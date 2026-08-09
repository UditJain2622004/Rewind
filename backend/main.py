"""Thin uvicorn entry point that avoids the app.py ↔ app/ package name collision.

Run with:
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

import importlib.util
import sys
from pathlib import Path

# Load app.py under a clean alias so Python never maps it to 'app' in sys.modules,
# allowing 'from app.routes import ...' inside app.py to resolve to the app/ package.
_backend_dir = Path(__file__).resolve().parent
_spec = importlib.util.spec_from_file_location("rewind_server", _backend_dir / "app.py")
_module = importlib.util.module_from_spec(_spec)
sys.modules["rewind_server"] = _module
_spec.loader.exec_module(_module)

# Re-export the FastAPI instance so uvicorn can find it as main:app
app = _module.app
