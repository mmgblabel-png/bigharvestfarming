import pygame
from typing import List


class Animation:
    """Speelt een spritesheet af (meerdere frames in één afbeelding)."""

    def __init__(
        self,
        image: pygame.Surface,
        frame_width: int,
        frame_height: int,
        frame_count: int,
        fps: float = 8.0,
    ):
        self.frames: List[pygame.Surface] = []
        self.frame_count = frame_count
        self.fps = fps
        self.current_frame = 0
        self.timer = 0.0

        sheet_width, sheet_height = image.get_size()
        frames_per_row = sheet_width // frame_width

        for i in range(frame_count):
            x = (i % frames_per_row) * frame_width
            y = (i // frames_per_row) * frame_height
            rect = pygame.Rect(x, y, frame_width, frame_height)
            frame = image.subsurface(rect)
            self.frames.append(frame)

    def update(self, dt: float):
        """Update naar volgende frame op basis van delta time in seconden."""
        self.timer += dt
        if self.timer >= 1.0 / self.fps:
            self.timer -= 1.0 / self.fps
            self.current_frame = (self.current_frame + 1) % self.frame_count

    def get_current_frame(self) -> pygame.Surface:
        return self.frames[self.current_frame]

    def reset(self):
        self.current_frame = 0
        self.timer = 0.0
