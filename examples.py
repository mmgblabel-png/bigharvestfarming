"""
Example usage of the Big Harvest Farming game system
Demonstrates the complete game loop and session flow
"""

from game_core import (
    Plant, Animal, ProductionBuilding, MarketOrder,
    GameSession, Farm
)
import time


def example_basic_farming():
    """Example: Basic farming with plants"""
    print("=== Example: Basic Farming ===\n")
    
    # Create a game session
    session = GameSession("player1")
    session.login()
    
    # Plant some crops
    wheat = Plant("wheat", 2, 5)  # 2 seconds to grow, yields 5
    corn = Plant("corn", 3, 8)    # 3 seconds to grow, yields 8
    
    session.farm.plant_crop(0, wheat)
    session.farm.plant_crop(1, corn)
    
    print(f"Planted wheat and corn")
    print(f"Wheat ready in: {wheat.time_remaining():.1f}s")
    print(f"Corn ready in: {corn.time_remaining():.1f}s\n")
    
    # Wait for crops to grow
    time.sleep(2.5)
    
    # Check timers and harvest
    ready = session.check_timers()
    print(f"Ready to harvest: {ready['plants']}")
    
    collected = session.harvest_and_collect()
    print(f"Harvested: {collected}")
    print(f"Inventory: {session.farm.inventory}\n")
    
    session.logout()


def example_animal_farming():
    """Example: Animal farming and product collection"""
    print("=== Example: Animal Farming ===\n")
    
    session = GameSession("player1")
    session.login()
    
    # Add animals
    chicken = Animal("chicken", "eggs", 2, 3)
    cow = Animal("cow", "milk", 3, 2)
    
    session.farm.add_animal(chicken)
    session.farm.add_animal(cow)
    
    # Feed animals
    chicken.feed()
    cow.feed()
    
    print(f"Fed chicken and cow")
    print(f"Chicken ready in: {chicken.time_remaining():.1f}s")
    print(f"Cow ready in: {cow.time_remaining():.1f}s\n")
    
    # Wait for production
    time.sleep(2.5)
    
    # Collect products
    collected = session.harvest_and_collect()
    print(f"Collected: {collected}")
    print(f"Inventory: {session.farm.inventory}\n")
    
    session.logout()


def example_production_buildings():
    """Example: Production buildings and processing"""
    print("=== Example: Production Buildings ===\n")
    
    session = GameSession("player1")
    session.login()
    
    # Add inventory for production
    session.farm.inventory = {"wheat": 10, "milk": 5}
    
    # Create production buildings
    bakery = ProductionBuilding("bakery", {"wheat": 2}, "bread", 1, 2)
    cheese_factory = ProductionBuilding("cheese_factory", {"milk": 2}, "cheese", 1, 2)
    
    session.farm.add_building(bakery, 0)  # Free for demo
    session.farm.add_building(cheese_factory, 0)
    
    print(f"Initial inventory: {session.farm.inventory}")
    
    # Start production
    bakery.start_production(session.farm.inventory)
    cheese_factory.start_production(session.farm.inventory)
    
    print(f"After starting production: {session.farm.inventory}")
    print(f"Bakery producing, ready in: {bakery.time_remaining():.1f}s")
    print(f"Cheese factory producing, ready in: {cheese_factory.time_remaining():.1f}s\n")
    
    # Wait for production
    time.sleep(2.5)
    
    # Collect products
    collected = session.harvest_and_collect()
    print(f"Produced: {collected}")
    print(f"Final inventory: {session.farm.inventory}\n")
    
    session.logout()


