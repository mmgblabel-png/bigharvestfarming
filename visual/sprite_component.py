import pygame
from typing import Dict, Optional

from .animation import Animation


class SpriteComponent:
    """
    Koppelt meerdere Animation-objecten aan één entity
    (bijv. plant_wheat_stage1_idle, plant_wheat_harvest, chicken_eat, ...).
    """

    def __init__(self):
        self.animations: Dict[str, Animation] = {}
        self.current_name: Optional[str] = None
        self.loop: bool = True
        self.finished: bool = False

    def add_animation(self, name: str, animation: Animation):
        self.animations[name] = animation

    def play(self, name: str, loop: bool = True, restart: bool = True):
        """Start een animatie op naam."""
        if name == self.current_name and not restart:
            return
        if name not in self.animations:
            raise KeyError(f"Animation '{name}' not found")

        self.current_name = name
        self.loop = loop
        self.finished = False
        self.animations[name].reset()

    def update(self, dt: float):
        if not self.current_name:
            return

        anim = self.animations[self.current_name]
        previous_frame = anim.current_frame
        anim.update(dt)

        if not self.loop:
            # als we weer op frame 0 komen, houden we hem op het laatste frame
            if previous_frame == anim.frame_count - 1 and anim.current_frame == 0:
                self.finished = True
                anim.current_frame = anim.frame_count - 1

    def draw(self, surface: pygame.Surface, position: tuple[int, int]):
        """Teken de huidige frame op het scherm, gecentreerd op position."""
        if not self.current_name:
            return

        anim = self.animations[self.current_name]
        frame = anim.get_current_frame()
        rect = frame.get_rect(center=position)
        surface.blit(frame, rect)
