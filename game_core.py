"""
Core Game Loop for Big Harvest Farming
Implements the main game mechanics including plants, animals, production, and trading.
"""

import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from enum import Enum


class ItemType(Enum):
    """Types of items in the game"""
    SEED = "seed"
    CROP = "crop"
    ANIMAL_PRODUCT = "animal_product"
    PROCESSED_GOOD = "processed_good"
    BOOST_ITEM = "boost_item"
    DECORATION = "decoration"


class PlantState(Enum):
    """States of plant growth"""
    PLANTED = "planted"
    GROWING = "growing"
    READY = "ready"
    HARVESTED = "harvested"


class AnimalState(Enum):
    """States of animal care"""
    HUNGRY = "hungry"
    FED = "fed"
    PRODUCING = "producing"
    READY = "ready"


class Plant:
    """Represents a plant/crop in the game"""
    
    def __init__(self, crop_type: str, growth_time: int, yield_amount: int):
        self.crop_type = crop_type
        self.growth_time = growth_time  # in seconds
        self.yield_amount = yield_amount
        self.state = PlantState.PLANTED
        self.planted_at = datetime.now()
        self.ready_at = self.planted_at + timedelta(seconds=growth_time)
        self.boost_multiplier = 1.0
        
    def apply_boost(self, multiplier: float):
        """Apply a boost item to speed up growth"""
        self.boost_multiplier *= multiplier
        remaining_time = (self.ready_at - datetime.now()).total_seconds()
        new_remaining_time = remaining_time / multiplier
        self.ready_at = datetime.now() + timedelta(seconds=new_remaining_time)
        
    def check_growth(self) -> bool:
        """Check if plant is ready for harvest"""
        if datetime.now() >= self.ready_at and self.state != PlantState.HARVESTED:
            self.state = PlantState.READY
            return True
        return False
        
    def harvest(self) -> int:
        """Harvest the plant and return yield"""
        if self.state == PlantState.READY:
            self.state = PlantState.HARVESTED
            return int(self.yield_amount * self.boost_multiplier)
        return 0
        
    def time_remaining(self) -> float:
        """Get remaining time until harvest in seconds"""
        if self.state == PlantState.HARVESTED:
            return 0
        remaining = (self.ready_at - datetime.now()).total_seconds()
        return max(0, remaining)


class Animal:
    """Represents an animal in the farm"""
    
    def __init__(self, animal_type: str, product_type: str, production_time: int, 
                 product_amount: int):
        self.animal_type = animal_type
        self.product_type = product_type  # eggs, milk, meat
        self.production_time = production_time  # in seconds
        self.product_amount = product_amount
        self.state = AnimalState.HUNGRY
        self.fed_at = None
        self.ready_at = None
        
    def feed(self):
        """Feed the animal to start production"""
        self.state = AnimalState.PRODUCING
        self.fed_at = datetime.now()
        self.ready_at = self.fed_at + timedelta(seconds=self.production_time)
        
    def check_production(self) -> bool:
        """Check if animal product is ready"""
        if self.ready_at and datetime.now() >= self.ready_at:
            self.state = AnimalState.READY
            return True
        return False
        
    def collect_product(self) -> Optional[Dict[str, Any]]:
        """Collect the animal product"""
        if self.state == AnimalState.READY:
            product = {
                "type": self.product_type,
                "amount": self.product_amount
            }
            self.state = AnimalState.HUNGRY
            self.fed_at = None
            self.ready_at = None
            return product
        return None
        
    def time_remaining(self) -> float:
        """Get remaining time until product is ready"""
        if not self.ready_at:
            return 0
        remaining = (self.ready_at - datetime.now()).total_seconds()
        return max(0, remaining)