def example_market_orders():
    """Example: Market orders and trading"""
    print("=== Example: Market Orders ===\n")
    
    session = GameSession("player1")
    session.login()
    
    # Add inventory
    session.farm.inventory = {"bread": 10, "cheese": 5}
    
    # Create market orders
    order1 = MarketOrder("order1", {"bread": 5}, 100, 3600)
    order2 = MarketOrder("order2", {"cheese": 3}, 150, 3600)
    
    session.market_orders.append(order1)
    session.market_orders.append(order2)
    
    print(f"Initial coins: {session.farm.coins}")
    print(f"Initial inventory: {session.farm.inventory}")
    print(f"Available orders: {len(session.market_orders)}\n")
    
    # Process orders
    results = session.process_orders()
    
    print(f"Completed orders: {results['completed_orders']}")
    print(f"Coins earned: {results['coins_earned']}")
    print(f"Final coins: {session.farm.coins}")
    print(f"Final inventory: {session.farm.inventory}\n")
    
    session.logout()


def example_player_market():
    """Example: Player-to-player market"""
    print("=== Example: Player Market ===\n")
    
    # Seller session
    seller = GameSession("seller")
    seller.login()
    seller.farm.inventory = {"wheat": 100}
    
    # Create listing
    seller.player_market.create_listing("seller", "wheat", 50, 200, seller.farm.inventory)
    print(f"Seller created listing: 50 wheat for 200 coins")
    print(f"Seller inventory after listing: {seller.farm.inventory}\n")
    
    # Buyer session
    buyer = GameSession("buyer")
    buyer.login()
    buyer.farm.coins = 500
    
    print(f"Buyer coins: {buyer.farm.coins}")
    print(f"Buyer inventory: {buyer.farm.inventory}")
    
    # Buy listing
    cost = seller.player_market.buy_listing("listing_0", "buyer", buyer.farm.inventory, buyer.farm.coins)
    
    if cost:
        buyer.farm.coins -= cost
        print(f"\nBuyer purchased listing for {cost} coins")
        print(f"Buyer coins: {buyer.farm.coins}")
        print(f"Buyer inventory: {buyer.farm.inventory}\n")
    
    seller.logout()
    buyer.logout()


def example_expansion_and_upgrades():
    """Example: Farm expansion and upgrades"""
    print("=== Example: Expansion and Upgrades ===\n")
    
    session = GameSession("player1")
    session.login()
    
    print(f"Initial state:")
    print(f"  Coins: {session.farm.coins}")
    print(f"  Max fields: {session.farm.max_fields}")
    print(f"  Buildings: {len(session.farm.buildings)}")
    print(f"  Decorations: {len(session.farm.decorations)}\n")
    
    # Expand fields
    session.farm.expand_fields(200)
    print(f"Expanded fields for 200 coins")
    print(f"  Max fields: {session.farm.max_fields}")
    print(f"  Coins: {session.farm.coins}\n")
    
    # Add building
    mill = ProductionBuilding("mill", {"wheat": 3}, "flour", 2, 5)
    session.farm.add_building(mill, 300)
    print(f"Built mill for 300 coins")
    print(f"  Buildings: {len(session.farm.buildings)}")
    print(f"  Coins: {session.farm.coins}\n")
    
    # Add decoration
    session.farm.add_decoration("garden", 100)
    print(f"Added garden decoration for 100 coins")
    print(f"  Decorations: {len(session.farm.decorations)}")
    print(f"  Coins: {session.farm.coins}\n")
    
    session.logout()


def example_complete_session_flow():
    """Example: Complete session flow as described in requirements"""
    print("=== Example: Complete Session Flow ===\n")
    
    # Create session and setup
    session = GameSession("player1")
    
    # Pre-setup: Add some game elements
    session.farm.inventory = {"wheat": 5, "milk": 3}
    
    plant = Plant("corn", 1, 10)
    session.farm.plant_crop(0, plant)
    
    chicken = Animal("chicken", "eggs", 1, 5)
    session.farm.add_animal(chicken)
    chicken.feed()
    
    bakery = ProductionBuilding("bakery", {"wheat": 2}, "bread", 1, 1)
    session.farm.buildings.append(bakery)
    bakery.start_production(session.farm.inventory)
    
    order = MarketOrder("order1", {"eggs": 3}, 50, 3600)
    session.market_orders.append(order)
    
    # Wait for things to be ready
    time.sleep(1.5)
    
    # Execute session flow
    print("Executing complete session flow...")
    print("-" * 50)
    
    results = session.run_session_flow()
    
    # Display results
    print(f"\n1. Login: {results['login']['status']}")
    print(f"\n2. Timers checked:")
    for category, items in results['timers'].items():
        if items:
            print(f"   {category}: {items}")
    
    print(f"\n3. Harvest/Collect: {results['collected']}")
    print(f"\n4. Queues filled: {results['queued']}")
    print(f"\n5. Orders processed: {results['orders']}")
    print(f"\n6. Upgrades available: {results['upgrades']}")
    print(f"\n7. Social: {results['social']}")
    print(f"\n8. Logout: {results['logout']['status']}")
    print(f"   Session duration: {results['logout']['session_duration']:.2f}s")
    
    print(f"\nFinal farm state:")
    print(f"  Inventory: {session.farm.inventory}")
    print(f"  Coins: {session.farm.coins}\n")


