"""
Unit tests for the Big Harvest Farming game core
"""

import unittest
import time
from datetime import datetime, timedelta
from game_core import (
    Plant, Animal, ProductionBuilding, MarketOrder, PlayerMarket,
    Farm, GameSession, PlantState, AnimalState
)


class TestPlant(unittest.TestCase):
    """Test Plant functionality"""
    
    def test_plant_creation(self):
        """Test creating a new plant"""
        plant = Plant("wheat", 10, 5)
        self.assertEqual(plant.crop_type, "wheat")
        self.assertEqual(plant.growth_time, 10)
        self.assertEqual(plant.yield_amount, 5)
        self.assertEqual(plant.state, PlantState.PLANTED)
        
    def test_plant_growth_timer(self):
        """Test plant growth timer"""
        plant = Plant("wheat", 1, 5)  # 1 second growth time
        self.assertFalse(plant.check_growth())
        time.sleep(1.1)
        self.assertTrue(plant.check_growth())
        self.assertEqual(plant.state, PlantState.READY)
        
    def test_plant_harvest(self):
        """Test harvesting a plant"""
        plant = Plant("wheat", 0, 5)  # Instant growth
        plant.check_growth()
        yield_amount = plant.harvest()
        self.assertEqual(yield_amount, 5)
        self.assertEqual(plant.state, PlantState.HARVESTED)
        
    def test_plant_boost(self):
        """Test applying boost to plant"""
        plant = Plant("wheat", 10, 5)
        initial_ready_time = plant.ready_at
        plant.apply_boost(2.0)  # 2x speed
        self.assertEqual(plant.boost_multiplier, 2.0)
        self.assertLess(plant.ready_at, initial_ready_time)
        
    def test_time_remaining(self):
        """Test getting time remaining"""
        plant = Plant("wheat", 10, 5)
        remaining = plant.time_remaining()
        self.assertGreater(remaining, 9)
        self.assertLessEqual(remaining, 10)


class TestAnimal(unittest.TestCase):
    """Test Animal functionality"""
    
    def test_animal_creation(self):
        """Test creating a new animal"""
        animal = Animal("chicken", "eggs", 10, 3)
        self.assertEqual(animal.animal_type, "chicken")
        self.assertEqual(animal.product_type, "eggs")
        self.assertEqual(animal.state, AnimalState.HUNGRY)
        
    def test_animal_feeding(self):
        """Test feeding an animal"""
        animal = Animal("chicken", "eggs", 10, 3)
        animal.feed()
        self.assertEqual(animal.state, AnimalState.PRODUCING)
        self.assertIsNotNone(animal.fed_at)
        self.assertIsNotNone(animal.ready_at)
        
    def test_animal_production(self):
        """Test animal product collection"""
        animal = Animal("chicken", "eggs", 1, 3)
        animal.feed()
        time.sleep(1.1)
        self.assertTrue(animal.check_production())
        product = animal.collect_product()
        self.assertIsNotNone(product)
        self.assertEqual(product["type"], "eggs")
        self.assertEqual(product["amount"], 3)
        self.assertEqual(animal.state, AnimalState.HUNGRY)
        
    def test_animal_not_ready(self):
        """Test collecting product when not ready"""
        animal = Animal("cow", "milk", 10, 5)
        animal.feed()
        product = animal.collect_product()
        self.assertIsNone(product)