class ProductionBuilding:
    """Represents a production building for processing goods"""
    
    def __init__(self, building_type: str, recipe: Dict[str, int], 
                 output_product: str, output_amount: int, production_time: int):
        self.building_type = building_type
        self.recipe = recipe  # {"wheat": 2, "water": 1}
        self.output_product = output_product
        self.output_amount = output_amount
        self.production_time = production_time  # in seconds
        self.is_producing = False
        self.started_at = None
        self.ready_at = None
        self.queue = []
        
    def start_production(self, inventory: Dict[str, int]) -> bool:
        """Start production if resources are available"""
        if self.is_producing:
            return False
            
        # Check if we have enough ingredients
        for ingredient, amount in self.recipe.items():
            if inventory.get(ingredient, 0) < amount:
                return False
                
        # Consume ingredients
        for ingredient, amount in self.recipe.items():
            inventory[ingredient] -= amount
            
        self.is_producing = True
        self.started_at = datetime.now()
        self.ready_at = self.started_at + timedelta(seconds=self.production_time)
        return True
        
    def check_production(self) -> bool:
        """Check if production is complete"""
        if self.is_producing and self.ready_at and datetime.now() >= self.ready_at:
            return True
        return False
        
    def collect_product(self) -> Optional[Dict[str, int]]:
        """Collect the produced goods"""
        if self.check_production():
            product = {self.output_product: self.output_amount}
            self.is_producing = False
            self.started_at = None
            self.ready_at = None
            return product
        return None
        
    def add_to_queue(self, count: int = 1):
        """Add production jobs to queue"""
        self.queue.extend([1] * count)
        
    def process_queue(self, inventory: Dict[str, int]) -> bool:
        """Process next item in queue if production is idle"""
        if not self.is_producing and self.queue:
            if self.start_production(inventory):
                self.queue.pop(0)
                return True
        return False
        
    def time_remaining(self) -> float:
        """Get remaining time until production completes"""
        if not self.ready_at:
            return 0
        remaining = (self.ready_at - datetime.now()).total_seconds()
        return max(0, remaining)


class MarketOrder:
    """Represents a market order for selling goods"""
    
    def __init__(self, order_id: str, required_items: Dict[str, int], 
                 reward: int, expires_in: int):
        self.order_id = order_id
        self.required_items = required_items
        self.reward = reward
        self.created_at = datetime.now()
        self.expires_at = self.created_at + timedelta(seconds=expires_in)
        self.completed = False
        
    def is_expired(self) -> bool:
        """Check if order has expired"""
        return datetime.now() >= self.expires_at and not self.completed
        
    def fulfill(self, inventory: Dict[str, int]) -> Optional[int]:
        """Fulfill the order if inventory has required items"""
        if self.is_expired() or self.completed:
            return None
            
        # Check if we have all required items
        for item, amount in self.required_items.items():
            if inventory.get(item, 0) < amount:
                return None
                
        # Consume items and give reward
        for item, amount in self.required_items.items():
            inventory[item] -= amount
            
        self.completed = True
        return self.reward


class PlayerMarket:
    """Represents a player-to-player trading market"""
    
    def __init__(self):
        self.listings = []
        
    def create_listing(self, seller_id: str, item: str, amount: int, 
                      price: int, inventory: Dict[str, int]) -> bool:
        """Create a new market listing"""
        if inventory.get(item, 0) < amount:
            return False
            
        inventory[item] -= amount
        listing = {
            "listing_id": f"listing_{len(self.listings)}",
            "seller_id": seller_id,
            "item": item,
            "amount": amount,
            "price": price,
            "active": True
        }
        self.listings.append(listing)
        return True
        
    def buy_listing(self, listing_id: str, buyer_id: str, 
                   buyer_inventory: Dict[str, int], buyer_coins: int) -> Optional[int]:
        """Buy an item from market"""
        for listing in self.listings:
            if listing["listing_id"] == listing_id and listing["active"]:
                if buyer_coins >= listing["price"]:
                    # Transfer item to buyer
                    item = listing["item"]
                    amount = listing["amount"]
                    buyer_inventory[item] = buyer_inventory.get(item, 0) + amount
                    listing["active"] = False
                    return listing["price"]  # Return cost
        return None


