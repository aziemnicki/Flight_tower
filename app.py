import streamlit as st
from geopy.distance import geodesic
from FlightRadar24 import FlightRadar24API
from streamlit_js_eval import get_geolocation

# from streamlit_geolocation import streamlit_geolocation
from datetime import datetime
from translations import translations
from countryinfo import CountryInfo
import folium
from streamlit_folium import st_folium

# import json
import geocoder


def get_country_flag(country_name):
    try:
        return CountryInfo(country_name).flag()
    except (KeyError, StopIteration):
        return "🏴‍☠️"


def update_location_by_ip():
    """Updates the user's location using the geocoder library."""
    g = geocoder.ip("me")
    if g.ok and g.latlng:
        st.session_state.user_lat, st.session_state.user_lon = g.latlng
        st.sidebar.success(get_text("location_updated"))
        st.session_state.trigger_flight_search = True
    else:
        st.sidebar.error(get_text("location_error"))


def get_text(key):
    """Gets the translated text for a given key."""
    return translations[st.session_state.lang].get(key, key)


# --- LANGUAGE SELECTION ---
if "lang" not in st.session_state:
    st.session_state.lang = "pl"  # Default to Polish

# Initialize session state for controlling display
if "show_results" not in st.session_state:
    st.session_state.show_results = False
if "flight_data" not in st.session_state:
    st.session_state.flight_data = None
if "trigger_flight_search" not in st.session_state:
    st.session_state.trigger_flight_search = False
if "user_lat" not in st.session_state:
    # st.session_state.user_lat = 52.3986
    st.session_state.user_lat = 0
if "user_lon" not in st.session_state:
    # st.session_state.user_lon = 16.9452
    st.session_state.user_lon = 0
if "location_request_sent" not in st.session_state:
    st.session_state.location_request_sent = False

# Language selector in the sidebar
st.sidebar.header(get_text("language"))
lang_options = {"Polski": "pl", "English": "en"}
selected_lang_display = st.sidebar.radio(
    "Wybierz język / Select language", options=list(lang_options.keys())
)
st.session_state.lang = lang_options[selected_lang_display]

# --- SEKCJA W SIDEBARZE ---
with st.sidebar:
    st.header(get_text("settings"))

    # This button's ONLY job is to set a flag.
    if st.button(get_text("get_my_location")):
        st.session_state.location_request_sent = True

    # This separate block of code runs on every rerun.
    if st.session_state.location_request_sent:
        st.info("Awaiting location permission from your browser...")

        loc = get_geolocation()

        # --- DEBUGGING STEP ---
        # This will show you the exact structure of what is returned.
        # You can remove this once the issue is solved.
        # st.write("Geolocation result:", loc)

        # --- DEFENSIVE CHECK ---
        # Check if loc is a dictionary AND if it has the keys you need.
        if (
            isinstance(loc, dict)
            and "coords" in loc
            and isinstance(loc.get("coords"), dict)
            and "latitude" in loc["coords"]
            and "longitude" in loc["coords"]
        ):
            # Assign the values from the nested dictionary
            st.session_state.user_lat = loc["coords"]["latitude"]
            st.session_state.user_lon = loc["coords"]["longitude"]
            st.session_state.trigger_flight_search = True

            # Reset the flag so we don't keep asking.
            st.session_state.location_request_sent = False

            st.success(
                get_text("location_updated").format(
                    time=datetime.now().strftime("%H:%M:%S")
                )
            )

            st.rerun()
        elif loc is not None:
            # This will catch cases where `loc` is returned but isn't the format we expect
            st.warning(
                "Received location data, but in an unexpected format. Please try again."
            )


# Initialize the FlightRadar24API
fr_api = FlightRadar24API()

st.set_page_config(page_title=get_text("page_title"), page_icon="✈️", layout="centered")

# --- UI ELEMENTS ---
st.title(get_text("title"))
st.write(get_text("description"))

# --- Automatic Location ---
# if st.sidebar.button(get_text("get_my_location")):
#     update_location_by_ip()


# Location Input
st.sidebar.subheader(get_text("your_location"))
user_lat = st.sidebar.number_input(get_text("latitude"), format="%.4f", key="user_lat")
user_lon = st.sidebar.number_input(get_text("longitude"), format="%.4f", key="user_lon")

# Search Radius Input
st.sidebar.subheader(get_text("search_radius"))
radius_km = st.sidebar.slider(
    get_text("radius_km"), min_value=5, max_value=100, value=50, step=5
)


# Button to trigger the search
if st.button(get_text("find_flights")) or st.session_state.trigger_flight_search:
    # Reset display state
    st.session_state.show_results = False
    st.session_state.flight_data = None

    st.header(get_text("nearby_flights"))

    # --- DATA FETCHING AND PROCESSING ---
    try:
        # 1. Define the search area (bounds)
        bounds = fr_api.get_bounds_by_point(user_lat, user_lon, radius_km * 1000)

        with st.spinner(get_text("searching").format(radius_km=radius_km)):
            # 2. Get flights within the defined bounds
            flights = fr_api.get_flights(bounds=bounds)

        if not flights:
            st.warning(get_text("no_flights_found"))
        else:
            st.success(get_text("found_flights").format(count=len(flights)))

            user_location = (user_lat, user_lon)
            valid_flights = []

            for flight in flights:
                if (
                    hasattr(flight, "latitude")
                    and hasattr(flight, "longitude")
                    and flight.latitude
                    and flight.longitude
                ):
                    flight.distance = geodesic(
                        user_location, (flight.latitude, flight.longitude)
                    ).km
                    valid_flights.append(flight)

            if not valid_flights:
                st.warning(get_text("no_valid_flight_data"))
                # No st.stop() here, just don't set show_results
            else:
                valid_flights.sort(key=lambda f: f.distance)
                st.session_state.flight_data = valid_flights
                st.session_state.show_results = True

        st.session_state.trigger_flight_search = False  # Reset the trigger

    except Exception as e:
        st.error(get_text("error_occurred").format(error=e))
        st.error(get_text("try_again"))