class TestProductionBuilding(unittest.TestCase):
    """Test ProductionBuilding functionality"""
    
    def test_building_creation(self):
        """Test creating a production building"""
        building = ProductionBuilding(
            "bakery", 
            {"wheat": 2}, 
            "bread", 
            1, 
            10
        )
        self.assertEqual(building.building_type, "bakery")
        self.assertFalse(building.is_producing)
        
    def test_start_production(self):
        """Test starting production"""
        building = ProductionBuilding("bakery", {"wheat": 2}, "bread", 1, 1)
        inventory = {"wheat": 5}
        result = building.start_production(inventory)
        self.assertTrue(result)
        self.assertTrue(building.is_producing)
        self.assertEqual(inventory["wheat"], 3)
        
    def test_insufficient_resources(self):
        """Test production with insufficient resources"""
        building = ProductionBuilding("bakery", {"wheat": 2}, "bread", 1, 1)
        inventory = {"wheat": 1}
        result = building.start_production(inventory)
        self.assertFalse(result)
        self.assertFalse(building.is_producing)
        
    def test_collect_product(self):
        """Test collecting finished product"""
        building = ProductionBuilding("bakery", {"wheat": 2}, "bread", 1, 1)
        inventory = {"wheat": 5}
        building.start_production(inventory)
        time.sleep(1.1)
        product = building.collect_product()
        self.assertIsNotNone(product)
        self.assertEqual(product["bread"], 1)
        self.assertFalse(building.is_producing)
        
    def test_production_queue(self):
        """Test production queue functionality"""
        building = ProductionBuilding("bakery", {"wheat": 2}, "bread", 1, 1)
        building.add_to_queue(3)
        self.assertEqual(len(building.queue), 3)
        
        inventory = {"wheat": 10}
        result = building.process_queue(inventory)
        self.assertTrue(result)
        self.assertEqual(len(building.queue), 2)


class TestMarketOrder(unittest.TestCase):
    """Test MarketOrder functionality"""
    
    def test_order_creation(self):
        """Test creating a market order"""
        order = MarketOrder("order1", {"bread": 5}, 100, 3600)
        self.assertEqual(order.order_id, "order1")
        self.assertFalse(order.completed)
        
    def test_fulfill_order(self):
        """Test fulfilling a market order"""
        order = MarketOrder("order1", {"bread": 5}, 100, 3600)
        inventory = {"bread": 10}
        reward = order.fulfill(inventory)
        self.assertEqual(reward, 100)
        self.assertEqual(inventory["bread"], 5)
        self.assertTrue(order.completed)
        
    def test_insufficient_items(self):
        """Test order with insufficient items"""
        order = MarketOrder("order1", {"bread": 5}, 100, 3600)
        inventory = {"bread": 3}
        reward = order.fulfill(inventory)
        self.assertIsNone(reward)
        self.assertFalse(order.completed)
        
    def test_order_expiration(self):
        """Test order expiration"""
        order = MarketOrder("order1", {"bread": 5}, 100, 1)
        time.sleep(1.1)
        self.assertTrue(order.is_expired())


class TestPlayerMarket(unittest.TestCase):
    """Test PlayerMarket functionality"""
    
    def test_create_listing(self):
        """Test creating a market listing"""
        market = PlayerMarket()
        inventory = {"wheat": 10}
        result = market.create_listing("player1", "wheat", 5, 50, inventory)
        self.assertTrue(result)
        self.assertEqual(inventory["wheat"], 5)
        self.assertEqual(len(market.listings), 1)
        
    def test_buy_listing(self):
        """Test buying from market"""
        market = PlayerMarket()
        seller_inventory = {"wheat": 10}
        market.create_listing("player1", "wheat", 5, 50, seller_inventory)
        
        buyer_inventory = {}
        cost = market.buy_listing("listing_0", "player2", buyer_inventory, 100)
        self.assertEqual(cost, 50)
        self.assertEqual(buyer_inventory["wheat"], 5)
        
    def test_insufficient_coins(self):
        """Test buying with insufficient coins"""
        market = PlayerMarket()
        seller_inventory = {"wheat": 10}
        market.create_listing("player1", "wheat", 5, 50, seller_inventory)
        
        buyer_inventory = {}
        cost = market.buy_listing("listing_0", "player2", buyer_inventory, 30)
        self.assertIsNone(cost)


