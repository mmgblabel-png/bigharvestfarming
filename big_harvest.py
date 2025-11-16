"""Convenience launcher for Big Harvest Farming.

Running this file will attempt to start the interactive CLI game
defined in `game_core.py`. If that fails, it falls back to the demo
loop in `main.py`.

Usage (Windows PowerShell):
  python big_harvest.py
"""

from importlib import import_module


def main():
	try:
		gc = import_module("game_core")
		if hasattr(gc, "main"):
			gc.main()
			return
	except Exception as e:
		print("Could not start game_core main():", e)

	try:
		demo = import_module("main")
		if hasattr(demo, "main"):
			demo.main()
			return
	except Exception as e:
		print("Fallback to main.py failed:", e)

	print("No entrypoints available. Run: python examples.py")


if __name__ == "__main__":
	main()
