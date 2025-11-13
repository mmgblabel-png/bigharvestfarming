import os
import pygame

from .animation import Animation


ASSETS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets")


def load_image(*path_parts: str) -> pygame.Surface:
    """Laad een afbeelding uit de assets-map."""
    path = os.path.join(ASSETS_DIR, *path_parts)
    image = pygame.image.load(path).convert_alpha()
    return image


def load_animation(
    relative_path: str,
    frame_w: int,
    frame_h: int,
    frame_count: int,
    fps: float = 8.0,
) -> Animation:
    sheet = load_image(relative_path)
    return Animation(sheet, frame_w, frame_h, frame_count, fps)
