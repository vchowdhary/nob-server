import sqlite3
import pickle
import numpy as np
import pandas as pd
from sklearn.svm import SVR
from sklearn import metrics
from sklearn_pandas import DataFrameMapper
from ast import literal_eval

conn = sqlite3.connect('/Users/vanshikachowdhary/Desktop/night-owl-bakery-master/data/db.sqlite')
employerPath = '/Users/vanshikachowdhary/Desktop/night-owl-bakery-master/data/employers.csv'
employeePath = 'data/employees.csv'

employerData2 = pd.read_csv(employerPath, sep=',', index_col='id')
employeeData2 = pd.read_csv(employeePath, sep=',', index_col='id')

# print("Employee data 2")
# print(employeeData2)

reviewData = pd.read_sql_query('''SELECT * from MATCHES''', conn)
employerData = pd.read_sql_query('''SELECT * from Profiles where isEmployee = "0"''', conn)
employeeData = pd.read_sql_query('''SELECT * from Profiles where isEmployee = "1"''', conn)

df1 = pd.DataFrame(employeeData['likert'].apply(literal_eval).values.tolist())
df1.columns = 'likert.'+ df1.columns

df2 = pd.DataFrame(employeeData['semDiff'].apply(literal_eval).values.tolist())
df2.columns = 'semDiff.'+ df2.columns

col = employeeData.columns.difference(['likert','semDiff'])
employeeData = pd.concat([employeeData[col], df1, df2],axis=1)  

df3 = pd.DataFrame(employerData['likert'].apply(literal_eval).values.tolist())
df3.columns = 'likert.'+ df3.columns

df4 = pd.DataFrame(employerData['semDiff'].apply(literal_eval).values.tolist())
df4.columns = 'semDiff.'+ df4.columns

col = employerData.columns.difference(['likert','semDiff'])
employerData = pd.concat([employerData[col], df3, df4],axis=1)  
#employerData = pd.concat([employerData, employerData2], axis=0)

reviewData.rename(columns={'SCORE':'score'}, inplace=True)

#employeeData2.rename(columns={'id':'EMPLOYEE_ID'}, inplace=True)
#employerData2.rename(columns={'id':'EMPLOYER_ID'}, inplace=True)

# print("Employee data:")
del reviewData['ID']
del employeeData['bio']
del employeeData['phone']
del employeeData['zipCode']
del employeeData['openResp']
del employeeData['isEmployee']
#del employeeData['EMPLOYEE_ID']

# print(employeeData)
employeeData = pd.concat([employeeData.set_index('id'), employeeData2], axis=0)
#print(employeeData)

employerData = pd.concat([employerData.set_index('id'), employerData2], axis=0)
#print(employerData)

del employerData['bio']
del employerData['phone']
del employerData['zipCode']
del employerData['openResp']
del employerData['isEmployee']
# del employerData['EMPLOYER_ID']

dtype = {'EMPLOYEE_ID': str, 'EMPLOYER_ID': str}

reviewData = reviewData.astype(dtype)

employeeData.rename(columns={'id':'EMPLOYEE_ID'}, inplace=True)
employerData.rename(columns={'id':'EMPLOYER_ID'}, inplace=True)

# print("new data")
#print(employeeData)
#print(employerData)

df = reviewData                                                                   
df = df.merge(employerData, how='inner', left_on='EMPLOYER_ID', right_on='id')
df = df.merge(employeeData[employeeData2.columns.difference(employeeData.columns)], how='inner', left_on = 'EMPLOYEE_ID', right_on='id')

# print("After merge")
# print(df)
# print(df.columns)

# Feature selection
attrs = set(df.columns.values)
ignoredAttrs = set([
    'EMPLOYER_ID',
    'EMPLOYEE_ID',
    'nameFirst',
    'nameLast',
    'origin'
])
outputAttr = 'score'
inputAttrs = list(attrs - ignoredAttrs - set([outputAttr]))
inputsMap = DataFrameMapper([
    (inputAttrs, None)
])

# Model training
inputSamples = inputsMap.fit_transform(df)
outputSamples = list(df[outputAttr].values)

model = SVR(kernel='rbf', gamma='scale')
model.fit(inputSamples, outputSamples)

predOutputs = model.predict(inputSamples)

print((
    "mean absolute error = %.6f\n"
    "mean squared error = %.6f\n"
    "explained variance score = %.6f\n"
    "r^2 score = %.6f"
) % (
    metrics.mean_absolute_error(outputSamples, predOutputs),
    metrics.mean_squared_error(outputSamples, predOutputs),
    metrics.explained_variance_score(outputSamples, predOutputs),
    metrics.r2_score(outputSamples, predOutputs)
))

pickle.dump(model, open('/Users/vanshikachowdhary/Desktop/night-owl-bakery-master/data/model.pickle', 'wb'))