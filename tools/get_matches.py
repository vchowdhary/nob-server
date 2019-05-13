#!/usr/bin/env python3

import sys
import json
import pickle
#print(pickle)
from sklearn_pandas import DataFrameMapper
from ast import literal_eval
import numpy as np
import pandas as pd
from sklearn.svm import SVR
from sklearn import metrics

def get_matches(request, providers, histories):
    #print("getting matches")
    model = pickle.load(open('/home/vanshika/nob-server/data/model_tutoring.pickle', 'rb'), encoding='latin1')
    providers = [i for i in providers if i]
    #print("providers")
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

    res = {}
    count = 0
    
    result.sort_values(by=['score'], ascending=False, inplace=True)
    
    
    for key in result["id"]:
        res[count] = key
        count += 1

    return json.dumps(res)
    
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
    #print(lines)
    result = get_matches(lines[0], lines[1], lines[2])
    print(result)
    sys.stdout.flush()
    
