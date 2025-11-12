import importlib
import os
import runpy
import sys
from pathlib import Path

ROOT = Path(__file__).parent

def run_examples():
    ex = ROOT / "examples.py"
    if ex.exists():
        print("▶ Running examples.py …")
        runpy.run_path(str(ex), run_name="__main__")
        return True
    return False

def run_game_core():
    print("▶ Trying to run game_core …")
    try:
        gc = importlib.import_module("game_core")
    except Exception as e:
        print("✘ Could not import game_core:", e)
        return False

    for fn_name in ("main", "run", "start"):
        fn = getattr(gc, fn_name, None)
        if callable(fn):
            print(f"▶ Calling game_core.{fn_name}()")
            fn()
            return True

    Game = getattr(gc, "Game", None)
    if isinstance(Game, type):
        game = Game()
        for m in ("run", "start", "play", "__call__"):
            if hasattr(game, m) and callable(getattr(game, m)):
                print(f"▶ Calling Game.{m}()")
                getattr(game, m)()
                return True

    print("⚠ Geen automatisch entrypoint gevonden in game_core.")
    print("   Start handmatig: python examples.py of voeg main() toe in game_core.py")
    return False

def main():
    os.chdir(ROOT)
    if run_examples():
        return
    if run_game_core():
        return
    print("\nTip:")
    print("  python examples.py")
    print("  python -c \"import game_core; game_core.main()\"  # als er main() is")

if __name__ == "__main__":
    sys.exit(main() or 0)
