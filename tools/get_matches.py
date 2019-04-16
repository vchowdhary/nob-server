#!/usr/bin/env python3
# match.py

import sys
import json
import pickle
import pandas as pd
from sklearn_pandas import DataFrameMapper
from dbmanager import Database
import sqlite3
from ast import literal_eval
import numpy as np
import pandas as pd
from sklearn.svm import SVR
from sklearn import metrics


def setup():
    db = Database()
    db.createMatchTable()
    employeePath = '../data/employees.csv'
    employerPath = '../data/employers.csv'

    model = pickle.load(open('/data/model.pickle', 'rb'))
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
        print(df)
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

def get_matches(request, providers, histories):
    #print("getting matches")
    model = pickle.load(open('/Users/vanshikachowdhary/Desktop/night-owl-bakery-master/data/model_tutoring.pickle', 'rb'))
    providers = [i for i in providers if i]
    #print(providers)
    providerdf = pd.io.json.json_normalize(providers, sep='_')


    histories = [i for i in histories if i]

    df = providerdf

    if(histories != []):
        historiesdf = pd.io.json.json_normalize(histories, sep='_')
        df['avg_match_score'] = historiesdf["score"].mean()
    

    #print(df)
    if (not 'subject_1_rating' in df):
        df['subject_1_rating'] = 1

    if (not 'subject_2_rating' in df):
        df['subject_2_rating'] = 1

    if (not 'subject_2_preference' in df):
        df['subject_2_preference'] = 1
    
    if (not 'subject_3_rating' in df):
        df['subject_3_rating'] = 1

    if (not 'subject_3_preference' in df):
        df['subject_3_preference'] = 1
    
    if (not 'avg_match_score' in df):
        df['avg_match_score'] = 0
    
    attrs = set(df.columns.values)


    ignoredAttrs = set([
        'subject_1_details',
        'id',
        'subject_1_timetotutor',
        'subject_2_details',
        'subject_2_timetotutor',
        'subject_2_details',
        'subject_3_timetotutor',
        'subject_1_timetogettutored',
        'subject_2_timetogettutored',
        'subject_3_timetogettutored'
    ])

    inputAttrs = list(attrs - ignoredAttrs)
    df[inputAttrs] = df[inputAttrs].astype(float)

    inputsMap = DataFrameMapper([
        (inputAttrs, None)
    ])


    inputSamples = inputsMap.fit_transform(df)

    #print(inputAttrs)
    #print(inputSamples)    

    #print({'id': df['id'], 'score': model.predict(inputSamples)})

    result = pd.DataFrame(data={
        'id': df['id'],
        'score': model.predict(inputSamples)
    })
    
   
    result.sort_values(by=['score'], ascending=False, inplace=True);
    result = result.head(5)

    return result.to_json()
    
    #print(result.to_json())
    
    #print(request)
   # print(histories)
   # print(providers)
    sys.stdout.flush()

def read_in():
    lines = sys.stdin.readlines()
    #Since our input would only be having one line, parse our JSON data from that
    return json.loads(lines[0])

if __name__ == "__main__":
    #print("getting matches")
    lines = read_in()
    result = get_matches(lines[0], lines[1], lines[2])
    print(result)
    sys.stdout.flush()
    
