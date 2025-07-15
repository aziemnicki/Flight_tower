<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# Project Plan: Python Application for Displaying Aircraft Information Above User's Location Using Flightradar24API

## 1. Application Goal

Create a simple Python application that displays the most important information about the aircraft currently flying above the user's location, utilizing the open-source **FlightRadar24API** library.

## 2. Main Features

- Automatically retrieve the user's location (via GPS or manual coordinate entry).
- Set a search radius (default: 8 km, user-adjustable).
- Retrieve data on nearby aircraft using the FlightRadar24API library.
- Identify the aircraft closest to the user's position (or directly overhead).
- Display only the most essential information in a minimalist UI:
    - Destination airport
    - Departure airport
    - Airline
    - Departure and arrival times


## 3. Application Structure

### 3.1. Modules

- **Location Retrieval Module**
    - Automatically get location or allow manual coordinate entry.
- **Settings Module**
    - Set the search radius (default: 8 km).
- **Data Retrieval Module (FlightRadar24API)**
    - Integrate with the FlightRadar24API library to retrieve flight lists.
    - Filter aircraft within the specified radius based on coordinates.
- **Data Analysis Module**
    - Select the aircraft closest to the user.
    - Retrieve detailed information about the selected flight (e.g., with `get_flight_details`).
- **UI Module (Streamlit)**
    - Minimalist interface built with Streamlit, displaying only the required information.


## 4. Example Application Workflow

1. The user launches the application (e.g., with `streamlit run app.py`).
2. The application retrieves the user's location.
3. The user can adjust the search radius (default: 8 km) via a slider or text field in Streamlit.
4. The application retrieves a list of aircraft within the specified radius using FlightRadar24API.
5. The aircraft closest to the user's position is selected.
6. Streamlit displays:
    - Destination airport
    - Departure airport
    - Airline
    - Departure and arrival times

## 5. Technologies and Tools

- Python 3.x
- Libraries:
    - `requests` (optional, for additional queries)
    - `geopy` (coordinate operations)
    - `streamlit` (user interface)
    - **`FlightRadar24API`** (flight data retrieval)
- FlightRadar24API installation:

```bash
uv add FlightRadarAPI
```

- Documentation and usage examples: [GitHub FlightRadarAPI]


## 6. Minimalist UI in Streamlit

Only four key pieces of information are displayed in a clear format, for example:


| Destination | Departure | Airline | Departure Time | Arrival Time |
| :-- | :-- | :-- | :-- | :-- |
| Warsaw | London | LOT | 14:05 | 16:35 |

In Streamlit, you can use `st.table()` or `st.dataframe()` to present this data.

## 7. Next Steps

- Review the FlightRadar24API documentation.
- Prepare sample API queries and analyze responses.
- Implement a prototype using Streamlit and FlightRadar24API.
- Test functionality in various locations and optimize UX.


## 8. Final Notes

- The application should be as simple as possible—one screen, minimal settings.
- The MVP version runs as a web app in Streamlit.
- Focus on speed and clarity of the presented information.

**Sample FlightRadar24API usage:**

```python
from FlightRadar24 import FlightRadar24API

fr_api = FlightRadar24API()
flights = fr_api.get_flights(bounds=(lat1, lon1, lat2, lon2))
flight_details = fr_api.get_flight_details(flights[0].id)
```

More examples and documentation: [GitHub FlightRadarAPI]

