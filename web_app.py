# web_app.py
from flask import Flask, jsonify, request
from game_core import (
    GameSession,
    Plant,
    Animal,
    ProductionBuilding,
    MarketOrder,
    PlantState,
)

app = Flask(__name__, static_folder="static", static_url_path="/static")

# --- 1. GameSession + start-opstelling -------------------------

session = GameSession("web_player")
session.login()


def setup_game(gs: GameSession) -> None:
    # Zelfde idee als je main.py demo-setup :contentReference[oaicite:0]{index=0}
    gs.farm.inventory.update({
        "wheat_seed": 5,
        "water": 10,
        "wheat": 0,
        "egg": 0,
        "flour": 0,
    })

    # 3 velden met tarwe
    for _ in range(3):
        plant = Plant(crop_type="wheat", growth_time=5, yield_amount=3)
        field_index = len(gs.farm.fields)
        gs.farm.plant_crop(field_index=field_index, plant=plant)

    # 1 kip
    chicken = Animal(
        animal_type="chicken",
        product_type="egg",
        production_time=6,
        product_amount=2,
    )
    gs.farm.add_animal(chicken)
    chicken.feed()

    # molen (wheat -> flour)
    mill = ProductionBuilding(
        building_type="mill",
        recipe={"wheat": 2},
        output_product="flour",
        output_amount=1,
        production_time=4,
    )
    gs.farm.add_building(mill, cost=0)
    mill.add_to_queue(5)

    # één order voor demo
    order = MarketOrder(
        order_id="O-1",
        required_items={"flour": 2, "egg": 2},
        reward=150,
        expires_in=300,
    )
    gs.market_orders.append(order)


setup_game(session)


# --- 2. Routes -------------------------------------------------


@app.route("/")
def index():
    # serve static/index.html
    return app.send_static_file("index.html")


@app.get("/api/state")
def api_state():
    """Geef de huidige spelstatus terug als JSON."""
    # timers checken zodat dingen READY worden
    session.check_timers()

    # fields
    fields = []
    max_fields = session.farm.max_fields
    for i in range(max_fields):
        plant = session.farm.fields[i] if i < len(session.farm.fields) else None
        if plant is None:
            fields.append({
                "index": i,
                "empty": True,
            })
        else:
            fields.append({
                "index": i,
                "empty": False,
                "crop_type": plant.crop_type,
                "state": plant.state.value,
                "time_remaining": plant.time_remaining(),
            })

    # animals
    animals = []
    for i, a in enumerate(session.farm.animals):
        animals.append({
            "index": i,
            "animal_type": a.animal_type,
            "state": a.state.value,
            "time_remaining": a.time_remaining(),
        })

    # buildings
    buildings = []
    for i, b in enumerate(session.farm.buildings):
        buildings.append({
            "index": i,
            "building_type": b.building_type,
            "is_producing": b.is_producing,
            "time_remaining": b.time_remaining(),
            "queue_length": len(b.queue),
        })

    # simpele orders
    orders = []
    for o in session.market_orders:
        orders.append({
            "order_id": o.order_id,
            "required_items": o.required_items,
            "reward": o.reward,
            "expired": o.is_expired(),
        })

    return jsonify({
        "coins": session.farm.coins,
        "inventory": session.farm.inventory,
        "fields": fields,
        "animals": animals,
        "buildings": buildings,
        "orders": orders,
    })


@app.post("/api/action")
def api_action():
    """Voer een actie uit (plant, harvest, feed, start_production)."""
    data = request.get_json(force=True) or {}
    action = data.get("action")
    result = {"ok": False, "action": action}

    if action == "plant":
        # veld beplanten met tarwe
        idx = int(data.get("field_index", 0))
        plant = Plant("wheat", growth_time=5, yield_amount=3)
        ok = session.farm.plant_crop(idx, plant)
        result["ok"] = ok

    elif action == "harvest_field":
        # één veld oogsten
        idx = int(data.get("field_index", 0))
        if 0 <= idx < len(session.farm.fields):
            plant = session.farm.fields[idx]
            if plant and plant.state == PlantState.READY:
                amount = plant.harvest()
                crop = plant.crop_type
                session.farm.inventory[crop] = session.farm.inventory.get(crop, 0) + amount
                # veld leeg maken
                session.farm.fields[idx] = None
                result["ok"] = True
                result["collected"] = {crop: amount}

    elif action == "harvest_all":
        collected = session.harvest_and_collect()
        # geoogste velden leegmaken
        for i, plant in enumerate(session.farm.fields):
            if plant and plant.state == PlantState.HARVESTED:
                session.farm.fields[i] = None
        result["ok"] = True
        result["collected"] = collected

    elif action == "feed_animal":
        idx = int(data.get("animal_index", 0))
        if 0 <= idx < len(session.farm.animals):
            session.farm.animals[idx].feed()
            result["ok"] = True

    elif action == "start_production":
        idx = int(data.get("building_index", 0))
        if 0 <= idx < len(session.farm.buildings):
            b = session.farm.buildings[idx]
            ok = b.start_production(session.farm.inventory)
            result["ok"] = ok

    return jsonify(result)


if __name__ == "__main__":
    # debug=True voor development; in productie uitzetten
    app.run(debug=True)
