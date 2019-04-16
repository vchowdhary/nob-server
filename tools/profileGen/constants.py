# File directory constants
NAMEFILE_DIR = "lib/";
OUTPUT_DIR = "../../data/";

############################### CSV header constants ###########################
# Output CSV header names
HEADERS = [
    "id",
    "nameFirst",
    "nameLast",
    "time",
    'Math',
    'Chemistry',
    'History',
    'Computer Science',
    'French',
    'Biology',
    'Physics'
]

TUTORING_CATEGORIES = [
    'Math',
    'Chemistry',
    'History',
    'Computer Science',
    'French',
    'Biology',
    'Physics'
]

REQUEST_HEADERS = [
    'id',
    'subject_1',
    'subject_2',
    'subject_3',
    'time'
]

DELIVERY_REQUEST_HEADERS = [
    'id',
    'category',
    'time',
    'time2'
]

# Headers for matching CSV
MATCHING_HEADERS = [
    "id",
    "details",
    "time",
    "time_request",
    "score",
    "subject_1_rating",
    "subject_1_pref",
    "subject_2_rating",
    "subject_2_pref",
    "subject_3_rating",
    "subject_3_pref",
    "avg_match_score"
];

DELIVERY_MATCHING_HEADERS = [
    "id",
    "details",
    "time",
    "time_request",
    "score",
    "preference",
    "time2_request",
    "time2",
    "avg_match_score"
];



DELIVERY_CATEGORIES = [
    'Food',
    'Beverages',
    'Takeout',
    'Music'
]


DELIVERY_HEADERS = [
    'id',
    'nameFirst',
    'nameLast',
    'time',
    'time2',
    'Food',
    'Beverages',
    'Takeout',
    'Music'
]