class Farm:
    """Represents a player's farm with fields, buildings, and upgrades"""
    
    def __init__(self, player_id: str):
        self.player_id = player_id
        self.fields = []
        self.animals = []
        self.buildings = []
        self.inventory = {}
        self.coins = 1000
        self.max_fields = 5
        self.decorations = []
        
    def expand_fields(self, cost: int) -> bool:
        """Purchase new field expansion"""
        if self.coins >= cost:
            self.coins -= cost
            self.max_fields += 1
            return True
        return False
        
    def plant_crop(self, field_index: int, plant: Plant) -> bool:
        """Plant a crop in a field"""
        if field_index >= len(self.fields):
            if len(self.fields) < self.max_fields:
                self.fields.append(plant)
                return True
            return False
        else:
            if self.fields[field_index] is None or \
               self.fields[field_index].state == PlantState.HARVESTED:
                self.fields[field_index] = plant
                return True
        return False
        
    def add_animal(self, animal: Animal) -> bool:
        """Add an animal to the farm"""
        self.animals.append(animal)
        return True
        
    def add_building(self, building: ProductionBuilding, cost: int) -> bool:
        """Add a production building"""
        if self.coins >= cost:
            self.coins -= cost
            self.buildings.append(building)
            return True
        return False
        
    def add_decoration(self, decoration: str, cost: int) -> bool:
        """Add a decoration"""
        if self.coins >= cost:
            self.coins -= cost
            self.decorations.append(decoration)
            return True
        return False


class GameSession:
    """Manages a game session with the full flow"""
    
    def __init__(self, player_id: str):
        self.player_id = player_id
        self.farm = Farm(player_id)
        self.market_orders = []
        self.player_market = PlayerMarket()
        self.logged_in = False
        self.session_start = None
        
    def login(self) -> Dict[str, Any]:
        """Login and initialize session"""
        self.logged_in = True
        self.session_start = datetime.now()
        return {
            "status": "success",
            "message": "Logged in successfully",
            "timestamp": self.session_start
        }
        
    def check_timers(self) -> Dict[str, List[str]]:
        """Check all timers (plants, animals, buildings)"""
        ready_items = {
            "plants": [],
            "animals": [],
            "buildings": []
        }
        
        # Check plants
        for i, plant in enumerate(self.farm.fields):
            if plant and plant.check_growth():
                ready_items["plants"].append(f"Field {i}: {plant.crop_type}")
                
        # Check animals
        for i, animal in enumerate(self.farm.animals):
            if animal.check_production():
                ready_items["animals"].append(f"Animal {i}: {animal.animal_type}")
                
        # Check buildings
        for i, building in enumerate(self.farm.buildings):
            if building.check_production():
                ready_items["buildings"].append(f"Building {i}: {building.building_type}")
                
        return ready_items
        
    def harvest_and_collect(self) -> Dict[str, int]:
        """Harvest plants and collect animal products"""
        collected = {}
        
        # Harvest plants
        for plant in self.farm.fields:
            if plant and plant.state == PlantState.READY:
                yield_amount = plant.harvest()
                crop = plant.crop_type
                collected[crop] = collected.get(crop, 0) + yield_amount
                self.farm.inventory[crop] = self.farm.inventory.get(crop, 0) + yield_amount
                
        # Collect animal products
        for animal in self.farm.animals:
            product = animal.collect_product()
            if product:
                product_type = product["type"]
                amount = product["amount"]
                collected[product_type] = collected.get(product_type, 0) + amount
                self.farm.inventory[product_type] = \
                    self.farm.inventory.get(product_type, 0) + amount
                    
        # Collect from buildings
        for building in self.farm.buildings:
            product = building.collect_product()
            if product:
                for item, amount in product.items():
                    collected[item] = collected.get(item, 0) + amount
                    self.farm.inventory[item] = self.farm.inventory.get(item, 0) + amount
                    
        return collected
        
    def fill_queues(self) -> Dict[str, int]:
        """Fill production queues"""
        queued = {}
        
        for building in self.farm.buildings:
            if building.process_queue(self.farm.inventory):
                queued[building.building_type] = queued.get(building.building_type, 0) + 1
                
        return queued
        
    def process_orders(self) -> Dict[str, Any]:
        """Process market orders and sales"""
        results = {
            "completed_orders": [],
            "expired_orders": [],
            "coins_earned": 0
        }
        
        # Process market orders
        for order in self.market_orders[:]:
            if order.is_expired():
                results["expired_orders"].append(order.order_id)
                self.market_orders.remove(order)
            else:
                reward = order.fulfill(self.farm.inventory)
                if reward:
                    self.farm.coins += reward
                    results["completed_orders"].append(order.order_id)
                    results["coins_earned"] += reward
                    self.market_orders.remove(order)
                    
        return results
        
    def build_and_upgrade(self) -> Dict[str, Any]:
        """Handle building and upgrade actions"""
        return {
            "available_upgrades": {
                "field_expansion": self.farm.max_fields < 20,
                "new_buildings": self.farm.coins >= 500,
                "decorations": self.farm.coins >= 100
            }
        }
        
    def social_actions(self) -> Dict[str, Any]:
        """Handle social interactions"""
        return {
            "player_market_active": True,
            "available_listings": len([l for l in self.player_market.listings if l["active"]])
        }
        
    def logout(self) -> Dict[str, Any]:
        """Logout and save session"""
        session_duration = (datetime.now() - self.session_start).total_seconds() \
                          if self.session_start else 0
        self.logged_in = False
        return {
            "status": "success",
            "message": "Logged out successfully",
            "session_duration": session_duration
        }
        
    def run_session_flow(self) -> Dict[str, Any]:
        """Execute the complete session flow"""
        flow_results = {}
        
        # 1. Login
        flow_results["login"] = self.login()
        
        # 2. Check timers
        flow_results["timers"] = self.check_timers()
        
        # 3. Harvest and collect
        flow_results["collected"] = self.harvest_and_collect()
        
        # 4. Fill queues
        flow_results["queued"] = self.fill_queues()
        
        # 5. Process orders
        flow_results["orders"] = self.process_orders()
        
        # 6. Build and upgrade
        flow_results["upgrades"] = self.build_and_upgrade()
        
        # 7. Social actions
        flow_results["social"] = self.social_actions()
        
        # 8. Logout
        flow_results["logout"] = self.logout()
        
        return flow_results


