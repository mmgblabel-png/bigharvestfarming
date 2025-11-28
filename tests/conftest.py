import sys
import os

# Ensure project root is on sys.path for imports like `web_app`
ROOT = os.path.dirname(os.path.dirname(__file__))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)
