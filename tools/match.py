#!/usr/bin/env python3
# match.py

import sys
import pickle
import pandas as pd
from sklearn_pandas import DataFrameMapper
from dbmanager import Database

db = Database()
db.createMatchTable()
employeePath = '../data/employees.csv'
employerPath = '../data/employers.csv'

model = pickle.load(open('../data/model.pickle', 'rb'))
employeeData = pd.read_csv(employeePath, sep=',')
employeeData['merge'] = 1

employerDataReader = pd.read_csv(employerPath, sep=',', chunksize=1)

for employerData in employerDataReader:
    employerData['merge'] = 1
    df = pd.merge(employerData, employeeData, on='merge')
    del df['merge']
    

    attrs = set(df.columns.values)
    ignoredAttrs = set([
        'id_x',
        'id_y',
        'nameFirst_x',
        'nameFirst_y',
        'nameLast_x',
        'nameLast_y',
        'origin_x',
        'origin_y'
    ])

    inputAttrs = list(attrs - ignoredAttrs)
    inputsMap = DataFrameMapper([
        (inputAttrs, None)
    ])

    inputSamples = inputsMap.fit_transform(df)
    print(inputSamples)

    result = pd.DataFrame(data={
        'id_x': df['id_x'],
        'id_y': df['id_y'],
        'score': model.predict(inputSamples)
    });
    
    id = 0

    result.sort_values(by=['score'], ascending=False, inplace=True);
    result = result.head(5)

    for index, row in result.iterrows():
       id += 1
       print(row)
       print(row[0])
       print(row[1])
       print(row[2])
       db.insertMatchTable(id, row[0], row[1], row[2])

  

    
