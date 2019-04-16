import sqlite3

class Database:
    def __init__(self):
        self.conn = sqlite3.connect('../data/db.sqlite')
        self.cursor = self.conn.cursor()
        print("Connected to database successfully")
        for row in self.cursor.execute("SELECT name FROM sqlite_master WHERE type='table';"):
            print(row)
        
    def createMatchTable(self):
        self.cursor.execute('''CREATE TABLE if not exists Matches 
        (
            ID INT PRIMARY_KEY NOT NULL,
            EMPLOYER_ID TEXT NOT NULL,
            EMPLOYEE_ID TEXT NOT NULL,
            SCORE REAL NOT NULL
        );''')
    
    def insertMatchTable(self, id, employerID, employeeID, score):
        self.cursor.execute('''INSERT INTO MATCHES (ID, EMPLOYER_ID, EMPLOYEE_ID, SCORE)  VALUES (?, ?, ?, ?)''', (id, employerID, employeeID, score))
        self.cursor.execute('''SELECT * FROM MATCHES''')
        self.conn.commit()


    
