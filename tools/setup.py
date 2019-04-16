
import pickle
import numpy as np
import pandas as pd

# Data file paths
print("Setting up data paths\n")
employerPath = '/Users/vanshikachowdhary/Desktop/night-owl-bakery-master/data/employers.csv'
employeePath = '../data/employees.csv'
reviewPath = '../data/reviews.csv'

# Data file parsing
print("Reading employer data")
employerData = pd.read_csv(employerPath, sep=',', index_col='id')
employeeData = pd.read_csv(employeePath, sep=',', index_col='id')
reviewData = pd.read_csv(reviewPath, sep=',')

