// =====================================================
// POINTLESS — BUILT-IN SAMPLE GAMES
// =====================================================
//
// These ready-made sets appear in the "ready-made set"
// dropdown on the host setup screen — pick one and press
// Start, no files to edit. To add your own, append another
// object to POINTLESS_SAMPLES using the same shape, or use
// the "Make/Load your own quiz" loader on the host screen.
//
// Each game has the same structure the custom loader expects:
//   { title, rounds: [{ roundNumber, questions: [...] }], final }
// A question is { category, question, answers }, where each
// answer maps a name to a score (0-100, LOWER = more obscure
// = better) or to { score, aliases: [...] }.
// =====================================================

const POINTLESS_SAMPLES = [
  {
    "title": "Aussie High School General Knowledge",
    "rounds": [
      {
        "roundNumber": 1,
        "questions": [
          {
            "category": "Australian Animals",
            "question": "Name an animal native to Australia",
            "answers": {
              "kangaroo": {
                "score": 95,
                "aliases": [
                  "roo",
                  "red kangaroo",
                  "grey kangaroo"
                ]
              },
              "koala": {
                "score": 92,
                "aliases": [
                  "koala bear"
                ]
              },
              "emu": 78,
              "platypus": {
                "score": 72,
                "aliases": [
                  "duck-billed platypus",
                  "duck billed platypus"
                ]
              },
              "wombat": 65,
              "tasmanian devil": {
                "score": 55,
                "aliases": [
                  "tassie devil"
                ]
              },
              "dingo": 50,
              "kookaburra": {
                "score": 40,
                "aliases": [
                  "laughing kookaburra"
                ]
              },
              "echidna": {
                "score": 35,
                "aliases": [
                  "spiny anteater"
                ]
              },
              "quokka": 28,
              "cockatoo": {
                "score": 20,
                "aliases": [
                  "sulphur-crested cockatoo",
                  "sulphur crested cockatoo"
                ]
              },
              "cassowary": {
                "score": 12,
                "aliases": [
                  "southern cassowary"
                ]
              },
              "bilby": {
                "score": 8,
                "aliases": [
                  "greater bilby"
                ]
              },
              "numbat": 5,
              "quoll": 3,
              "potoroo": {
                "score": 0,
                "aliases": [
                  "long-nosed potoroo"
                ]
              },
              "bettong": 0,
              "pademelon": 0,
              "dugong": 0,
              "tree kangaroo": {
                "score": 0,
                "aliases": [
                  "tree-kangaroo"
                ]
              },
              "bandicoot": {
                "score": 0,
                "aliases": [
                  "long-nosed bandicoot"
                ]
              }
            }
          },
          {
            "category": "Summer Olympic Sports",
            "question": "Name a sport at the Summer Olympic Games",
            "answers": {
              "swimming": 95,
              "athletics": {
                "score": 88,
                "aliases": [
                  "track and field",
                  "running",
                  "sprinting"
                ]
              },
              "basketball": {
                "score": 82,
                "aliases": [
                  "bball"
                ]
              },
              "soccer": {
                "score": 78,
                "aliases": [
                  "football"
                ]
              },
              "gymnastics": 72,
              "tennis": 65,
              "volleyball": 55,
              "hockey": {
                "score": 48,
                "aliases": [
                  "field hockey"
                ]
              },
              "boxing": 42,
              "cycling": {
                "score": 38,
                "aliases": [
                  "road cycling",
                  "track cycling"
                ]
              },
              "diving": 32,
              "rowing": 25,
              "archery": 18,
              "badminton": 15,
              "fencing": 10,
              "sailing": {
                "score": 8,
                "aliases": [
                  "yachting"
                ]
              },
              "water polo": 5,
              "equestrian": {
                "score": 3,
                "aliases": [
                  "horse riding",
                  "dressage",
                  "show jumping"
                ]
              },
              "modern pentathlon": {
                "score": 0,
                "aliases": [
                  "pentathlon"
                ]
              },
              "sport climbing": {
                "score": 0,
                "aliases": [
                  "climbing",
                  "rock climbing"
                ]
              },
              "trampoline": {
                "score": 0,
                "aliases": [
                  "trampolining",
                  "trampoline gymnastics"
                ]
              },
              "handball": {
                "score": 0,
                "aliases": [
                  "team handball"
                ]
              },
              "shooting": {
                "score": 0,
                "aliases": [
                  "sport shooting"
                ]
              }
            }
          }
        ]
      },
      {
        "roundNumber": 2,
        "questions": [
          {
            "category": "The Periodic Table",
            "question": "Name an element on the periodic table",
            "answers": {
              "oxygen": 95,
              "hydrogen": 90,
              "gold": {
                "score": 82,
                "aliases": [
                  "au"
                ]
              },
              "carbon": 78,
              "iron": {
                "score": 72,
                "aliases": [
                  "fe"
                ]
              },
              "helium": 65,
              "nitrogen": 55,
              "silver": {
                "score": 48,
                "aliases": [
                  "ag"
                ]
              },
              "sodium": {
                "score": 40,
                "aliases": [
                  "na"
                ]
              },
              "calcium": 35,
              "uranium": 28,
              "lithium": 22,
              "neon": 18,
              "mercury": {
                "score": 15,
                "aliases": [
                  "hg",
                  "quicksilver"
                ]
              },
              "titanium": 12,
              "argon": 8,
              "tungsten": {
                "score": 5,
                "aliases": [
                  "wolfram"
                ]
              },
              "antimony": 2,
              "ytterbium": 0,
              "praseodymium": 0,
              "tellurium": 0,
              "gadolinium": 0,
              "hafnium": 0
            }
          },
          {
            "category": "Shakespeare Plays",
            "question": "Name a play written by William Shakespeare",
            "answers": {
              "romeo and juliet": {
                "score": 92,
                "aliases": [
                  "romeo & juliet",
                  "romeo juliet"
                ]
              },
              "hamlet": 78,
              "macbeth": 72,
              "a midsummer night's dream": {
                "score": 55,
                "aliases": [
                  "midsummer nights dream",
                  "midsummer night's dream"
                ]
              },
              "much ado about nothing": 40,
              "othello": 35,
              "the tempest": {
                "score": 28,
                "aliases": [
                  "tempest"
                ]
              },
              "julius caesar": 22,
              "king lear": 15,
              "twelfth night": 10,
              "the merchant of venice": {
                "score": 8,
                "aliases": [
                  "merchant of venice"
                ]
              },
              "the taming of the shrew": {
                "score": 5,
                "aliases": [
                  "taming of the shrew"
                ]
              },
              "titus andronicus": 0,
              "coriolanus": 0,
              "cymbeline": 0,
              "pericles": {
                "score": 0,
                "aliases": [
                  "pericles prince of tyre"
                ]
              },
              "timon of athens": 0
            }
          }
        ]
      },
      {
        "roundNumber": 3,
        "questions": [
          {
            "category": "Countries in Asia",
            "question": "Name a country in Asia",
            "answers": {
              "china": 95,
              "japan": 92,
              "india": 85,
              "thailand": 68,
              "south korea": {
                "score": 60,
                "aliases": [
                  "korea"
                ]
              },
              "indonesia": {
                "score": 52,
                "aliases": [
                  "indo"
                ]
              },
              "vietnam": 45,
              "singapore": 38,
              "malaysia": 32,
              "philippines": {
                "score": 25,
                "aliases": [
                  "the philippines"
                ]
              },
              "nepal": 18,
              "mongolia": 12,
              "cambodia": 10,
              "sri lanka": 8,
              "bangladesh": 5,
              "laos": 3,
              "bhutan": 0,
              "brunei": 0,
              "timor-leste": {
                "score": 0,
                "aliases": [
                  "east timor"
                ]
              },
              "turkmenistan": 0,
              "kyrgyzstan": 0,
              "tajikistan": 0
            }
          }
        ]
      }
    ],
    "final": {
      "category": "Bones in the Human Body",
      "question": "Name a bone in the human body",
      "answers": {
        "skull": {
          "score": 88,
          "aliases": [
            "cranium"
          ]
        },
        "ribs": {
          "score": 85,
          "aliases": [
            "rib",
            "rib cage",
            "ribcage"
          ]
        },
        "spine": {
          "score": 82,
          "aliases": [
            "vertebra",
            "vertebrae",
            "spinal column",
            "backbone"
          ]
        },
        "femur": {
          "score": 72,
          "aliases": [
            "thigh bone",
            "thighbone"
          ]
        },
        "pelvis": {
          "score": 55,
          "aliases": [
            "hip bone",
            "hip"
          ]
        },
        "humerus": 45,
        "tibia": {
          "score": 38,
          "aliases": [
            "shin bone",
            "shinbone"
          ]
        },
        "radius": 35,
        "fibula": 30,
        "clavicle": {
          "score": 25,
          "aliases": [
            "collarbone",
            "collar bone"
          ]
        },
        "patella": {
          "score": 20,
          "aliases": [
            "kneecap",
            "knee cap"
          ]
        },
        "scapula": {
          "score": 15,
          "aliases": [
            "shoulder blade"
          ]
        },
        "sternum": {
          "score": 12,
          "aliases": [
            "breastbone"
          ]
        },
        "ulna": 10,
        "phalanges": {
          "score": 8,
          "aliases": [
            "phalanx",
            "finger bones"
          ]
        },
        "coccyx": {
          "score": 5,
          "aliases": [
            "tailbone",
            "tail bone"
          ]
        },
        "metacarpal": {
          "score": 3,
          "aliases": [
            "metacarpals"
          ]
        },
        "hyoid": 0,
        "trapezoid": {
          "score": 0,
          "aliases": [
            "trapezoid bone"
          ]
        },
        "navicular": {
          "score": 0,
          "aliases": [
            "navicular bone"
          ]
        },
        "ethmoid": {
          "score": 0,
          "aliases": [
            "ethmoid bone"
          ]
        },
        "pisiform": 0,
        "calcaneus": {
          "score": 0,
          "aliases": [
            "heel bone"
          ]
        }
      }
    }
  },
  {
    "title": "CS Fundamentals Review",
    "rounds": [
      {
        "roundNumber": 1,
        "questions": [
          {
            "category": "Programming Languages",
            "question": "Name a programming language in the TIOBE top 20",
            "answers": {
              "python": {
                "score": 95,
                "aliases": [
                  "py"
                ]
              },
              "javascript": {
                "score": 88,
                "aliases": [
                  "js",
                  "ecmascript"
                ]
              },
              "java": 85,
              "c": 72,
              "c++": {
                "score": 70,
                "aliases": [
                  "cpp"
                ]
              },
              "c#": {
                "score": 65,
                "aliases": [
                  "csharp",
                  "c sharp"
                ]
              },
              "typescript": {
                "score": 45,
                "aliases": [
                  "ts"
                ]
              },
              "go": {
                "score": 30,
                "aliases": [
                  "golang"
                ]
              },
              "rust": 12,
              "fortran": 5,
              "scratch": 3,
              "zig": 0
            }
          },
          {
            "category": "HTTP Status Codes",
            "question": "Name a valid HTTP status code",
            "answers": {
              "200": {
                "score": 92,
                "aliases": [
                  "200 ok"
                ]
              },
              "201": 25,
              "204": 5,
              "301": {
                "score": 40,
                "aliases": [
                  "301 moved permanently"
                ]
              },
              "403": {
                "score": 35,
                "aliases": [
                  "403 forbidden"
                ]
              },
              "404": {
                "score": 90,
                "aliases": [
                  "404 not found"
                ]
              },
              "418": {
                "score": 8,
                "aliases": [
                  "418 im a teapot",
                  "teapot"
                ]
              },
              "451": {
                "score": 2,
                "aliases": [
                  "451 unavailable for legal reasons"
                ]
              },
              "500": {
                "score": 65,
                "aliases": [
                  "500 internal server error"
                ]
              },
              "507": 0
            }
          }
        ]
      },
      {
        "roundNumber": 2,
        "questions": [
          {
            "category": "Linux Terminal Commands",
            "question": "Name a common Linux terminal command",
            "answers": {
              "ls": 92,
              "cd": 90,
              "mkdir": 75,
              "rm": 70,
              "cp": 60,
              "grep": 45,
              "chmod": 35,
              "ssh": 30,
              "awk": 15,
              "tar": 12,
              "sed": 10,
              "tee": 3,
              "xargs": 0
            }
          },
          {
            "category": "Computer Science Pioneers",
            "question": "Name a famous person in the history of computing",
            "answers": {
              "alan turing": {
                "score": 85,
                "aliases": [
                  "turing"
                ]
              },
              "bill gates": {
                "score": 90,
                "aliases": [
                  "gates"
                ]
              },
              "steve jobs": {
                "score": 88,
                "aliases": [
                  "jobs"
                ]
              },
              "ada lovelace": {
                "score": 55,
                "aliases": [
                  "lovelace",
                  "ada"
                ]
              },
              "grace hopper": {
                "score": 40,
                "aliases": [
                  "hopper"
                ]
              },
              "linus torvalds": {
                "score": 30,
                "aliases": [
                  "torvalds",
                  "linus"
                ]
              },
              "tim berners-lee": {
                "score": 25,
                "aliases": [
                  "berners-lee",
                  "berners lee"
                ]
              },
              "dennis ritchie": {
                "score": 15,
                "aliases": [
                  "ritchie"
                ]
              },
              "margaret hamilton": {
                "score": 10,
                "aliases": [
                  "hamilton"
                ]
              },
              "konrad zuse": {
                "score": 3,
                "aliases": [
                  "zuse"
                ]
              },
              "hedy lamarr": {
                "score": 0,
                "aliases": [
                  "lamarr"
                ]
              }
            }
          }
        ]
      },
      {
        "roundNumber": 3,
        "questions": [
          {
            "category": "Database Systems",
            "question": "Name a database management system",
            "answers": {
              "mysql": {
                "score": 90,
                "aliases": [
                  "my sql"
                ]
              },
              "postgresql": {
                "score": 75,
                "aliases": [
                  "postgres",
                  "psql"
                ]
              },
              "mongodb": {
                "score": 70,
                "aliases": [
                  "mongo"
                ]
              },
              "sqlite": 55,
              "oracle": {
                "score": 50,
                "aliases": [
                  "oracle db"
                ]
              },
              "microsoft sql server": {
                "score": 40,
                "aliases": [
                  "sql server",
                  "mssql",
                  "ms sql"
                ]
              },
              "redis": 25,
              "elasticsearch": {
                "score": 15,
                "aliases": [
                  "elastic"
                ]
              },
              "cassandra": 8,
              "neo4j": 3,
              "cockroachdb": {
                "score": 0,
                "aliases": [
                  "cockroach"
                ]
              }
            }
          }
        ]
      }
    ],
    "final": {
      "category": "Sorting Algorithms",
      "question": "Name a sorting algorithm",
      "answers": {
        "bubble sort": {
          "score": 88,
          "aliases": [
            "bubblesort"
          ]
        },
        "quick sort": {
          "score": 70,
          "aliases": [
            "quicksort"
          ]
        },
        "merge sort": {
          "score": 65,
          "aliases": [
            "mergesort"
          ]
        },
        "insertion sort": {
          "score": 45,
          "aliases": [
            "insertionsort"
          ]
        },
        "selection sort": {
          "score": 40,
          "aliases": [
            "selectionsort"
          ]
        },
        "heap sort": {
          "score": 20,
          "aliases": [
            "heapsort"
          ]
        },
        "radix sort": {
          "score": 10,
          "aliases": [
            "radixsort"
          ]
        },
        "shell sort": {
          "score": 5,
          "aliases": [
            "shellsort"
          ]
        },
        "tim sort": {
          "score": 3,
          "aliases": [
            "timsort"
          ]
        },
        "bogosort": {
          "score": 0,
          "aliases": [
            "bogo sort",
            "monkey sort"
          ]
        }
      }
    }
  }
];