# ---------------------------------------------------------------------------
# Simple interactive CLI game loop
# ---------------------------------------------------------------------------

class Game:
    """Interactive terminal game wrapper for a single player farm.

    Provides a minimal menu so the repository can be "played" directly
    in a terminal without needing the separate demo script or web app.
    """

    def __init__(self):
        self.session = GameSession("player_cli")
        self.session.login()
        # Seed some starter inventory
        self.session.farm.inventory.update({
            "wheat_seed": 10,
            "water": 20,
        })

    def _auto_tick(self):
        """Advance timers and auto-collect ready items."""
        ready = self.session.check_timers()
        collected = self.session.harvest_and_collect()
        # Clear harvested fields to allow replanting
        for i, plant in enumerate(self.session.farm.fields):
            if plant and plant.state == PlantState.HARVESTED:
                self.session.farm.fields[i] = None
        return ready, collected

    def _print_status(self):
        farm = self.session.farm
        print("\n=== FARM STATUS ===")
        print(f"Coins: {farm.coins}")
        print(f"Inventory: {farm.inventory}")
        # Fields
        for i in range(farm.max_fields):
            plant = farm.fields[i] if i < len(farm.fields) else None
            if not plant:
                print(f" Field {i}: [empty]")
            else:
                rem = int(plant.time_remaining())
                print(f" Field {i}: {plant.crop_type} [{plant.state.value}] {rem}s")
        # Animals
        if farm.animals:
            for i, a in enumerate(farm.animals):
                rem = int(a.time_remaining())
                print(f" Animal {i}: {a.animal_type} [{a.state.value}] {rem}s")
        else:
            print(" Animals: none")
        # Buildings
        if farm.buildings:
            for i, b in enumerate(farm.buildings):
                rem = int(b.time_remaining())
                status = "PRODUCING" if b.is_producing else "IDLE"
                print(f" Building {i}: {b.building_type} [{status}] q={len(b.queue)} {rem}s")
        else:
            print(" Buildings: none")
        # Orders
        if self.session.market_orders:
            for o in self.session.market_orders:
                print(f" Order {o.order_id}: needs {o.required_items} reward={o.reward} expired={o.is_expired()}")
        else:
            print(" Orders: none")

    def _help(self):
        print("""
Commands:
  status                 Show farm status
  plant <field> <crop>    Plant crop (wheat only for now)
  feed <animal_index>    Feed an animal
  addanimal <type> <prod> <time> <amount>   Add a new animal
  addbuilding <type> <input> <amount_in> <out> <amount_out> <time>   Add building
  startprod <building_index>  Start production in building
  order <id> <item> <amount> <reward> <expiry_sec>  Create market order
  harvestall             Harvest and collect all ready items
  wait <seconds>         Wait (advance timers)
  help                   Show this help
  quit                   Exit game
""")

    def run(self):
        print("Welcome to Big Harvest Farming (CLI). Type 'help' for commands.")
        self._print_status()
        while True:
            try:
                raw = input("big-harvest> ").strip()
            except (EOFError, KeyboardInterrupt):
                print("\nExiting...")
                break
            if not raw:
                ready, collected = self._auto_tick()
                continue
            parts = raw.split()
            cmd = parts[0].lower()
            args = parts[1:]
            if cmd == "quit" or cmd == "exit":
                break
            elif cmd == "help":
                self._help()
            elif cmd == "status":
                self._auto_tick()
                self._print_status()
            elif cmd == "plant":
                if len(args) < 2:
                    print("Usage: plant <field_index> <crop_type>")
                else:
                    idx = int(args[0])
                    crop = args[1]
                    plant = Plant(crop_type=crop, growth_time=5, yield_amount=3)
                    ok = self.session.farm.plant_crop(idx, plant)
                    print("Planted" if ok else "Could not plant")
            elif cmd == "feed":
                if not args:
                    print("Usage: feed <animal_index>")
                else:
                    idx = int(args[0])
                    if 0 <= idx < len(self.session.farm.animals):
                        self.session.farm.animals[idx].feed()
                        print("Fed animal")
                    else:
                        print("Invalid animal index")
            elif cmd == "addanimal":
                if len(args) < 4:
                    print("Usage: addanimal <type> <product> <prod_time_sec> <amount>")
                else:
                    t, prod, sec, amt = args[0], args[1], int(args[2]), int(args[3])
                    a = Animal(t, prod, sec, amt)
                    self.session.farm.add_animal(a)
                    print("Animal added.")
            elif cmd == "addbuilding":
                if len(args) < 6:
                    print("Usage: addbuilding <type> <input_item> <input_amount> <output_item> <output_amount> <prod_time>")
                else:
                    btype, in_item, in_amt, out_item, out_amt, ptime = args[0], args[1], int(args[2]), args[3], int(args[4]), int(args[5])
                    building = ProductionBuilding(btype, {in_item: in_amt}, out_item, out_amt, ptime)
                    if self.session.farm.add_building(building, cost=0):
                        print("Building added.")
            elif cmd == "startprod":
                if not args:
                    print("Usage: startprod <building_index>")
                else:
                    idx = int(args[0])
                    if 0 <= idx < len(self.session.farm.buildings):
                        ok = self.session.farm.buildings[idx].start_production(self.session.farm.inventory)
                        print("Production started" if ok else "Cannot start production")
            elif cmd == "order":
                if len(args) < 5:
                    print("Usage: order <id> <item> <amount> <reward> <expiry_sec>")
                else:
                    oid, item, amount, reward, exp = args[0], args[1], int(args[2]), int(args[3]), int(args[4])
                    order = MarketOrder(oid, {item: amount}, reward, exp)
                    self.session.market_orders.append(order)
                    print("Order created.")
            elif cmd == "harvestall":
                collected = self.session.harvest_and_collect()
                for i, plant in enumerate(self.session.farm.fields):
                    if plant and plant.state == PlantState.HARVESTED:
                        self.session.farm.fields[i] = None
                print(f"Collected: {collected}")
            elif cmd == "wait":
                if not args:
                    print("Usage: wait <seconds>")
                else:
                    sec = float(args[0])
                    import time
                    end = time.time() + sec
                    while time.time() < end:
                        time.sleep(0.2)
                        self._auto_tick()
                    print(f"Waited {sec} seconds.")
            else:
                print("Unknown command. Type 'help' for list.")
        logout = self.session.logout()
        print("Session ended.", logout)


def main():
    Game().run()

