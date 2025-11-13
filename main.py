# main.py
"""
Speelbare demo-loop voor Big Harvest Farming.

Dit script:
- maakt een GameSession aan;
- zet een paar velden, dieren en buildings klaar;
- laat een korte simulatie lopen met timers, oogsten, productie en orders.
"""

import time

# >>> BELANGRIJK <<<
# Als jouw bestand NIET game_core.py heet, vervang dan "game_core" hieronder
# door de naam van jouw .py-bestand ZONDER .py
from game_core import (
    GameSession,
    Plant,
    Animal,
    ProductionBuilding,
    MarketOrder,
    PlantState,
)


TICK_SEC = 0.5       # hoe vaak we status printen
RUN_FOR_SEC = 30     # hoe lang de demo loopt (in seconden)


def setup_game(gs: GameSession) -> None:
    """Zet de start-situatie klaar voor de demo."""

    # Startvoorraad in de inventory
    gs.farm.inventory.update({
        "wheat_seed": 5,
        "water": 10,
        "wheat": 0,
        "egg": 0,
        "flour": 0,
    })

    # VELDEN & PLANTEN
    # We planten 3 velden met tarwe die snel groeit
    for _ in range(3):
        plant = Plant(crop_type="wheat", growth_time=5, yield_amount=3)
        field_index = len(gs.farm.fields)
        gs.farm.plant_crop(field_index=field_index, plant=plant)

    # DIEREN
    # 1 kip die eieren produceert
    chicken = Animal(
        animal_type="chicken",
        product_type="egg",
        production_time=6,
        product_amount=2,
    )
    gs.farm.add_animal(chicken)
    chicken.feed()  # start direct met produceren

    # PRODUCTIE-BUILDING (molen: wheat -> flour)
    mill = ProductionBuilding(
        building_type="mill",
        recipe={"wheat": 2},
        output_product="flour",
        output_amount=1,
        production_time=4,
    )
    # cost = 0 zodat het in de demo altijd lukt
    gs.farm.add_building(mill, cost=0)

    # Zet een paar productie-jobs in de queue
    mill.add_to_queue(5)  # tot 5x flour

    # MARKT-ORDERS
    # Een order die flour en eggs vraagt en coins geeft
    order = MarketOrder(
        order_id="O-1",
        required_items={"flour": 2, "egg": 2},
        reward=150,
        expires_in=25,  # verloopt over 25 seconden
    )
    gs.market_orders.append(order)


def print_status(gs: GameSession) -> None:
    """Print de huidige status van de farm."""
    print("-" * 60)
    print(f"Coins: {gs.farm.coins}")
    print(f"Inventory: {gs.farm.inventory}")

    # Status van velden
    field_lines = []
    for i, plant in enumerate(gs.farm.fields):
        if plant is None:
            field_lines.append(f"Field {i}: [empty]")
        else:
            state = plant.state.value
            rem = int(plant.time_remaining())
            field_lines.append(f"Field {i}: {plant.crop_type} [{state}] {rem}s")
    print("Fields: ", " | ".join(field_lines) if field_lines else "Geen velden")

    # Status van dieren
    if gs.farm.animals:
        for i, animal in enumerate(gs.farm.animals):
            rem = int(animal.time_remaining())
            print(f"Animal {i}: {animal.animal_type} [{animal.state.value}] {rem}s")
    else:
        print("Animals: geen")

    # Status van buildings
    if gs.farm.buildings:
        for i, b in enumerate(gs.farm.buildings):
            rem = int(b.time_remaining())
            status = "PRODUCING" if b.is_producing else "IDLE"
            print(
                f"Building {i}: {b.building_type} [{status}] "
                f"{rem}s, queue={len(b.queue)}"
            )
    else:
        print("Buildings: geen")

    # Markt-orders
    if gs.market_orders:
        print("Market orders:")
        for order in gs.market_orders:
            print(
                f"  {order.order_id}: needs {order.required_items}, "
                f"reward={order.reward}, expired={order.is_expired()}"
            )
    else:
        print("Market orders: geen")


def main():
    # 1. GameSession aanmaken en inloggen
    gs = GameSession(player_id="player_1")
    login_info = gs.login()
    print("Login:", login_info)

    # 2. Setup start-game
    setup_game(gs)

    start_time = time.time()
    last_tick_print = 0.0

    while time.time() - start_time < RUN_FOR_SEC:
        # 3. Check timers (planten, dieren, buildings)
        ready = gs.check_timers()

        # 4. Oogsten & verzamelen
        collected = gs.harvest_and_collect()

        # 4b. Optioneel: geoogste velden leeg maken (zodat we later kunnen herplanten)
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
                # check of we nog een beetje "wheat_seed" hebben, puur cosmetisch
                if gs.farm.inventory.get("wheat_seed", 0) > 0:
                    gs.farm.inventory["wheat_seed"] -= 1
                new_plant = Plant(crop_type="wheat", growth_time=5, yield_amount=3)
                gs.farm.plant_crop(i, new_plant)

        # 8. Status printen elke TICK_SEC
        now_t = time.time()
        if now_t - last_tick_print >= TICK_SEC:
            print("\n=== TICK ===")
            if any(ready.values()):
                print("Ready items:", ready)
            if collected:
                print("Collected:", collected)
            if (
                order_results["completed_orders"]
                or order_results["expired_orders"]
            ):
                print("Order results:", order_results)
            print_status(gs)
            last_tick_print = now_t

        time.sleep(0.1)

    # 9. Logout en sessie afronden
    logout_info = gs.logout()
    print("\nGame session ended.")
    print("Logout:", logout_info)


if __name__ == "__main__":
    main()
