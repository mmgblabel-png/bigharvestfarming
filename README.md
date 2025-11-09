# Big Harvest Farming

A comprehensive farming game system implementing the core game loop with plants, animals, production buildings, market trading, and farm expansion.

## Game Features

### 1. Core Game Loop (Kern Game Loop)

The game implements a complete farming simulation with the following mechanics:

#### 1.1 Plants (Planten → Verzorging → Oogst)
- **Plant crops** with customizable growth times
- **Growth timers** track when crops are ready to harvest
- **Boost items** can speed up growth and increase yields
- **Harvest system** collects crops into inventory

#### 1.2 Animals (Dieren voeren → Producten verzamelen)
- **Feed animals** to start production cycle
- **Collect products**: eggs, milk, meat, etc.
- **Production timers** for each animal type
- **State management**: hungry → fed → producing → ready

#### 1.3 Production Buildings (Verwerken in Productiegebouwen)
- **Processing facilities**: bakery, cheese factory, mill, etc.
- **Recipe system**: convert raw materials into finished goods
- **Production queues**: queue multiple production jobs
- **Output products**: bread, cheese, ham, flour, etc.

#### 1.4 Sales & Trading (Verkoop & Handel)
- **Market orders**: fulfill contracts for rewards
- **Contract system**: time-limited orders with expiration
- **Player market**: player-to-player trading system
- **Listings management**: create and buy market listings

#### 1.5 Expansion & Upgrades (Uitbreiden & Upgraden)
- **Field expansion**: purchase additional crop fields
- **New buildings**: stables, production facilities
- **Production lines**: add new processing capabilities
- **Decorations**: beautify your farm

### 2. Session Flow (Sessieflow)

The game follows a structured session flow:

```
login → check timers → harvest/collect → fill queues → 
process orders/sales → build/upgrades → social actions → logout
```

Each step is implemented as a method in the `GameSession` class:
1. **Login**: Initialize session and load farm state
2. **Check Timers**: Review all active timers (plants, animals, buildings)
3. **Harvest/Collect**: Gather ready crops, animal products, and processed goods
4. **Fill Queues**: Start queued production jobs
5. **Process Orders**: Complete market orders and player trades
6. **Build/Upgrades**: Expand farm with new facilities
7. **Social Actions**: Interact with player market
8. **Logout**: Save session and calculate duration

## Installation

This is a Python-based implementation. No external dependencies required (uses only standard library).

```bash
# Clone the repository
git clone https://github.com/mmgblabel-png/bigharvestfarming.git
cd bigharvestfarming

# Run tests
python test_game_core.py

# Run examples
python examples.py
```

## Usage

### Basic Example

```python
from game_core import GameSession, Plant, Animal

# Create a game session
session = GameSession("player1")
session.login()

# Plant crops
wheat = Plant("wheat", growth_time=10, yield_amount=5)
session.farm.plant_crop(0, wheat)

# Add and feed animals
chicken = Animal("chicken", "eggs", production_time=10, product_amount=3)
session.farm.add_animal(chicken)
chicken.feed()

# Wait for timers...
# Then harvest and collect
collected = session.harvest_and_collect()
print(f"Collected: {collected}")

session.logout()
```

### Complete Session Flow

```python
from game_core import GameSession

session = GameSession("player1")

# Execute the complete session flow
results = session.run_session_flow()

# Results include:
# - login status
# - timer checks
# - collected items
# - processed orders
# - available upgrades
# - social interactions
# - logout info
```

## API Documentation

### Core Classes

#### `Plant`
Represents a crop that can be planted, grown, and harvested.

**Constructor**: `Plant(crop_type: str, growth_time: int, yield_amount: int)`
- `crop_type`: Name of the crop (e.g., "wheat", "corn")
- `growth_time`: Time in seconds to grow
- `yield_amount`: Amount harvested

**Methods**:
- `apply_boost(multiplier: float)`: Speed up growth
- `check_growth() -> bool`: Check if ready to harvest
- `harvest() -> int`: Harvest the plant
- `time_remaining() -> float`: Get remaining growth time

#### `Animal`
Represents a farm animal that produces goods.

