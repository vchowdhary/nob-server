#!/usr/bin/python3
############################## profileGen.py ###################################
# Main script to run to generate profiles. Creates 3 CSVs:                     #
#   1. employer profiles                                                       #
#   2. employee profiles                                                       #
#   3. matchings between each employer-employee pair                           #
# and places them in output_csvs.                                              #
#                                                                              #
# Parses command line input to add a custom number of entries for each set of  #
# profiles.                                                                    #
################################################################################

# Project-defined modules
import constants;
import names;
import scoring;
# Builtin modules
import sys;
import optparse;
import csv;
import random;

# Returns a tuple of (options, args) parsed from the command line. All options
# and args are optional.
def getArgs():
    usage = "usage: %prog [-r] [-e]";
    parser = optparse.OptionParser(usage=usage)
    parser.add_option("-r", "--employer", action="store", type="int",
                    dest="numEmployers", default=1000,
                    help="number of employer entries to generate (default 1000)");
    parser.add_option("-e", "--employee", action="store", type="int",
                    dest="numRequests", default=50,
                    help="number of employer entries to generate (default 50)");
    (options, args) = parser.parse_args();
    return (options, args);

def main():
    (options, args) = getArgs();

    # Generate list only once in runtime to make things faster
    maleNames = names.getFirstNames(names.MALE);
    femaleNames = names.getFirstNames(names.FEMALE);
    lastNames = names.getLastNames();

    users = [];
    requests = [];
    usedIDs = set();                # To prevent duplicate IDs
    headers = constants.HEADERS;

    # Generate user profiles
    with open(constants.OUTPUT_DIR + "users.csv", "wb") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=headers);
        writer.writeheader();

        for i in range(0, options.numEmployers):
            userDict = {};

            firstName = names.getRandFirstName(maleNames, femaleNames);
            lastName = names.getRandLastName(lastNames);
            userDict["nameFirst"] = firstName;
            userDict["nameLast"] = lastName;
            newID = names.getIdFromName(firstName, lastName, usedIDs);
            userDict["id"] = newID
            

            subject_1 = names.getRandCategory(constants.TUTORING_CATEGORIES)
            subject_2 = names.getRandCategory(constants.TUTORING_CATEGORIES)
            subject_3 = names.getRandCategory(constants.TUTORING_CATEGORIES)
            times = [5, 10, 15, 20, 25, 30]
            time = times[random.randint(0, 5)]

            for subject in constants.TUTORING_CATEGORIES:
                userDict[subject] = {'preference': 0, 'rating': 0}
                userDict[subject]["preference"] = random.randint(1, 5)
                userDict[subject]["rating"] = random.randint(1,5)

            userDict["time"] = time

            writer.writerow(userDict);
            users.append(userDict);
        csvfile.close(); 

    with open(constants.OUTPUT_DIR + "requests_tutoring.csv", "wb") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=constants.REQUEST_HEADERS)
        writer.writeheader()

        usedIDs = {}
        for i in range(0, 50):
            requestDict = {}
            id = names.getIdFromName(names.getRandFirstName(maleNames, femaleNames), names.getRandLastName(lastNames), usedIDs)

            subject_1 = names.getRandCategory(constants.TUTORING_CATEGORIES)
            subject_2 = names.getRandCategory(constants.TUTORING_CATEGORIES)
            subject_3 = names.getRandCategory(constants.TUTORING_CATEGORIES)
            time = round(random.uniform(0,30), 2)

            print(constants.REQUEST_HEADERS)
            requestDict["id"] = id
            requestDict["time"] = time
            requestDict["subject_1"] = subject_1
            requestDict["subject_2"] = subject_2
            requestDict["subject_3"] = subject_3
            requests.append(requestDict)
            writer.writerow(requestDict)

    # Generate user pairings + reviews
    with open(constants.OUTPUT_DIR + "reviews_tutoring.csv", "wb") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=constants.MATCHING_HEADERS);
        writer.writeheader();

        # Generate matchings
        for user in users:
                #print(user)
                for request in requests:
                    avg_match_score = round(random.uniform(1, 5), 3)
                    pairDict = {};
                    pairDict["id"] = user["id"];
                    pairDict["score"] = scoring.score(user, request, avg_match_score);
                    pairDict["time_request"] = request["time"]
                    pairDict["time"] = user["time"]
                    pairDict["subject_1_pref"] = user[request["subject_1"]]["preference"]
                    pairDict["subject_1_rating"] = user[request["subject_1"]]["rating"]
                    pairDict["subject_2_pref"] = user[request["subject_2"]]["preference"]
                    pairDict["subject_2_rating"] = user[request["subject_2"]]["rating"]
                    pairDict["subject_3_pref"] = user[request["subject_3"]]["preference"]
                    pairDict["subject_3_rating"] = user[request["subject_3"]]["rating"]
                    pairDict["avg_match_score"] = avg_match_score
                    
                    writer.writerow(pairDict)


               
        csvfile.close();

    return 0;

exitStatus = main();
exit(exitStatus);

