################################# scoring.py ###################################
# Define a function here to rate an employer-employee pairing. Used in the     #
# main file to populate the "score" header in the matching CSV file.           #
################################################################################

import random;
from constants import *;

# r := employer
# e := employee
def score(r, req, avg_match_score):

    print(r)
    print(req)
    
    '''dist = 0

    for likert in LIKERTS:
            key = 'likert.%s' % (likert)
            dist += (r[key] - e[key]) ** 2
    #print("dist")
    #print(dist)

    for semDiff in SEMDIFFS:
            key = 'semDiff.%s' % (semDiff)
            dist += (r[key] - e[key]) ** 2
    #print("dist")
    #print(dist)

    maxDist = (4 ** 2) * len(LIKERTS) + (4 ** 2) * len(semDiff)
    #print(maxDist)
    #print((float)(maxDist - dist)/maxDist)'''

    subjectscore = 0
    
    timediff = r['time'] - req['time']

    if (timediff < -20):
            timediff = -20

    if (timediff > 20):
            timediff = 20

    return (0.3)*(r['time'] - req['time']) + (0.3)*(r[req['subject_1']]['preference'] + r[req['subject_1']]['rating']) + (0.2)*(r[req['subject_2']]['preference'] + r[req['subject_2']]['rating']) + (0.1)*(r[req['subject_3']]['preference'] + r[req['subject_3']]['rating']) + 0.1*(avg_match_score)


def delivery_score(r, req, avg_match_score):
        return (0.3)*(r['time'] - req['time']) + (0.3)*(r['time2'] - req['time2']) + 0.2*(r[req['category']]['preference']) + 0.2*(avg_match_score)
