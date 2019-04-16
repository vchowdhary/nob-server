################################# names.py #####################################
# This defines functions that are useful for name generation. Can create a     #
# list of names, create an ID based on first and last names, as well as return #
# some random name.                                                            #
################################################################################

import random
from constants import *

# Defining some constants
MALE = 0
FEMALE = 1

# Returns a list of first names, based on gender.
def getFirstNames(gender):
    retArr = [];
    fileName = NAMEFILE_DIR + "names.first"
    fileName += ".male" if gender == MALE else ".female";
    fh = open(fileName, "r");
    retArr = fh.readlines();
    for (idx, name) in enumerate(retArr):
        retArr[idx] = name.capitalize().strip();
    return retArr;

# Returns a list of last names.
def getLastNames():
    retArr = [];
    fileName = NAMEFILE_DIR + "names.last.all"
    fh = open(fileName, "r");
    retArr = fh.readlines();
    for (idx, name) in enumerate(retArr):
        retArr[idx] = name.capitalize().strip();
    return retArr;

# Returns a random first name. An array (MUST BE ARRAY) of names is provided,
# then it will use that for random generation. Otherwise this function will use
# the list defined in this file.
#
# Needs 2 lists, as the gender picking is random.
def getRandFirstName(maleNames=None, femaleNames=None):
    if (maleNames == None or femaleNames == None):
        maleNames = getFirstNames(MALE)
        femaleNames = getFirstNames(FEMALE)
    source = maleNames if random.randint(0,1) == MALE else femaleNames
    return random.choice(source)

# Returns a random last name. Source list is either given or defaulted to this
# file's.
def getRandLastName(lastNames=None):
    if (lastNames == None):
        lastNames = getLastNames();
    return random.choice(lastNames);

# Creates a username (id) from a first and last name. If we need them to be
# unique, then a usedIDs set must be passed in.
# User is responsible for adding the new username to their set of usedIDs.
#
# Returns None on error.
def getIdFromName(firstName, lastName, usedIDs=None):
    if (len(firstName) < 1 or len(lastName) < 1):
        print("ID_ERROR: first or last name cannot be blank");
        return None;
    isDuplicate = True;
    while (isDuplicate):
        newID = firstName[0].lower();
        newID += lastName[0:min(9, len(lastName))].lower()
        newID += str(random.randint(0, 999))
        if (not usedIDs == None):
            isDuplicate = newID in usedIDs
        else:
            isDuplicate = False
    return newID;

def getRandCategory(categoryNames=None):
    if (categoryNames == None):
        return None
    else:
        return random.choice(categoryNames)

