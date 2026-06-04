const QUESTIONS = [
  {
    question: "Name something you find in a classroom",
    answers: [
      { text: "Desks", points: 30 },
      { text: "Whiteboard", points: 25 },
      { text: "Books", points: 15 },
      { text: "Computer", points: 10 },
      { text: "Pencils", points: 8 },
      { text: "Clock", points: 7 },
      { text: "Teacher", points: 5 }
    ]
  },
  {
    question: "Name a subject students study in school",
    answers: [
      { text: "Math", points: 30 },
      { text: "English", points: 22 },
      { text: "Science", points: 18 },
      { text: "History", points: 12 },
      { text: "Art", points: 8 },
      { text: "Phys Ed", points: 6 },
      { text: "Music", points: 4 }
    ]
  },
  {
    question: "Name something students bring to school",
    answers: [
      { text: "Backpack", points: 28 },
      { text: "Lunch", points: 22 },
      { text: "Books", points: 16 },
      { text: "Pencils / Pens", points: 14 },
      { text: "Laptop / Tablet", points: 10 },
      { text: "Water Bottle", points: 6 },
      { text: "Homework", points: 4 }
    ]
  },
  {
    question: "Name a popular school lunch food",
    answers: [
      { text: "Pizza", points: 32 },
      { text: "Chicken Nuggets", points: 20 },
      { text: "Hamburger", points: 15 },
      { text: "Mac & Cheese", points: 12 },
      { text: "Sandwich", points: 10 },
      { text: "Tacos", points: 7 },
      { text: "Salad", points: 4 }
    ]
  },
  {
    question: "Name something a teacher might say",
    answers: [
      { text: "Pay Attention", points: 25 },
      { text: "Open Your Books", points: 18 },
      { text: "Quiet Down", points: 16 },
      { text: "Any Questions?", points: 14 },
      { text: "Good Job!", points: 12 },
      { text: "Turn In Homework", points: 10 },
      { text: "No Phones!", points: 5 }
    ]
  },
  {
    question: "Name a reason a student might be late to class",
    answers: [
      { text: "Overslept", points: 30 },
      { text: "Traffic", points: 20 },
      { text: "Lost Something", points: 15 },
      { text: "At Their Locker", points: 12 },
      { text: "Bathroom", points: 10 },
      { text: "Talking to Friends", points: 8 },
      { text: "Forgot Something", points: 5 }
    ]
  },
  {
    question: "Name something found on a teacher's desk",
    answers: [
      { text: "Papers", points: 25 },
      { text: "Computer", points: 20 },
      { text: "Coffee Mug", points: 18 },
      { text: "Pens / Pencils", points: 14 },
      { text: "Stapler", points: 10 },
      { text: "Books", points: 8 },
      { text: "Phone", points: 5 }
    ]
  },
  {
    question: "Name a famous scientist",
    answers: [
      { text: "Einstein", points: 35 },
      { text: "Newton", points: 20 },
      { text: "Marie Curie", points: 15 },
      { text: "Darwin", points: 10 },
      { text: "Tesla", points: 8 },
      { text: "Galileo", points: 7 },
      { text: "Hawking", points: 5 }
    ]
  },
  {
    question: "Name a planet in our solar system",
    answers: [
      { text: "Jupiter", points: 20 },
      { text: "Mars", points: 18 },
      { text: "Saturn", points: 16 },
      { text: "Earth", points: 14 },
      { text: "Venus", points: 12 },
      { text: "Mercury", points: 8 },
      { text: "Neptune", points: 7 },
      { text: "Uranus", points: 5 }
    ]
  },
  {
    question: "Name something found in a library",
    answers: [
      { text: "Books", points: 35 },
      { text: "Computers", points: 18 },
      { text: "Librarian", points: 14 },
      { text: "Tables / Chairs", points: 12 },
      { text: "Magazines", points: 8 },
      { text: "Silence", points: 8 },
      { text: "Bookshelves", points: 5 }
    ]
  },
  {
    question: "Name a school supply",
    answers: [
      { text: "Pencil", points: 28 },
      { text: "Notebook", points: 22 },
      { text: "Eraser", points: 14 },
      { text: "Ruler", points: 12 },
      { text: "Scissors", points: 10 },
      { text: "Glue", points: 8 },
      { text: "Markers", points: 6 }
    ]
  },
  {
    question: "Name something students look forward to at school",
    answers: [
      { text: "Lunch / Recess", points: 30 },
      { text: "Seeing Friends", points: 22 },
      { text: "Weekends", points: 16 },
      { text: "Field Trips", points: 12 },
      { text: "Sports / Games", points: 10 },
      { text: "Summer Break", points: 7 },
      { text: "Art Class", points: 3 }
    ]
  },
  {
    question: "Name a type of weather",
    answers: [
      { text: "Sunny", points: 28 },
      { text: "Rainy", points: 24 },
      { text: "Snowy", points: 18 },
      { text: "Windy", points: 12 },
      { text: "Cloudy", points: 8 },
      { text: "Stormy", points: 6 },
      { text: "Foggy", points: 4 }
    ]
  },
  {
    question: "Name a popular pet",
    answers: [
      { text: "Dog", points: 35 },
      { text: "Cat", points: 25 },
      { text: "Fish", points: 14 },
      { text: "Hamster", points: 10 },
      { text: "Bird", points: 8 },
      { text: "Rabbit", points: 5 },
      { text: "Turtle", points: 3 }
    ]
  },
  {
    question: "Name something found in a gym",
    answers: [
      { text: "Basketballs", points: 25 },
      { text: "Bleachers", points: 18 },
      { text: "Mats", points: 16 },
      { text: "Jump Ropes", points: 14 },
      { text: "Cones", points: 10 },
      { text: "Whistle", points: 9 },
      { text: "Scoreboard", points: 8 }
    ]
  },
  {
    question: "Name a fruit",
    answers: [
      { text: "Apple", points: 28 },
      { text: "Banana", points: 22 },
      { text: "Orange", points: 16 },
      { text: "Strawberry", points: 12 },
      { text: "Grapes", points: 10 },
      { text: "Watermelon", points: 8 },
      { text: "Mango", points: 4 }
    ]
  },
  {
    question: "Name a color in the rainbow",
    answers: [
      { text: "Red", points: 22 },
      { text: "Blue", points: 20 },
      { text: "Green", points: 16 },
      { text: "Yellow", points: 14 },
      { text: "Orange", points: 12 },
      { text: "Purple", points: 10 },
      { text: "Indigo", points: 6 }
    ]
  },
  {
    question: "Name something that uses batteries",
    answers: [
      { text: "Remote Control", points: 25 },
      { text: "Flashlight", points: 20 },
      { text: "Phone", points: 16 },
      { text: "Toy", points: 14 },
      { text: "Game Controller", points: 10 },
      { text: "Clock", points: 8 },
      { text: "Smoke Detector", points: 7 }
    ]
  },
  {
    question: "Name a type of transportation",
    answers: [
      { text: "Car", points: 30 },
      { text: "Bus", points: 22 },
      { text: "Airplane", points: 16 },
      { text: "Train", points: 12 },
      { text: "Bicycle", points: 8 },
      { text: "Boat", points: 7 },
      { text: "Subway", points: 5 }
    ]
  },
  {
    question: "Name something you do before school in the morning",
    answers: [
      { text: "Brush Teeth", points: 24 },
      { text: "Eat Breakfast", points: 22 },
      { text: "Get Dressed", points: 18 },
      { text: "Shower", points: 14 },
      { text: "Pack Backpack", points: 10 },
      { text: "Set Alarm", points: 7 },
      { text: "Check Phone", points: 5 }
    ]
  }
];