class TestFarm(unittest.TestCase):
    """Test Farm functionality"""
    
    def test_farm_creation(self):
        """Test creating a farm"""
        farm = Farm("player1")
        self.assertEqual(farm.player_id, "player1")
        self.assertEqual(farm.coins, 1000)
        self.assertEqual(farm.max_fields, 5)
        
    def test_expand_fields(self):
        """Test field expansion"""
        farm = Farm("player1")
        initial_fields = farm.max_fields
        result = farm.expand_fields(200)
        self.assertTrue(result)
        self.assertEqual(farm.max_fields, initial_fields + 1)
        self.assertEqual(farm.coins, 800)
        
    def test_plant_crop(self):
        """Test planting a crop"""
        farm = Farm("player1")
        plant = Plant("wheat", 10, 5)
        result = farm.plant_crop(0, plant)
        self.assertTrue(result)
        self.assertEqual(len(farm.fields), 1)
        
    def test_add_animal(self):
        """Test adding an animal"""
        farm = Farm("player1")
        animal = Animal("chicken", "eggs", 10, 3)
        result = farm.add_animal(animal)
        self.assertTrue(result)
        self.assertEqual(len(farm.animals), 1)
        
    def test_add_building(self):
        """Test adding a building"""
        farm = Farm("player1")
        building = ProductionBuilding("bakery", {"wheat": 2}, "bread", 1, 10)
        result = farm.add_building(building, 500)
        self.assertTrue(result)
        self.assertEqual(len(farm.buildings), 1)
        self.assertEqual(farm.coins, 500)
        
    def test_add_decoration(self):
        """Test adding a decoration"""
        farm = Farm("player1")
        result = farm.add_decoration("fountain", 100)
        self.assertTrue(result)
        self.assertEqual(len(farm.decorations), 1)


class TestGameSession(unittest.TestCase):
    """Test GameSession functionality"""
    
    def test_session_login(self):
        """Test session login"""
        session = GameSession("player1")
        result = session.login()
        self.assertEqual(result["status"], "success")
        self.assertTrue(session.logged_in)
        
    def test_check_timers(self):
        """Test checking timers"""
        session = GameSession("player1")
        plant = Plant("wheat", 0, 5)
        session.farm.plant_crop(0, plant)
        
        timers = session.check_timers()
        self.assertIn("plants", timers)
        self.assertIn("animals", timers)
        self.assertIn("buildings", timers)
        
    def test_harvest_and_collect(self):
        """Test harvest and collect"""
        session = GameSession("player1")
        plant = Plant("wheat", 0, 5)
        session.farm.plant_crop(0, plant)
        plant.check_growth()
        
        collected = session.harvest_and_collect()
        self.assertIn("wheat", collected)
        self.assertEqual(collected["wheat"], 5)
        self.assertEqual(session.farm.inventory["wheat"], 5)
        
    def test_process_orders(self):
        """Test processing orders"""
        session = GameSession("player1")
        session.farm.inventory = {"bread": 10}
        order = MarketOrder("order1", {"bread": 5}, 100, 3600)
        session.market_orders.append(order)
        
        results = session.process_orders()
        self.assertIn("order1", results["completed_orders"])
        self.assertEqual(results["coins_earned"], 100)
        self.assertEqual(session.farm.coins, 1100)
        
    def test_session_logout(self):
        """Test session logout"""
        session = GameSession("player1")
        session.login()
        time.sleep(0.1)
        result = session.logout()
        self.assertEqual(result["status"], "success")
        self.assertFalse(session.logged_in)
        self.assertGreater(result["session_duration"], 0)
        
    def test_full_session_flow(self):
        """Test complete session flow"""
        session = GameSession("player1")
        
        # Setup some game state
        plant = Plant("wheat", 0, 5)
        session.farm.plant_crop(0, plant)
        
        results = session.run_session_flow()
        
        self.assertIn("login", results)
        self.assertIn("timers", results)
        self.assertIn("collected", results)
        self.assertIn("queued", results)
        self.assertIn("orders", results)
        self.assertIn("upgrades", results)
        self.assertIn("social", results)
        self.assertIn("logout", results)


if __name__ == "__main__":
    unittest.main()
