import pygame
from datetime import datetime

from game_core import Plant, Animal, ProductionBuilding, Farm  # uit jouw repo
from .factories import create_plant_sprite, create_animal_sprite, create_building_sprite


WINDOW_WIDTH = 1024
WINDOW_HEIGHT = 768
BG_COLOR = (40, 120, 50)


class VisualPlant:
    def __init__(self, plant: Plant, position):
        self.plant = plant
        self.sprite = create_plant_sprite(plant.crop_type)
        self.position = position

    def update(self, dt: float):
        # koppel timer/state uit game_core aan animatie
        self.plant.check_growth()
        if self.plant.state.name == "PLANTED":
            self.sprite.play("plant_wheat_stage1_idle", loop=True, restart=False)
        elif self.plant.state.name == "GROWING":
            self.sprite.play("plant_wheat_stage2_idle", loop=True, restart=False)
        elif self.plant.state.name == "READY":
            self.sprite.play("plant_wheat_ready_idle", loop=True, restart=False)

        self.sprite.update(dt)

    def harvest(self):
        if self.plant.state.name == "READY":
            self.sprite.play("plant_wheat_harvest", loop=False)
            self.plant.harvest()

    def draw(self, surface: pygame.Surface):
        self.sprite.draw(surface, self.position)


class VisualAnimal:
    def __init__(self, animal: Animal, position):
        self.animal = animal
        self.sprite = create_animal_sprite(animal.animal_type)
        self.position = position

    def feed(self):
        self.animal.feed()
        self.sprite.play("chicken_eat", loop=True)

    def update(self, dt: float):
        if self.animal.check_production():
            self.sprite.play("chicken_happy", loop=True, restart=False)

        self.sprite.update(dt)

    def collect_product(self):
        product = self.animal.collect_product()
        if product:
            # na verzamelen weer idle
            self.sprite.play("chicken_idle", loop=True)
        return product

    def draw(self, surface: pygame.Surface):
        self.sprite.draw(surface, self.position)


class VisualBuilding:
    def __init__(self, building: ProductionBuilding, position):
        self.building = building
        self.sprite = create_building_sprite(building.building_type)
        self.position = position

    def start_production(self, inventory):
        if self.building.start_production(inventory):
            self.sprite.play("mill_work_flour", loop=True)

    def update(self, dt: float, inventory):
        if self.building.check_production():
            self.sprite.play("mill_ready", loop=False)
            product = self.building.collect_product()
            if product:
                for k, v in product.items():
                    inventory[k] = inventory.get(k, 0) + v
                # na ready-animatie weer idle
                if self.sprite.finished:
                    self.sprite.play("mill_idle", loop=True)

        self.sprite.update(dt)

    def draw(self, surface: pygame.Surface):
        self.sprite.draw(surface, self.position)


def main():
    pygame.init()
    screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
    pygame.display.set_caption("Big Harvest Farming – Visual Demo")
    clock = pygame.time.Clock()

    # ----- BACKEND: jouw bestaande game_core classes -----
    farm = Farm("player1")
    plant = Plant("wheat", growth_time=10, yield_amount=5)
    animal = Animal("chicken", "eggs", production_time=8, product_amount=3)
    building = ProductionBuilding("mill", {"wheat": 2}, "flour", 1, production_time=5)

    farm.plant_crop(0, plant)
    farm.add_animal(animal)
    farm.add_building(building, cost=0)  # kosten 0 voor demo

    # ----- VISUAL WRAPPERS -----
    visual_plant = VisualPlant(plant, position=(250, 400))
    visual_animal = VisualAnimal(animal, position=(500, 450))
    visual_building = VisualBuilding(building, position=(800, 380))

    running = True
    last_click_time = datetime.now()

    while running:
        dt = clock.tick(60) / 1000.0  # seconden

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

            # simpele input: klikken om acties uit te proberen
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_h:
                    visual_plant.harvest()
                if event.key == pygame.K_f:
                    visual_animal.feed()
                if event.key == pygame.K_c:
                    visual_animal.collect_product()
                if event.key == pygame.K_p:
                    visual_building.start_production(farm.inventory)

        # UPDATE
        visual_plant.update(dt)
        visual_animal.update(dt)
        visual_building.update(dt, farm.inventory)

        # DRAW
        screen.fill(BG_COLOR)
        visual_plant.draw(screen)
        visual_animal.draw(screen)
        visual_building.draw(screen)

        pygame.display.flip()

    pygame.quit()


if __name__ == "__main__":
    main()
