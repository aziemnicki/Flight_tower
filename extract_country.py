import json

with open(r'C:\Users\Andrzej\Desktop\Python\Flight_tower\flight_data (1).json', 'r') as f:
    data = json.load(f)

print(data[0]['airport']['origin']['position']['country']['name'])