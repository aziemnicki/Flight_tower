# Flight Tower

A minimalist Python application to display the most important information about aircraft currently flying above your location, using the FlightRadar24API and Streamlit.

## Features

- Enter your location (latitude/longitude)
- Adjustable search radius (default: 8 km)
- Retrieves flights above your area using FlightRadar24API
- Displays destination, departure, airline, and times for the closest aircraft

## Usage

1. Install dependencies (already managed by `uv`):
   ```bash
   uv pip sync
   ```
2. Run the Streamlit app:
   ```bash
   streamlit run main.py
   ```
3. Enter your coordinates and adjust the search radius as needed.
4. Click "Find Flights Above Me" to see the closest aircraft and its details.

---

For more details, see the project plan and code comments.
