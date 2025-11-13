import time
import pygame

from game_core import (
    GameSession,
    Plant,
    Animal,
    ProductionBuilding,
    MarketOrder,
    PlantState,
)  # uit jouw repo
from main import setup_game, TICK_SEC  # hergebruik je bestaande setup-logica


WINDOW_WIDTH = 1024
WINDOW_HEIGHT = 768
BG_COLOR = (40, 120, 50)


def init_game_session() -> GameSession:
    """Maak een GameSession en zet dezelfde start-situatie op als in main.py."""
    gs = GameSession(player_id="player_1")
    gs.login()
    setup_game(gs)  # gebruikt jouw bestaande functie uit main.py
    return gs


def draw_text(surface, text, x, y, font, color=(255, 255, 255)):
    img = font.render(text, True, color)
    surface.blit(img, (x, y))


def main():
    pygame.init()
    screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
    pygame.display.setCaption = pygame.display.set_caption("Big Harvest Farming - Visual Demo")
    clock = pygame.time.Clock()
    font = pygame.font.SysFont("arial", 18)

    gs = init_game_session()

    running = True
    tick_accumulator = 0.0

    while running:
        dt = clock.tick(60) / 1000.0  # delta time in seconden
        tick_accumulator += dt

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

            # simpele controls:
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    running = False

        # --- GAME LOGICA (gebaseerd op jouw main.py) ---
        # Elke TICK_SEC (0.5 sec) doen we een 'tick'
        if tick_accumulator >= TICK_SEC:
            tick_accumulator -= TICK_SEC

            # 3. Check timers (planten, dieren, buildings)
            ready = gs.check_timers()

            # 4. Oogsten & verzamelen
            collected = gs.harvest_and_collect()

            # 4b. Geoogste velden leeg maken zodat we later kunnen herplanten
            for i, plant in enumerate(gs.farm.fields):
                if plant is not None and plant.state == PlantState.HARVESTED:
                    gs.farm.fields[i] = None

            # 5. Queues vullen / productie starten
            gs.fill_queues()
            for b in gs.farm.buildings:
                if not b.is_producing:
                    b.process_queue(gs.farm.inventory)

            # 6. Markt-orders verwerken
            order_results = gs.process_orders()

            # 7. Eenvoudig automatisch herplanten van lege velden
            for i, plant in enumerate(gs.farm.fields):
                if plant is None:
                    if gs.farm.inventory.get("wheat_seed", 0) > 0:
                        gs.farm.inventory["wheat_seed"] -= 1
                    new_plant = Plant(crop_type="wheat", growth_time=5, yield_amount=3)
                    gs.farm.plant_crop(i, new_plant)

            # hier kun je evt. debug-print doen:
            # print("Tick: ready=", ready, "collected=", collected, "orders=", order_results)

        # --- TEKENEN ---
        screen.fill(BG_COLOR)

        # coins & inventory
        draw_text(screen, f"Coins: {gs.farm.coins}", 20, 20, font)
        draw_text(screen, f"Inventory: {gs.farm.inventory}", 20, 50, font)

        # velden tekenen als blokjes
        start_x = 50
        y_fields = 120
        field_w = 120
        field_h = 60
        gap = 20

        for i, plant in enumerate(gs.farm.fields):
            x = start_x + i * (field_w + gap)
            rect = pygame.Rect(x, y_fields, field_w, field_h)
            pygame.draw.rect(screen, (90, 60, 30), rect)  # bruine akker

            if plant is None:
                label = f"Field {i}: empty"
            else:
                state = plant.state.value
                rem = int(plant.time_remaining())
                label = f"{plant.crop_type} [{state}] {rem}s"

            draw_text(screen, label, x + 5, y_fields + 5, font, (255, 255, 255))

        # dieren
        y_animals = 220
        if gs.farm.animals:
            for i, animal in enumerate(gs.farm.animals):
                x = start_x + i * 200
                label = f"Animal {i}: {animal.animal_type} [{animal.state.value}] {int(animal.time_remaining())}s"
                draw_text(screen, label, x, y_animals, font, (255, 255, 0))
        else:
            draw_text(screen, "Animals: none", start_x, y_animals, font)

        # buildings
        y_buildings = 260
        if gs.farm.buildings:
            for i, b in enumerate(gs.farm.buildings):
                x = start_x + i * 250
                rem = int(b.time_remaining())
                status = "PRODUCING" if b.is_producing else "IDLE"
                label = (
                    f"Building {i}: {b.building_type} [{status}] "
                    f"{rem}s, queue={len(b.queue)}"
                )
                draw_text(screen, label, x, y_buildings, font, (0, 200, 255))
        else:
            draw_text(screen, "Buildings: none", start_x, y_buildings, font)

        # markt-orders
        y_orders = 320
        if gs.market_orders:
            draw_text(screen, "Market orders:", start_x, y_orders, font)
            for j, order in enumerate(gs.market_orders):
                txt = (
                    f"{order.order_id}: needs {order.required_items}, "
                    f"reward={order.reward}, expired={order.is_expired()}"
                )
                draw_text(screen, txt, start_x + 20, y_orders + 25 + j * 20, font)
        else:
            draw_text(screen, "Market orders: none", start_x, y_orders, font)

        # instructies
        draw_text(screen, "ESC om af te sluiten", 20, WINDOW_HEIGHT - 40, font, (200, 200, 200))

        pygame.display.flip()

    pygame.quit()


if __name__ == "__main__":
    main()
