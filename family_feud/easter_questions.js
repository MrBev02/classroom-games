const QUESTIONS = [
  {
    question: "Name something you'd find at an Easter egg hunt",
    answers: [
      { text: "Chocolate Eggs", points: 32 },
      { text: "Baskets / Buckets", points: 20 },
      { text: "Clue Cards", points: 15 },
      { text: "Excited Kids", points: 12 },
      { text: "Foil Wrappers", points: 9 },
      { text: "Easter Bunny", points: 7 },
      { text: "Arguments", points: 5 }
    ]
  },
  {
    question: "Name a popular Easter treat in Australia",
    answers: [
      { text: "Hot Cross Buns", points: 30 },
      { text: "Chocolate Eggs", points: 25 },
      { text: "Easter Bilby", points: 14 },
      { text: "Cadbury Creme Egg", points: 12 },
      { text: "Darrell Lea Bunny", points: 8 },
      { text: "Simnel Cake", points: 6 },
      { text: "Tim Tams", points: 5 }
    ]
  },
  {
    question: "Name something Aussie families do over the Easter long weekend",
    answers: [
      { text: "Go Camping", points: 25 },
      { text: "BBQ", points: 20 },
      { text: "Visit Family", points: 18 },
      { text: "Go to the Beach", points: 14 },
      { text: "Watch Footy", points: 10 },
      { text: "Road Trip", points: 8 },
      { text: "Easter Egg Hunt", points: 5 }
    ]
  },
  {
    question: "Name an animal associated with Easter in Australia",
    answers: [
      { text: "Bunny / Rabbit", points: 32 },
      { text: "Bilby", points: 25 },
      { text: "Chick / Chicken", points: 16 },
      { text: "Lamb", points: 10 },
      { text: "Duck", points: 7 },
      { text: "Echidna", points: 6 },
      { text: "Platypus", points: 4 }
    ]
  },
  {
    question: "Name a place Aussies travel to over Easter",
    answers: [
      { text: "Gold Coast", points: 22 },
      { text: "Bali", points: 18 },
      { text: "Byron Bay", points: 16 },
      { text: "Grandparents' House", points: 14 },
      { text: "Caravan Park", points: 12 },
      { text: "Sydney", points: 10 },
      { text: "South Coast", points: 8 }
    ]
  },
  {
    question: "Name something you'd find at an Easter BBQ",
    answers: [
      { text: "Snags / Sausages", points: 28 },
      { text: "Steak", points: 18 },
      { text: "Onions", points: 14 },
      { text: "Salad", points: 12 },
      { text: "Bread Rolls", points: 10 },
      { text: "Esky Full of Drinks", points: 9 },
      { text: "Flies", points: 8 }
    ]
  },
  {
    question: "Name something kids do with their Easter eggs before eating them",
    answers: [
      { text: "Count Them", points: 25 },
      { text: "Sort by Size", points: 20 },
      { text: "Line Them Up", points: 16 },
      { text: "Trade with Siblings", points: 14 },
      { text: "Hide the Best Ones", points: 10 },
      { text: "Shake Them", points: 8 },
      { text: "Smell Them", points: 7 }
    ]
  },
  {
    question: "Name a popular hot cross bun flavour",
    answers: [
      { text: "Traditional Fruit", points: 30 },
      { text: "Chocolate", points: 25 },
      { text: "Apple & Cinnamon", points: 15 },
      { text: "Mocha / Coffee", points: 10 },
      { text: "Brioche", points: 8 },
      { text: "Banana", points: 7 },
      { text: "Cheesy Vegemite", points: 5 }
    ]
  },
  {
    question: "Name something that goes wrong at a backyard Easter egg hunt",
    answers: [
      { text: "Someone Finds Too Many", points: 25 },
      { text: "Chocolate Melts", points: 22 },
      { text: "Eggs Get Lost / Forgotten", points: 18 },
      { text: "Someone Cries", points: 14 },
      { text: "Dog Eats the Eggs", points: 10 },
      { text: "Ants Get to Them", points: 7 },
      { text: "It Rains", points: 4 }
    ]
  },
  {
    question: "Name a movie families might watch over the Easter break",
    answers: [
      { text: "Hop", points: 22 },
      { text: "Peter Rabbit", points: 20 },
      { text: "Charlie and the Chocolate Factory", points: 16 },
      { text: "Willy Wonka", points: 14 },
      { text: "Shrek", points: 10 },
      { text: "Babe", points: 8 },
      { text: "The Ten Commandments", points: 5 }
    ]
  },
  {
    question: "Name something you'd find at the Royal Easter Show",
    answers: [
      { text: "Show Bags", points: 28 },
      { text: "Farm Animals", points: 20 },
      { text: "Rides", points: 18 },
      { text: "Fairy Floss", points: 12 },
      { text: "Crowds", points: 8 },
      { text: "Woodchop Competitions", points: 7 },
      { text: "Dagwood Dogs", points: 7 }
    ]
  },
  {
    question: "Name a place you'd hide an Easter egg in the backyard",
    answers: [
      { text: "Behind a Plant / Bush", points: 28 },
      { text: "Under the Trampoline", points: 20 },
      { text: "In a Tree", points: 16 },
      { text: "In the Letterbox", points: 12 },
      { text: "Under the Outdoor Table", points: 10 },
      { text: "Inside a Shoe", points: 8 },
      { text: "In the Veggie Patch", points: 6 }
    ]
  },
  {
    question: "Name a chocolate brand you'd see at Easter in Australia",
    answers: [
      { text: "Cadbury", points: 35 },
      { text: "Lindt", points: 22 },
      { text: "Darrell Lea", points: 15 },
      { text: "Kinder", points: 10 },
      { text: "Haigh's", points: 8 },
      { text: "Ferrero Rocher", points: 6 },
      { text: "Aldi Brand", points: 4 }
    ]
  },
  {
    question: "Name something kids complain about during the Easter holidays",
    answers: [
      { text: "Being Bored", points: 28 },
      { text: "Not Enough Chocolate", points: 18 },
      { text: "Long Car Trips", points: 16 },
      { text: "No Wi-Fi / Signal", points: 14 },
      { text: "Sibling Got More Eggs", points: 10 },
      { text: "Too Cold / Rainy", points: 8 },
      { text: "Having to Visit Relatives", points: 6 }
    ]
  },
  {
    question: "Name something adults sneak from the kids' Easter stash",
    answers: [
      { text: "Lindt Bunny", points: 28 },
      { text: "Cadbury Creme Egg", points: 20 },
      { text: "Mini Eggs", points: 16 },
      { text: "Freddo Frog", points: 14 },
      { text: "Caramello Koala", points: 10 },
      { text: "Malteser Bunny", points: 7 },
      { text: "Hot Cross Buns", points: 5 }
    ]
  },
  {
    question: "Name a reason the Easter long weekend is the best",
    answers: [
      { text: "Four Days Off", points: 30 },
      { text: "Chocolate", points: 22 },
      { text: "Family Time", points: 16 },
      { text: "No School / Work", points: 12 },
      { text: "Autumn Weather", points: 8 },
      { text: "Camping / Holidays", points: 7 },
      { text: "Hot Cross Buns", points: 5 }
    ]
  },
  {
    question: "Name something you'd pack for an Easter camping trip",
    answers: [
      { text: "Tent / Swag", points: 25 },
      { text: "Esky", points: 20 },
      { text: "Sleeping Bag", points: 16 },
      { text: "Camp Chairs", points: 12 },
      { text: "Snags for the BBQ", points: 10 },
      { text: "Insect Repellent", points: 9 },
      { text: "Torch / Lantern", points: 8 }
    ]
  },
  {
    question: "Name something on TV over the Easter weekend in Australia",
    answers: [
      { text: "AFL Football", points: 28 },
      { text: "NRL Football", points: 22 },
      { text: "Movies", points: 16 },
      { text: "Cricket", points: 12 },
      { text: "Kids' Specials", points: 8 },
      { text: "Cooking Shows", points: 7 },
      { text: "News", points: 7 }
    ]
  },
  {
    question: "Name something that's closed on Good Friday in Australia",
    answers: [
      { text: "Shops / Shopping Centres", points: 30 },
      { text: "Schools", points: 20 },
      { text: "Pubs / Bars", points: 16 },
      { text: "Banks", points: 12 },
      { text: "Offices", points: 8 },
      { text: "Petrol Stations", points: 7 },
      { text: "Cafés", points: 7 }
    ]
  },
  {
    question: "Name a type of egg that isn't chocolate",
    answers: [
      { text: "Chicken / Hen Egg", points: 30 },
      { text: "Painted / Decorated Egg", points: 20 },
      { text: "Plastic Egg", points: 16 },
      { text: "Scotch Egg", points: 12 },
      { text: "Dinosaur Egg", points: 8 },
      { text: "Emu Egg", points: 7 },
      { text: "Kinder Surprise", points: 7 }
    ]
  }
];
