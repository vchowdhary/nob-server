#!/usr/bin/env python3

import sys
import json
import pickle
import pandas as pd
from sklearn_pandas import DataFrameMapper
from ast import literal_eval
import numpy as np
import pandas as pd
from sklearn.svm import SVR
from sklearn import metrics

def get_matches(request, providers, histories):
    #print(request)
    model = pickle.load(open('/home/vanshika/nob-server/data/model_delivery.pickle', 'rb'), encoding='latin1') 
    providers = [i for i in providers if i]
    providerdf = pd.io.json.json_normalize(providers, sep='_')

    histories = [i for i in histories if i]

    df = providerdf

    if(histories != []):
        historiesdf = pd.io.json.json_normalize(histories, sep='_')
        df["avg_match_score"] = historiesdf["score"].mean()
    

    if (not 'subject_1_preference' in df):
        df['preference'] = 1

    if (not 'subject_1_timetodeliver' in df):
        df['time2'] = 30
    
    if (not 'subject_1_timetopickup' in df):
        df['time'] = 30

    if (not "avg_match_score" in df):
        df["avg_match_score"] = 0
    
    #print(df)
    
    attrs = set(df.columns.values)

    #print(attrs)


    ignoredAttrs = set([
        'subject_1_details',
        'subject_1_timetopickup',
        'subject_1_timetodeliver',
        'id'
    ])

    inputAttrs = list(attrs - ignoredAttrs)
    df[inputAttrs] = df[inputAttrs].astype(float)

    #print(inputAttrs)
    #print(df)

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
    
   
    result.sort_values(by=['score'], ascending=False, inplace=True)
    
    res = {}
    count = 0
    for key in result["id"]:
        res[count] = key
        count += 1

    return json.dumps(res)
    
def read_in():
    lines = sys.stdin.readlines()
    #Since our input would only be having one line, parse our JSON data from that
    return json.loads(lines[0])

if __name__ == "__main__":
    #print("getting matches")
    lines = read_in()
    result = get_matches(lines[0], lines[1], lines[2])
    print(result)
    