# New conditional block for displaying results
if st.session_state.show_results and st.session_state.flight_data:
    valid_flights = st.session_state.flight_data
    # user_lat and user_lon are already available in the global scope of the script

    # Display flight information
    for flight in valid_flights[:10]:  # Display top 10 closest flights
        with st.spinner(
            f"Fetching details for {getattr(flight, 'callsign', 'N/A')}..."
        ):
            try:
                if hasattr(flight, "id") and flight.id:
                    flight_details = fr_api.get_flight_details(flight)
                    if isinstance(flight_details, dict):
                        flight.set_flight_details(flight_details)

                        origin_country = "N/A"
                        dest_country = "N/A"
                        try:
                            origin_country = flight_details["airport"]["origin"][
                                "position"
                            ]["country"]["name"]
                        except (KeyError, TypeError):
                            pass
                        try:
                            dest_country = flight_details["airport"]["destination"][
                                "position"
                            ]["country"]["name"]
                        except (KeyError, TypeError):
                            pass

                        origin_flag = get_country_flag(origin_country)
                        dest_flag = get_country_flag(dest_country)

                        flight_time_str = "N/A"
                        try:
                            departure = flight_details["time"]["scheduled"]["departure"]
                            arrival = flight_details["time"]["scheduled"]["arrival"]
                            if departure and arrival:
                                duration = arrival - departure
                                hours = duration // 3600
                                minutes = (duration % 3600) // 60
                                flight_time_str = f"{int(hours)}h {int(minutes)}m"
                        except (KeyError, TypeError, ValueError):
                            pass

                        st.markdown(
                            f"""
                        <div style="border: 1px solid #e6e6e6; border-radius: 10px; padding: 15px; margin-bottom: 15px;">
                                    <h3 style="margin-bottom: 10px;">{getattr(flight, "callsign", "N/A")}</h3>
                                    <p>
                                        {get_text("from")}: {getattr(flight, "origin_airport_name", "N/A")} ({getattr(flight, "origin_airport_iata", "")}) - {origin_country} {origin_flag}<br>
                                        {get_text("to")}: {getattr(flight, "destination_airport_name", "N/A")} ({getattr(flight, "destination_airport_iata", "")}) - {dest_country} {dest_flag}
                                    </p>
                                    <p>
                                        <strong>{get_text("distance")}:</strong> {flight.distance:.2f} km<br>
                                        <strong>{get_text("aircraft")}:</strong> {getattr(flight, "aircraft_code", "N/A")}<br>
                                        <strong>{get_text("flight_time")}:</strong> {flight_time_str}
                                    </p>
                                </div>
                        """,
                            unsafe_allow_html=True,
                        )

                    else:
                        st.warning(
                            f"Could not retrieve details for {getattr(flight, 'callsign', 'N/A')}"
                        )
                else:
                    st.markdown(
                        f"""
                    <div style="border: 1px solid #e6e6e6; border-radius: 10px; padding: 15px; margin-bottom: 15px;">
                        <h3 style="margin-bottom: 10px;">{getattr(flight, "callsign", "N/A")}</h3>
                        <p>
                            <strong>{get_text("distance")}:</strong> {flight.distance:.2f} km<br>
                        </p>
                        <p>Incomplete data. Detailed flight information is unavailable.</p>
                    </div>
                    """,
                        unsafe_allow_html=True,
                    )

            except Exception as e:
                st.error(
                    f"Error fetching details for {getattr(flight, 'callsign', 'N/A')}: {e}"
                )

    # --- MAP DISPLAY ---
    st.header(get_text("flights_on_map"))
    m = folium.Map(location=[user_lat, user_lon], zoom_start=10)

    # Add user's location marker
    folium.Marker(
        [user_lat, user_lon],
        tooltip=get_text("your_location"),
        icon=folium.Icon(color="blue", icon="home", prefix="fa"),
    ).add_to(m)

    # Add flight markers
    for flight in valid_flights[:10]:
        if (
            hasattr(flight, "latitude")
            and hasattr(flight, "longitude")
            and flight.latitude
            and flight.longitude
        ):
            folium.Marker(
                [flight.latitude, flight.longitude],
                tooltip=f"{getattr(flight, 'callsign', 'N/A')} ({flight.distance:.2f} km)",
                icon=folium.Icon(color="red", icon="plane", prefix="fa"),
            ).add_to(m)

    st_folium(m, width=700, height=500)

    # # Add a download button for flight data as JSON  -for debuging only
    # if st.session_state.flight_data:
    #     flight_data_for_json = []
    #     for flight in st.session_state.flight_data:
    #         flight_details = fr_api.get_flight_details(flight)
    #         flight_data_for_json.append(flight_details)

    #     json_data = json.dumps(flight_data_for_json, indent=4)
    #     st.download_button(
    #         label="Download Flight Data as JSON",
    #         data=json_data,
    #         file_name="flight_data.json",
    #         mime="application/json"
    #     )

else:  # This is the original 'else' for the button, now it's for when no results are shown
    st.info(get_text("sidebar_info"))
    st.write(get_text("how_to_use_title"))
    st.write(get_text("how_to_use_steps"))
