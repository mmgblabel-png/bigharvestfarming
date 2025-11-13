from typing import Tuple

from .sprite_component import SpriteComponent
from .asset_loader import load_animation

FRAME_SIZE = 256  # pas dit aan als jouw frames anders zijn


def create_plant_sprite(crop_type: str) -> SpriteComponent:
    sprite = SpriteComponent()

    if crop_type == "wheat":
        sprite.add_animation(
            "plant_wheat_stage1_idle",
            load_animation("plants/plant_wheat_stage1_idle_4f.png", FRAME_SIZE, FRAME_SIZE, 4, fps=4),
        )
        sprite.add_animation(
            "plant_wheat_stage2_idle",
            load_animation("plants/plant_wheat_stage2_idle_4f.png", FRAME_SIZE, FRAME_SIZE, 4, fps=4),
        )
        sprite.add_animation(
            "plant_wheat_ready_idle",
            load_animation("plants/plant_wheat_ready_idle_4f.png", FRAME_SIZE, FRAME_SIZE, 4, fps=4),
        )
        sprite.add_animation(
            "plant_wheat_harvest",
            load_animation("plants/plant_wheat_harvest_4f.png", FRAME_SIZE, FRAME_SIZE, 4, fps=10),
        )
        sprite.play("plant_wheat_stage1_idle")

    # hier later andere crops toevoegen

    return sprite


def create_animal_sprite(animal_type: str) -> SpriteComponent:
    sprite = SpriteComponent()

    if animal_type == "chicken":
        sprite.add_animation(
            "chicken_idle",
            load_animation("animals/chicken_idle_4f.png", FRAME_SIZE, FRAME_SIZE, 4, fps=4),
        )
        sprite.add_animation(
            "chicken_eat",
            load_animation("animals/chicken_eat_4f.png", FRAME_SIZE, FRAME_SIZE, 4, fps=6),
        )
        sprite.add_animation(
            "chicken_happy",
            load_animation("animals/chicken_happy_4f.png", FRAME_SIZE, FRAME_SIZE, 4, fps=6),
        )
        sprite.play("chicken_idle")

    # later: cow, pig, etc.

    return sprite


def create_building_sprite(building_type: str) -> SpriteComponent:
    sprite = SpriteComponent()

    if building_type == "mill":
        sprite.add_animation(
            "mill_idle",
            load_animation("buildings/mill_idle_4f.png", FRAME_SIZE, FRAME_SIZE, 4, fps=4),
        )
        sprite.add_animation(
            "mill_work_flour",
            load_animation("buildings/mill_work_flour_4f.png", FRAME_SIZE, FRAME_SIZE, 4, fps=8),
        )
        sprite.add_animation(
            "mill_ready",
            load_animation("buildings/mill_ready_4f.png", FRAME_SIZE, FRAME_SIZE, 4, fps=6),
        )
        sprite.play("mill_idle")

    return sprite
