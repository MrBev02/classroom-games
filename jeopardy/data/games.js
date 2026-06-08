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

  // =====================================================
  // ENTERPRISE COMPUTING (Year 11) — Interactive Media &
  // the User Experience. Five 5x5 boards, each category and
  // clue mapped to the course syllabus dotpoints (not slide
  // trivia). Rows run easiest (top) to hardest (bottom).
  // =====================================================

  {
    title: "EC — Interactive Media Foundations",
    categories: [
      {
        name: "Interactive Media & UX",
        clues: [
          { clue: "Media that lets users actively take part and engage, rather than just passively watch or read", answer: "What is interactive media?" },
          { clue: "Abbreviated UX, this is the overall experience a person has when using a product, system or service", answer: "What is the user experience?" },
          { clue: "Interactive media and UX are used to communicate this to an audience", answer: "What is information?" },
          { clue: "This word means 'present everywhere' and describes how interactive media is now found on almost every device", answer: "What is ubiquity?" },
          { clue: "Beyond being useful and easy to use, good UX also means a product does the job without wasted effort — that is, it is this", answer: "What is efficient?" },
        ],
      },
      {
        name: "Evolution of Interactive Media",
        clues: [
          { clue: "These regularly-updated, post-based personal websites let ordinary people become online publishers", answer: "What are blogs?" },
          { clue: "YouTube and TikTok made this form of interactive media extremely widespread", answer: "What is online video?" },
          { clue: "The digital, internet-era successor to analog AM/FM broadcasting", answer: "What is digital radio?" },
          { clue: "Web 1.0 was 'read only'; this later era added user-generated content and two-way interaction", answer: "What is Web 2.0?" },
          { clue: "Researching how interactive media has changed over time is studying its ___", answer: "What is the evolution (of interactive media)?" },
        ],
      },
      {
        name: "File Formats",
        clues: [
          { clue: "The common lossy format used for photographs on the web", answer: "What is JPEG?" },
          { clue: "This format suits logos and icons because it keeps sharp edges and supports transparency", answer: "What is PNG?" },
          { clue: "Choosing JPEG, PNG or MP4 for a task means selecting an appropriate one of these", answer: "What is a file format?" },
          { clue: "Unlike pixel-based raster images, this image type uses maths so it scales to any size without losing quality", answer: "What is a vector (SVG)?" },
          { clue: "A short movie clip would be saved in this category of format rather than an image format", answer: "What is a video format?" },
        ],
      },
      {
        name: "Data Compression",
        clues: [
          { clue: "Reducing the size of a file is called this", answer: "What is compression?" },
          { clue: "Compression that reduces file size with no loss of quality at all", answer: "What is lossless compression?" },
          { clue: "Compression that throws away some detail you're unlikely to notice to make files much smaller", answer: "What is lossy compression?" },
          { clue: "JPEG photos and MP3 music are everyday examples of this type of compression", answer: "What is lossy compression?" },
          { clue: "Smaller, compressed files load faster and use less of this when sent over the internet", answer: "What is bandwidth (data)?" },
        ],
      },
      {
        name: "Hardware & Performance",
        clues: [
          { clue: "Checking whether a device is powerful enough for a project means evaluating its performance ___", answer: "What are requirements?" },
          { clue: "Video editing and 3D graphics rely heavily on this chip, abbreviated GPU", answer: "What is the graphics processing unit?" },
          { clue: "This temporary working memory must be large enough to run big media projects smoothly", answer: "What is RAM?" },
          { clue: "A VR headset needs more powerful hardware than a blog because VR is far more this", answer: "What is demanding (processing-intensive)?" },
          { clue: "Smooth video and animation depend on a high enough one of these, measured in fps", answer: "What is the frame rate?" },
        ],
      },
    ],
  },

  {
    title: "EC — UX & Interface Design",
    categories: [
      {
        name: "UI Impacts UX",
        clues: [
          { clue: "The buttons, menus, icons and screens a user actually sees and taps, abbreviated UI", answer: "What is the user interface?" },
          { clue: "The UI's main job is to shape this — how the whole product feels to use", answer: "What is the user experience?" },
          { clue: "A clear, simple, consistent UI gives the user this kind of experience", answer: "What is a good (positive) experience?" },
          { clue: "A cluttered layout with hidden buttons produces this kind of UX", answer: "What is a poor (bad) experience?" },
          { clue: "Keeping colours, fonts and buttons the same across every screen is this UI principle", answer: "What is consistency?" },
        ],
      },
      {
        name: "Designing an Engaging UI",
        clues: [
          { clue: "A rough sketch of a screen's layout, drawn before anything is built", answer: "What is a wireframe?" },
          { clue: "An early, testable version of a product", answer: "What is a prototype?" },
          { clue: "Free design tools like Figma are used to build these clickable previews", answer: "What are prototypes (mockups)?" },
          { clue: "Designing around the needs of the people who'll actually use it is 'user-___ design'", answer: "What is centred?" },
          { clue: "Fonts, colour, spacing and layout are all part of a UI's visual ___", answer: "What is design?" },
        ],
      },
      {
        name: "Design Thinking",
        clues: [
          { clue: "Design thinking begins by understanding the needs of these people", answer: "What are the users?" },
          { clue: "The first stage of design thinking, getting to know the user", answer: "What is Empathise?" },
          { clue: "Empathise, Define, Ideate, Prototype and ___ are the five stages", answer: "What is Test?" },
          { clue: "The Ideate stage is all about generating lots of these", answer: "What are ideas?" },
          { clue: "Trying your prototype with real users to find problems is which stage", answer: "What is Test?" },
        ],
      },
      {
        name: "Accessibility",
        clues: [
          { clue: "Designing so that people with disability can use a product is called this", answer: "What is accessibility?" },
          { clue: "Interactive media can give people with disability new chances to explore and ___ in their environment", answer: "What is participate?" },
          { clue: "This assistive technology reads on-screen text aloud for users who are blind", answer: "What is a screen reader?" },
          { clue: "Captions make video content accessible to people who are this", answer: "What is deaf (or hard of hearing)?" },
          { clue: "Strong contrast between text and its background mainly helps users with this kind of impairment", answer: "What is visual (impairment)?" },
        ],
      },
      {
        name: "Project Management",
        clues: [
          { clue: "Planning, organising and tracking the work to build a system is project ___", answer: "What is management?" },
          { clue: "This approach finishes each stage fully before the next begins, like steps in a row", answer: "What is waterfall?" },
          { clue: "This flexible approach works in short, repeated cycles and welcomes change along the way", answer: "What is agile?" },
          { clue: "Agile teams do their work in short cycles called these", answer: "What are sprints?" },
          { clue: "Picking waterfall or agile for a project means choosing a project management ___", answer: "What is approach?" },
        ],
      },
    ],
  },

  {
    title: "EC — Ethics, Identity & Society",
    categories: [
      {
        name: "Social, Ethical & Legal",
        clues: [
          { clue: "The three lenses used to examine issues in interactive media: social, ethical and ___", answer: "What is legal?" },
          { clue: "An action can be perfectly legal yet still be this if people consider it wrong", answer: "What is unethical?" },
          { clue: "Considering how a system affects people and communities is looking at its ___ impact", answer: "What is social?" },
          { clue: "Breaking a law, such as misusing personal data, makes an action this", answer: "What is illegal?" },
          { clue: "Rules set by government that you must follow are these; values about right and wrong are ethics", answer: "What are laws?" },
        ],
      },
      {
        name: "Privacy & Data",
        clues: [
          { clue: "Keeping personal information safe and not misusing it protects a user's ___", answer: "What is privacy?" },
          { clue: "Australian law governing how organisations handle your personal information", answer: "What is the Privacy Act?" },
          { clue: "Your name, address, photos and date of birth are all examples of this kind of information", answer: "What is personal information?" },
          { clue: "Settings that let you choose who can see your information are these", answer: "What are privacy settings?" },
          { clue: "Collecting far more user data than a service actually needs raises this kind of concern", answer: "What is a privacy concern?" },
        ],
      },
      {
        name: "Marketing & Influence",
        clues: [
          { clue: "These windows promoting online shopping interrupt you while you browse", answer: "What are pop-ups?" },
          { clue: "Gently steering users toward a choice while they feel it was their own (also called guided choice)", answer: "What is nudging?" },
          { clue: "Small files that remember you and your settings, often via a consent banner", answer: "What are cookies?" },
          { clue: "This feature auto-fills your saved details, removing the pause before you buy", answer: "What is autofill?" },
          { clue: "A pre-ticked option you have to actively change is this kind of setting", answer: "What is a default setting?" },
        ],
      },
      {
        name: "Digital Identities",
        clues: [
          { clue: "Your online profile representing who you are across platforms", answer: "What is a personal e-profile?" },
          { clue: "A username or email points to you but isn't the real you; it is an ___, not your identity", answer: "What is an identifier?" },
          { clue: "Building a picture of someone from their data and behaviour is called this", answer: "What is profiling?" },
          { clue: "When a platform builds that picture automatically, without you actively handing over the data", answer: "What is auto-profiling?" },
          { clue: "Everything you post adds to this lasting trail you leave behind online", answer: "What is a digital footprint?" },
        ],
      },
      {
        name: "IP & ICIP",
        clues: [
          { clue: "Legal rights over creations of the mind — images, music, writing and code", answer: "What is intellectual property?" },
          { clue: "This four-letter acronym stands for Indigenous Cultural and Intellectual Property", answer: "What is ICIP?" },
          { clue: "Unlike individually-owned IP, ICIP is owned by a community in this way", answer: "What is collectively?" },
          { clue: "This licensing system lets creators share work while keeping copyright and setting the conditions for reuse", answer: "What is Creative Commons?" },
          { clue: "Giving credit to the original creator when you reuse their work is called this", answer: "What is attribution?" },
        ],
      },
    ],
  },

  {
    title: "EC — Media in Enterprises",
    categories: [
      {
        name: "Training & Learning",
        clues: [
          { clue: "Pilots and surgeons train safely using this realistic imitation of a real situation", answer: "What is simulation?" },
          { clue: "Adding points, badges, streaks and levels to motivate learning is called this", answer: "What is gamification?" },
          { clue: "Overlaying digital information onto the real world through a phone or glasses, abbreviated AR", answer: "What is augmented reality?" },
          { clue: "A language app using XP, streaks and leagues to keep you learning is an example of this technique", answer: "What is gamification?" },
          { clue: "Simulation, gamification and AR are described as supporting online training and this", answer: "What is learning?" },
        ],
      },
      {
        name: "Entertainment",
        clues: [
          { clue: "Watching shows delivered over the internet without downloading them first", answer: "What is streaming?" },
          { clue: "A fully immersive, computer-generated world you enter with a headset, abbreviated VR", answer: "What is virtual reality?" },
          { clue: "Netflix and Spotify mainly improved people's access to this", answer: "What is entertainment?" },
          { clue: "This massive interactive entertainment industry spans console, PC and mobile titles", answer: "What is gaming?" },
          { clue: "Streaming, gaming and VR are praised for improving ___ to entertainment", answer: "What is access?" },
        ],
      },
      {
        name: "Specialist Apps",
        clues: [
          { clue: "An app that shows your parcel's live journey supports delivery ___", answer: "What is tracking?" },
          { clue: "Targeted promotions shown inside apps and websites are a form of digital ___", answer: "What is advertising?" },
          { clue: "Messaging and video-call apps mainly support this between people", answer: "What is communication?" },
          { clue: "An app built for one specific job, like parcel tracking, is this kind of app", answer: "What is a specialist app?" },
          { clue: "Specialist apps are said to support delivery tracking, advertising and this", answer: "What is communication?" },
        ],
      },
      {
        name: "Creative Processes",
        clues: [
          { clue: "Open-ended games like Minecraft, where players build freely, are this type of game", answer: "What is sandbox gaming?" },
          { clue: "Platforms like Instagram and TikTok support people's creativity as this kind of media", answer: "What is social media?" },
          { clue: "Making and sharing your own levels, mods or posts is called user-generated ___", answer: "What is content?" },
          { clue: "Sandbox gaming, social media and Creative Commons all support these processes", answer: "What are creative processes?" },
          { clue: "Creative Commons lets others legally reuse and ___ a creator's work under set conditions", answer: "What is remix (adapt / share)?" },
        ],
      },
      {
        name: "Connecting People",
        clues: [
          { clue: "Gathering ideas, data or contributions from a large online crowd", answer: "What is crowdsourcing?" },
          { clue: "Free online courses that let huge numbers learn at once, abbreviated MOOC", answer: "What is a massive open online course?" },
          { clue: "Online games where thousands play together in one shared world, abbreviated MMOG", answer: "What is a massively multiplayer online game?" },
          { clue: "Social media applications are mainly designed to encourage these between people", answer: "What are (human) connections?" },
          { clue: "Wikipedia and live traffic apps that improve from many users' input rely on this", answer: "What is crowdsourcing?" },
        ],
      },
    ],
  },

  {
    title: "EC — Data, Software & Interaction",
    categories: [
      {
        name: "Data Journalism",
        clues: [
          { clue: "Telling news stories using data, charts and interaction is called data ___", answer: "What is journalism?" },
          { clue: "A published data-journalism piece lets readers do this with the data, not just read about it", answer: "What is explore (interact with) it?" },
          { clue: "Turning a dataset into a chart, graph or map creates a data ___", answer: "What is visualisation?" },
          { clue: "Stating where your numbers came from gives a data story credibility through this", answer: "What is citing the source (attribution)?" },
          { clue: "A strong data story needs real data, a clear story and this element that lets readers take part", answer: "What is interaction?" },
        ],
      },
      {
        name: "Working with Data",
        clues: [
          { clue: "A structured collection of related information, often arranged in rows and columns", answer: "What is a dataset?" },
          { clue: "Public information that governments release for free reuse is called ___ data", answer: "What is open data?" },
          { clue: "Checking that data is accurate, complete and trustworthy concerns its ___", answer: "What is data quality?" },
          { clue: "Removing errors and duplicates from a dataset before using it is data ___", answer: "What is cleaning?" },
          { clue: "Choosing a chart that does not mislead the reader is part of responsible data ___", answer: "What is visualisation?" },
        ],
      },
      {
        name: "User Interaction Features",
        clues: [
          { clue: "Online shops let you narrow products by price, brand or size using these", answer: "What are filters?" },
          { clue: "Typing keywords to find a product uses this feature", answer: "What is search?" },
          { clue: "Reordering results from cheapest to dearest uses this feature", answer: "What is sort (sorting)?" },
          { clue: "Liking, commenting and sharing are communication processes carried out via ___", answer: "What is social media?" },
          { clue: "Search, sort and selection are interaction features especially central to these services", answer: "What is online retail (online shopping)?" },
        ],
      },
      {
        name: "Software & Assets",
        clues: [
          { clue: "Turning a physical photo, document or sound into a digital file", answer: "What is digitising?" },
          { clue: "Photos, audio, video and graphics used in a project are collectively called these", answer: "What are (media) assets?" },
          { clue: "Programs like Figma, Photoshop or Audacity used to create media elements are this", answer: "What is software?" },
          { clue: "A scanner or microphone is the kind of ___ used to digitise assets", answer: "What is hardware?" },
          { clue: "Trimming a sound clip or resizing an image so it suits your project is ___ the asset", answer: "What is editing (processing)?" },
        ],
      },
      {
        name: "Human Behaviour Online",
        clues: [
          { clue: "Interactive media is studied for how it influences human ___", answer: "What is behaviour?" },
          { clue: "Endless feeds and autoplay are designed to maximise this — the time and attention you give an app", answer: "What is engagement?" },
          { clue: "A notification buzzing to pull you back into an app is a designed prompt, also called a ___", answer: "What is a nudge (trigger)?" },
          { clue: "Interactive media can give people with disability new opportunities to explore and ___ in their environment", answer: "What is participate?" },
          { clue: "Playing for hours because a game is designed to be hard to stop shows media shaping our ___", answer: "What is behaviour (habits)?" },
        ],
      },
    ],
  },
];
