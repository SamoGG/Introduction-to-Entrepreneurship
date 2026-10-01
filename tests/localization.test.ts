import test from 'node:test';
import assert from 'node:assert/strict';
import { translations } from '../src/i18n/translations.ts';
import { quizTranslations } from '../src/i18n/attributesQuiz.ts';

test('English and Greek disclosures are complete and describe local storage without absolute privacy claims', () => {
  assert.deepEqual(Object.keys(translations.en).sort(), Object.keys(translations.el).sort());
  assert.equal(translations.en.aiDisclosure, 'Developed with assistance from AI tools.');
  assert.equal(translations.el.aiDisclosure, 'Αναπτύχθηκε με τη βοήθεια εργαλείων τεχνητής νοημοσύνης.');
  for (const language of ['en', 'el'] as const) {
    const t = translations[language];
    assert.match(t.privacyBody, /localStorage/);
    assert.match(t.privacyHosting, /IP/);
    assert.match(t.privacyDate, /2026/);
    for (const key of ['privacyBody', 'privacyStorage', 'privacyControl', 'privacyExtra', 'privacyHosting', 'privacyUpdated', 'privacyDate', 'aiDisclosure'] as const) {
      assert.ok(t[key].trim());
      assert.notEqual(translations.en[key], translations.el[key]);
    }
    assert.doesNotMatch(JSON.stringify([t, quizTranslations[language]]), /future quiz|coming soon|μελλοντικό κουίζ|Προσεχώς|GDPR compliant|100% private|no data ever leaves/i);
  }
  assert.match(translations.en.privacyBody, /does not transmit these data to a server/);
  assert.match(translations.el.privacyBody, /δεν αποστέλλει αυτά τα δεδομένα σε διακομιστή/);
  assert.match(translations.en.privacyControl, /keeps your language, theme and accessibility preferences/);
  assert.match(translations.el.privacyControl, /διατηρεί σκόπιμα τις προτιμήσεις γλώσσας, θέματος και προσβασιμότητας/);
});
