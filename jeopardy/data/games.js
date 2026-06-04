// =====================================================
// JEOPARDY — GAME DATA
// =====================================================
//
// Add as many game sets as you like to GAME_SETS — you pick
// which one to play on the host setup screen.
//
// Board size is flexible:
//   - number of categories  = number of columns
//   - clues per category    = number of rows
//   So 5 categories x 5 clues gives a classic 5x5 board,
//   3 categories x 4 clues gives a 3x4 board, etc.
//
// "value" is optional on each clue. If you leave it out, the
// value is computed from the row: $100, $200, $300, ...
//
// Write answers in Jeopardy style ("What is ...?") or plain
// answers — whatever suits your class.
// =====================================================

const GAME_SETS = [
  {
    title: "General Trivia",
    categories: [
      {
        name: "World Capitals",
        clues: [
          { clue: "This city on the River Thames is the capital of England", answer: "What is London?" },
          { clue: "Australia's purpose-built capital, sitting between Sydney and Melbourne", answer: "What is Canberra?" },
          { clue: "This Japanese capital city was once known as Edo", answer: "What is Tokyo?" },
          { clue: "Ottawa is the capital of this large North American country", answer: "What is Canada?" },
          { clue: "This African country has THREE capitals, including Pretoria and Cape Town", answer: "What is South Africa?" },
        ],
      },
      {
        name: "Science & Nature",
        clues: [
          { clue: "H₂O is the chemical formula for this everyday substance", answer: "What is water?" },
          { clue: "This planet is known as the Red Planet", answer: "What is Mars?" },
          { clue: "It's the largest organ of the human body", answer: "What is the skin?" },
          { clue: "Described by Isaac Newton, this force keeps the planets in orbit", answer: "What is gravity?" },
          { clue: "Diamond and graphite are both forms of this chemical element", answer: "What is carbon?" },
        ],
      },
      {
        name: "Movies & TV",
        clues: [
          { clue: "This boy wizard attends Hogwarts School of Witchcraft and Wizardry", answer: "Who is Harry Potter?" },
          { clue: "“May the Force be with you” comes from this film saga", answer: "What is Star Wars?" },
          { clue: "This Pixar film follows a clownfish searching the ocean for his son", answer: "What is Finding Nemo?" },
          { clue: "Tony Stark is the alter ego of this Marvel superhero", answer: "Who is Iron Man?" },
          { clue: "This 1997 film about a doomed ocean liner won 11 Academy Awards", answer: "What is Titanic?" },
        ],
      },
      {
        name: "Sport",
        clues: [
          { clue: "The number of players per side on the field in a soccer match", answer: "What is 11?" },
          { clue: "This sport is played on grass courts at Wimbledon", answer: "What is tennis?" },
          { clue: "The Ashes is a famous cricket rivalry between Australia and this country", answer: "What is England?" },
          { clue: "This American swimmer has won more Olympic gold medals than anyone in history", answer: "Who is Michael Phelps?" },
          { clue: "In basketball, a successful shot from beyond the arc scores this many points", answer: "What is 3?" },
        ],
      },
      {
        name: "Food & Drink",
        clues: [
          { clue: "This Italian dish of dough, tomato sauce and cheese is baked in a very hot oven", answer: "What is pizza?" },
          { clue: "This dark yeast spread on toast divides Australians and tourists alike", answer: "What is Vegemite?" },
          { clue: "Sushi originated in this country", answer: "What is Japan?" },
          { clue: "Chocolate is made from the beans of this tree", answer: "What is the cacao (cocoa) tree?" },
          { clue: "Harvested from crocus flowers, it's the world's most expensive spice by weight", answer: "What is saffron?" },
        ],
      },
    ],
  },

  // A smaller 4x3 board — shows that any board size works.
  {
    title: "Quick Quiz",
    categories: [
      {
        name: "Aussie Geography",
        clues: [
          { clue: "This giant red monolith in the Northern Territory is also called Ayers Rock", answer: "What is Uluru?" },
          { clue: "Australia's longest river", answer: "What is the Murray?" },
          { clue: "Hobart is the capital city of this island state", answer: "What is Tasmania?" },
        ],
      },
      {
        name: "Maths",
        clues: [
          { clue: "The value of pi to two decimal places", answer: "What is 3.14?" },
          { clue: "A triangle with all three sides equal is called this", answer: "What is equilateral?" },
          { clue: "Seven squared", answer: "What is 49?" },
        ],
      },
      {
        name: "Music",
        clues: [
          { clue: "This Australian band sang “Down Under”", answer: "Who are Men at Work?" },
          { clue: "The number of strings on a standard guitar", answer: "What is 6?" },
          { clue: "This famous composer continued writing music after losing his hearing", answer: "Who is Beethoven?" },
        ],
      },
      {
        name: "Animals",
        clues: [
          { clue: "The largest animal ever to have lived on Earth", answer: "What is the blue whale?" },
          { clue: "This boxing marsupial carries its young in a pouch", answer: "What is the kangaroo?" },
          { clue: "A group of lions is called this", answer: "What is a pride?" },
        ],
      },
    ],
  },
];