def example_boost_items():
    """Example: Using boost items to speed up production"""
    print("=== Example: Boost Items ===\n")
    
    session = GameSession("player1")
    session.login()
    
    # Plant crops
    wheat1 = Plant("wheat", 4, 5)  # Normal 4 second growth
    wheat2 = Plant("wheat", 4, 5)  # With 2x boost
    
    session.farm.plant_crop(0, wheat1)
    session.farm.plant_crop(1, wheat2)
    
    # Apply boost to second wheat
    wheat2.apply_boost(2.0)  # 2x speed = half the time
    
    print(f"Wheat 1 (normal) ready in: {wheat1.time_remaining():.1f}s")
    print(f"Wheat 2 (2x boost) ready in: {wheat2.time_remaining():.1f}s")
    print(f"Boost multiplier: {wheat2.boost_multiplier}x\n")
    
    # Wait and harvest
    time.sleep(2.5)
    
    collected = session.harvest_and_collect()
    print(f"Harvested: {collected}")
    
    # Boosted plant gives more yield
    print(f"Wheat 2 yield with boost: {wheat2.yield_amount * wheat2.boost_multiplier}\n")
    
    session.logout()


def example_production_queue():
    """Example: Production queue management"""
    print("=== Example: Production Queue ===\n")
    
    session = GameSession("player1")
    session.login()
    
    session.farm.inventory = {"wheat": 20}
    
    bakery = ProductionBuilding("bakery", {"wheat": 2}, "bread", 1, 1)
    session.farm.buildings.append(bakery)
    
    # Add multiple items to queue
    bakery.add_to_queue(5)  # Queue 5 bread productions
    
    print(f"Initial inventory: {session.farm.inventory}")
    print(f"Queue length: {len(bakery.queue)}\n")
    
    # Process queue items
    for i in range(3):
        print(f"Processing queue item {i+1}...")
        bakery.process_queue(session.farm.inventory)
        print(f"  Queue remaining: {len(bakery.queue)}")
        print(f"  Inventory: {session.farm.inventory}")
        
        time.sleep(1.2)
        product = bakery.collect_product()
        if product:
            for item, amount in product.items():
                session.farm.inventory[item] = session.farm.inventory.get(item, 0) + amount
            print(f"  Collected: {product}")
            print(f"  Inventory: {session.farm.inventory}\n")
    
    session.logout()


if __name__ == "__main__":
    # Run all examples
    print("\n" + "="*60)
    print("BIG HARVEST FARMING - GAME EXAMPLES")
    print("="*60 + "\n")
    
    example_basic_farming()
    time.sleep(0.5)
    
    example_animal_farming()
    time.sleep(0.5)
    
    example_production_buildings()
    time.sleep(0.5)
    
    example_market_orders()
    time.sleep(0.5)
    
    example_player_market()
    time.sleep(0.5)
    
    example_expansion_and_upgrades()
    time.sleep(0.5)
    
    example_boost_items()
    time.sleep(0.5)
    
    example_production_queue()
    time.sleep(0.5)
    
    example_complete_session_flow()
    
    print("\n" + "="*60)
    print("ALL EXAMPLES COMPLETED")
    print("="*60 + "\n")
