import json
import os
import pandas as pd
from kaggle.api.kaggle_api_extended import KaggleApi

api = KaggleApi()
api.authenticate()
api.dataset_download_files('piterfm/massive-missile-attacks-on-ukraine', unzip=True)

df = pd.read_csv('missile_attacks_daily.csv')  # Adjust filename as needed
records = df.to_dict(orient='records')

os.makedirs('mdata', exist_ok=True)


with open('mdata/kaggle_missile_attacks_daily.json', 'w') as f:
    json.dump(records, f, indent=2)