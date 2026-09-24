export const categories = ['achievement', 'autonomy', 'creativity', 'risk', 'locus'] as const;
export type Category = (typeof categories)[number];
export type Question = { id: number; category: Category; english: string; greek: string };

export const categoryIds: Record<Category, readonly number[]> = {
  achievement: [1, 10, 19, 28, 37, 46, 6, 15, 24, 33, 42, 51],
  autonomy: [3, 12, 21, 30, 39, 48],
  creativity: [5, 14, 23, 32, 41, 50, 8, 17, 26, 35, 44, 53],
  risk: [2, 11, 20, 29, 38, 47, 9, 18, 27, 36, 45, 54],
  locus: [4, 13, 22, 31, 40, 49, 7, 16, 25, 34, 43, 52],
};

// Fixed source wording supplied by the application owner. IDs are scoring keys,
// never display positions. Keep both languages paired within each item.
export const questions: Question[] = [
  {
    id: 1,
    category: "achievement",
    english: "I would not mind routine unchallenging work if the pay and pension prospects were good.",
    greek: "Δεν θα με πείραζε μια δουλειά ρουτίνας χωρίς προκλήσεις, αν οι αποδοχές και οι προοπτικές συνταξιοδότησης ήταν καλές.",
  },
  {
    id: 2,
    category: "risk",
    english: "I like to test boundaries and get into areas where few have worked before.",
    greek: "Μου αρέσει να δοκιμάζω τα όρια και να μπαίνω σε τομείς όπου λίγοι έχουν δραστηριοποιηθεί στο παρελθόν.",
  },
  {
    id: 3,
    category: "autonomy",
    english: "I tend not to like to stand out or be unconventional.",
    greek: "Συνήθως δεν μου αρέσει να ξεχωρίζω ή να λειτουργώ αντισυμβατικά.",
  },
  {
    id: 4,
    category: "locus",
    english: "Capable people who fail to become successful have not usually taken chances when they have occurred.",
    greek: "Οι ικανοί άνθρωποι που δεν καταφέρνουν να πετύχουν συνήθως δεν αξιοποίησαν τις ευκαιρίες όταν παρουσιάστηκαν.",
  },
  {
    id: 5,
    category: "creativity",
    english: "I rarely day dream.",
    greek: "Σπάνια ονειροπολώ.",
  },
  {
    id: 6,
    category: "achievement",
    english: "I find it difficult to switch off from work completely.",
    greek: "Δυσκολεύομαι να αποσυνδεθώ εντελώς από τη δουλειά.",
  },
  {
    id: 7,
    category: "locus",
    english: "You are either naturally good at something or you are not, effort makes no difference.",
    greek: "Είτε είναι κανείς από τη φύση του καλός σε κάτι είτε όχι· η προσπάθεια δεν κάνει καμία διαφορά.",
  },
  {
    id: 8,
    category: "creativity",
    english: "Sometimes people find my ideas unusual.",
    greek: "Μερικές φορές οι άλλοι βρίσκουν τις ιδέες μου ασυνήθιστες.",
  },
  {
    id: 9,
    category: "risk",
    english: "I would rather buy a lottery ticket than enter a competition.",
    greek: "Θα προτιμούσα να αγοράσω ένα λαχείο παρά να συμμετάσχω σε έναν διαγωνισμό.",
  },
  {
    id: 10,
    category: "achievement",
    english: "I like challenges that stretch my abilities and get bored with things I can do quite easily.",
    greek: "Μου αρέσουν οι προκλήσεις που δοκιμάζουν τα όρια των ικανοτήτων μου και βαριέμαι πράγματα που μπορώ να κάνω αρκετά εύκολα.",
  },
  {
    id: 11,
    category: "risk",
    english: "I would prefer to have a moderate income in a secure job rather than a high income in a job that depended on my performance.",
    greek: "Θα προτιμούσα ένα μέτριο εισόδημα σε μια σταθερή θέση εργασίας παρά ένα υψηλό εισόδημα σε μια δουλειά που θα εξαρτιόταν από την απόδοσή μου.",
  },
  {
    id: 12,
    category: "autonomy",
    english: "At work, I often take over projects and steer them my way without worrying about what other people think.",
    greek: "Στη δουλειά, συχνά αναλαμβάνω έργα και τα κατευθύνω με τον δικό μου τρόπο, χωρίς να ανησυχώ για το τι σκέφτονται οι άλλοι.",
  },
  {
    id: 13,
    category: "locus",
    english: "Many of the bad times that people experience are due to bad luck.",
    greek: "Πολλές από τις δύσκολες στιγμές που βιώνουν οι άνθρωποι οφείλονται στην κακή τύχη.",
  },
  {
    id: 14,
    category: "creativity",
    english: "Sometimes I think about information almost obsessively until I come up with new ideas and solutions.",
    greek: "Μερικές φορές σκέφτομαι κάποιες πληροφορίες σχεδόν εμμονικά, μέχρι να καταλήξω σε νέες ιδέες και λύσεις.",
  },
  {
    id: 15,
    category: "achievement",
    english: "If I am having problems with a task I leave it, forget it and move on to something else.",
    greek: "Αν αντιμετωπίζω προβλήματα με μια εργασία, την αφήνω, την ξεχνώ και προχωρώ σε κάτι άλλο.",
  },
  {
    id: 16,
    category: "locus",
    english: "When I make plans I nearly always achieve them.",
    greek: "Όταν κάνω σχέδια, σχεδόν πάντα τα πραγματοποιώ.",
  },
  {
    id: 17,
    category: "creativity",
    english: "I do not like unexpected changes to my weekly routines.",
    greek: "Δεν μου αρέσουν οι απρόσμενες αλλαγές στις εβδομαδιαίες μου συνήθειες.",
  },
  {
    id: 18,
    category: "risk",
    english: "If I wanted to achieve something and the chances of success were 50/50 I would take the risk.",
    greek: "Αν ήθελα να πετύχω κάτι και οι πιθανότητες επιτυχίας ήταν 50/50, θα έπαιρνα το ρίσκο.",
  },
  {
    id: 19,
    category: "achievement",
    english: "I think more of the present and past than of the future.",
    greek: "Σκέφτομαι περισσότερο το παρόν και το παρελθόν παρά το μέλλον.",
  },
  {
    id: 20,
    category: "risk",
    english: "If I had a good idea for making some money, I would be willing to invest my time and borrow money to enable me to do it.",
    greek: "Αν είχα μια καλή ιδέα για να βγάλω χρήματα, θα ήμουν πρόθυμος να επενδύσω τον χρόνο μου και να δανειστώ χρήματα ώστε να μπορέσω να την υλοποιήσω.",
  },
  {
    id: 21,
    category: "autonomy",
    english: "I like a lot of guidance to be really clear about what to do in work.",
    greek: "Μου αρέσει να έχω πολλή καθοδήγηση, ώστε να είναι απολύτως ξεκάθαρο τι πρέπει να κάνω στη δουλειά.",
  },
  {
    id: 22,
    category: "locus",
    english: "People generally get what they deserve.",
    greek: "Οι άνθρωποι γενικά παίρνουν αυτό που τους αξίζει.",
  },
  {
    id: 23,
    category: "creativity",
    english: "I am wary of new ideas, gadgets and technologies.",
    greek: "Αντιμετωπίζω με επιφύλαξη τις νέες ιδέες, τα νέα gadget και τις νέες τεχνολογίες.",
  },
  {
    id: 24,
    category: "achievement",
    english: "It is more important to do a job well than to try to please people.",
    greek: "Είναι πιο σημαντικό να κάνω καλά μια δουλειά παρά να προσπαθώ να ευχαριστώ τους άλλους.",
  },
  {
    id: 25,
    category: "locus",
    english: "I try to accept that things happen to me in life for a reason.",
    greek: "Προσπαθώ να αποδέχομαι ότι όσα μου συμβαίνουν στη ζωή συμβαίνουν για κάποιον λόγο.",
  },
  {
    id: 26,
    category: "creativity",
    english: "Other people think that I‘m always making changes and trying out new ideas.",
    greek: "Οι άλλοι πιστεύουν ότι συνεχώς κάνω αλλαγές και δοκιμάζω νέες ιδέες.",
  },
  {
    id: 27,
    category: "risk",
    english: "If there is a chance of failure I would rather not do it.",
    greek: "Αν υπάρχει πιθανότητα αποτυχίας, θα προτιμούσα να μην το κάνω.",
  },
  {
    id: 28,
    category: "achievement",
    english: "I get annoyed if people are not on time for meetings.",
    greek: "Εκνευρίζομαι όταν οι άλλοι δεν έρχονται στην ώρα τους στις συναντήσεις.",
  },
  {
    id: 29,
    category: "risk",
    english: "Before I make a decision I like to have all the facts no matter how long it takes.",
    greek: "Πριν πάρω μια απόφαση, μου αρέσει να έχω όλα τα δεδομένα, όσο χρόνο κι αν χρειαστεί.",
  },
  {
    id: 30,
    category: "autonomy",
    english: "I rarely need or want any assistance and like to put my own stamp on work that I do.",
    greek: "Σπάνια χρειάζομαι ή θέλω οποιαδήποτε βοήθεια και μου αρέσει να βάζω τη δική μου σφραγίδα στη δουλειά που κάνω.",
  },
  {
    id: 31,
    category: "locus",
    english: "You are not likely to be successful unless you are in the right place at the right time.",
    greek: "Δεν είναι πιθανό να πετύχει κανείς αν δεν βρίσκεται στο σωστό μέρος τη σωστή στιγμή.",
  },
  {
    id: 32,
    category: "creativity",
    english: "I prefer to be quite good at several things rather than very good at one thing.",
    greek: "Προτιμώ να τα καταφέρνω αρκετά καλά σε πολλά πράγματα παρά πολύ καλά σε ένα μόνο.",
  },
  {
    id: 33,
    category: "achievement",
    english: "I would rather work with a person I liked who was not good at the job, rather than work with someone I did not like even if they were good at the job.",
    greek: "Θα προτιμούσα να δουλεύω με ένα άτομο που συμπαθώ αλλά δεν είναι καλό στη δουλειά του, παρά με κάποιον που δεν συμπαθώ, ακόμη κι αν είναι καλός στη δουλειά του.",
  },
  {
    id: 34,
    category: "locus",
    english: "Being successful is a result of working hard, luck has little to do with it.",
    greek: "Η επιτυχία είναι αποτέλεσμα σκληρής δουλειάς· η τύχη παίζει μικρό ρόλο.",
  },
  {
    id: 35,
    category: "creativity",
    english: "I prefer doing things in the usual way rather than trying out new methods.",
    greek: "Προτιμώ να κάνω τα πράγματα με τον συνηθισμένο τρόπο παρά να δοκιμάζω νέες μεθόδους.",
  },
  {
    id: 36,
    category: "risk",
    english: "Before making an important decision I prefer to weigh up the pro's and con's fairly quickly rather than spending a long time thinking about it.",
    greek: "Πριν πάρω μια σημαντική απόφαση, προτιμώ να ζυγίζω τα υπέρ και τα κατά αρκετά γρήγορα, παρά να αφιερώνω πολύ χρόνο για να το σκεφτώ.",
  },
  {
    id: 37,
    category: "achievement",
    english: "I would rather work on a task as part of a team rather than take responsibility for it myself.",
    greek: "Θα προτιμούσα να δουλεύω σε μια εργασία ως μέλος μιας ομάδας παρά να αναλάβω προσωπικά την ευθύνη γι’ αυτήν.",
  },
  {
    id: 38,
    category: "risk",
    english: "I would rather take an opportunity that might lead to even better things than have an experience that I am sure to enjoy.",
    greek: "Θα προτιμούσα να αξιοποιήσω μια ευκαιρία που θα μπορούσε να οδηγήσει σε ακόμη καλύτερα πράγματα παρά να ζήσω μια εμπειρία που ξέρω ότι θα απολαύσω.",
  },
  {
    id: 39,
    category: "autonomy",
    english: "I usually do what is expected of me and follow instructions carefully.",
    greek: "Συνήθως κάνω ό,τι αναμένεται από εμένα και ακολουθώ προσεκτικά τις οδηγίες.",
  },
  {
    id: 40,
    category: "locus",
    english: "For me, getting what I want is a just reward for my efforts.",
    greek: "Για εμένα, το να αποκτώ αυτό που θέλω είναι μια δίκαιη ανταμοιβή για τις προσπάθειές μου.",
  },
  {
    id: 41,
    category: "creativity",
    english: "I like to have my life organised so that it runs smoothly and to plan.",
    greek: "Μου αρέσει να έχω τη ζωή μου οργανωμένη, ώστε να κυλά ομαλά και σύμφωνα με το πρόγραμμά μου.",
  },
  {
    id: 42,
    category: "achievement",
    english: "When I am faced with a challenge I think more about the results of succeeding than the effects of failing.",
    greek: "Όταν αντιμετωπίζω μια πρόκληση, σκέφτομαι περισσότερο τα αποτελέσματα της επιτυχίας παρά τις συνέπειες της αποτυχίας.",
  },
  {
    id: 43,
    category: "locus",
    english: "I believe that destiny determines what happens to me in life.",
    greek: "Πιστεύω ότι η μοίρα καθορίζει όσα μου συμβαίνουν στη ζωή.",
  },
  {
    id: 44,
    category: "creativity",
    english: "I like to spend time with people who have different ways of thinking.",
    greek: "Μου αρέσει να περνώ χρόνο με ανθρώπους που έχουν διαφορετικούς τρόπους σκέψης.",
  },
  {
    id: 45,
    category: "risk",
    english: "I find it difficult to ask for favours from other people.",
    greek: "Δυσκολεύομαι να ζητώ χάρες από άλλους ανθρώπους.",
  },
  {
    id: 46,
    category: "achievement",
    english: "I get up early, stay late or skip meals if I have a deadline for some work that needs to be done.",
    greek: "Σηκώνομαι νωρίς, δουλεύω μέχρι αργά ή παραλείπω γεύματα αν έχω προθεσμία για κάποια δουλειά που πρέπει να γίνει.",
  },
  {
    id: 47,
    category: "risk",
    english: "What we are used to is usually better than what is unfamiliar.",
    greek: "Αυτό που έχουμε συνηθίσει είναι συνήθως καλύτερο από ό,τι μας είναι άγνωστο.",
  },
  {
    id: 48,
    category: "autonomy",
    english: "I get annoyed if superiors or colleagues take credit for my work.",
    greek: "Εκνευρίζομαι όταν προϊστάμενοι ή συνάδελφοι παίρνουν τα εύσημα για τη δική μου δουλειά.",
  },
  {
    id: 49,
    category: "locus",
    english: "People's failures are rarely the result of their poor judgement.",
    greek: "Οι αποτυχίες των ανθρώπων σπάνια είναι αποτέλεσμα της κακής τους κρίσης.",
  },
  {
    id: 50,
    category: "creativity",
    english: "Sometimes I have so many ideas that I feel pressurised.",
    greek: "Μερικές φορές έχω τόσες πολλές ιδέες που νιώθω πίεση.",
  },
  {
    id: 51,
    category: "achievement",
    english: "I find it easy to relax on holiday and forget about work.",
    greek: "Μου είναι εύκολο να χαλαρώνω στις διακοπές και να ξεχνώ τη δουλειά.",
  },
  {
    id: 52,
    category: "locus",
    english: "I get what I want from life because I work hard to make it happen.",
    greek: "Παίρνω από τη ζωή αυτό που θέλω επειδή δουλεύω σκληρά για να το πετύχω.",
  },
  {
    id: 53,
    category: "creativity",
    english: "It is harder for me to adapt to change than keep to a routine.",
    greek: "Μου είναι δυσκολότερο να προσαρμόζομαι στις αλλαγές παρά να ακολουθώ μια ρουτίνα.",
  },
  {
    id: 54,
    category: "risk",
    english: "I like to start interesting projects even if there is no guaranteed payback for the money or time I have to put in.",
    greek: "Μου αρέσει να ξεκινώ ενδιαφέροντα έργα, ακόμη κι αν δεν είναι βέβαιο ότι θα υπάρξει ανταπόδοση για τα χρήματα ή τον χρόνο που θα χρειαστεί να επενδύσω.",
  },
];

export function validateQuestions(items: readonly Question[]): void {
  if (items.length !== 54) throw new Error('Question data must contain exactly 54 items.');
  const ids = new Set<number>();
  for (const item of items) {
    if (!Number.isInteger(item.id) || item.id < 1 || item.id > 54 || ids.has(item.id)) {
      throw new Error('Question IDs must contain each integer from 1 to 54 exactly once.');
    }
    if (!categories.includes(item.category) || !categoryIds[item.category].includes(item.id)) {
      throw new Error(`Question ${item.id} has an incorrect scoring category.`);
    }
    if (typeof item.english !== 'string' || !item.english.trim() ||
        typeof item.greek !== 'string' || !item.greek.trim()) {
      throw new Error(`Question ${item.id} requires English and Greek text.`);
    }
    ids.add(item.id);
  }
}
