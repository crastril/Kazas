# Simulator Component

## Responsibility

Allow users to estimate their potential revenue with Kazas compared to standard rental management.

## Key Logic

### Inputs

1. **Rooms**: Slider (1-5+). Base revenue multiplier.
2. **Capacity**: Slider. Affects base pricing.
3. **Equipment**: Standard / Premium / Luxe. Affects price multiplier and occupancy.
4. **Options (Toggles)**:
    - **Piscine**: +30€ + (rooms*8) price. +4% Occupancy.
    - **Vue Dégagée**: +12€ + (rooms*2) price. +3% Occupancy.
    - **Déco Pro**: +10% Price. +4% Occupancy.
    - **Photos Pro**: +15% Occupancy.
    - **Annonce Optimisée**: +5% Occupancy boost.
    - **Multi-sites**: +8% Occupancy boost.

### Calculations

#### Base Formula

`Base Price = (Rooms * 40€) + (Capacity * 8€)`

#### Occupancy Rates

- **Standard (Sans Kazas)**: 30% Base.
- **Optimization (Avec Kazas)**:
  - Starts at Standard Rate.
  - Adds "Kazas Management Boost" (+10%).
  - Adds all Option Boosts (Pool, View, etc.).
  - **Cap**: Corrected to **85%** (previously 40%).

#### Monthly Revenue

- Calculated for 12 months using seasonality coefficients.
- **High Season**: Dec-Apr, Jul-Sep.
- **Low Season**: May-Jun, Oct-Nov.

## Output Display

1. **Total Annual Revenue**: Primary display numbers.
2. **Comparison Chart**: Bar chart showing monthly revenue (Sans Kazas vs Avec Kazas).
3. **Details List**: Breakdown of active boosts (e.g., "+30€ Prix", "+4% Occup.").

## Mobile Behavior

- **Inputs**: Grid layout adjusts (2 columns) or stacked.
- **Results**: Result cards ("Sans Kazas" / "Avec Kazas") stack vertically for readability.
- **Tabs**: (Optional/Legacy) Logic exists to switch views if screen is too narrow.