**Constructor**: `Animal(animal_type: str, product_type: str, production_time: int, product_amount: int)`

**Methods**:
- `feed()`: Feed animal to start production
- `check_production() -> bool`: Check if product is ready
- `collect_product() -> Optional[Dict]`: Collect product
- `time_remaining() -> float`: Get remaining production time

#### `ProductionBuilding`
Represents a building that processes raw materials.

**Constructor**: `ProductionBuilding(building_type: str, recipe: Dict[str, int], output_product: str, output_amount: int, production_time: int)`

**Methods**:
- `start_production(inventory: Dict[str, int]) -> bool`: Start production
- `check_production() -> bool`: Check if production is complete
- `collect_product() -> Optional[Dict[str, int]]`: Collect product
- `add_to_queue(count: int)`: Add jobs to production queue
- `process_queue(inventory: Dict[str, int]) -> bool`: Process next queued job

#### `MarketOrder`
Represents a market contract/order.

**Constructor**: `MarketOrder(order_id: str, required_items: Dict[str, int], reward: int, expires_in: int)`

**Methods**:
- `is_expired() -> bool`: Check if order expired
- `fulfill(inventory: Dict[str, int]) -> Optional[int]`: Complete order

#### `PlayerMarket`
Manages player-to-player trading.

**Methods**:
- `create_listing(seller_id: str, item: str, amount: int, price: int, inventory: Dict) -> bool`
- `buy_listing(listing_id: str, buyer_id: str, buyer_inventory: Dict, buyer_coins: int) -> Optional[int]`

#### `Farm`
Represents a player's farm.

**Constructor**: `Farm(player_id: str)`

**Attributes**:
- `fields`: List of planted crops
- `animals`: List of farm animals
- `buildings`: List of production buildings
- `inventory`: Dict of items
- `coins`: Player's currency
- `decorations`: List of decorations

**Methods**:
- `expand_fields(cost: int) -> bool`
- `plant_crop(field_index: int, plant: Plant) -> bool`
- `add_animal(animal: Animal) -> bool`
- `add_building(building: ProductionBuilding, cost: int) -> bool`
- `add_decoration(decoration: str, cost: int) -> bool`

#### `GameSession`
Manages the complete game session and flow.

**Constructor**: `GameSession(player_id: str)`

**Methods**:
- `login() -> Dict`: Start session
- `check_timers() -> Dict`: Check all timers
- `harvest_and_collect() -> Dict`: Collect all ready items
- `fill_queues() -> Dict`: Process production queues
- `process_orders() -> Dict`: Handle market orders
- `build_and_upgrade() -> Dict`: Get upgrade options
- `social_actions() -> Dict`: Social features status
- `logout() -> Dict`: End session
- `run_session_flow() -> Dict`: Execute complete flow

## Examples

See `examples.py` for comprehensive usage examples including:
- Basic farming with plants
- Animal farming and product collection
- Production buildings and processing
- Market orders and trading
- Player-to-player market
- Farm expansion and upgrades
- Boost items usage
- Production queue management
- Complete session flow

Run examples with:
```bash
python examples.py
```

## Testing

Run the test suite:
```bash
python test_game_core.py
```

Tests cover:
- Plant growth and harvesting
- Animal feeding and production
- Production buildings and queues
- Market orders and expiration
- Player market trading
- Farm expansion and upgrades
- Complete session flow

## Architecture

The system is designed with clean separation of concerns:

- **game_core.py**: Core game mechanics and classes
- **test_game_core.py**: Comprehensive unit tests
- **examples.py**: Usage examples and demonstrations

### Design Principles

1. **Time-based mechanics**: All timers use real timestamps for accurate timing
2. **State management**: Clear state machines for plants, animals, and buildings
3. **Inventory system**: Centralized inventory management
4. **Modularity**: Each component is independent and testable
5. **Extensibility**: Easy to add new crops, animals, buildings, and features

## Game Balance

Default values (can be customized):
- Starting coins: 1000
- Initial max fields: 5
- Field expansion: Increases max fields by 1
- Production requires specific recipes
- Market orders have expiration timers
- Boost items multiply speed and yield

## License

This is an open-source farming game implementation.