import type { QuizCopy } from './attributesQuiz.ts';

export const frenchQuiz: QuizCopy = {
  inDepthExplanation: 'Explications détaillées des cinq caractéristiques', instantFeedback: 'Afficher une correction immédiate', instantFeedbackHelp: 'Choisissez une option et validez votre réponse pour voir si elle est correcte, la bonne caractéristique et une explication avant de continuer. Les réponses validées ne peuvent plus être modifiées.', submitAnswer: 'Valider la réponse', yourIncorrectAnswer: 'Votre réponse — incorrecte', draftAnswer: 'Réponse sélectionnée. Validez-la pour voir la correction et l’enregistrer.', feedbackCorrect: 'Correct — cette affirmation concerne :', feedbackIncorrect: 'Pas tout à fait. La bonne caractéristique est :', totalScore: 'Score global de compréhension', correctCount: 'réponses correctes', saving: 'Enregistrement de la progression du quiz…', updatedElsewhere: 'Les données du quiz ont changé dans un autre onglet. La dernière progression enregistrée a été chargée.', expandReview: 'Afficher les réponses et les explications', collapseReview: 'Masquer les réponses et les explications', chooseAttribute: 'Choisir une caractéristique',
  title: 'Comprendre les cinq caractéristiques entrepreneuriales', intro: 'GET2 regroupe ses affirmations en cinq dimensions d’évaluation associées au comportement entrepreneurial. Apprenez à reconnaître ce que chaque affirmation cherche à mesurer. Il s’agit d’un quiz de connaissances, et non d’une évaluation de la personnalité ou d’un modèle clinique. Ce sont des caractéristiques typiques, pas une liste que chaque personne doit entièrement remplir.', note: 'Certaines affirmations sont formulées positivement et d’autres négativement. Votre tâche est d’identifier la caractéristique que l’affirmation cherche à mesurer, et non de déterminer si elle montre un niveau élevé de cette caractéristique.',
  definitions: {
    achievement: 'Motivation à atteindre des objectifs exigeants mais réalistes, à persévérer face aux difficultés et à assumer la responsabilité de mener les tâches à bien.',
    autonomy: 'Préférence pour l’indépendance et la maîtrise de sa façon de travailler : prendre ses propres décisions, diriger et aborder les tâches à sa manière.',
    creativity: 'Produire et explorer des idées, résoudre les problèmes avec imagination et être à l’aise avec la nouveauté et le changement.',
    risk: 'Évaluer des occasions incertaines et décider si les bénéfices possibles justifient le risque. Il ne s’agit pas d’imprudence ou d’un goût du danger, mais de s’appuyer sur les informations, le jugement et les conséquences probables.',
    locus: 'Croire que ses actions, ses décisions et ses efforts influencent fortement les résultats, plutôt que principalement la chance ou le destin. Cela ne signifie pas que l’on contrôle tout ce qui nous arrive.',
  },
  traits: {
    achievement: ['Persévérance et motivation', 'Gestion du temps et attention aux résultats', 'Orientation vers l’avenir et confiance en soi'],
    autonomy: ['Opinions indépendantes', 'Leadership et détermination', 'Résistance à la pression du groupe'],
    creativity: ['Imagination et curiosité', 'Inventivité et rapprochement d’idées', 'Ouverture au changement'],
    risk: ['Évaluation des coûts et bénéfices', 'Estimation des capacités et des chances de réussite', 'Décisions avec des informations incomplètes'],
    locus: ['Responsabilité personnelle', 'Saisie active des occasions', 'Lien entre efforts et résultats'],
  },
  explanations: {
    achievement: 'Cette affirmation concerne la motivation, la persévérance, les objectifs exigeants ou l’accomplissement des tâches.',
    autonomy: 'Cette affirmation concerne l’indépendance, le leadership ou la préférence pour une façon personnelle de faire les choses.',
    creativity: 'Cette affirmation concerne les idées, la nouveauté, l’imagination, le changement ou une pensée non conventionnelle.',
    risk: 'Cette affirmation concerne l’évaluation ou la saisie d’occasions dont le résultat est incertain.',
    locus: 'Cette affirmation concerne la conviction que les résultats sont influencés par les actions et les efforts personnels plutôt que principalement par des forces extérieures.',
  },
  example: 'Exemple pour s’entraîner', exampleText: '« Je préfère trouver ma propre manière d’accomplir une tâche plutôt que de suivre des instructions détaillées. »', exampleWhy: 'Cela concerne l’indépendance et la préférence pour sa propre façon de travailler.',
  start: 'Commencer le quiz', resume: 'Continuer le quiz', facts: '54 affirmations · 5 caractéristiques possibles', prompt: 'À quelle caractéristique entrepreneuriale cette affirmation se rapporte-t-elle ?', remaining: 'Restantes', submit: 'Valider le quiz', results: 'Votre compréhension des cinq caractéristiques entrepreneuriales', retake: 'Refaire le quiz', learn: 'Découvrir les caractéristiques', correct: 'Réponses correctes', incorrect: 'Réponses incorrectes', byAttribute: 'Compréhension par caractéristique', confusions: 'Caractéristiques les plus souvent confondues', confusedWith: 'a été identifié comme', times: 'fois', reviewIncorrect: 'Revoir les réponses incorrectes', yours: 'Votre réponse', correctAnswer: 'Bonne réponse', perfect: 'Aucune réponse incorrecte.', bands: ['Excellente compréhension', 'Très bonne compréhension', 'Bonne compréhension', 'Compréhension en développement', 'Révision recommandée'], feedback: ['Solide compréhension', 'Globalement compris', 'À revoir', 'Révisez cette caractéristique'],
};
